import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BuildGoogleAuthUrlInput,
  ExchangeGoogleCodeInput,
  GoogleOidcProfile,
  GoogleOidcProviderPort,
} from '../../domain/ports/google-oidc-provider.port';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleOidcAdapter implements GoogleOidcProviderPort {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(input: BuildGoogleAuthUrlInput): string {
    const clientId = this.required('GOOGLE_CLIENT_ID');
    const callbackUrl = input.callbackUrl?.trim() || this.required('GOOGLE_OAUTH_CALLBACK_URL');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: input.scopes.join(' '),
      state: input.state,
      access_type: 'online',
      include_granted_scopes: 'false',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForProfile(
    input: ExchangeGoogleCodeInput,
  ): Promise<GoogleOidcProfile> {
    const clientId = this.required('GOOGLE_CLIENT_ID');
    const clientSecret = this.required('GOOGLE_CLIENT_SECRET');
    const callbackUrl = input.callbackUrl?.trim() || this.required('GOOGLE_OAUTH_CALLBACK_URL');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new BadRequestException('No se pudo validar el codigo OAuth con Google.');
    }
    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenData.access_token) {
      throw new BadRequestException('Google no retorno access token.');
    }

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    if (!userInfoResponse.ok) {
      throw new BadRequestException('No se pudo obtener perfil OIDC de Google.');
    }
    const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;
    if (!userInfo.sub || !userInfo.email) {
      throw new BadRequestException('Perfil Google incompleto para login.');
    }

    return {
      providerUserId: userInfo.sub,
      email: String(userInfo.email).trim().toLowerCase(),
      emailVerified: Boolean(userInfo.email_verified),
      givenName: userInfo.given_name ?? null,
      familyName: userInfo.family_name ?? null,
      fullName: userInfo.name ?? null,
      pictureUrl: userInfo.picture ?? null,
    };
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key, '').trim();
    if (!value) throw new BadRequestException(`Falta configuracion ${key}`);
    return value;
  }
}
