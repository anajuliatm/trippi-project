export interface TripMemberContribution {
  memberId: string;
  amount: number;
}

export interface TripDebtSettlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  note: string;
}

export interface TripFinanceEntry {
  id: string;
  memberId: string;
  type: "contribution" | "expense";
  description: string;
  amount: number;
}

export interface TripFinanceRecord {
  tripId: number;
  contributions: TripMemberContribution[];
  settlements: TripDebtSettlement[];
  entries: TripFinanceEntry[];
}

export interface AppMember {
  id: string;
  name: string;
}

export const CURRENT_USER_ID = "member-ana";

export const appMembers: AppMember[] = [
  { id: "member-ana", name: "Ana" },
  { id: "member-luca", name: "Luca" },
  { id: "member-duda", name: "Duda" },
  { id: "member-noah", name: "Noah" },
  { id: "member-joao", name: "Joao" },
];

export const tripFinanceRecords: TripFinanceRecord[] = [
  {
    tripId: 1,
    contributions: [
      { memberId: "member-ana", amount: 2800 },
      { memberId: "member-luca", amount: 1750 },
      { memberId: "member-duda", amount: 1600 },
      { memberId: "member-noah", amount: 1300 },
      { memberId: "member-joao", amount: 1050 },
    ],
    entries: [
      {
        id: "paris-entry-1",
        memberId: "member-ana",
        type: "expense",
        description: "Museu do Louvre",
        amount: 300,
      },
      {
        id: "paris-entry-2",
        memberId: "member-ana",
        type: "contribution",
        description: "Ana adicionou ao caixa comum",
        amount: 500,
      },
      {
        id: "paris-entry-3",
        memberId: "member-luca",
        type: "expense",
        description: "Jantar de abertura",
        amount: 420,
      },
      {
        id: "paris-entry-4",
        memberId: "member-duda",
        type: "contribution",
        description: "Duda reforcou o saldo da viagem",
        amount: 350,
      },
    ],
    settlements: [
      {
        fromMemberId: "member-luca",
        toMemberId: "member-ana",
        amount: 310,
        note: "Ingressos do Louvre",
      },
      {
        fromMemberId: "member-joao",
        toMemberId: "member-duda",
        amount: 190,
        note: "Jantar de abertura",
      },
    ],
  },
  {
    tripId: 2,
    contributions: [
      { memberId: "member-ana", amount: 2600 },
      { memberId: "member-luca", amount: 1500 },
      { memberId: "member-duda", amount: 1300 },
    ],
    entries: [
      {
        id: "tokyo-entry-1",
        memberId: "member-ana",
        type: "contribution",
        description: "Ana adicionou ao fundo inicial",
        amount: 700,
      },
      {
        id: "tokyo-entry-2",
        memberId: "member-duda",
        type: "expense",
        description: "Shibuya Sky",
        amount: 260,
      },
      {
        id: "tokyo-entry-3",
        memberId: "member-luca",
        type: "expense",
        description: "Hotel primeira noite",
        amount: 480,
      },
    ],
    settlements: [
      {
        fromMemberId: "member-duda",
        toMemberId: "member-ana",
        amount: 480,
        note: "Shibuya Sky",
      },
      {
        fromMemberId: "member-luca",
        toMemberId: "member-ana",
        amount: 260,
        note: "Hotel primeira noite",
      },
    ],
  },
  {
    tripId: 3,
    contributions: [],
    settlements: [],
    entries: [
      {
        id: "lisboa-entry-1",
        memberId: "member-joao",
        type: "expense",
        description: "Noite de fado",
        amount: 240,
      },
    ],
  },
];

export function getMemberName(memberId: string) {
  return appMembers.find((member) => member.id === memberId)?.name ?? "Participante";
}
