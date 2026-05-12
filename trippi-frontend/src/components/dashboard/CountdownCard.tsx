import "../../styles/countdown.css";

interface Props {
  destination: string;
  days: number;
}

export function CountdownCard({ destination, days }: Props) {
  return (
    <div className="countdown">
      <p className="countdown__label">Próxima viagem</p>

      <h1 className="countdown__title">{destination}</h1>

      <div className="countdown__counter">
        <span className="countdown__days">{days}</span>
        <p>Dias restantes</p>
      </div>
    </div>
  );
}