import { motion } from "framer-motion";

interface Props {
  destination: string;

  image: string;

  participants: number;
}

export function TripCard({
  destination,
  image,
  participants
}: Props) {
  return (
    <motion.div
      whileHover={{
        y: -6
      }}
      style={{
        width: "320px",

        background: "var(--card)",

        borderRadius: "28px",

        overflow: "hidden",

        border: "1px solid var(--border)"
      }}
    >
      <img
        src={image}
        style={{
          width: "100%",
          height: "220px",
          objectFit: "cover"
        }}
      />

      <div
        style={{
          padding: "24px"
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            marginBottom: "8px"
          }}
        >
          {destination}
        </h2>

        <p
          style={{
            opacity: 0.7
          }}
        >
          {participants} participantes
        </p>
      </div>
    </motion.div>
  );
}