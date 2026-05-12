import { BrowserRouter, Routes, Route } from "react-router-dom";

import { DashboardPage } from "../pages/Dashboard/DashboardPage.tsx";
import { TripDetailsPage } from "../pages/TripDetails/TripDetailsPage.tsx";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/trip/:id" element={<TripDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}