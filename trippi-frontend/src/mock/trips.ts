export interface TripActivity {
  time: string;
  title: string;
  description: string;
  location: string;
  notes: string;
  amount: number;
}

export interface TripItineraryDay {
  date: string;
  activities: TripActivity[];
}

export type TripStatus = "active" | "completed";

export interface Trip {
  id: number;
  destination: string;
  image: string;
  participants: number;
  departureDate: string;
  endDate: string;
  status: TripStatus;
  budget: number;
  spent: number;
  itinerary: TripItineraryDay[];
}

export const trips: Trip[] = [
  {
    id: 1,
    destination: "Paris",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=80",
    participants: 5,
    departureDate: "2026-07-25",
    endDate: "2026-07-27",
    status: "active",
    budget: 8500,
    spent: 3200,
    itinerary: [
      {
        date: "2026-07-25",
        activities: [
          {
            time: "08:30",
            title: "Café no Marais",
            description: "Encontro da equipe para alinhar roteiro e tickets do dia.",
            location: "Le Peloton Cafe",
            notes: "Chegar 15 min antes para garantir mesa no térreo.",
            amount: 95,
          },
          {
            time: "11:00",
            title: "Museu do Louvre",
            description: "Visita guiada com foco nas alas italiana e egípcia.",
            location: "Rue de Rivoli",
            notes: "Ingressos digitais já pagos pelo fundo comum.",
            amount: 300,
          },
          {
            time: "19:30",
            title: "Jantar de abertura",
            description: "Primeiro jantar oficial da viagem com brinde do grupo.",
            location: "Bistrot Richelieu",
            notes: "Reserva em nome de Trippi Group.",
            amount: 420,
          }
        ]
      },
      {
        date: "2026-07-26",
        activities: [
          {
            time: "09:00",
            title: "Tour Montmartre",
            description: "Passeio fotográfico pelas ruas históricas e ateliês.",
            location: "Sacre-Coeur",
            notes: "Levar casaco leve e bateria extra para câmeras.",
            amount: 180,
          },
          {
            time: "14:00",
            title: "Picnic no Champ de Mars",
            description: "Pausa para almoço com vista para a Torre Eiffel.",
            location: "Champ de Mars",
            notes: "Mercado sugerido: Rue Cler.",
            amount: 140,
          },
          {
            time: "21:00",
            title: "Cruzeiro no Sena",
            description: "Passeio noturno com iluminação completa da cidade.",
            location: "Port de la Bourdonnais",
            notes: "Check-in fecha 20 minutos antes do embarque.",
            amount: 560,
          }
        ]
      },
      {
        date: "2026-07-27",
        activities: [
          {
            time: "10:00",
            title: "Compras na Galeries Lafayette",
            description: "Janela livre para compras e souvenirs.",
            location: "Boulevard Haussmann",
            notes: "Separar orçamento individual antes de entrar.",
            amount: 0,
          },
          {
            time: "16:00",
            title: "Revisão financeira da viagem",
            description: "Conferência de gastos e fechamento parcial por categoria.",
            location: "Lounge do hotel",
            notes: "Atualizar comprovantes no app até 15:45.",
            amount: 0,
          }
        ]
      }
    ]
  },
  {
    id: 2,
    destination: "Tokyo",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1800&q=80",
    participants: 3,
    departureDate: "2026-08-10",
    endDate: "2026-08-11",
    status: "active",
    budget: 12000,
    spent: 5400,
    itinerary: [
      {
        date: "2026-08-10",
        activities: [
          {
            time: "09:30",
            title: "Chegada e check-in",
            description: "Ajuste de conexão e descanso rápido.",
            location: "Shinjuku",
            notes: "Ativar eSIM local antes de sair do aeroporto.",
            amount: 0,
          },
          {
            time: "18:00",
            title: "Shibuya Sky",
            description: "Sessão de fotos ao pôr do sol e briefing da semana.",
            location: "Shibuya",
            notes: "Ingressos com horário fixo.",
            amount: 260,
          }
        ]
      },
      {
        date: "2026-08-11",
        activities: [
          {
            time: "08:00",
            title: "Mercado de Toyosu",
            description: "Experiência gastronômica e compras de snacks.",
            location: "Koto City",
            notes: "Levar dinheiro para lojas menores.",
            amount: 180,
          },
          {
            time: "13:30",
            title: "Asakusa e Senso-ji",
            description: "Roteiro cultural com tempo livre para lojinhas.",
            location: "Taito City",
            notes: "Evitar horário de pico do metrô na volta.",
            amount: 220,
          }
        ]
      }
    ]
  },
  {
    id: 3,
    destination: "Lisboa",
    image:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1800&q=80",
    participants: 4,
    departureDate: "2026-03-18",
    endDate: "2026-03-18",
    status: "completed",
    budget: 6400,
    spent: 5980,
    itinerary: [
      {
        date: "2026-03-18",
        activities: [
          {
            time: "09:00",
            title: "Passeio em Belem",
            description: "Visita aos principais pontos historicos da regiao.",
            location: "Mosteiro dos Jeronimos",
            notes: "Ingressos reservados com antecedencia.",
            amount: 160,
          },
          {
            time: "20:00",
            title: "Noite de fado",
            description: "Jantar com apresentacao tradicional portuguesa.",
            location: "Alfama",
            notes: "Confirmar restricoes alimentares do grupo.",
            amount: 240,
          }
        ]
      }
    ]
  }
];

export function getTripById(id: number) {
  return trips.find((trip) => trip.id === id);
}

export function calculateDaysRemaining(departureDate: string) {
  const today = new Date();
  const departure = new Date(departureDate);
  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(Math.ceil((departure.getTime() - today.getTime()) / msPerDay), 0);
}