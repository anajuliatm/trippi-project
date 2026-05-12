import { motion } from "framer-motion";
import "../../styles/card.css";

interface Props {
  destination: string;
  image: string;
  participants: number;
  onClick?: () => void;
}

export function TripCard({ destination, image, participants, onClick }: Props) {
  return (
    <motion.button
      className="card trip-card"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      type="button"
    >
      <img src={image} className="trip-card__image" />

      <div className="trip-card__body">
        <h2 className="trip-card__title">{destination}</h2>
        <p className="trip-card__participants">{participants} participantes</p>
      </div>
    </motion.button>
  );
}