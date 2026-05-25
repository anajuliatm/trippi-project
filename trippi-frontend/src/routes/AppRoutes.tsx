import { BrowserRouter, Routes, Route } from "react-router-dom";

import { DashboardPage } from "../pages/Dashboard/DashboardPage.tsx";
import { FinancePage } from "../pages/Finance/FinancePage.tsx";
import { LoginPage } from "../pages/Login/LoginPage.tsx";
import { ProfilePage } from "../pages/Profile/ProfilePage.tsx";
import { TripDetailsPage } from "../pages/TripDetails/TripDetailsPage.tsx";
import { TripsPage } from "../pages/Trips/TripsPage.tsx";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/trip/:id" element={<TripDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}