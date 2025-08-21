export type User = {
  id: string;
  email: string;
  fullName?: string;
}

export type LoginRequest = {
  email: string;
  password: string;
}

export type RegisterRequest = {
  email: string;
  password: string;
  fullName?: string;
}

export type AuthResponse = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}