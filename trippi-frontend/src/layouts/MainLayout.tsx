import { Sidebar } from "../components/common/Sidebar";

interface Props {
  children: React.ReactNode;
}

export function MainLayout({ children }: Props) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#071120"
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "40px"
        }}
      >
        {children}
      </main>
    </div>
  );
}