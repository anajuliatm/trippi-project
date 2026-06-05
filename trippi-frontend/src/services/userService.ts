import { api, parseApiError } from "./api";

export type AppUser = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type UpdateUserPayload = Partial<{
  username: string;
  email: string;
  password: string;
}>;

export async function getUserByIdRequest(userId: string): Promise<AppUser> {
  try {
    const { data } = await api.get<AppUser>(`/users/${userId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar os dados do usuario.");
  }
}

export async function getUserByEmailRequest(email: string): Promise<AppUser> {
  try {
    const { data } = await api.get<AppUser>("/users/by-email", {
      params: { email },
    });
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel localizar o usuario por email.");
  }
}

export async function updateUserRequest(
  userId: string,
  payload: UpdateUserPayload,
): Promise<AppUser> {
  try {
    const { data } = await api.patch<AppUser>(`/users/${userId}`, payload);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel atualizar os dados do usuario.");
  }
}

export async function getUsersMapRequest(
  userIds: string[],
): Promise<Record<string, AppUser>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  const users = await Promise.all(uniqueUserIds.map((userId) => getUserByIdRequest(userId)));

  return users.reduce<Record<string, AppUser>>((accumulator, user) => {
    accumulator[user.id] = user;
    return accumulator;
  }, {});
}