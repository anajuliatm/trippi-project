import axios from "axios";

export const TOKEN_STORAGE_KEY = "trippi:token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:9010",
});

export function parseApiError(
  error: unknown,
  fallbackMessage = "Não foi possível concluir a requisição.",
): never {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      throw new Error(
        "Não foi possível conectar ao backend. Verifique se a API está rodando e se o CORS está liberado.",
      );
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => {
          if (typeof item?.msg === "string") {
            return item.msg.replace(/^value error,\s*/i, "").trim();
          }

          return null;
        })
        .filter((item): item is string => Boolean(item))
        .join("\n");

      if (message) {
        throw new Error(message);
      }
    }
  }

  throw new Error(fallbackMessage);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});