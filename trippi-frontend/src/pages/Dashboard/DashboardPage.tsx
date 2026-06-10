import { MainLayout } from "../../layouts/MainLayout";
import { TripCard } from "../../components/dashboard/TripCard";
import { calculateDaysRemaining, 
  getDashboardTripsRequest,
  type DashboardTrip,
} from "../../services/tripService";
import { CountdownCard } from "../../components/dashboard/CountdownCard";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardTripsRequest();
      setTrips(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();

    const interval = setInterval(async () => {
      try {
        const data = await getDashboardTripsRequest();
        setTrips(data);
      } catch {}
    }, 30000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status === "active"),
    [trips],
  );

  const nextTrip = activeTrips[0];

  return (
    <MainLayout>
      <div className="dashboard">
        <h1 className="dashboard__title">Próximas viagens</h1>

        {loading ? <section className="trips-empty"><h2>Carregando viagens...</h2></section> : null}

        {!loading && error ? <p>{error}</p> : null}

        {!loading && !error && activeTrips.length === 0 ? (
          <section className="trips-empty">
            <h2>Nenhuma viagem ativa encontrada.</h2>
          </section>
        ) : null}

        {!loading && !error && activeTrips.length > 0 ? (
          <>
            <div className="dashboard__trips">
              {activeTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  destination={trip.destination}
                  image={trip.image}
                  participants={trip.participants}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                />
              ))}
            </div>

            {nextTrip ? (
              <CountdownCard
                destination={nextTrip.destination}
                days={calculateDaysRemaining(nextTrip.departureDate)}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}