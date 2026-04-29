"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  /** Number of twinkling star particles */
  starCount?: number;
  /** Intensity of the aurora glow (0-1) */
  intensity?: number;
}

export function AuroraBackground({
  className = "",
  children,
  starCount = 30,
  intensity = 1,
}: AuroraBackgroundProps) {
  // Pre-generate star positions so they don't re-render
  const stars = useMemo(
    () =>
      Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 6,
        duration: Math.random() * 3 + 2,
        maxOpacity: Math.random() * 0.6 + 0.2,
      })),
    [starCount]
  );

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background layers — lightweight, no blur filters */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Base radial gradient — static, zero GPU cost */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 50% 0%, rgba(99,102,241,${0.1 * intensity}) 0%, transparent 50%),
              radial-gradient(ellipse 80% 60% at 80% 50%, rgba(139,92,246,${0.07 * intensity}) 0%, transparent 50%),
              radial-gradient(ellipse 60% 80% at 20% 80%, rgba(6,182,212,${0.05 * intensity}) 0%, transparent 50%)
            `,
          }}
        />

        {/* Soft animated glow 1 — Indigo (opacity only, no blur) */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "50vw",
            height: "50vw",
            maxWidth: "700px",
            maxHeight: "700px",
            top: "-15%",
            left: "-5%",
            background: `radial-gradient(circle, rgba(99,102,241,${0.12 * intensity}) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.6, 1, 0.7, 0.6],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Soft animated glow 2 — Violet (opacity only, no blur) */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "45vw",
            height: "45vw",
            maxWidth: "600px",
            maxHeight: "600px",
            bottom: "-10%",
            right: "-5%",
            background: `radial-gradient(circle, rgba(139,92,246,${0.1 * intensity}) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 0.9, 0.6, 0.5],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Soft animated glow 3 — Cyan (opacity only, no blur) */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "35vw",
            height: "35vw",
            maxWidth: "500px",
            maxHeight: "500px",
            top: "40%",
            left: "30%",
            background: `radial-gradient(circle, rgba(6,182,212,${0.07 * intensity}) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.4, 0.8, 0.5, 0.4],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Bottom glow — static */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[300px]"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(99,102,241,${0.08 * intensity}) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Twinkling stars — lightweight opacity animation */}
      <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="true">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [0, star.maxOpacity, 0],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

