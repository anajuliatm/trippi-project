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
    if (!error.response) {
      throw new Error(
        "Nao foi possivel conectar ao backend. Verifique se a API esta rodando e se o CORS esta liberado.",
      );
    }

    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => {
          if (typeof item?.msg === "string") {
            return item.msg;
          }

          return null;
        })
        .filter((item): item is string => Boolean(item))
        .join(" ");

      if (message) {
        throw new Error(message);
      }
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