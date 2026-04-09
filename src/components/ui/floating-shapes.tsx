"use client";

import { motion } from "framer-motion";

interface Shape {
  width: number;
  height: number;
  gradient: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay: number;
  duration: number;
  rotate: number;
}

const defaultShapes: Shape[] = [
  {
    width: 340,
    height: 180,
    gradient: "from-indigo-500/[0.08] to-violet-500/[0.04]",
    top: "12%",
    left: "8%",
    delay: 0,
    duration: 18,
    rotate: -15,
  },
  {
    width: 280,
    height: 140,
    gradient: "from-violet-500/[0.08] to-purple-500/[0.04]",
    top: "25%",
    right: "10%",
    delay: 2,
    duration: 22,
    rotate: 12,
  },
  {
    width: 220,
    height: 120,
    gradient: "from-cyan-500/[0.06] to-indigo-500/[0.03]",
    bottom: "18%",
    left: "15%",
    delay: 4,
    duration: 20,
    rotate: -8,
  },
  {
    width: 300,
    height: 160,
    gradient: "from-purple-500/[0.06] to-indigo-500/[0.04]",
    bottom: "25%",
    right: "6%",
    delay: 1,
    duration: 24,
    rotate: 20,
  },
  {
    width: 180,
    height: 100,
    gradient: "from-indigo-400/[0.05] to-cyan-400/[0.03]",
    top: "55%",
    left: "40%",
    delay: 3,
    duration: 16,
    rotate: -25,
  },
];

export function FloatingShapes({
  shapes = defaultShapes,
  className = "",
}: {
  shapes?: Shape[];
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${shape.gradient} blur-[1px]`}
          style={{
            width: shape.width,
            height: shape.height,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
            borderRadius: "50%",
            willChange: "transform",
          }}
          initial={{ opacity: 0, rotate: shape.rotate }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            y: [0, -16, 0, -10, 0],
            rotate: [shape.rotate, shape.rotate + 3, shape.rotate - 2, shape.rotate],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Fade-out overlay top and bottom */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--pp-bg-deepest)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--pp-bg-deepest)] to-transparent" />
    </div>
  );
}
