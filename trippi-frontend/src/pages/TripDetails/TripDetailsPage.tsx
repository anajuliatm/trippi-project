import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../components/common/BackButton";
import { Modal } from "../../components/common/Modal";
import { MainLayout } from "../../layouts/MainLayout";
import { getMemberName, tripFinanceRecords } from "../../mock/finance";
import {
  calculateDaysRemaining,
  getTripById,
  type Trip,
  type TripActivity,
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

function formatSignedCurrency(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(value))}`;
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
type ItineraryEditorMode = "add" | "edit";

interface OverviewFormState {
  departureDate: string;
  endDate: string;
}

interface ItineraryFormState {
  date: string;
  time: string;
  amount: string;
  title: string;
  description: string;
  location: string;
  notes: string;
}

interface EditingActivityRef {
  date: string;
  index: number;
}

function createParticipantUsers(participantsCount: number) {
  return Array.from({ length: participantsCount }, (_, index) => `Usuario ${index + 1}`);
}

const TAB_LABELS: Record<DetailTab, string> = {
  overview: "Overview",
  finance: "Financeiro",
  itinerary: "Roteiro",
};

function ActionButtons({
  modes,
  className,
  onAction,
}: {
  modes: ActionButtonMode[];
  className?: string;
  onAction?: (mode: ActionButtonMode) => void;
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
          onClick={() => onAction?.(mode)}
        >
          {iconByMode[mode]}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({
  trip,
  daysRemaining,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  daysRemaining: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
            <ActionButtons
              modes={["edit", "delete"]}
              onAction={(mode) => {
                if (mode === "edit") {
                  onEdit();
                }

                if (mode === "delete") {
                  onDelete();
                }
              }}
            />
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

function FinanceSummary({ trip, onEditBudget }: { trip: Trip; onEditBudget: () => void }) {
  const remaining = trip.budget - trip.spent;
  const financeEntries = tripFinanceRecords.find((record) => record.tripId === trip.id)?.entries ?? [];

  return (
    <section className="trip-finance">
      <h2 className="trip-section-title">Financeiro</h2>

      <div className="trip-finance__grid">
        <article className="trip-finance__card trip-finance__card--budget">
          <ActionButtons
            modes={["edit"]}
            className="trip-finance__card-actions"
            onAction={() => onEditBudget()}
          />
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

      <section className="trip-finance__entries" aria-label="Lancamentos da viagem">
        <div className="trip-section__header">
          <h3 className="trip-finance__entries-title">Lancamentos da viagem</h3>
        </div>

        {financeEntries.length > 0 ? (
          <div className="trip-finance__entries-list">
            {financeEntries.map((entry) => {
              const signedAmount = entry.type === "contribution" ? entry.amount : -entry.amount;

              return (
                <article key={entry.id} className="trip-finance-entry">
                  <div className="trip-finance-entry__icon">
                    {entry.type === "contribution" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>

                  <div className="trip-finance-entry__content">
                    <strong>{entry.description}</strong>
                    <span>{getMemberName(entry.memberId)} registrou este lancamento</span>
                  </div>

                  <strong
                    className={`trip-finance-entry__amount ${signedAmount >= 0 ? "is-positive" : "is-negative"}`}
                  >
                    {formatSignedCurrency(signedAmount)}
                  </strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="trip-finance__entries-empty">
            <h3>Sem lancamentos para esta viagem.</h3>
          </div>
        )}
      </section>
    </section>
  );
}

function ItineraryTabs({
  trip,
  onAdd,
  onAddForDate,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  onAdd: () => void;
  onAddForDate: (date: string) => void;
  onEdit: (date: string, index: number, activity: TripActivity) => void;
  onDelete: (date: string, index: number) => void;
}) {
  const itineraryDates = useMemo(
    () => getTripDateRange(trip.departureDate, trip.endDate),
    [trip.departureDate, trip.endDate]
  );

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  useEffect(() => {
    if (activeDayIndex <= itineraryDates.length - 1) {
      return;
    }

    setActiveDayIndex(0);
  }, [activeDayIndex, itineraryDates.length]);

  const activeDate = itineraryDates[activeDayIndex] ?? itineraryDates[0];
  const activeDay = trip.itinerary.find((day) => day.date === activeDate);

  return (
    <section className="trip-itinerary">
      <div className="trip-section__header">
        <h2 className="trip-section-title">Roteiro</h2>
        <ActionButtons modes={["add"]} onAction={() => onAdd()} />
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
            activeDay.activities.map((activity, activityIndex) => (
              <article key={`${activeDate}-${activity.time}-${activity.title}`} className="trip-activity">
                <div className="trip-activity__time">
                  <Clock3 size={16} />
                  <span>{activity.time}</span>
                </div>

                <div className="trip-activity__content">
                  <div className="trip-activity__title-row">
                    <h3>{activity.title}</h3>
                    <div className="trip-activity__title-actions">
                      <span className="trip-activity__inline-amount">{formatCurrency(activity.amount)}</span>
                      <ActionButtons
                        modes={["edit", "delete"]}
                        onAction={(mode) => {
                          if (mode === "edit") {
                            onEdit(activeDate, activityIndex, activity);
                          }

                          if (mode === "delete") {
                            onDelete(activeDate, activityIndex);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p>{activity.description}</p>
                  <span>{activity.notes}</span>

                  <div className="trip-activity__meta">
                    <span>
                      <MapPin size={14} /> {activity.location}
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="trip-activity trip-activity--empty">
              <div className="trip-activity__content">
                <div className="trip-activity__title-row">
                  <h3>Nenhuma atividade neste dia</h3>
                  <ActionButtons modes={["add"]} onAction={() => onAddForDate(activeDate)} />
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
  const navigate = useNavigate();
  const { id } = useParams();
  const tripId = Number(id);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const trip = useMemo(() => {
    if (Number.isNaN(tripId)) {
      return undefined;
    }

    return getTripById(tripId);
  }, [tripId]);

  const [tripData, setTripData] = useState<Trip | null>(trip ?? null);
  const [isOverviewEditOpen, setIsOverviewEditOpen] = useState(false);
  const [isTripDeleteOpen, setIsTripDeleteOpen] = useState(false);
  const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isItineraryDeleteOpen, setIsItineraryDeleteOpen] = useState(false);

  const [overviewForm, setOverviewForm] = useState<OverviewFormState>({
    departureDate: "",
    endDate: "",
  });

  const [participantsUsers, setParticipantsUsers] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState("");
  const [budgetDraftValue, setBudgetDraftValue] = useState("0");

  const [itineraryMode, setItineraryMode] = useState<ItineraryEditorMode>("add");
  const [itineraryForm, setItineraryForm] = useState<ItineraryFormState>({
    date: "",
    time: "09:00",
    amount: "0",
    title: "",
    description: "",
    location: "",
    notes: "",
  });
  const [editingActivityRef, setEditingActivityRef] = useState<EditingActivityRef | null>(null);
  const [pendingDeleteRef, setPendingDeleteRef] = useState<EditingActivityRef | null>(null);

  useEffect(() => {
    setTripData(trip ?? null);
  }, [trip]);

  useEffect(() => {
    if (!trip) {
      setParticipantsUsers([]);
      return;
    }

    setParticipantsUsers(createParticipantUsers(trip.participants));
  }, [trip]);

  const itineraryDates = useMemo(() => {
    if (!tripData) {
      return [];
    }

    return getTripDateRange(tripData.departureDate, tripData.endDate);
  }, [tripData]);

  const budgetPreview = useMemo(() => {
    const parsedValue = Number(budgetDraftValue);
    return Number.isNaN(parsedValue) ? 0 : Math.max(parsedValue, 0);
  }, [budgetDraftValue]);

  function openOverviewEditModal() {
    if (!tripData) {
      return;
    }

    setOverviewForm({
      departureDate: tripData.departureDate,
      endDate: tripData.endDate,
    });
    setParticipantInput("");
    setIsOverviewEditOpen(true);
  }

  function handleSaveOverview() {
    setTripData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        departureDate: overviewForm.departureDate,
        endDate: overviewForm.endDate,
        participants: participantsUsers.length,
      };
    });

    setIsOverviewEditOpen(false);
  }

  function openBudgetModal() {
    if (!tripData) {
      return;
    }

    setBudgetDraftValue(String(tripData.budget));
    setIsBudgetEditOpen(true);
  }

  function handleSaveBudget() {
    setTripData((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        budget: budgetPreview,
      };
    });

    setIsBudgetEditOpen(false);
  }

  function openAddItineraryModal(date?: string) {
    const initialDate = date ?? itineraryDates[0] ?? tripData?.departureDate ?? "";

    setItineraryMode("add");
    setEditingActivityRef(null);
    setItineraryForm({
      date: initialDate,
      time: "09:00",
      amount: "0",
      title: "",
      description: "",
      location: "",
      notes: "",
    });
    setIsItineraryModalOpen(true);
  }

  function openEditItineraryModal(date: string, index: number, activity: TripActivity) {
    setItineraryMode("edit");
    setEditingActivityRef({ date, index });
    setItineraryForm({
      date,
      time: activity.time,
      amount: String(activity.amount),
      title: activity.title,
      description: activity.description,
      location: activity.location,
      notes: activity.notes,
    });
    setIsItineraryModalOpen(true);
  }

  function handleSaveItineraryItem() {
    setTripData((previous) => {
      if (!previous) {
        return previous;
      }

      const itinerary = previous.itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
      const parsedAmount = Number(itineraryForm.amount);
      const newActivity: TripActivity = {
        time: itineraryForm.time,
        amount: Number.isNaN(parsedAmount) ? 0 : Math.max(parsedAmount, 0),
        title: itineraryForm.title,
        description: itineraryForm.description,
        location: itineraryForm.location,
        notes: itineraryForm.notes,
      };

      if (itineraryMode === "edit" && editingActivityRef) {
        const oldDayIndex = itinerary.findIndex((day) => day.date === editingActivityRef.date);

        if (oldDayIndex >= 0) {
          itinerary[oldDayIndex].activities.splice(editingActivityRef.index, 1);
        }
      }

      let targetDayIndex = itinerary.findIndex((day) => day.date === itineraryForm.date);

      if (targetDayIndex < 0) {
        itinerary.push({ date: itineraryForm.date, activities: [] });
        itinerary.sort((first, second) => first.date.localeCompare(second.date));
        targetDayIndex = itinerary.findIndex((day) => day.date === itineraryForm.date);
      }

      itinerary[targetDayIndex].activities.push(newActivity);

      return {
        ...previous,
        itinerary,
      };
    });

    setIsItineraryModalOpen(false);
  }

  function openItineraryDeleteModal(date: string, index: number) {
    setPendingDeleteRef({ date, index });
    setIsItineraryDeleteOpen(true);
  }

  function handleDeleteItineraryItem() {
    if (!pendingDeleteRef) {
      return;
    }

    setTripData((previous) => {
      if (!previous) {
        return previous;
      }

      const itinerary = previous.itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
      const dayIndex = itinerary.findIndex((day) => day.date === pendingDeleteRef.date);

      if (dayIndex < 0) {
        return previous;
      }

      itinerary[dayIndex].activities.splice(pendingDeleteRef.index, 1);

      return {
        ...previous,
        itinerary,
      };
    });

    setPendingDeleteRef(null);
    setIsItineraryDeleteOpen(false);
  }

  if (!tripData) {
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

  const daysRemaining = calculateDaysRemaining(tripData.departureDate);

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
            {activeTab === "overview" && (
              <OverviewTab
                trip={tripData}
                daysRemaining={daysRemaining}
                onEdit={openOverviewEditModal}
                onDelete={() => setIsTripDeleteOpen(true)}
              />
            )}
            {activeTab === "finance" && <FinanceSummary trip={tripData} onEditBudget={openBudgetModal} />}
            {activeTab === "itinerary" && (
              <ItineraryTabs
                trip={tripData}
                onAdd={() => openAddItineraryModal()}
                onAddForDate={(date) => openAddItineraryModal(date)}
                onEdit={openEditItineraryModal}
                onDelete={openItineraryDeleteModal}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <Modal
          open={isOverviewEditOpen}
          title="Editar Viagem"
          onClose={() => setIsOverviewEditOpen(false)}
          footer={
            <>
              <button type="button" className="modal-btn" onClick={() => setIsOverviewEditOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-btn modal-btn--primary" onClick={handleSaveOverview}>
                Salvar
              </button>
            </>
          }
        >
          <form className="modal-form" onSubmit={(event) => event.preventDefault()}>
            <div className="modal-inline-fields">
              <div className="modal-form__row">
                <label htmlFor="overview-departure">Data de ida</label>
                <input
                  id="overview-departure"
                  type="date"
                  value={overviewForm.departureDate}
                  onChange={(event) =>
                    setOverviewForm((previous) => ({ ...previous, departureDate: event.target.value }))
                  }
                />
              </div>

              <div className="modal-form__row">
                <label htmlFor="overview-end">Data de volta</label>
                <input
                  id="overview-end"
                  type="date"
                  value={overviewForm.endDate}
                  onChange={(event) =>
                    setOverviewForm((previous) => ({ ...previous, endDate: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="modal-form__row">
              <label htmlFor="overview-participant-input">Participantes</label>

              <div className="trip-participants-editor">
                <div className="trip-participants-editor__list">
                  {participantsUsers.length > 0 ? (
                    participantsUsers.map((participant, index) => (
                      <span key={`${participant}-${index}`} className="trip-participant-chip">
                        {participant}
                        <button
                          type="button"
                          aria-label={`Excluir participante ${participant}`}
                          onClick={() =>
                            setParticipantsUsers((previous) =>
                              previous.filter((_, participantIndex) => participantIndex !== index)
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="trip-participants-editor__empty">Nenhum participante adicionado.</p>
                  )}
                </div>

                <div className="trip-participants-editor__add-row">
                  <input
                    id="overview-participant-input"
                    type="text"
                    placeholder="Nome do usuario"
                    value={participantInput}
                    onChange={(event) => setParticipantInput(event.target.value)}
                  />
                  <button
                    type="button"
                    className="modal-btn"
                    onClick={() => {
                      const trimmedParticipant = participantInput.trim();

                      if (!trimmedParticipant) {
                        return;
                      }

                      setParticipantsUsers((previous) => [...previous, trimmedParticipant]);
                      setParticipantInput("");
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <Modal
          open={isTripDeleteOpen}
          title="Excluir viagem"
          description="Tem certeza que deseja excluir? Esta operacao nao podera ser desfeita."
          onClose={() => setIsTripDeleteOpen(false)}
          size="sm"
          footer={
            <>
              <button type="button" className="modal-btn" onClick={() => setIsTripDeleteOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn modal-btn--danger"
                onClick={() => {
                  setIsTripDeleteOpen(false);
                  setTripData(null);
                  navigate("/trips");
                }}
              >
                Excluir
              </button>
            </>
          }
        />

        <Modal
          open={isBudgetEditOpen}
          title="Editar Orçamento"
          onClose={() => setIsBudgetEditOpen(false)}
          footer={
            <>
              <button type="button" className="modal-btn" onClick={() => setIsBudgetEditOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="modal-btn modal-btn--primary" onClick={handleSaveBudget}>
                Salvar
              </button>
            </>
          }
        >
          <div className="modal-form">
            <div className="trip-budget-preview">
              <p>Orçamento atual</p>
              <strong>{formatCurrency(tripData.budget)}</strong>
            </div>

            <div className="modal-form__row">
              <label htmlFor="budget-total">Adicionar/Remover quantidade</label>
              <input
                id="budget-total"
                type="number"
                step="0.01"
                min={0}
                value={budgetDraftValue}
                onChange={(event) => setBudgetDraftValue(event.target.value)}
              />
            </div>

            <div className="trip-budget-quick-actions">
              {[100, 500, 1000].map((quickValue) => (
                <button
                  key={`plus-${quickValue}`}
                  type="button"
                  className="modal-btn"
                  onClick={() => setBudgetDraftValue(String(budgetPreview + quickValue))}
                >
                  + {formatCurrency(quickValue)}
                </button>
              ))}

              {[100, 500].map((quickValue) => (
                <button
                  key={`minus-${quickValue}`}
                  type="button"
                  className="modal-btn"
                  onClick={() => setBudgetDraftValue(String(Math.max(budgetPreview - quickValue, 0)))}
                >
                  - {formatCurrency(quickValue)}
                </button>
              ))}
            </div>

            <div className="trip-budget-preview trip-budget-preview--final">
              <p>Novo orçamento total</p>
              <strong>{formatCurrency(budgetPreview)}</strong>
            </div>
          </div>
        </Modal>

        <Modal
          open={isItineraryModalOpen}
          title={itineraryMode === "add" ? "Adicionar item no roteiro" : "Editar item no roteiro"}
          onClose={() => setIsItineraryModalOpen(false)}
          footer={
            <>
              <button type="button" className="modal-btn" onClick={() => setIsItineraryModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn modal-btn--primary"
                onClick={handleSaveItineraryItem}
              >
                {itineraryMode === "add" ? "Adicionar item" : "Salvar item"}
              </button>
            </>
          }
        >
          <form className="modal-form" onSubmit={(event) => event.preventDefault()}>
            <div className="modal-inline-fields">
              <div className="modal-form__row">
                <label htmlFor="itinerary-date">Data</label>
                <select
                  id="itinerary-date"
                  value={itineraryForm.date}
                  onChange={(event) =>
                    setItineraryForm((previous) => ({ ...previous, date: event.target.value }))
                  }
                >
                  {itineraryDates.map((dateOption) => (
                    <option key={dateOption} value={dateOption}>
                      {formatDate(dateOption)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form__row">
                <label htmlFor="itinerary-time">Horário</label>
                <input
                  id="itinerary-time"
                  type="time"
                  value={itineraryForm.time}
                  onChange={(event) =>
                    setItineraryForm((previous) => ({ ...previous, time: event.target.value }))
                  }
                />
              </div>

              <div className="modal-form__row">
                <label htmlFor="itinerary-amount">Valor em R$</label>
                <input
                  id="itinerary-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={itineraryForm.amount}
                  onChange={(event) =>
                    setItineraryForm((previous) => ({ ...previous, amount: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="modal-form__row">
              <label htmlFor="itinerary-title">Título</label>
              <input
                id="itinerary-title"
                type="text"
                value={itineraryForm.title}
                onChange={(event) =>
                  setItineraryForm((previous) => ({ ...previous, title: event.target.value }))
                }
              />
            </div>

            <div className="modal-form__row">
              <label htmlFor="itinerary-description">Descrição</label>
              <textarea
                id="itinerary-description"
                value={itineraryForm.description}
                onChange={(event) =>
                  setItineraryForm((previous) => ({ ...previous, description: event.target.value }))
                }
              />
            </div>

            <div className="modal-inline-fields">
              <div className="modal-form__row">
                <label htmlFor="itinerary-location">Local</label>
                <input
                  id="itinerary-location"
                  type="text"
                  value={itineraryForm.location}
                  onChange={(event) =>
                    setItineraryForm((previous) => ({ ...previous, location: event.target.value }))
                  }
                />
              </div>

              <div className="modal-form__row">
                <label htmlFor="itinerary-notes">Notas</label>
                <input
                  id="itinerary-notes"
                  type="text"
                  value={itineraryForm.notes}
                  onChange={(event) =>
                    setItineraryForm((previous) => ({ ...previous, notes: event.target.value }))
                  }
                />
              </div>
            </div>
          </form>
        </Modal>

        <Modal
          open={isItineraryDeleteOpen}
          title="Excluir item do roteiro"
          description="Tem certeza que deseja excluir? Esta operacao nao podera ser desfeita."
          onClose={() => {
            setPendingDeleteRef(null);
            setIsItineraryDeleteOpen(false);
          }}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="modal-btn"
                onClick={() => {
                  setPendingDeleteRef(null);
                  setIsItineraryDeleteOpen(false);
                }}
              >
                Cancelar
              </button>
              <button type="button" className="modal-btn modal-btn--danger" onClick={handleDeleteItineraryItem}>
                Excluir
              </button>
            </>
          }
        />
      </div>
    </MainLayout>
  );
}
