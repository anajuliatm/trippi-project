import { Sidebar } from "../components/common/Sidebar";
import "../styles/layout.css";

interface Props {
  children: React.ReactNode;
}

export function MainLayout({ children }: Props) {
  return (
    <div className="layout">
      <Sidebar />

      <main className="layout__main">
        {children}
      </main>
    </div>
  );
}