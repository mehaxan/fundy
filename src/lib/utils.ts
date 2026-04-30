import { NextResponse } from "next/server";
import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatBDT(amount: number): string {
  if (amount === null || amount === undefined) return "৳0";
  return `৳${Math.abs(amount).toLocaleString("en-IN")}`;
}

export function formatBDTCompact(amount: number): string {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
  return formatBDT(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function calcROI(invested: number, returned: number): number {
  if (!invested || invested === 0) return 0;
  return Math.round(((returned - invested) / invested) * 10000) / 100;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    active: "success",
    approved: "success",
    completed: "success",
    paid: "success",
    confirmed: "success",
    attended: "success",
    pending: "warning",
    scheduled: "warning",
    planned: "warning",
    draft: "dim",
    paused: "dim",
    cancelled: "danger",
    rejected: "danger",
    disposed: "danger",
    waived: "info",
    under_maintenance: "warning",
    closed: "muted",
    general: "info",
    emergency: "danger",
    annual: "primary",
    special: "warning",
  };
  return map[status] ?? "muted";
}

export function formatCents(cents: number, currency = "BDT"): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
