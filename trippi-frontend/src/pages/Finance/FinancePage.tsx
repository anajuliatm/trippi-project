import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { MainLayout } from "../../layouts/MainLayout";
import {
  getDashboardTripsRequest,
  getTripBalancesRequest,
  getTripSettlementsRequest,
  type DashboardTrip,
  type TripParticipantBalance,
  type TripSettlement,
} from "../../services/tripService";
import "../../styles/finance-page.css";

type FinanceTab = "summary" | "settlements";

type TripSummaryView = {
  tripId: string;
  destination: string;
  participants: number;
  budget: number;
  spent: number;
  myPaid: number;
  myShouldPay: number;
  balance: number;
};

type SettlementView = {
  id: string;
  tripId: string;
  destination: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  amount: number;
};

type TripSettlementGroupView = {
  id: string;
  tripId: string;
  destination: string;
  direction: "incoming" | "outgoing";
  totalAmount: number;
  counterparties: number;
  amountPerPerson: number;
};

const TAB_LABELS: Record<FinanceTab, string> = {
  summary: "Resumo por Viagem",
  settlements: "Acertos",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getSignedLabel(value: number) {
  if (value > 0) {
    return "A receber";
  }

  if (value < 0) {
    return "A pagar";
  }

  return "Equilibrado";
}

export function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FinanceTab>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripSummaries, setTripSummaries] = useState<TripSummaryView[]>([]);
  const [settlements, setSettlements] = useState<SettlementView[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadFinance() {
      try {
        setLoading(true);
        setError(null);

        const dashboardTrips = await getDashboardTripsRequest();
        const activeTrips = dashboardTrips.filter((trip) => trip.status === "active");

        const tripData = await Promise.all(
          activeTrips.map(async (trip) => {
            const [balances, settlements] = await Promise.all([
              getTripBalancesRequest(trip.id),
              getTripSettlementsRequest(trip.id),
            ]);

            return { trip, balances, settlements };
          }),
        );

        const nextSummaries = tripData.map(({ trip, balances }) =>
          mapTripSummary(trip, balances, user!.id),
        );

        const nextSettlements = tripData.flatMap(({ trip, settlements }) =>
          mapTripSettlements(settlements, trip, user!.id),
        );

        setTripSummaries(nextSummaries);
        setSettlements(nextSettlements);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel carregar o financeiro.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadFinance();
  }, [user]);

  const groupedSettlements = useMemo(
    () => groupSettlementsByTrip(settlements, user?.id ?? ""),
    [settlements, user?.id],
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="finance-page">
          <header className="finance-page__header">
            <h1>Financeiro</h1>
          </header>
          <section className="settlement-empty">
            <h3>Carregando financeiro...</h3>
          </section>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="finance-page">
          <header className="finance-page__header">
            <h1>Financeiro</h1>
          </header>
          <section className="settlement-empty">
            <h3>Nao foi possivel carregar os dados.</h3>
            <p>{error}</p>
          </section>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="finance-page">
        <header className="finance-page__header">
          <h1>Financeiro</h1>
        </header>

        <div className="finance-tabs" role="tablist" aria-label="Abas da pagina financeiro">
          {(Object.keys(TAB_LABELS) as FinanceTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`finance-tabs__button ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {activeTab === "summary" ? (
          <section className="finance-summary-list">
            {tripSummaries.map((trip, index) => (
              <motion.article
                key={trip.tripId}
                className="finance-trip-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.24, ease: "easeOut" }}
              >
                <div className="finance-trip-card__head">
                  <h2>{trip.destination}</h2>
                  <span className={`finance-balance-tag ${trip.balance >= 0 ? "is-positive" : "is-negative"}`}>
                    {getSignedLabel(trip.balance)}
                  </span>
                </div>

                <div className="finance-trip-card__grid">
                  <p>
                    Orçamento total
                    <strong>{formatCurrency(trip.budget)}</strong>
                  </p>
                  <p>
                    Gasto total da viagem
                    <strong>{formatCurrency(trip.spent)}</strong>
                  </p>
                  <p>
                    Sua parte
                    <strong>{formatCurrency(trip.myShouldPay)}</strong>
                  </p>
                </div>

                <footer className="finance-trip-card__footer">
                  <span>{trip.participants} participantes</span>
                </footer>
              </motion.article>
            ))}
          </section>
        ) : (
          <SettlementsTab settlements={groupedSettlements} />
        )}
      </div>
    </MainLayout>
  );
}

function mapTripSummary(
  trip: DashboardTrip,
  balances: TripParticipantBalance[],
  currentUserId: string,
): TripSummaryView {
  const myBalance = balances.find((item) => item.user_id === currentUserId);

  return {
    tripId: trip.id,
    destination: trip.destination,
    participants: trip.participants,
    budget: trip.budget,
    spent: trip.spent,
    myPaid: Number(myBalance?.paid ?? 0),
    myShouldPay: Number(myBalance?.should_pay ?? 0),
    balance: Number(myBalance?.balance ?? 0),
  };
}

function mapTripSettlements(
  settlements: TripSettlement[],
  trip: DashboardTrip,
  currentUserId: string,
): SettlementView[] {
  return settlements
    .filter(
      (settlement) =>
        settlement.from_user_id === currentUserId || settlement.to_user_id === currentUserId,
    )
    .map((settlement, index) => ({
      id: `${trip.id}:${settlement.from_user_id}:${settlement.to_user_id}:${index}`,
      tripId: trip.id,
      destination: trip.destination,
      fromUserId: settlement.from_user_id,
      toUserId: settlement.to_user_id,
      fromName: settlement.from_username,
      toName: settlement.to_username,
      amount: Number(settlement.amount),
    }));
}

function groupSettlementsByTrip(
  settlements: SettlementView[],
  currentUserId: string,
): TripSettlementGroupView[] {
  const grouped = new Map<string, TripSettlementGroupView>();

  for (const settlement of settlements) {
    const isIncoming = settlement.toUserId === currentUserId;
    const direction = isIncoming ? "incoming" : "outgoing";
    const key = `${settlement.tripId}:${direction}`;
    const currentGroup = grouped.get(key);

    if (currentGroup) {
      currentGroup.totalAmount += settlement.amount;
      currentGroup.counterparties += 1;
      currentGroup.amountPerPerson = roundCurrency(
        currentGroup.totalAmount / currentGroup.counterparties,
      );
      continue;
    }

    grouped.set(key, {
      id: key,
      tripId: settlement.tripId,
      destination: settlement.destination,
      direction,
      totalAmount: settlement.amount,
      counterparties: 1,
      amountPerPerson: roundCurrency(settlement.amount),
    });
  }

  return Array.from(grouped.values());
}

function SettlementsTab({
  settlements,
}: {
  settlements: TripSettlementGroupView[];
}) {
  return (
    <section className="settlements-section">
      <div className="settlement-list">
        {settlements.length === 0 ? (
          <div className="settlement-empty">
            <h3>Sem sugestoes de acerto nas viagens ativas.</h3>
          </div>
        ) : (
          settlements.map((settlement) => {
            return (
              <article key={settlement.id} className="settlement-item">
                <p className="settlement-item__summary">
                  <span className="settlement-item__destination">{settlement.destination}</span>
                  <span className="settlement-item__divider">|</span>
                  <span>Valor por pessoa:</span>
                  <strong className="settlement-item__value">
                    {formatCurrency(settlement.amountPerPerson)}
                  </strong>
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}