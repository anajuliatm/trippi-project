interface Props {
  title: string;

  value: string;
}

export function FinanceCard({
  title,
  value
}: Props) {
  return (
    <div
      style={{
        background: "var(--card)",

        padding: "28px",

        borderRadius: "24px",

        minWidth: "220px",

        border: "1px solid var(--border)"
      }}
    >
      <p
        style={{
          opacity: 0.7,
          marginBottom: "12px"
        }}
      >
        {title}
      </p>

      <h2
        style={{
          fontSize: "36px"
        }}
      >
        {value}
      </h2>
    </div>
  );
}