import axios from "axios";

import { api } from "./api";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

function parseApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }
  }

  throw new Error("Não foi possível concluir a autenticação.");
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  } catch (error) {
    parseApiError(error);
  }
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  } catch (error) {
    parseApiError(error);
  }
}

export async function getMeRequest(): Promise<AuthUser> {
  try {
    const { data } = await api.get<AuthUser>("/auth/me");
    return data;
  } catch (error) {
    parseApiError(error);
  }
}