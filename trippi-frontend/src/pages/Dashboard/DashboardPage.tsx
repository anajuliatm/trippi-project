import { MainLayout } from "../../layouts/MainLayout";
import { TripCard } from "../../components/dashboard/TripCard";
import { calculateDaysRemaining, trips } from "../../mock/trips";
import { CountdownCard } from "../../components/dashboard/CountdownCard";
// import { FinanceCard } from "../../components/finance/FinanceCard";
// import { Timeline } from "../../components/itinerary/Timeline";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const activeTrips = trips.filter((trip) => trip.status === "active");
  const nextTrip = activeTrips[0];

  return (
    <MainLayout>
      <div className="dashboard">
        <h1 className="dashboard__title">Próximas viagens</h1>

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

        {nextTrip && (
          <CountdownCard
            destination={nextTrip.destination}
            days={calculateDaysRemaining(nextTrip.departureDate)}
          />
        )}

      </div>
    </MainLayout>
  );
}