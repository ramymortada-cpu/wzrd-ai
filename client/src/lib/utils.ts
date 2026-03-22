import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract data array from PaginatedResult, array, or { items } */
export function paginatedData<T>(data: T[] | { data: T[] } | { items: T[] } | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("data" in data) return data.data ?? [];
  if ("items" in data) return data.items ?? [];
  return [];
}
