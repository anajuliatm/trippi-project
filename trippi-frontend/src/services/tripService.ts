import { api, parseApiError } from "./api";
import { getTripMembersRequest } from "./memberService";

const DEFAULT_TRIP_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

export type TripStatus = "active" | "completed";

export type TripResponse = {
  id: string;
  owner_id: string;
  destination: string;
  image_url: string | null;
  departure_date: string;
  return_date: string;
  is_active: boolean;
  budget: number;
  created_at: string;
};

export type CreateTripPayload = {
  owner_id: string;
  destination: string;
  image_url?: string | null;
  departure_date: string;
  return_date: string;
  budget: number;
};

export type UpdateTripPayload = Partial<{
  destination: string;
  image_url: string | null;
  departure_date: string;
  return_date: string;
  is_active: boolean;
  budget: number;
}>;

export type TripFinanceSummary = {
  trip_id: string;
  participants: number;
  budget: number;
  budget_per_person: number;
  total_expenses: number;
  remaining_budget: number;
};

export type TripParticipantBalance = {
  user_id: string;
  username: string;
  paid: number;
  should_pay: number;
  balance: number;
};

export type TripSettlement = {
  from_user_id: string;
  from_username: string;
  to_user_id: string;
  to_username: string;
  amount: number;
};

export type DashboardTrip = {
  id: string;
  destination: string;
  image: string;
  participants: number;
  departureDate: string;
  endDate: string;
  status: TripStatus;
  budget: number;
  spent: number;
};

function mapTripStatus(trip: TripResponse): TripStatus {
  return trip.is_active ? "active" : "completed";
}

function mapTripToDashboardTrip(
  trip: TripResponse,
  participants: number,
  totalExpenses: number,
): DashboardTrip {
  return {
    id: trip.id,
    destination: trip.destination,
    image: trip.image_url ?? DEFAULT_TRIP_IMAGE,
    participants,
    departureDate: trip.departure_date,
    endDate: trip.return_date,
    status: mapTripStatus(trip),
    budget: Number(trip.budget),
    spent: Number(totalExpenses),
  };
}

export function calculateDaysRemaining(departureDate: string) {
  const today = new Date();
  const departure = new Date(`${departureDate}T00:00:00`);
  const msPerDay = 1000 * 60 * 60 * 24;

  today.setHours(0, 0, 0, 0);

  return Math.max(
    Math.ceil((departure.getTime() - today.getTime()) / msPerDay),
    0,
  );
}

export async function createTripRequest(
  payload: CreateTripPayload,
): Promise<TripResponse> {
  try {
    const { data } = await api.post<TripResponse>("/trips", payload);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível criar a viagem.");
  }
}

export async function getTripsRequest(): Promise<TripResponse[]> {
  try {
    const { data } = await api.get<TripResponse[]>("/trips");
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível carregar as viagens.");
  }
}

export async function getTripByIdRequest(tripId: string): Promise<TripResponse> {
  try {
    const { data } = await api.get<TripResponse>(`/trips/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível carregar a viagem.");
  }
}

export async function updateTripRequest(
  tripId: string,
  payload: UpdateTripPayload,
): Promise<TripResponse> {
  try {
    const { data } = await api.patch<TripResponse>(`/trips/${tripId}`, payload);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível atualizar a viagem.");
  }
}

export async function deleteTripRequest(
  tripId: string,
): Promise<{ message: string }> {
  try {
    const { data } = await api.delete<{ message: string }>(`/trips/${tripId}`);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível excluir a viagem.");
  }
}

export async function getTripSummaryRequest(
  tripId: string,
): Promise<TripFinanceSummary> {
  try {
    const { data } = await api.get<TripFinanceSummary>(`/trips/${tripId}/summary`);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível carregar o resumo financeiro da viagem.");
  }
}

export async function getTripBalancesRequest(
  tripId: string,
): Promise<TripParticipantBalance[]> {
  try {
    const { data } = await api.get<TripParticipantBalance[]>(
      `/trips/${tripId}/balances`,
    );

    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível carregar os saldos da viagem.");
  }
}

export async function getTripSettlementsRequest(
  tripId: string,
): Promise<TripSettlement[]> {
  try {
    const { data } = await api.get<TripSettlement[]>(`/trips/${tripId}/settlements`);
    return data;
  } catch (error) {
    parseApiError(error, "Não foi possível carregar as sugestões de acerto da viagem.");
  }
}

export async function getDashboardTripsRequest(): Promise<DashboardTrip[]> {
  try {
    const trips = await getTripsRequest();

    const dashboardTrips = await Promise.all(
      trips.map(async (trip) => {
        const [members, summary] = await Promise.all([
          getTripMembersRequest(trip.id),
          getTripSummaryRequest(trip.id),
        ]);

        const participants = Math.max(
          members.length,
          Number(summary.participants ?? 0),
          1,
        );

        return mapTripToDashboardTrip(
          trip,
          participants,
          Number(summary.total_expenses),
        );
      }),
    );

    return dashboardTrips.sort(
      (left, right) =>
        new Date(left.departureDate).getTime() -
        new Date(right.departureDate).getTime(),
    );
  } catch (error) {
    parseApiError(error, "Não foi possível montar os dados do dashboard.");
  }
}