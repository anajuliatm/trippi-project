import { api, parseApiError } from "./api";

export type ItineraryEntry = {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  location: string | null;
  activity_date: string;
  activity_time: string | null;
  notes: string | null;
  estimated_cost: number;
  created_at: string;
};

export type CreateItineraryPayload = {
  trip_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  activity_date: string;
  activity_time?: string | null;
  notes?: string | null;
  estimated_cost: number;
};

export type UpdateItineraryPayload = Partial<{
  title: string;
  description: string | null;
  location: string | null;
  activity_date: string;
  activity_time: string | null;
  notes: string | null;
  estimated_cost: number;
}>;

export async function createItineraryEntryRequest(
  tripId: string,
  payload: CreateItineraryPayload,
): Promise<ItineraryEntry> {
  try {
    const { data } = await api.post<ItineraryEntry>(`/itinerary/trip/${tripId}`, payload);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel criar a atividade do roteiro.");
  }
}

export async function getTripItineraryRequest(tripId: string): Promise<ItineraryEntry[]> {
  try {
    const { data } = await api.get<ItineraryEntry[]>(`/itinerary/trip/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel carregar o roteiro da viagem.");
  }
}

export async function updateItineraryEntryRequest(
  tripId: string,
  activityId: string,
  payload: UpdateItineraryPayload,
): Promise<ItineraryEntry> {
  try {
    const { data } = await api.patch<ItineraryEntry>(
      `/itinerary/trip/${tripId}/activity/${activityId}`,
      payload,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel atualizar a atividade do roteiro.");
  }
}

export async function deleteItineraryEntryRequest(
  tripId: string,
  activityId: string,
): Promise<{ message: string }> {
  try {
    const { data } = await api.delete<{ message: string }>(
      `/itinerary/trip/${tripId}/activity/${activityId}`,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Nao foi possivel remover a atividade do roteiro.");
  }
}