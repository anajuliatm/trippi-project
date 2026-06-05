import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  ReceiptText,
  Users,
} from "lucide-react";
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

const TAB_LABELS: Record<FinanceTab, string> = {
  summary: "Resumo pessoal",
  settlements: "Sugestoes de acerto",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

  const totals = useMemo(() => {
    const totalBudget = tripSummaries.reduce((total, trip) => total + trip.budget, 0);
    const totalSpent = tripSummaries.reduce((total, trip) => total + trip.spent, 0);
    const totalMyPaid = tripSummaries.reduce((total, trip) => total + trip.myPaid, 0);
    const totalMyShouldPay = tripSummaries.reduce(
      (total, trip) => total + trip.myShouldPay,
      0,
    );
    const myBalance = tripSummaries.reduce((total, trip) => total + trip.balance, 0);

    const myIncoming = settlements
      .filter((settlement) => settlement.toUserId === user?.id)
      .reduce((total, settlement) => total + settlement.amount, 0);

    const myOutgoing = settlements
      .filter((settlement) => settlement.fromUserId === user?.id)
      .reduce((total, settlement) => total + settlement.amount, 0);

    return {
      totalBudget,
      totalSpent,
      totalMyPaid,
      totalMyShouldPay,
      myBalance,
      myIncoming,
      myOutgoing,
    };
  }, [settlements, tripSummaries, user?.id]);

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

        <section className="finance-kpis">
          <article className="finance-kpi-card">
            <span>
              <PiggyBank size={16} /> Voce pagou
            </span>
            <strong>{formatCurrency(totals.totalMyPaid)}</strong>
          </article>

          <article className="finance-kpi-card">
            <span>
              <ReceiptText size={16} /> A pagar
            </span>
            <strong>{formatCurrency(totals.totalMyShouldPay)}</strong>
          </article>

          <article className="finance-kpi-card">
            <span>
              <Users size={16} /> Seu saldo geral
            </span>
            <strong className={totals.myBalance >= 0 ? "is-positive" : "is-negative"}>
              {formatCurrency(totals.myBalance)}
            </strong>
          </article>
        </section>

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
                    Você pagou
                    <strong>{formatCurrency(trip.myPaid)}</strong>
                  </p>
                  <p>
                    A pagar
                    <strong>{formatCurrency(trip.myShouldPay)}</strong>
                  </p>
                </div>

                <footer className="finance-trip-card__footer">
                  <span>{trip.participants} participantes</span>
                  <strong className={trip.balance >= 0 ? "is-positive" : "is-negative"}>
                    {formatCurrency(Math.abs(trip.balance))}
                  </strong>
                </footer>
              </motion.article>
            ))}
          </section>
        ) : (
          <SettlementsTab
            settlements={settlements}
            incoming={totals.myIncoming}
            outgoing={totals.myOutgoing}
            currentUserId={user?.id ?? ""}
          />
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

function SettlementsTab({
  settlements,
  incoming,
  outgoing,
  currentUserId,
}: {
  settlements: SettlementView[];
  incoming: number;
  outgoing: number;
  currentUserId: string;
}) {
  return (
    <section className="settlements-section">
      <div className="settlements-summary">
        <article>
          <span>
            <ArrowDownLeft size={15} /> A receber
          </span>
          <strong>{formatCurrency(incoming)}</strong>
        </article>
        <article>
          <span>
            <ArrowUpRight size={15} /> A pagar
          </span>
          <strong>{formatCurrency(outgoing)}</strong>
        </article>
      </div>

      <div className="settlement-list">
        {settlements.length === 0 ? (
          <div className="settlement-empty">
            <h3>Sem sugestoes de acerto nas viagens ativas.</h3>
          </div>
        ) : (
          settlements.map((settlement) => {
            const isIncoming = settlement.toUserId === currentUserId;
            const isOutgoing = settlement.fromUserId === currentUserId;

            return (
              <article key={settlement.id} className="settlement-item">
                <header>
                  <h3>{settlement.destination}</h3>
                  <strong className={isIncoming ? "is-positive" : isOutgoing ? "is-negative" : ""}>
                    {formatCurrency(settlement.amount)}
                  </strong>
                </header>

                <p>
                  <span>{settlement.fromName}</span>
                  <ArrowUpRight size={13} />
                  <span>{settlement.toName}</span>
                </p>

                <small>Sugestao baseada no saldo atual da viagem.</small>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}