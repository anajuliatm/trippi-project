interface Props {
  destination: string;

  days: number;
}

export function CountdownCard({
  destination,
  days
}: Props) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #2563EB, #60A5FA)",

        padding: "40px",

        borderRadius: "32px",

        marginBottom: "40px"
      }}
    >
      <p
        style={{
          opacity: 0.8
        }}
      >
        Próxima viagem
      </p>

      <h1
        style={{
          fontSize: "52px",
          marginTop: "12px"
        }}
      >
        {destination}
      </h1>

      <div
        style={{
          marginTop: "24px"
        }}
      >
        <span
          style={{
            fontSize: "72px",
            fontWeight: "bold"
          }}
        >
          {days}
        </span>

        <p>Dias restantes</p>
      </div>
    </div>
  );
}