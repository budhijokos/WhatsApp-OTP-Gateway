export interface DeveloperClaims {
  sub: string;
  name: string;
  permissions: string[];
  kid?: string;
  env?: string;
  iat?: number;
  exp?: number;
}

export type KeyStatus = 'active' | 'rotating' | 'revoked';
export type KeyEnvironment = 'production' | 'staging' | 'development';

export interface KeyRotationInfo {
  previousToken?: string;
  previousTokenExpiresAt?: string; // ISO string
  rotatedAt: string;
  gracePeriodHours: number;
}

export interface ApiKey {
  id: string; // e.g. key_w9f28a
  clientId: string; // e.g. ecommerce_auth
  clientName: string; // e.g. Web E-Commerce Checkout
  environment: KeyEnvironment;
  permissions: string[];
  expiresIn: string; // e.g. "30d", "90d", "365d"
  expiresAt: string | null;
  status: KeyStatus;
  token: string;
  tokenPreview: string; // e.g. "eyJhbG...a9Zb"
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  revokedAt?: string | null;
  revocationReason?: string | null;
  rotationInfo?: KeyRotationInfo | null;
}

export interface CreateApiKeyDto {
  clientId?: string;
  clientName: string;
  environment?: KeyEnvironment;
  permissions?: string[];
  expiresIn?: string;
}

export interface RotateApiKeyDto {
  gracePeriodHours?: number; // 0 (immediate), 1, 24, 72, 168
  newExpiresIn?: string;
  newPermissions?: string[];
}

export interface RevokeApiKeyDto {
  reason?: string;
}

export interface ApiKeyStats {
  total: number;
  active: number;
  rotating: number;
  revoked: number;
  totalUsage: number;
}

export interface GenerateTokenDto {
  sub?: string;
  name?: string;
  permissions?: string[];
  expiresIn?: string;
}

export interface VerifyTokenDto {
  token: string;
}

export interface TokenResult {
  token: string;
  tokenType: string;
  expiresIn: string;
  payload: DeveloperClaims;
  sampleCurl: string;
}

