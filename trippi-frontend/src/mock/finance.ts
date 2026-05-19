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

export interface TripFinanceRecord {
  tripId: number;
  contributions: TripMemberContribution[];
  settlements: TripDebtSettlement[];
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
];

export function getMemberName(memberId: string) {
  return appMembers.find((member) => member.id === memberId)?.name ?? "Participante";
}
