const activities = [
  {
    time: "08:00",
    title: "Café da manhã"
  },

  {
    time: "10:30",
    title: "Tour no Louvre"
  },

  {
    time: "14:00",
    title: "Almoço"
  }
];

export function Timeline() {
  return (
    <div
      style={{
        marginTop: "48px"
      }}
    >
      <h2
        style={{
          marginBottom: "24px",
          fontSize: "28px"
        }}
      >
        Roteiro da viagem
      </h2>

      {activities.map((activity) => (
        <div
          key={activity.time}
          style={{
            display: "flex",

            gap: "24px",

            marginBottom: "24px"
          }}
        >
          <div
            style={{
              color: "#60A5FA",
              fontWeight: "bold"
            }}
          >
            {activity.time}
          </div>

          <div
            style={{
              background: "var(--card)",

              padding: "20px",

              borderRadius: "18px",

              flex: 1
            }}
          >
            {activity.title}
          </div>
        </div>
      ))}
    </div>
  );
}