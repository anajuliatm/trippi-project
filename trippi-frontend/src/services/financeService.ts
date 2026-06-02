import { api, parseApiError } from "./api";

export type FinanceType = "expense" | "payment" | string;

export type FinanceEntry = {
  id: string;
  trip_id: string;
  user_id: string;
  type: FinanceType;
  description: string | null;
  amount: number;
  created_at: string;
};

export type CreateFinancePayload = {
  trip_id: string;
  user_id: string;
  type: FinanceType;
  description?: string | null;
  amount: number;
};

export type UpdateFinancePayload = Partial<{
  type: FinanceType;
  description: string | null;
  amount: number;
}>;

export type DeleteFinanceResponse = {
  message: string;
};

export async function createFinanceRequest(
  tripId: string,
  userId: string,
  payload: CreateFinancePayload,
): Promise<FinanceEntry> {
  try {
    const { data } = await api.post<FinanceEntry>(
      `/finance/trip/${tripId}/user/${userId}`,
      payload,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel criar o lancamento financeiro.");
  }
}

export async function getTripFinancesRequest(tripId: string): Promise<FinanceEntry[]> {
  try {
    const { data } = await api.get<FinanceEntry[]>(`/finance/trip/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar os lancamentos da viagem.");
  }
}

export async function getUserTripFinancesRequest(
  tripId: string,
  userId: string,
): Promise<FinanceEntry[]> {
  try {
    const { data } = await api.get<FinanceEntry[]>(
      `/finance/trip/${tripId}/user/${userId}`,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar os lancamentos do usuario.");
  }
}

export async function updateFinanceRequest(
  tripId: string,
  userId: string,
  financeId: string,
  payload: UpdateFinancePayload,
): Promise<FinanceEntry> {
  try {
    const { data } = await api.patch<FinanceEntry>(
      `/finance/trip/${tripId}/user/${userId}/entry/${financeId}`,
      payload,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel atualizar o lancamento financeiro.");
  }
}

export async function deleteFinanceRequest(
  tripId: string,
  userId: string,
  financeId: string,
): Promise<DeleteFinanceResponse> {
  try {
    const { data } = await api.delete<DeleteFinanceResponse>(
      `/finance/trip/${tripId}/user/${userId}/entry/${financeId}`,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel remover o lancamento financeiro.");
  }
}