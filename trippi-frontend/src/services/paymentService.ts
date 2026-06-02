import { api, parseApiError } from "./api";

export type PaymentEntry = {
  id: string;
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  note: string | null;
  status: string;
  created_at: string;
  settled_at: string | null;
};

export async function getTripPaymentsRequest(
  tripId: string,
): Promise<PaymentEntry[]> {
  try {
    const { data } = await api.get<PaymentEntry[]>(`/payments/trip/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar os acertos da viagem.");
  }
}