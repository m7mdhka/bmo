"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, HardDrive } from "lucide-react";

const stats = [
  { icon: Activity, label: "Running", value: "1", color: "#a6e3a1" },
  { icon: HardDrive, label: "Disk used", value: "~340 MB", color: "#89dceb" },
  { icon: Cpu, label: "Docker", value: "online", color: "#cba6f7" },
];

export function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-wrap gap-px border border-border"
    >
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="flex flex-1 items-center gap-2 bg-card px-3 py-2 text-xs"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} aria-hidden />
          <span className="font-mono text-muted-foreground">{label}</span>
          <span className="ml-auto font-mono font-semibold" style={{ color }}>
            {value}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
