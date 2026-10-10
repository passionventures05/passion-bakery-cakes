import type { Unit } from "@/types";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 1049 -> "₹1,049" */
export const formatRupees = (amount: number) => `₹${inr.format(Math.round(amount))}`;

/** 500 g -> "500 g", 1500 g -> "1.5 kg", 3 pc -> "3 pieces" */
export const formatAmount = (amount: number, unit: Unit) => {
  if (unit === "pc") return `${amount} ${amount === 1 ? "piece" : "pieces"}`;
  if (amount >= 1000) return `${Number((amount / 1000).toFixed(2))} kg`;
  return `${amount} g`;
};
