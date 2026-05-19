import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, ReceiptText, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { MainLayout } from "../../layouts/MainLayout";
import {
  CURRENT_USER_ID,
  getMemberName,
  tripFinanceRecords,
  type TripDebtSettlement,
} from "../../mock/finance";
import { trips } from "../../mock/trips";
import "../../styles/finance-page.css";

type FinanceTab = "summary" | "settlements";

const TAB_LABELS: Record<FinanceTab, string> = {
  summary: "Resumo pessoal",
  settlements: "Acertos",
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
  const [activeTab, setActiveTab] = useState<FinanceTab>("summary");

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status === "active"), []);

  const tripSummaries = useMemo(() => {
    return activeTrips.map((trip) => {
      const financeRecord = tripFinanceRecords.find((record) => record.tripId === trip.id);
      const myContribution =
        financeRecord?.contributions.find((contribution) => contribution.memberId === CURRENT_USER_ID)
          ?.amount ??
        trip.budget / trip.participants;
      const mySpentShare = trip.spent / trip.participants;
      const balance = myContribution - mySpentShare;

      return {
        tripId: trip.id,
        destination: trip.destination,
        participants: trip.participants,
        budget: trip.budget,
        spent: trip.spent,
        myContribution,
        mySpentShare,
        balance,
      };
    });
  }, [activeTrips]);

  const settlements = useMemo(() => {
    const activeTripIds = new Set(activeTrips.map((trip) => trip.id));

    return tripFinanceRecords
      .filter((record) => activeTripIds.has(record.tripId))
      .flatMap((record) => {
        const destination = activeTrips.find((trip) => trip.id === record.tripId)?.destination ?? "Viagem";

        return record.settlements.map((item) => ({
          ...item,
          tripId: record.tripId,
          destination,
        }));
      });
  }, [activeTrips]);

  const totals = useMemo(() => {
    const totalBudget = tripSummaries.reduce((total, trip) => total + trip.budget, 0);
    const totalSpent = tripSummaries.reduce((total, trip) => total + trip.spent, 0);
    const totalMyContribution = tripSummaries.reduce((total, trip) => total + trip.myContribution, 0);
    const totalMySpentShare = tripSummaries.reduce((total, trip) => total + trip.mySpentShare, 0);
    const myBalance = totalMyContribution - totalMySpentShare;

    const myIncoming = settlements
      .filter((settlement) => settlement.toMemberId === CURRENT_USER_ID)
      .reduce((total, settlement) => total + settlement.amount, 0);

    const myOutgoing = settlements
      .filter((settlement) => settlement.fromMemberId === CURRENT_USER_ID)
      .reduce((total, settlement) => total + settlement.amount, 0);

    return {
      totalBudget,
      totalSpent,
      totalMyContribution,
      totalMySpentShare,
      myBalance,
      myIncoming,
      myOutgoing,
    };
  }, [settlements, tripSummaries]);

  return (
    <MainLayout>
      <div className="finance-page">
        <header className="finance-page__header">
          <h1>Financeiro</h1>
        </header>

        <section className="finance-kpis">
          <article className="finance-kpi-card">
            <span>
              <PiggyBank size={16} /> Voce adicionou
            </span>
            <strong>{formatCurrency(totals.totalMyContribution)}</strong>
          </article>

          <article className="finance-kpi-card">
            <span>
              <ReceiptText size={16} /> Sua cota gasta
            </span>
            <strong>{formatCurrency(totals.totalMySpentShare)}</strong>
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
                    Orcamento total
                    <strong>{formatCurrency(trip.budget)}</strong>
                  </p>
                  <p>
                    Gasto da viagem
                    <strong>{formatCurrency(trip.spent)}</strong>
                  </p>
                  <p>
                    Voce adicionou
                    <strong>{formatCurrency(trip.myContribution)}</strong>
                  </p>
                  <p>
                    Seu gastos
                    <strong>{formatCurrency(trip.mySpentShare)}</strong>
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
          />
        )}
      </div>
    </MainLayout>
  );
}

function SettlementsTab({
  settlements,
  incoming,
  outgoing,
}: {
  settlements: (TripDebtSettlement & { destination: string; tripId: number })[];
  incoming: number;
  outgoing: number;
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
            <h3>Sem acertos pendentes nas viagens ativas.</h3>
          </div>
        ) : (
          settlements.map((settlement) => {
            const isIncoming = settlement.toMemberId === CURRENT_USER_ID;
            const isOutgoing = settlement.fromMemberId === CURRENT_USER_ID;

            return (
              <article key={`${settlement.tripId}-${settlement.note}`} className="settlement-item">
                <header>
                  <h3>{settlement.destination}</h3>
                  <strong className={isIncoming ? "is-positive" : isOutgoing ? "is-negative" : ""}>
                    {formatCurrency(settlement.amount)}
                  </strong>
                </header>

                <p>
                  <span>{getMemberName(settlement.fromMemberId)}</span>
                  <ArrowUpRight size={13} />
                  <span>{getMemberName(settlement.toMemberId)}</span>
                </p>

                <small>{settlement.note}</small>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
