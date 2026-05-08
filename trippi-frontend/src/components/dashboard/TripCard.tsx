import { motion } from "framer-motion";

export function TripCard() {
  return (
    <motion.div
      whileHover={{
        y: -5
      }}
      style={{
        width: "320px",

        background: "rgba(255,255,255,0.05)",

        borderRadius: "28px",

        overflow: "hidden",

        border: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <img
        src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34"
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
          Paris 2026
        </h2>

        <p
          style={{
            opacity: 0.7
          }}
        >
          5 participantes
        </p>
      </div>
    </motion.div>
  );
}