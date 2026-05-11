import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'net';
import { connect as tlsConnect, TLSSocket } from 'tls';
import { EmailSenderPort, SendEmailInput } from '../../domain/ports/email-sender.port';

@Injectable()
export class GmailSmtpEmailSender implements EmailSenderPort {
  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const secure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');
    const from = this.configService.get<string>('SMTP_FROM', user);

    if (!host || !port || !user || !pass || !from) {
      throw new Error('SMTP configuration incomplete');
    }

    const socket = await this.openSocket({ host, port, secure });

    try {
      await this.readResponse(socket, 220);
      await this.write(socket, `EHLO localhost`);
      await this.readResponse(socket, 250);

      let smtpSocket: Socket | TLSSocket = socket;
      if (!secure) {
        await this.write(smtpSocket, 'STARTTLS');
        await this.readResponse(smtpSocket, 220);
        smtpSocket = await this.upgradeToTls(smtpSocket, host, port);
        await this.write(smtpSocket, `EHLO localhost`);
        await this.readResponse(smtpSocket, 250);
      }

      await this.write(smtpSocket, 'AUTH LOGIN');
      await this.readResponse(smtpSocket, 334);
      await this.write(smtpSocket, Buffer.from(user).toString('base64'));
      await this.readResponse(smtpSocket, 334);
      await this.write(smtpSocket, Buffer.from(pass).toString('base64'));
      await this.readResponse(smtpSocket, 235);

      await this.write(smtpSocket, `MAIL FROM:<${from}>`);
      await this.readResponse(smtpSocket, 250);
      await this.write(smtpSocket, `RCPT TO:<${input.to}>`);
      await this.readResponse(smtpSocket, 250);
      await this.write(smtpSocket, 'DATA');
      await this.readResponse(smtpSocket, 354);

      const body = this.buildRawMessage({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text ?? '',
      });
      await this.writeRaw(smtpSocket, `${body}\r\n.\r\n`);
      await this.readResponse(smtpSocket, 250);
      await this.write(smtpSocket, 'QUIT');
      await this.readResponse(smtpSocket, 221);
      smtpSocket.end();
    } catch (error) {
      socket.destroy();
      throw error;
    }
  }

  private buildRawMessage(input: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): string {
    const boundary = `crm_${Date.now().toString(16)}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(input.subject, 'utf8').toString('base64')}?=`;
    const safeText = input.text.replace(/\r?\n/g, '\r\n');
    return [
      `From: ${input.from}`,
      `To: ${input.to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      safeText,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      input.html,
      `--${boundary}--`,
    ].join('\r\n');
  }

  private async openSocket(input: {
    host: string;
    port: number;
    secure: boolean;
  }): Promise<Socket | TLSSocket> {
    if (input.secure) {
      return await new Promise<TLSSocket>((resolve, reject) => {
        const tlsSocket = tlsConnect(
          {
            host: input.host,
            port: input.port,
            servername: input.host,
          },
          () => resolve(tlsSocket),
        );
        tlsSocket.once('error', reject);
      });
    }
    return await new Promise<Socket>((resolve, reject) => {
      const socket = new Socket();
      socket.connect(input.port, input.host, () => resolve(socket));
      socket.once('error', reject);
    });
  }

  private async upgradeToTls(
    socket: Socket | TLSSocket,
    host: string,
    port: number,
  ): Promise<TLSSocket> {
    return await new Promise<TLSSocket>((resolve, reject) => {
      const tlsSocket = tlsConnect(
        {
          socket,
          host,
          port,
          servername: host,
        },
        () => resolve(tlsSocket),
      );
      tlsSocket.once('error', reject);
    });
  }

  private async write(socket: Socket | TLSSocket, command: string): Promise<void> {
    await this.writeRaw(socket, `${command}\r\n`);
  }

  private async writeRaw(socket: Socket | TLSSocket, raw: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      socket.write(raw, (error?: Error | null) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private async readResponse(
    socket: Socket | TLSSocket,
    expectedCode: number,
  ): Promise<string[]> {
    const expected = String(expectedCode);
    return await new Promise<string[]>((resolve, reject) => {
      let buffer = '';
      const lines: string[] = [];

      const onData = (chunk: Buffer | string) => {
        buffer += chunk.toString();
        const parts = buffer.split('\r\n');
        buffer = parts.pop() ?? '';
        for (const line of parts) {
          if (!line) continue;
          lines.push(line);
          if (/^\d{3}\s/.test(line)) {
            socket.off('data', onData);
            socket.off('error', onError);
            const last = line.slice(0, 3);
            if (last !== expected) {
              reject(new Error(`SMTP expected ${expected}, got ${line}`));
              return;
            }
            resolve(lines);
            return;
          }
        }
      };

      const onError = (error: Error) => {
        socket.off('data', onData);
        socket.off('error', onError);
        reject(error);
      };

      socket.on('data', onData);
      socket.once('error', onError);
    });
  }
}

