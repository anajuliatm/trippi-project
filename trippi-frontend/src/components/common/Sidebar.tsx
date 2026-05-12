import { LayoutDashboard, Wallet, Plane } from "lucide-react";

export function Sidebar() {
  return (
    <aside
      style={{
        width: "280px",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "32px"
      }}
    >
        <div
            style={{
                marginBottom: "48px"
            }}
        >
            <img
                src="/logo-ico.png"
                alt="Trippi"
                style={{
                  width: "140px",
                  height: "auto",
                  maxHeight: "56px",
                  display: "block",
                  objectFit: "contain"
                }}
            />
        </div>

        <nav
            style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
            }}
        >
            <MenuItem icon={<LayoutDashboard />} label="Dashboard" />

            <MenuItem icon={<Plane />} label="Viagens" />

            <MenuItem icon={<Wallet />} label="Financeiro" />
        </nav>
    </aside>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
}

function MenuItem({ icon, label }: MenuItemProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",

        padding: "18px",

        borderRadius: "18px",

        background: "rgba(255,255,255,0.04)",

        backdropFilter: "blur(12px)"
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}