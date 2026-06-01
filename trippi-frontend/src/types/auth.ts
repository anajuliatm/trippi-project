export type AuthUser = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};