export interface EncryptedKeyPayload {
  k: string; // The encrypted API key
  iv: string; // Hex initialization vector (12 or 16 bytes)
  tag: string; // Hex auth tag (16 bytes)
  exp: number; // Expiration timestamp
}

export interface SessionStatus {
  connected: boolean;
  expiresAt?: string;
  model?: string;
}
