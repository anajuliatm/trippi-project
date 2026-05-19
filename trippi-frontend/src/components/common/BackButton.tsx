import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/back-button.css";

interface BackButtonProps {
  className?: string;
  ariaLabel?: string;
  iconSize?: number;
}

export function BackButton({
  className,
  ariaLabel = "Voltar para a pagina anterior",
  iconSize = 18,
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`back-button ${className ?? ""}`.trim()}
      onClick={() => navigate(-1)}
      aria-label={ariaLabel}
    >
      <ArrowLeft size={iconSize} aria-hidden="true" />
    </button>
  );
}
