import { motion } from "framer-motion";
import { CalendarDays, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/common/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { MainLayout } from "../../layouts/MainLayout";
import { addTripMemberRequest } from "../../services/memberService";
import {
  createTripRequest,
  getDashboardTripsRequest,
  type DashboardTrip,
  type TripStatus,
} from "../../services/tripService";
import { getUserByEmailRequest } from "../../services/userService";
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

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

interface NewTripForm {
  destination: string;
  imageUrl: string;
  departureDate: string;
  endDate: string;
  participants: string[];
}

export function TripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TripStatus>("active");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTripForm, setNewTripForm] = useState<NewTripForm>({
    destination: "",
    imageUrl: "",
    departureDate: getTodayDate(),
    endDate: getTodayDate(),
    participants: [],
  });
  const [newParticipantName, setNewParticipantName] = useState("");

  useEffect(() => {
    async function loadTrips() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardTripsRequest();
        setTrips(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Nao foi possivel carregar as viagens.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTrips();
  }, []);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => trip.status === activeTab);
  }, [activeTab, trips]);

  function resetNewTripForm() {
    setNewTripForm({
      destination: "",
      imageUrl: "",
      departureDate: getTodayDate(),
      endDate: getTodayDate(),
      participants: [],
    });
    setNewParticipantName("");
  }

  async function loadTrips() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardTripsRequest();
      setTrips(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar as viagens.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNewTrip() {
    if (!user) {
      setError("Sessao invalida. Faca login novamente.");
      return;
    }

    if (!newTripForm.destination.trim()) {
      setError("Informe o destino da viagem.");
      return;
    }

    try {
      setError(null);

      const participantEmails = Array.from(
        new Set(
          newTripForm.participants
            .map((participant) => participant.trim().toLowerCase())
            .filter(Boolean),
        ),
      );

      const resolvedParticipants = await Promise.all(
        participantEmails.map((email) => getUserByEmailRequest(email)),
      );

      const participantIds = Array.from(
        new Set(
          resolvedParticipants
            .map((participant) => participant.id)
            .filter((participantId) => participantId !== user.id),
        ),
      );

      const createdTrip = await createTripRequest({
        owner_id: user.id,
        destination: newTripForm.destination.trim(),
        image_url: newTripForm.imageUrl.trim() || null,
        departure_date: newTripForm.departureDate,
        return_date: newTripForm.endDate,
        budget: 0,
      });

      const participantResults = await Promise.allSettled(
        participantIds.map((participantId) =>
          addTripMemberRequest(createdTrip.id, participantId, {
            trip_id: createdTrip.id,
            user_id: participantId,
            role: "member",
          }),
        ),
      );

      const failedParticipants = participantResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedParticipants.length > 0) {
        setError(
          "Viagem criada, mas um ou mais participantes nao puderam ser adicionados. Confirme se os emails informados existem.",
        );
      }

      setIsAddModalOpen(false);
      resetNewTripForm();
      await loadTrips();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nao foi possivel criar a viagem.",
      );
    }
  }

  function handleAddParticipant() {
    const trimmedName = newParticipantName.trim().toLowerCase();

    if (!trimmedName) {
      return;
    }

    if (newTripForm.participants.includes(trimmedName)) {
      setNewParticipantName("");
      return;
    }

    setNewTripForm((previous) => ({
      ...previous,
      participants: [...previous.participants, trimmedName],
    }));
    setNewParticipantName("");
  }

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

        <button
          type="button"
          className="trips-page__add-btn"
          aria-label="Adicionar viagem"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} />
          <span>Adicionar viagem</span>
        </button>

        {loading ? <section className="trips-empty"><h2>Carregando viagens...</h2></section> : null}

        {!loading && error ? (
          <section className="trips-empty">
            <h2>Nao foi possivel carregar os dados.</h2>
            <p>{error}</p>
          </section>
        ) : null}

        {!loading && !error && filteredTrips.length > 0 ? (
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
        ) : null}

        {!loading && !error && filteredTrips.length === 0 ? (
          <section className="trips-empty">
            <h2>Nenhuma viagem cadastrada.</h2>
          </section>
        ) : null}

        <Modal
          open={isAddModalOpen}
          title="Adicionar viagem"
          onClose={() => setIsAddModalOpen(false)}
          footer={
            <>
              <button type="button" className="modal-btn" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn modal-btn--primary"
                onClick={handleSaveNewTrip}
              >
                Salvar viagem
              </button>
            </>
          }
        >
          <form className="modal-form" onSubmit={(event) => event.preventDefault()}>
            <div className="modal-form__row">
              <label htmlFor="trip-destination">Destino</label>
              <input
                id="trip-destination"
                type="text"
                placeholder="Ex.: Santiago"
                value={newTripForm.destination}
                onChange={(event) =>
                  setNewTripForm((previous) => ({ ...previous, destination: event.target.value }))
                }
              />
            </div>

            <div className="modal-form__row">
              <label htmlFor="trip-image-file">Imagem de capa (URL)</label>
              <input
                id="trip-image-file"
                type="text"
                placeholder="Ex.: site.com/imagem.jpg"
                value={newTripForm.imageUrl}
                onChange={(event) => {
                  setNewTripForm((previous) => ({
                    ...previous,
                    imageUrl: event.target.value,
                  }));
                }}
              />
              <div className="trip-preview-container">
                {newTripForm.imageUrl && (
                  <img
                    src={newTripForm.imageUrl}
                    alt="Preview"
                    className="trip-preview-image"
                    width={200}
                  />
                )}
              </div>
            </div>

            <div className="modal-inline-fields">
              <div className="modal-form__row">
                <label htmlFor="trip-departure-date">Data de ida</label>
                <input
                  id="trip-departure-date"
                  type="date"
                  value={newTripForm.departureDate}
                  onChange={(event) =>
                    setNewTripForm((previous) => ({
                      ...previous,
                      departureDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="modal-form__row">
                <label htmlFor="trip-end-date">Data de volta</label>
                <input
                  id="trip-end-date"
                  type="date"
                  value={newTripForm.endDate}
                  onChange={(event) =>
                    setNewTripForm((previous) => ({ ...previous, endDate: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="modal-form__row">
              <label htmlFor="trip-participant-name">Participantes por email</label>

              <div className="trip-participants-editor">
                <div className="trip-participants-editor__list">
                  {newTripForm.participants.length > 0 ? (
                    newTripForm.participants.map((participant, index) => (
                      <span key={`${participant}-${index}`} className="trip-participant-chip">
                        {participant}
                        <button
                          type="button"
                          aria-label={`Excluir participante ${participant}`}
                          onClick={() =>
                            setNewTripForm((previous) => ({
                              ...previous,
                              participants: previous.participants.filter(
                                (_, participantIndex) => participantIndex !== index
                              ),
                            }))
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
                    id="trip-participant-name"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newParticipantName}
                    onChange={(event) => setNewParticipantName(event.target.value)}
                  />
                  <button type="button" className="modal-btn" onClick={handleAddParticipant}>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}
