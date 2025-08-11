"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface MorphingBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function MorphingBackground({ children, className = "" }: MorphingBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform scroll progress into various animation values
  const primaryHue = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [220, 280, 320, 220]);
  const accentHue = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [320, 220, 280, 320]);
  const saturation = useTransform(scrollYProgress, [0, 0.5, 1], [50, 80, 50]);
  const lightness = useTransform(scrollYProgress, [0, 0.5, 1], [15, 25, 15]);
  
  const blob1X = useTransform(scrollYProgress, [0, 1], ["20%", "80%"]);
  const blob1Y = useTransform(scrollYProgress, [0, 1], ["30%", "70%"]);
  const blob1Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.5, 1]);
  
  const blob2X = useTransform(scrollYProgress, [0, 1], ["80%", "20%"]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], ["70%", "30%"]);
  const blob2Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 1.2]);

  const gridOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.03, 0.08, 0.05, 0.03]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Morphing gradient blobs */}
      <motion.div
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{
          background: `radial-gradient(circle at center, hsl(${primaryHue} ${saturation}% ${lightness}%) 0%, transparent 70%)`,
        }}
      >
        {/* Primary blob */}
        <motion.div
          className="absolute w-[60rem] h-[60rem] rounded-full blur-3xl"
          style={{
            x: blob1X,
            y: blob1Y,
            scale: blob1Scale,
            background: `radial-gradient(circle, hsl(${primaryHue} ${saturation}% 25%) 0%, transparent 70%)`,
          }}
        />
        
        {/* Secondary blob */}
        <motion.div
          className="absolute w-[40rem] h-[40rem] rounded-full blur-3xl"
          style={{
            x: blob2X,
            y: blob2Y,
            scale: blob2Scale,
            background: `radial-gradient(circle, hsl(${accentHue} ${saturation}% 20%) 0%, transparent 70%)`,
          }}
        />

        {/* Tertiary accent blob */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[30rem] h-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            background: `conic-gradient(from 0deg, hsl(${primaryHue} 60% 15%), hsl(${accentHue} 60% 15%), transparent)`,
          }}
        />
      </motion.div>

      {/* Animated grid */}
      <motion.div
        className="fixed inset-0 -z-10"
        style={{
          opacity: gridOpacity,
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {children}
    </div>
  );
}
