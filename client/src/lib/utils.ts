import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatString: string = "PPP"): string {
  if (!date) return "N/A";
  return format(new Date(date), formatString);
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return "N/A";
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}
