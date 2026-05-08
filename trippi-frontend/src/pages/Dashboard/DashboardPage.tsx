import { MainLayout } from "../../layouts/MainLayout";
import { TripCard } from "../../components/dashboard/TripCard";

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
          gap: "24px"
        }}
      >
        <TripCard />
        <TripCard />
      </div>
    </MainLayout>
  );
}