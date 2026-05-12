export interface GoogleOidcProfile {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  fullName: string | null;
  pictureUrl: string | null;
}

export interface BuildGoogleAuthUrlInput {
  state: string;
  scopes: string[];
}

export interface ExchangeGoogleCodeInput {
  code: string;
}

export abstract class GoogleOidcProviderPort {
  abstract buildAuthorizationUrl(input: BuildGoogleAuthUrlInput): string;
  abstract exchangeCodeForProfile(
    input: ExchangeGoogleCodeInput,
  ): Promise<GoogleOidcProfile>;
}
