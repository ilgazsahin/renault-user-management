export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface TokenPayload {
  sub: string;
  username: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}
