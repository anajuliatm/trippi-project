import { api, parseApiError } from "./api";

export type TripMember = {
  trip_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

export type CreateTripMemberPayload = {
  trip_id: string;
  user_id: string;
  role?: string;
};

export type DeleteTripMemberResponse = {
  message: string;
};

export async function addTripMemberRequest(
  tripId: string,
  userId: string,
  payload: CreateTripMemberPayload,
): Promise<TripMember> {
  try {
    const { data } = await api.post<TripMember>(
      `/trip_member/trip/${tripId}/user/${userId}`,
      payload,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel adicionar o membro na viagem.");
  }
}

export async function getTripMembersRequest(tripId: string): Promise<TripMember[]> {
  try {
    const { data } = await api.get<TripMember[]>(`/trip_member/trip/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar os participantes da viagem.");
  }
}

export async function deleteTripMemberRequest(
  tripId: string,
  userId: string,
): Promise<DeleteTripMemberResponse> {
  try {
    const { data } = await api.delete<DeleteTripMemberResponse>(
      `/trip_member/trip/${tripId}/user/${userId}`,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel remover o membro da viagem.");
  }
}