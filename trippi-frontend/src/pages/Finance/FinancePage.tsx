import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { MainLayout } from "../../layouts/MainLayout";
import {
  getDashboardTripsRequest,
  getTripBalancesRequest,
  type DashboardTrip,
  type TripParticipantBalance,
} from "../../services/tripService";
import "../../styles/finance-page.css";

type TripSummaryView = {
  tripId: string;
  destination: string;
  participants: number;
  budget: number;
  spent: number;
  myPaid: number;
  myShouldPay: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FinancePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripSummaries, setTripSummaries] = useState<TripSummaryView[]>([]);

  async function refreshFinance() {
    if (!user) return;

    const dashboardTrips = await getDashboardTripsRequest();
    const activeTrips = dashboardTrips.filter((trip) => trip.status === "active");
    const tripData = await Promise.all(
      activeTrips.map(async (trip) => {
        const balances = await getTripBalancesRequest(trip.id);
        return { trip, balances };
      }),
    );

    setTripSummaries(tripData.map(({ trip, balances }) => mapTripSummary(trip, balances, user.id)));
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadFinance() {
      try {
        setLoading(true);
        setError(null);
        await refreshFinance();
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o financeiro.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadFinance();

    const interval = setInterval(() => {
      void refreshFinance().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    async function reload() {
      setLoading(true);
      try {
        await refreshFinance();
      } catch {
        // Keep the current view if a background reload fails.
      } finally {
        setLoading(false);
      }
    }

    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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
            <h3>Não foi possível carregar os dados.</h3>
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

        {tripSummaries.length === 0 ? (
          <div className="settlement-empty">
            <h3>Nenhuma viagem ativa encontrada.</h3>
          </div>
        ) : (
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
  };
}
