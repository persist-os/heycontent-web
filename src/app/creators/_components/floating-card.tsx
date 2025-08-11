"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltIntensity?: number;
  floatRange?: number;
}

export function FloatingCard({ 
  children, 
  className = "", 
  glowColor = "primary",
  tiltIntensity = 15,
  floatRange = 10
}: FloatingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("relative transform-gpu", className)}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ z: 50 }}
      animate={{
        y: isHovered ? -floatRange : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Glow effect */}
      <motion.div
        className={cn(
          "absolute -inset-1 rounded-2xl blur-xl opacity-0 transition-opacity duration-500",
          glowColor === "primary" && "bg-primary/30",
          glowColor === "accent" && "bg-accent/30",
          glowColor === "secondary" && "bg-secondary/30"
        )}
        animate={{
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      
      {/* Inner glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        style={{
          transform: "translateZ(50px)",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10"
        style={{
          transform: "translateZ(25px)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
