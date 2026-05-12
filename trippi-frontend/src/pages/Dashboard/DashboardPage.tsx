import { MainLayout } from "../../layouts/MainLayout";
import { TripCard } from "../../components/dashboard/TripCard";
import { trips } from "../../mock/trips";
import { CountdownCard } from "../../components/dashboard/CountdownCard";
import { FinanceCard } from "../../components/finance/FinanceCard";
import { Timeline } from "../../components/itinerary/Timeline";
import "../../styles/dashboard.css";

export function DashboardPage() {
  return (
    <MainLayout>
      <div className="dashboard">
        <h1 className="dashboard__title">Suas viagens</h1>

        <div className="dashboard__trips">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              destination={trip.destination}
              image={trip.image}
              participants={trip.participants}
            />
          ))}
        </div>

        <CountdownCard destination="Paris" days={10} />

        <div className="dashboard__finance">
          <FinanceCard title="Orçamento" value="R$ 8.500" />
          <FinanceCard title="Gasto" value="R$ 3.200" />
          <FinanceCard title="Saldo" value="R$ 5.300" />
        </div>

        <Timeline />
      </div>
    </MainLayout>
  );
}