import { LayoutDashboard, Wallet, Plane, LogOut, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/sidebar.css";

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img src="/logo-ico.png" alt="Trippi" className="sidebar__logo-img" />
      </div>

      <nav className="sidebar__nav">
        <MenuItem icon={<LayoutDashboard />} label="Dashboard" to="/dashboard" end />
        <MenuItem icon={<Plane />} label="Viagens" to="/trips" />
        <MenuItem icon={<Wallet />} label="Financeiro" to="/finance" />
        <MenuItem icon={<UserRound />} label="Perfil" to="/profile" />
      </nav>

      <div className="sidebar__logout">
        <button
          type="button"
          className="menu-item menu-item--logout"
          onClick={() => navigate("/")}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  end?: boolean;
}

function MenuItem({ icon, label, to, end }: MenuItemProps) {
  if (to) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `menu-item${isActive ? " is-active" : ""}`}
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    );
  }

  return (
    <div className="menu-item">
      {icon}
      <span>{label}</span>
    </div>
  );
}