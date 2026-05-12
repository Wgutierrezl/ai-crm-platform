export interface OAuthStatePayload {
  nonce: string;
}

export interface OAuthAuthCodePayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
}

export abstract class OauthTempStorePort {
  abstract issueState(payload: OAuthStatePayload, ttlMinutes: number): Promise<string>;
  abstract consumeState(token: string): Promise<OAuthStatePayload | null>;
  abstract issueAuthCode(payload: OAuthAuthCodePayload, ttlMinutes: number): Promise<string>;
  abstract consumeAuthCode(code: string): Promise<OAuthAuthCodePayload | null>;
}
