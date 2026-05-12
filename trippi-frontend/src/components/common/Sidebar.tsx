import { LayoutDashboard, Wallet, Plane } from "lucide-react";
import "../../styles/sidebar.css";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img src="/logo-ico.png" alt="Trippi" className="sidebar__logo-img" />
      </div>

      <nav className="sidebar__nav">
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
    <div className="menu-item">
      {icon}
      <span>{label}</span>
    </div>
  );
}