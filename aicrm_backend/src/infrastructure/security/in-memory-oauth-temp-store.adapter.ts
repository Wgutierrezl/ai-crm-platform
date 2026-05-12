import { Injectable } from '@nestjs/common';
import { randomBytes, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  OAuthAuthCodePayload,
  OAuthStatePayload,
  OauthTempStorePort,
} from '../../domain/ports/oauth-temp-store.port';

type StoreItem<T> = {
  payload: T;
  expiresAt: number;
};

@Injectable()
export class InMemoryOauthTempStoreAdapter implements OauthTempStorePort {
  constructor(private readonly configService: ConfigService) {}

  private readonly states = new Map<string, StoreItem<OAuthStatePayload>>();
  private readonly authCodes = new Map<string, StoreItem<OAuthAuthCodePayload>>();

  async issueState(payload: OAuthStatePayload, ttlMinutes: number): Promise<string> {
    this.cleanup();
    const token = this.generateToken('state');
    this.states.set(token, {
      payload,
      expiresAt: Date.now() + ttlMinutes * 60_000,
    });
    return token;
  }

  async consumeState(token: string): Promise<OAuthStatePayload | null> {
    this.cleanup();
    const item = this.states.get(token);
    if (!item) return null;
    this.states.delete(token);
    if (item.expiresAt < Date.now()) return null;
    return item.payload;
  }

  async issueAuthCode(payload: OAuthAuthCodePayload, ttlMinutes: number): Promise<string> {
    this.cleanup();
    const code = this.generateToken('authcode');
    this.authCodes.set(code, {
      payload,
      expiresAt: Date.now() + ttlMinutes * 60_000,
    });
    return code;
  }

  async consumeAuthCode(code: string): Promise<OAuthAuthCodePayload | null> {
    this.cleanup();
    const item = this.authCodes.get(code);
    if (!item) return null;
    this.authCodes.delete(code);
    if (item.expiresAt < Date.now()) return null;
    return item.payload;
  }

  private generateToken(prefix: string): string {
    const raw = randomBytes(24).toString('hex');
    const secret = this.configService.get<string>('GOOGLE_OAUTH_STATE_SECRET', 'dev-secret');
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    return `${prefix}_${raw}_${signature.slice(0, 24)}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, item] of this.states.entries()) {
      if (item.expiresAt < now) this.states.delete(token);
    }
    for (const [code, item] of this.authCodes.entries()) {
      if (item.expiresAt < now) this.authCodes.delete(code);
    }
  }
}
