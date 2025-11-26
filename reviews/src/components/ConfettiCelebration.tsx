import { Box } from "@mui/material";
import { useEffect, useState } from "react";

interface ConfettiCelebrationProps {
  trigger: boolean;
  duration?: number;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  speed: number;
  color: string;
  size: number;
}

export const ConfettiCelebration = ({
  trigger,
  duration = 3000,
  onComplete,
}: ConfettiCelebrationProps) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ];

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const pieces: ConfettiPiece[] = [];
      const pieceCount = 50;

      for (let i = 0; i < pieceCount; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          speed: 2 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 12,
        });
      }

      setConfetti(pieces);

      const timeout = setTimeout(() => {
        setIsActive(false);
        setConfetti([]);
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [trigger, duration, onComplete]);

  useEffect(() => {
    if (!isActive || confetti.length === 0) return;

    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev.map((piece) => ({
          ...piece,
          y: piece.y + piece.speed,
          rotation: piece.rotation + piece.rotationSpeed,
          x: piece.x + (Math.random() - 0.5) * 0.5,
        }))
      );
    }, 16);

    return () => clearInterval(interval);
  }, [isActive, confetti.length]);

  if (!isActive || confetti.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {confetti.map((piece) => (
        <Box
          key={piece.id}
          sx={{
            position: "absolute",
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: piece.id % 3 === 0 ? "50%" : "2px",
            opacity: piece.y > 110 ? 0 : 1,
            transition: "opacity 0.3s ease-out",
          }}
        />
      ))}
    </Box>
  );
};

