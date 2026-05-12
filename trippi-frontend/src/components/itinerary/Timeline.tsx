import "../../styles/timeline.css";
import "../../styles/card.css";

const activities = [
  { time: "08:00", title: "Café da manhã" },
  { time: "10:30", title: "Tour no Louvre" },
  { time: "14:00", title: "Almoço" },
];

export function Timeline() {
  return (
    <div className="timeline">
      <h2 className="timeline__title">Roteiro da viagem</h2>

      {activities.map((activity) => (
        <div key={activity.time} className="timeline__item">
          <div className="timeline__time">{activity.time}</div>
          <div className="card timeline__content">{activity.title}</div>
        </div>
      ))}
    </div>
  );
}