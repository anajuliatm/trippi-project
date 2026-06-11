import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Clock3, LogOut, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../components/common/BackButton";
import { Modal } from "../../components/common/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { MainLayout } from "../../layouts/MainLayout";
import {
  calculateDaysRemaining,
  deleteTripRequest,
  getTripByIdRequest,
  getTripSummaryRequest,
  updateTripRequest,
} from "../../services/tripService";
import {
  createItineraryEntryRequest,
  deleteItineraryEntryRequest,
  getTripItineraryRequest,
  updateItineraryEntryRequest,
  type ItineraryEntry,
} from "../../services/itineraryService";
import {
  getTripFinancesRequest,
  type FinanceEntry,
} from "../../services/financeService";
import {
  addTripMemberRequest,
  deleteTripMemberRequest,
  getTripMembersRequest,
  type TripMember,
} from "../../services/memberService";
import { getUserByEmailRequest, getUsersMapRequest } from "../../services/userService";
import "../../styles/trip-details.css";
import { getSocket } from "../../services/socketService";

const ITINERARY_FINANCE_PREFIX = "[itinerary-expense:";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
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

function formatCentsDisplay(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(cents) / 100);
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

function getFinanceEntryDescription(description: string | null) {
  if (!description) {
    return "Lancamento sem descricao";
  }

  if (!description.startsWith(ITINERARY_FINANCE_PREFIX)) {
    return description;
  }

  const markerEnd = description.indexOf("] ");

  if (markerEnd === -1) {
    return description;
  }

  return description.slice(markerEnd + 2) || "Atividade do roteiro";
}

type DetailTab = "overview" | "finance" | "itinerary";
type ActionButtonMode = "add" | "edit" | "delete" | "leave";
type ItineraryEditorMode = "add" | "edit";

interface OverviewFormState {
  destination: string;
  imageUrl: string;
  departureDate: string;
  endDate: string;
}

interface ItineraryFormState {
  date: string;
  time: string;
  title: string;
  description: string;
  location: string;
  notes: string;
}

interface EditingActivityRef {
  activityId: string;
  date: string;
}

interface TripActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  notes: string;
  amount: number;
}

interface TripItineraryDay {
  date: string;
  activities: TripActivity[];
}

interface TripParticipant {
  userId: string;
  name: string;
  role: string;
}

interface TripFinanceViewEntry {
  id: string;
  userId: string;
  username: string;
  type: string;
  description: string;
  amount: number;
}

interface TripDetailsData {
  id: string;
  destination: string;
  image: string;
  participants: number;
  departureDate: string;
  endDate: string;
  budget: number;
  spent: number;
  itinerary: TripItineraryDay[];
  memberDetails: TripParticipant[];
  financeEntries: TripFinanceViewEntry[];
}

const DEFAULT_TRIP_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

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
    leave: <LogOut size={15} />,
  };

  const labelByMode: Record<ActionButtonMode, string> = {
    add: "Adicionar",
    edit: "Editar",
    delete: "Excluir",
    leave: "Sair da viagem",
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
  onLeave,
  onViewParticipants,
  canDeleteTrip,
  canLeaveTrip,
}: {
  trip: TripDetailsData;
  daysRemaining: number;
  onEdit: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onViewParticipants: () => void;
  canDeleteTrip: boolean;
  canLeaveTrip: boolean;
}) {
  const heroActionModes: ActionButtonMode[] = [
    "edit",
    ...(canDeleteTrip ? ["delete" as const] : []),
    ...(canLeaveTrip ? ["leave" as const] : []),
  ];

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
          </div>

          <ActionButtons
            className="trip-hero__actions"
            modes={heroActionModes}
            onAction={(mode) => {
              if (mode === "edit") {
                onEdit();
              }

              if (mode === "delete") {
                onDelete();
              }

              if (mode === "leave") {
                onLeave();
              }
            }}
          />

          <div className="trip-hero__meta-grid">
            <div>
              <CalendarDays size={18} />
              <span>
                {formatDate(trip.departureDate)} - {formatDate(trip.endDate)}
              </span>
            </div>
            <div
              onClick={onViewParticipants}
              style={{ cursor: "pointer" }}
              title="Ver participantes"
            >
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

function FinanceSummary({
  trip,
  onEditBudget,
}: {
  trip: TripDetailsData;
  onEditBudget: () => void;
}) {
  const remaining = trip.budget - trip.spent;
  const financeEntries = trip.financeEntries;

  return (
    <section className="trip-finance">
      <h2 className="trip-section-title">Financeiro</h2>

      <div className="trip-finance__grid">
        <article className="trip-finance__card trip-finance__card--budget">
          <div className="trip-finance__card-header">
            <p>Orçamento total</p>
            <ActionButtons modes={["edit"]} onAction={() => onEditBudget()} />
          </div>
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

      <section className="trip-finance__entries" aria-label="Lançamentos da viagem">
        <div className="trip-section__header">
          <h3 className="trip-finance__entries-title">Lançamentos da viagem</h3>
        </div>

        {financeEntries.length > 0 ? (
          <div className="trip-finance__entries-list">
            {financeEntries.map((entry) => {
              const signedAmount = entry.type === "expense" ? -entry.amount : entry.amount;

              return (
                <article key={entry.id} className="trip-finance-entry">
                  <div className="trip-finance-entry__icon">
                    {entry.type === "expense" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>

                  <div className="trip-finance-entry__content">
                    <strong>{entry.description}</strong>
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
            <h3>Sem lançamentos para esta viagem.</h3>
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
  trip: TripDetailsData;
  onAdd: () => void;
  onAddForDate: (date: string) => void;
  onEdit: (date: string, activity: TripActivity) => void;
  onDelete: (activityId: string, date: string) => void;
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
            activeDay.activities.map((activity) => (
              <article key={activity.id} className="trip-activity">
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
                            onEdit(activeDate, activity);
                          }

                          if (mode === "delete") {
                            onDelete(activity.id, activeDate);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p>{activity.description}</p>
                  <span>{activity.notes}</span>

                  {activity.location ? (
                    <div className="trip-activity__meta">
                      <span>
                        <MapPin size={14} /> {activity.location}
                      </span>
                    </div>
                  ) : null}
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
                <p>Use o botão de adicionar para incluir itens no roteiro desta data.</p>
              </div>
            </article>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function TripDetailsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const tripId = id ?? "";
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [tripData, setTripData] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewModalError, setOverviewModalError] = useState<string | null>(null);
  const [isOverviewEditOpen, setIsOverviewEditOpen] = useState(false);
  const [isTripDeleteOpen, setIsTripDeleteOpen] = useState(false);
  const [isLeaveTripOpen, setIsLeaveTripOpen] = useState(false);
  const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isItineraryDeleteOpen, setIsItineraryDeleteOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const [overviewForm, setOverviewForm] = useState<OverviewFormState>({
    destination: "",
    imageUrl: "",
    departureDate: "",
    endDate: "",
  });

  const [participantsUsers, setParticipantsUsers] = useState<TripParticipant[]>([]);
  const [participantInput, setParticipantInput] = useState("");
  const [budgetCents, setBudgetCents] = useState(0);
  const [budgetNegativeMode, setBudgetNegativeMode] = useState(false);
  const [itineraryCents, setItineraryCents] = useState(0);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [deleteTripError, setDeleteTripError] = useState<string | null>(null);
  const [deleteTripConfirmed, setDeleteTripConfirmed] = useState(false);
  const [leaveTripError, setLeaveTripError] = useState<string | null>(null);
  const [leavingTrip, setLeavingTrip] = useState(false);

  const [itineraryModalError, setItineraryModalError] = useState<string | null>(null);
  const [itineraryMode, setItineraryMode] = useState<ItineraryEditorMode>("add");
  const [itineraryForm, setItineraryForm] = useState<ItineraryFormState>({
    date: "",
    time: "09:00",
    title: "",
    description: "",
    location: "",
    notes: "",
  });
  const [editingActivityRef, setEditingActivityRef] = useState<EditingActivityRef | null>(null);
  const [pendingDeleteRef, setPendingDeleteRef] = useState<EditingActivityRef | null>(null);

  useEffect(() => {
    if (!tripData) {
      setParticipantsUsers([]);
      return;
    }

    setParticipantsUsers(tripData.memberDetails);
  }, [tripData]);

  useEffect(() => {
    async function loadTripDetails() {
      if (!tripId) {
        setTripData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [trip, summary, members, finances, itinerary] = await Promise.all([
          getTripByIdRequest(tripId),
          getTripSummaryRequest(tripId),
          getTripMembersRequest(tripId),
          getTripFinancesRequest(tripId),
          getTripItineraryRequest(tripId),
        ]);

        const userMap = await getUsersMapRequest([
          ...members.map((member) => member.user_id),
          ...finances.map((finance) => finance.user_id),
          trip.owner_id,
        ]);

        setTripData(
          buildTripDetailsData({
            trip,
            summary,
            members,
            finances,
            itinerary,
            userMap,
          }),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar a viagem.",
        );
        setTripData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadTripDetails();

    async function silentRefresh() {
      if (!tripId) {
        return
      }
      try {
        const [trip, summary, members, finances, itinerary] = await 
        Promise.all([
          getTripByIdRequest(tripId),
          getTripSummaryRequest(tripId),
          getTripMembersRequest(tripId),
          getTripFinancesRequest(tripId),
          getTripItineraryRequest(tripId),
        ]);

        const userMap = await getUsersMapRequest([
          ...members.map((member) => member.user_id),
          ...finances.map((finance) => finance.user_id),
          trip.owner_id,
        ]);
        
        setTripData(
          buildTripDetailsData({
            trip,
            summary,
            members,
            finances,
            itinerary,
            userMap,
          }),
        );
        
      } catch {
    
      }
    }

    const socket = getSocket();
    socket.emit("join_trip", tripId);
    socket.on("trip_updated", () => { void silentRefresh(); });

    return () => {
      socket.emit("leave_trip", tripId);
      socket.off("trip_updated");
    };
  }, [tripId]);

  const itineraryDates = useMemo(() => {
    if (!tripData) {
      return [];
    }

    return getTripDateRange(tripData.departureDate, tripData.endDate);
  }, [tripData]);

  const budgetAdjustment = useMemo(
    () => (budgetNegativeMode ? -1 : 1) * budgetCents / 100,
    [budgetCents, budgetNegativeMode],
  );

  const budgetPreview = useMemo(() => {
    if (!tripData) {
      return 0;
    }

    return Math.max(tripData.budget + budgetAdjustment, 0);
  }, [budgetAdjustment, tripData]);

  const currentUserMembership = useMemo(() => {
    if (!tripData || !user) {
      return null;
    }

    return tripData.memberDetails.find((participant) => participant.userId === user.id) ?? null;
  }, [tripData, user]);

  const isCurrentUserOwner = currentUserMembership?.role === "owner";
  const canLeaveTrip = Boolean(currentUserMembership && !isCurrentUserOwner);

  function openOverviewEditModal() {
    if (!tripData) {
      return;
    }

    setOverviewModalError(null);
    setOverviewForm({
      destination: tripData.destination,
      imageUrl: tripData.image !== DEFAULT_TRIP_IMAGE ? tripData.image : "",
      departureDate: tripData.departureDate,
      endDate: tripData.endDate,
    });
    setParticipantsUsers(tripData.memberDetails);
    setParticipantInput("");
    setIsOverviewEditOpen(true);
  }

  async function reloadTripDetails() {
    if (!tripId) {
      return;
    }

    setLoading(true);

    try {
      const [trip, summary, members, finances, itinerary] = await Promise.all([
        getTripByIdRequest(tripId),
        getTripSummaryRequest(tripId),
        getTripMembersRequest(tripId),
        getTripFinancesRequest(tripId),
        getTripItineraryRequest(tripId),
      ]);

      const userMap = await getUsersMapRequest([
        ...members.map((member) => member.user_id),
        ...finances.map((finance) => finance.user_id),
        trip.owner_id,
      ]);

      setTripData(
        buildTripDetailsData({
          trip,
          summary,
          members,
          finances,
          itinerary,
          userMap,
        }),
      );
      setError(null);
    } catch (reloadError) {
      setError(
        reloadError instanceof Error
          ? reloadError.message
          : "Não foi possível atualizar a tela da viagem.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOverview() {
    if (!tripData) {
      return;
    }

    if (!overviewForm.destination.trim()) {
      setOverviewModalError("Informe o destino da viagem.");
      return;
    }

    if (overviewForm.endDate < overviewForm.departureDate) {
      setOverviewModalError("A data de volta não pode ser anterior à data de ida.");
      return;
    }

    try {
      setOverviewModalError(null);
      setError(null);

      const shouldUpdateTrip =
        overviewForm.destination.trim() !== tripData.destination ||
        overviewForm.imageUrl !== (tripData.image !== DEFAULT_TRIP_IMAGE ? tripData.image : "") ||
        overviewForm.departureDate !== tripData.departureDate ||
        overviewForm.endDate !== tripData.endDate;

      if (shouldUpdateTrip) {
        await updateTripRequest(tripData.id, {
          destination: overviewForm.destination.trim(),
          image_url: overviewForm.imageUrl.trim(),
          departure_date: overviewForm.departureDate,
          return_date: overviewForm.endDate,
        });
      }

      const currentIds = new Set(tripData.memberDetails.map((participant) => participant.userId));
      const nextIds = new Set(participantsUsers.map((participant) => participant.userId));

      const membersToAdd = participantsUsers.filter(
        (participant) => !currentIds.has(participant.userId),
      );
      const membersToRemove = tripData.memberDetails.filter(
        (participant) => !nextIds.has(participant.userId) && participant.role !== "owner",
      );

      await Promise.all(
        membersToAdd.map((participant) =>
          addTripMemberRequest(tripData.id, participant.userId, {
            trip_id: tripData.id,
            user_id: participant.userId,
            role: "member",
          }),
        ),
      );

      await Promise.all(
        membersToRemove.map((participant) =>
          deleteTripMemberRequest(tripData.id, participant.userId),
        ),
      );

      const removedSelf = membersToRemove.some((p) => p.userId === user?.id);

      setIsOverviewEditOpen(false);

      if (removedSelf) {
        navigate("/trips");
        return;
      }

      await reloadTripDetails();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível atualizar os dados da viagem.";

      if (message === "Apenas o dono da viagem pode atualiza-la") {
        setOverviewModalError("Apenas o owner da viagem pode alterar a data.");
        return;
      }

      setOverviewModalError(message);
    }
  }

  function openBudgetModal() {
    if (!tripData) {
      return;
    }

    setBudgetCents(0);
    setBudgetNegativeMode(false);
    setIsBudgetEditOpen(true);
  }

  async function handleSaveBudget() {
    if (!tripData) {
      return;
    }

    try {
      setError(null);
      await updateTripRequest(tripData.id, { budget: budgetPreview });
      setTripData((previous) => (previous ? { ...previous, budget: budgetPreview } : previous));
      setIsBudgetEditOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível atualizar o orçamento.",
      );
    }
  }

  function openAddItineraryModal(date?: string) {
    const initialDate = date ?? itineraryDates[0] ?? tripData?.departureDate ?? "";

    setItineraryMode("add");
    setEditingActivityRef(null);
    setItineraryForm({
      date: initialDate,
      time: "09:00",
      title: "",
      description: "",
      location: "",
      notes: "",
    });
    setItineraryCents(0);
    setIsItineraryModalOpen(true);
  }

  function openEditItineraryModal(date: string, activity: TripActivity) {
    setItineraryMode("edit");
    setEditingActivityRef({ activityId: activity.id, date });
    setItineraryForm({
      date,
      time: activity.time,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      notes: activity.notes,
    });
    setItineraryCents(Math.round(activity.amount * 100));
    setIsItineraryModalOpen(true);
  }

  async function handleSaveItineraryItem() {
    if (!tripData) {
      return;
    }

    if (!itineraryForm.title.trim()) {
      setItineraryModalError("Informe o título da atividade.");
      return;
    }

    setItineraryModalError(null);

    const isEditing = itineraryMode === "edit" && editingActivityRef;
    const payload = {
      trip_id: tripData.id,
      title: itineraryForm.title,
      description: isEditing ? itineraryForm.description : (itineraryForm.description || null),
      location: isEditing ? itineraryForm.location : (itineraryForm.location || null),
      activity_date: itineraryForm.date,
      activity_time: itineraryForm.time || null,
      notes: isEditing ? itineraryForm.notes : (itineraryForm.notes || null),
      estimated_cost: itineraryCents / 100,
    };

    try {
      setError(null);

      if (itineraryMode === "edit" && editingActivityRef) {
        await updateItineraryEntryRequest(
          tripData.id,
          editingActivityRef.activityId,
          payload,
        );
      } else {
        await createItineraryEntryRequest(tripData.id, payload);
      }

      setIsItineraryModalOpen(false);
      await reloadTripDetails();
    } catch (saveError) {
      setItineraryModalError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar o item do roteiro.",
      );
    }
  }

  function openItineraryDeleteModal(activityId: string, date: string) {
    setPendingDeleteRef({ activityId, date });
    setIsItineraryDeleteOpen(true);
  }

  async function handleDeleteItineraryItem() {
    if (!pendingDeleteRef || !tripData) {
      return;
    }

    try {
      setError(null);
      await deleteItineraryEntryRequest(tripData.id, pendingDeleteRef.activityId);
      setPendingDeleteRef(null);
      setIsItineraryDeleteOpen(false);
      await reloadTripDetails();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir o item do roteiro.",
      );
    }
  }

  async function handleAddParticipant() {
    const trimmedParticipantEmail = participantInput.trim().toLowerCase();

    if (!trimmedParticipantEmail) {
      return;
    }

    const emailRegex = /^[^\s@]+(?<!\.)@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedParticipantEmail)) {
      setOverviewModalError("Informe um email válido.");
      return;
    }

    try {
      setAddingParticipant(true);
      const user = await getUserByEmailRequest(trimmedParticipantEmail);

      if (participantsUsers.some((participant) => participant.userId === user.id)) {
        setOverviewModalError("Este usuário já está na lista.");
        return;
      }

      setParticipantsUsers((previous) => [
        ...previous,
        {
          userId: user.id,
          name: user.username,
          role: "member",
        },
      ]);
      setOverviewModalError(null);
      setParticipantInput("");
    } catch (participantError) {
      setOverviewModalError(
        participantError instanceof Error
          ? participantError.message
          : "Não foi possível adicionar o participante por email.",
      );
    } finally {
      setAddingParticipant(false);
    }
  }

  async function handleDeleteTrip() {
    if (!tripData) {
      return;
    }

    try {
      setError(null);
      await deleteTripRequest(tripData.id);
      navigate("/trips");
    } catch (deleteError) {
      setDeleteTripError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir a viagem.",
      );
    }
  }

  async function handleLeaveTrip() {
    if (!tripData || !user || !canLeaveTrip) {
      return;
    }

    try {
      setLeavingTrip(true);
      setLeaveTripError(null);
      setError(null);
      await deleteTripMemberRequest(tripData.id, user.id);
      navigate("/trips");
    } catch (leaveError) {
      setLeaveTripError(
        leaveError instanceof Error
          ? leaveError.message
          : "Não foi possível sair da viagem.",
      );
    } finally {
      setLeavingTrip(false);
    }
  }

  function handleBudgetKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const next = budgetCents * 10 + Number(e.key);
      if (next <= 99999999) setBudgetCents(next);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setBudgetCents(Math.floor(budgetCents / 10));
    } else if (e.key === "-") {
      e.preventDefault();
      setBudgetNegativeMode((prev) => !prev);
    }
  }

  function applyQuickBudget(delta: number) {
    const current = (budgetNegativeMode ? -1 : 1) * budgetCents;
    const next = current + delta;
    setBudgetNegativeMode(next < 0);
    setBudgetCents(Math.abs(next));
  }

  function handleItineraryAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const next = itineraryCents * 10 + Number(e.key);
      if (next <= 99999999) setItineraryCents(next);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      setItineraryCents(Math.floor(itineraryCents / 10));
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="trip-details-empty">
          <h1>Carregando viagem...</h1>
        </div>
      </MainLayout>
    );
  }

  if (!tripData) {
    return (
      <MainLayout>
        <div className="trip-details-empty">
          <h1>Viagem não encontrada</h1>
          <p>{error ?? "Confira o link e selecione uma viagem valida no dashboard."}</p>
          <BackButton className="trip-details-empty__link" />
        </div>
      </MainLayout>
    );
  }

  const daysRemaining = calculateDaysRemaining(tripData.departureDate);

  return (
    <MainLayout>
      <div className="trip-details-page">
        {error ? (
          <div className="trip-details-empty">
            <p>{error}</p>
          </div>
        ) : null}

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
                onLeave={() => setIsLeaveTripOpen(true)}
                onViewParticipants={() => setIsParticipantsOpen(true)}
                canDeleteTrip={isCurrentUserOwner}
                canLeaveTrip={canLeaveTrip}
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
          open={isParticipantsOpen}
          title="Participantes"
          onClose={() => setIsParticipantsOpen(false)}
          footer={
            <button type="button" className="modal-btn" onClick={() => setIsParticipantsOpen(false)}>
              Fechar
            </button>
          }
        >
          <div className="trip-participants-editor__list">
            {tripData.memberDetails.length > 0 ? (
              tripData.memberDetails.map((participant, index) => (
                <span key={`${participant.userId}-${index}`} className="trip-participant-chip">
                  {participant.name}
                  {participant.role === "owner" ? " (owner)" : ""}
                </span>
              ))
            ) : (
              <p className="trip-participants-editor__empty">Nenhum participante.</p>
            )}
          </div>
        </Modal>

        <Modal
          open={isOverviewEditOpen}
          title="Editar Viagem"
          onClose={() => {
            setOverviewModalError(null);
            setIsOverviewEditOpen(false);
          }}
          footer={
            <>
              <button
                type="button"
                className="modal-btn"
                onClick={() => {
                  setOverviewModalError(null);
                  setIsOverviewEditOpen(false);
                }}
              >
                Cancelar
              </button>
              <button type="button" className="modal-btn modal-btn--primary" onClick={handleSaveOverview}>
                Salvar
              </button>
            </>
          }
        >
          <form className="modal-form" onSubmit={(event) => event.preventDefault()}>
            {overviewModalError ? (
              <p className="trip-modal-message trip-modal-message--error">{overviewModalError}</p>
            ) : null}

            <div className="modal-form__row">
              <label htmlFor="overview-destination">Destino <span style={{ color: "#f87171" }}>*</span></label>
              <input
                id="overview-destination"
                type="text"
                value={overviewForm.destination}
                onChange={(event) =>
                  setOverviewForm((previous) => ({ ...previous, destination: event.target.value }))
                }
              />
            </div>

            <div className="modal-form__row">
              <label htmlFor="overview-image">Imagem de capa (URL)</label>
              <input
                id="overview-image"
                type="text"
                placeholder="Ex.: site.com/imagem.jpg"
                value={overviewForm.imageUrl}
                onChange={(event) =>
                  setOverviewForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                }
              />
            </div>

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
                  min={overviewForm.departureDate || undefined}
                  onChange={(event) =>
                    setOverviewForm((previous) => ({ ...previous, endDate: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="modal-form__row">
              <label htmlFor="overview-participant-input">Participantes por email</label>

              <div className="trip-participants-editor">
                <div className="trip-participants-editor__list">
                  {participantsUsers.length > 0 ? (
                    participantsUsers.map((participant, index) => (
                      <span key={`${participant.userId}-${index}`} className="trip-participant-chip">
                        {participant.name}
                        {participant.role === "owner" ? " (owner)" : ""}
                        {participant.role !== "owner" ? (
                          <button
                            type="button"
                            aria-label={`Excluir participante ${participant.name}`}
                            onClick={() =>
                              setParticipantsUsers((previous) =>
                                previous.filter(
                                  (_, participantIndex) => participantIndex !== index,
                                )
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </span>
                    ))
                  ) : (
                    <p className="trip-participants-editor__empty">Nenhum participante adicionado.</p>
                  )}
                </div>

                <div className="trip-participants-editor__add-row">
                  <input
                    id="overview-participant-input"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={participantInput}
                    onChange={(event) => setParticipantInput(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleAddParticipant(); } }}
                  />
                  <button type="button" className="modal-btn" onClick={() => void handleAddParticipant()} disabled={addingParticipant}>
                    {addingParticipant ? "Verificando..." : "Adicionar"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>

        {isCurrentUserOwner ? (
          <Modal
            open={isTripDeleteOpen}
            title="Excluir viagem"
            onClose={() => { setIsTripDeleteOpen(false); setDeleteTripError(null); setDeleteTripConfirmed(false); }}
            size="sm"
            footer={
              <>
                <button type="button" className="modal-btn" onClick={() => { setIsTripDeleteOpen(false); setDeleteTripError(null); setDeleteTripConfirmed(false); }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="modal-btn modal-btn--danger"
                  onClick={() => void handleDeleteTrip()}
                  disabled={!deleteTripConfirmed}
                >
                  Excluir
                </button>
              </>
            }
          >
            <p>Tem certeza que deseja excluir a viagem?</p>

            <p>Esta ação <strong>removerá o grupo permanentemente para todos os participantes</strong> e não poderá ser desfeita.</p>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", cursor: "pointer", fontSize: "0.9rem" }}>
              <input
                type="checkbox"
                checked={deleteTripConfirmed}
                onChange={(e) => setDeleteTripConfirmed(e.target.checked)}
              />
              Entendo que essa ação é irreversível
            </label>

            {deleteTripError && (
              <div className="modal-callout modal-callout--error">{deleteTripError}</div>
            )}
          </Modal>
        ) : null}

        <Modal
          open={isLeaveTripOpen}
          title="Sair da viagem"
          onClose={() => {
            if (leavingTrip) {
              return;
            }

            setIsLeaveTripOpen(false);
            setLeaveTripError(null);
          }}
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="modal-btn"
                onClick={() => {
                  setIsLeaveTripOpen(false);
                  setLeaveTripError(null);
                }}
                disabled={leavingTrip}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn modal-btn--danger"
                onClick={() => void handleLeaveTrip()}
                disabled={leavingTrip}
              >
                {leavingTrip ? "Saindo..." : "Sair da viagem"}
              </button>
            </>
          }
        >
          <p>Tem certeza que deseja sair desta viagem?</p>

          <p>Você deixará de participar do grupo e precisará ser adicionado novamente para voltar.</p>

          {leaveTripError ? (
            <div className="modal-callout modal-callout--error">{leaveTripError}</div>
          ) : null}
        </Modal>

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
              <div className="currency-input">
                <span className="currency-input__prefix">{budgetNegativeMode ? "- R$" : "R$"}</span>
                <input
                  id="budget-total"
                  type="text"
                  inputMode="numeric"
                  value={formatCentsDisplay(budgetCents)}
                  onChange={() => {}}
                  onKeyDown={handleBudgetKeyDown}
                />
              </div>
            </div>

            <div className="trip-budget-quick-actions">
              {[100, 500, 1000].map((quickValue) => (
                <button
                  key={`plus-${quickValue}`}
                  type="button"
                  className="modal-btn"
                  onClick={() => applyQuickBudget(quickValue * 100)}
                >
                  + {formatCurrency(quickValue)}
                </button>
              ))}

              {[100, 500].map((quickValue) => (
                <button
                  key={`minus-${quickValue}`}
                  type="button"
                  className="modal-btn"
                  onClick={() => applyQuickBudget(-quickValue * 100)}
                >
                  - {formatCurrency(quickValue)}
                </button>
              ))}
            </div>

            <div className={`trip-budget-preview trip-budget-preview--final ${(budgetNegativeMode || budgetAdjustment < 0) ? "trip-budget-preview--negative" : ""}`}>
              <p>Ajuste aplicado</p>
              <strong>
                {budgetCents === 0
                  ? `${budgetNegativeMode ? "-" : "+"}${formatCurrency(0)}`
                  : formatSignedCurrency(budgetAdjustment)}
              </strong>
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
          onClose={() => { setIsItineraryModalOpen(false); setItineraryModalError(null); }}
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
            {itineraryModalError ? (
              <div className="modal-callout modal-callout--error">{itineraryModalError}</div>
            ) : null}

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
                <label htmlFor="itinerary-amount">Valor</label>
                <div className="currency-input">
                  <span className="currency-input__prefix">R$</span>
                  <input
                    id="itinerary-amount"
                    type="text"
                    inputMode="numeric"
                    value={formatCentsDisplay(itineraryCents)}
                    onChange={() => {}}
                    onKeyDown={handleItineraryAmountKeyDown}
                  />
                </div>
              </div>
            </div>

            <div className="modal-form__row">
              <label htmlFor="itinerary-title">Título <span style={{ color: "#f87171" }}>*</span></label>
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
        >
          <p>Tem certeza que deseja excluir esta atividade?</p>
          <p>Ela será removida para todos os participantes e não poderá ser desfeita.</p>
        </Modal>
      </div>
    </MainLayout>
  );
}

function normalizeActivityTime(value: string | null) {
  if (!value) {
    return "00:00";
  }

  return value.slice(0, 5);
}

function groupItineraryByDate(entries: ItineraryEntry[]): TripItineraryDay[] {
  const grouped = entries.reduce<Record<string, TripActivity[]>>((accumulator, entry) => {
    const activity: TripActivity = {
      id: entry.id,
      time: normalizeActivityTime(entry.activity_time),
      amount: Number(entry.estimated_cost),
      title: entry.title,
      description: entry.description ?? "",
      location: entry.location ?? "",
      notes: entry.notes ?? "",
    };

    if (!accumulator[entry.activity_date]) {
      accumulator[entry.activity_date] = [];
    }

    accumulator[entry.activity_date].push(activity);
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, activities]) => ({
      date,
      activities: activities.sort((left, right) => left.time.localeCompare(right.time)),
    }));
}

function mapMembers(
  members: TripMember[],
  userMap: Record<string, { username: string }>,
): TripParticipant[] {
  return members.map((member) => ({
    userId: member.user_id,
    name: userMap[member.user_id]?.username ?? member.user_id,
    role: member.role,
  }));
}

function mapFinances(
  finances: FinanceEntry[],
  userMap: Record<string, { username: string }>,
): TripFinanceViewEntry[] {
  return finances.map((finance) => ({
    id: finance.id,
    userId: finance.user_id,
    username: userMap[finance.user_id]?.username ?? finance.user_id,
    type: finance.type,
    description: getFinanceEntryDescription(finance.description),
    amount: Number(finance.amount),
  }));
}

function buildTripDetailsData({
  trip,
  summary,
  members,
  finances,
  itinerary,
  userMap,
}: {
  trip: Awaited<ReturnType<typeof getTripByIdRequest>>;
  summary: Awaited<ReturnType<typeof getTripSummaryRequest>>;
  members: TripMember[];
  finances: FinanceEntry[];
  itinerary: ItineraryEntry[];
  userMap: Record<string, { username: string }>;
}): TripDetailsData {
  const memberDetails = mapMembers(members, userMap);

  return {
    id: trip.id,
    destination: trip.destination,
    image: trip.image_url ?? DEFAULT_TRIP_IMAGE,
    participants: Math.max(memberDetails.length, Number(summary.participants ?? 0), 1),
    departureDate: trip.departure_date,
    endDate: trip.return_date,
    budget: Number(trip.budget),
    spent: Number(summary.total_expenses),
    itinerary: groupItineraryByDate(itinerary),
    memberDetails,
    financeEntries: mapFinances(finances, userMap),
  };
}
