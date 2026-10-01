export interface DeveloperClaims {
  sub: string;
  name: string;
  permissions: string[];
  iat?: number;
  exp?: number;
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
