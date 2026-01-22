export interface UserInfo {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface TokenResponse {
  token_type: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: Date; 
  refreshTokenExpiresAt:Date;
  user:UserInfo
}