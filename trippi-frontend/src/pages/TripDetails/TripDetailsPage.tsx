import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { BackButton } from "../../components/common/BackButton";
import { MainLayout } from "../../layouts/MainLayout";
import { calculateDaysRemaining, getTripById, type Trip } from "../../mock/trips";
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

function getTripDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

type DetailTab = "overview" | "finance" | "itinerary";
type ActionButtonMode = "add" | "edit" | "delete";

const TAB_LABELS: Record<DetailTab, string> = {
  overview: "Overview",
  finance: "Financeiro",
  itinerary: "Roteiro",
};

function ActionButtons({
  modes,
  className,
}: {
  modes: ActionButtonMode[];
  className?: string;
}) {
  const iconByMode: Record<ActionButtonMode, ReactNode> = {
    add: <Plus size={15} />,
    edit: <Pencil size={15} />,
    delete: <Trash2 size={15} />,
  };

  const labelByMode: Record<ActionButtonMode, string> = {
    add: "Adicionar",
    edit: "Editar",
    delete: "Excluir",
  };

  return (
    <div className={`trip-section__actions ${className ?? ""}`.trim()} aria-label="Acoes da secao">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`trip-action-btn ${mode === "delete" ? "trip-action-btn--danger" : ""}`}
          aria-label={labelByMode[mode]}
        >
          {iconByMode[mode]}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({ trip, daysRemaining }: { trip: Trip; daysRemaining: number }) {
  return (
    <section className="trip-overview">
      <header className="trip-hero" style={{ backgroundImage: `url(${trip.image})` }}>
        <div className="trip-hero__overlay" />

        <motion.div
          className="trip-hero__content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="trip-hero__title-row">
            <h1>{trip.destination}</h1>
            <ActionButtons modes={["edit", "delete"]} />
          </div>

          <div className="trip-hero__meta-grid">
            <div>
              <CalendarDays size={18} />
              <span>
                {formatDate(trip.departureDate)} - {formatDate(trip.endDate)}
              </span>
            </div>
            <div>
              <Users size={18} />
              <span>{trip.participants} participantes</span>
            </div>
          </div>

          <div className="trip-hero__countdown">
            <div>
              <strong>{daysRemaining}</strong>
              <span> dias para a viagem.</span>
            </div>
          </div>
        </motion.div>
      </header>
    </section>
  );
}

function FinanceSummary({ trip }: { trip: Trip }) {
  const remaining = trip.budget - trip.spent;

  return (
    <section className="trip-finance">
      <h2 className="trip-section-title">Financeiro</h2>

      <div className="trip-finance__grid">
        <article className="trip-finance__card trip-finance__card--budget">
          <ActionButtons modes={["edit"]} className="trip-finance__card-actions" />
          <p>Orcamento total</p>
          <strong>{formatCurrency(trip.budget)}</strong>
        </article>

        <article className="trip-finance__card trip-finance__card--spent">
          <p>Total gasto</p>
          <strong>{formatCurrency(trip.spent)}</strong>
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
  const itineraryDates = useMemo(
    () => getTripDateRange(trip.departureDate, trip.endDate),
    [trip.departureDate, trip.endDate]
  );

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDate = itineraryDates[activeDayIndex] ?? itineraryDates[0];
  const activeDay = trip.itinerary.find((day) => day.date === activeDate);

  return (
    <section className="trip-itinerary">
      <div className="trip-section__header">
        <h2 className="trip-section-title">Roteiro</h2>
        <ActionButtons modes={["add"]} />
      </div>

      <div className="trip-itinerary__tabs">
        {itineraryDates.map((date, index) => (
          <button
            type="button"
            key={date}
            className={`trip-itinerary__tab ${activeDayIndex === index ? "is-active" : ""}`}
            onClick={() => setActiveDayIndex(index)}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeDate}
          className="trip-itinerary__activities"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {activeDay && activeDay.activities.length > 0 ? (
            activeDay.activities.map((activity) => (
              <article key={`${activeDate}-${activity.time}-${activity.title}`} className="trip-activity">
                <div className="trip-activity__time">
                  <Clock3 size={16} />
                  <span>{activity.time}</span>
                </div>

                <div className="trip-activity__content">
                  <div className="trip-activity__title-row">
                    <h3>{activity.title}</h3>
                    <ActionButtons modes={["edit", "delete"]} />
                  </div>
                  <p>{activity.description}</p>

                  <div className="trip-activity__meta">
                    <span>
                      <MapPin size={14} /> {activity.location}
                    </span>
                    <span>{activity.notes}</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="trip-activity trip-activity--empty">
              <div className="trip-activity__content">
                <div className="trip-activity__title-row">
                  <h3>Nenhuma atividade neste dia</h3>
                  <ActionButtons modes={["add"]} />
                </div>
                <p>Use o botao de adicionar para incluir itens no roteiro desta data.</p>
              </div>
            </article>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function TripDetailsPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

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
          <BackButton className="trip-details-empty__link" />
        </div>
      </MainLayout>
    );
  }

  const daysRemaining = calculateDaysRemaining(trip.departureDate);

  return (
    <MainLayout>
      <div className="trip-details-page">
        <div className="trip-details__topbar">
          <BackButton className="trip-hero__back-link" />

          <div className="trip-page-tabs" role="tablist" aria-label="Abas dos detalhes da viagem">
            {(Object.keys(TAB_LABELS) as DetailTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`trip-page-tab ${activeTab === tab ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "overview" && <OverviewTab trip={trip} daysRemaining={daysRemaining} />}
            {activeTab === "finance" && <FinanceSummary trip={trip} />}
            {activeTab === "itinerary" && <ItineraryTabs trip={trip} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
