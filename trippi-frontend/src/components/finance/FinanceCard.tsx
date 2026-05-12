import "../../styles/card.css";

interface Props {
  title: string;
  value: string;
}

export function FinanceCard({ title, value }: Props) {
  return (
    <div className="card finance-card">
      <p className="finance-card__label">{title}</p>
      <h2 className="finance-card__value">{value}</h2>
    </div>
  );
}