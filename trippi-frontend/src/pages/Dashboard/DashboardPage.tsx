import { MainLayout } from "../../layouts/MainLayout";

import { TripCard } from "../../components/dashboard/TripCard";

import { trips } from "../../mock/trips";

import { CountdownCard } from "../../components/dashboard/CountdownCard";

import { FinanceCard } from "../../components/finance/FinanceCard";

import { Timeline } from "../../components/itinerary/Timeline";

export function DashboardPage() {
  return (
    <MainLayout>
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "32px"
        }}
      >
        Suas viagens
      </h1>

      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap"
        }}
      >
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            destination={trip.destination}
            image={trip.image}
            participants={trip.participants}
          />
        ))}
      </div>
      <CountdownCard 
        destination="Paris"
        days={10}
      />

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "40px"
        }}
      >
        <FinanceCard
          title="Orçamento"
          value="R$ 8.500"
        />

        <FinanceCard
          title="Gasto"
          value="R$ 3.200"
        />

        <FinanceCard
          title="Saldo"
          value="R$ 5.300"
        />
      </div>

      <Timeline />
    </MainLayout>
  );
}