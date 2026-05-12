import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "../../layouts/MainLayout";
import {
  calculateDaysRemaining,
  getTripById,
  type Trip,
} from "../../mock/trips";
import "../../styles/trip-details.css";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function FinanceSummary({ trip }: { trip: Trip }) {
  const remaining = trip.budget - trip.spent;

  return (
    <section className="trip-finance">
      <h2 className="trip-section-title">Destaque financeiro</h2>

      <div className="trip-finance__grid">
        <article className="trip-finance__card trip-finance__card--spent">
          <p>Total gasto</p>
          <strong>{formatCurrency(trip.spent)}</strong>
        </article>

        <article className="trip-finance__card">
          <p>Orcamento total</p>
          <strong>{formatCurrency(trip.budget)}</strong>
        </article>

        <article className="trip-finance__card trip-finance__card--remaining">
          <p>Saldo restante</p>
          <strong>{formatCurrency(remaining)}</strong>
        </article>
      </div>
    </section>
  );
}

function ItineraryTabs({ trip }: { trip: Trip }) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = trip.itinerary[activeDayIndex];

  return (
    <section className="trip-itinerary">
      <h2 className="trip-section-title">Roteiro da viagem</h2>

      <div className="trip-itinerary__tabs">
        {trip.itinerary.map((day, index) => (
          <button
            type="button"
            key={day.date}
            className={`trip-itinerary__tab ${
              activeDayIndex === index ? "is-active" : ""
            }`}
            onClick={() => setActiveDayIndex(index)}
          >
            {formatDate(day.date)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay.date}
          className="trip-itinerary__activities"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {activeDay.activities.map((activity) => (
            <article
              key={`${activeDay.date}-${activity.time}-${activity.title}`}
              className="trip-activity"
            >
              <div className="trip-activity__time">
                <Clock3 size={16} />
                <span>{activity.time}</span>
              </div>

              <div className="trip-activity__content">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>

                <div className="trip-activity__meta">
                  <span>
                    <MapPin size={14} /> {activity.location}
                  </span>
                  <span>{activity.notes}</span>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function TripDetailsPage() {
  const { id } = useParams();
  const tripId = Number(id);

  const trip = useMemo(() => {
    if (Number.isNaN(tripId)) {
      return undefined;
    }

    return getTripById(tripId);
  }, [tripId]);

  if (!trip) {
    return (
      <MainLayout>
        <div className="trip-details-empty">
          <h1>Viagem nao encontrada</h1>
          <p>Confira o link e selecione uma viagem valida no dashboard.</p>
          <Link to="/" className="trip-details-empty__link">
            Voltar para o dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  const daysRemaining = calculateDaysRemaining(trip.departureDate);

  return (
    <MainLayout>
      <div className="trip-details-page">
        <header className="trip-hero" style={{ backgroundImage: `url(${trip.image})` }}>
          <div className="trip-hero__overlay" />

          <motion.div
            className="trip-hero__content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Link to="/" className="trip-hero__back-link">
              Voltar ao dashboard
            </Link>

            <h1>{trip.destination}</h1>

            <div className="trip-hero__meta-grid">
              <div>
                <CalendarDays size={18} />
                <span>{formatDate(trip.departureDate)}</span>
              </div>
              <div>
                <Users size={18} />
                <span>{trip.participants} participantes</span>
              </div>
            </div>

            <div className="trip-hero__countdown">
              <strong>{daysRemaining}</strong>
              <span>dias para embarque</span>
            </div>
          </motion.div>
        </header>

        <FinanceSummary trip={trip} />
        <ItineraryTabs trip={trip} />
      </div>
    </MainLayout>
  );
}
