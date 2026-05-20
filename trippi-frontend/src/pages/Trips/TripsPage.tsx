import { motion } from "framer-motion";
import { CalendarDays, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts/MainLayout";
import { trips, type TripStatus } from "../../mock/trips";
import "../../styles/trips-page.css";

const TAB_OPTIONS: { label: string; value: TripStatus }[] = [
  { label: "Ativas", value: "active" },
  { label: "Concluidas", value: "completed" },
];

const STATUS_LABEL: Record<TripStatus, string> = {
  active: "Ativa",
  completed: "Concluida",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function TripsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TripStatus>("active");

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => trip.status === activeTab);
  }, [activeTab]);

  return (
    <MainLayout>
      <div className="trips-page">
        <header className="trips-page__header">
          <h1>Todas as viagens</h1>
        </header>

        <div className="trips-tabs" role="tablist" aria-label="Filtrar viagens por status">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`trips-tabs__button ${activeTab === tab.value ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button type="button" className="trips-page__add-btn" aria-label="Adicionar viagem">
          <Plus size={16} />
          <span>Adicionar viagem</span>
        </button>

        {filteredTrips.length > 0 ? (
          <section className="trips-grid">
            {filteredTrips.map((trip, index) => (
              <motion.button
                key={trip.id}
                type="button"
                className="trip-list-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.28, ease: "easeOut" }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                <img src={trip.image} alt={trip.destination} className="trip-list-card__image" />

                <div className="trip-list-card__body">
                  <div className="trip-list-card__title-row">
                    <h2>{trip.destination}</h2>
                    <span className={`trip-status trip-status--${trip.status}`}>
                      {STATUS_LABEL[trip.status]}
                    </span>
                  </div>

                  <div className="trip-list-card__meta">
                    <span>
                      <Users size={14} /> {trip.participants} participantes
                    </span>
                    <span>
                      <CalendarDays size={14} /> {formatDate(trip.departureDate)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </section>
        ) : (
          <section className="trips-empty">
            <h2>Nenhuma viagem cadastrada.</h2>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
