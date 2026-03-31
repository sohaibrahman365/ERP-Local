import { INCOME_TAX_SLABS, DEFAULTS } from "../constants";

/**
 * Generate a sequential number with prefix: e.g., ORD-0001, INV-0001
 */
export function generateSequentialNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Calculate Pakistan income tax based on annual salary
 */
export function calculateIncomeTax(annualSalary: number): number {
  for (const slab of INCOME_TAX_SLABS) {
    if (annualSalary >= slab.min && annualSalary <= slab.max) {
      const taxableAboveMin = annualSalary - slab.min;
      return slab.fixedTax + (taxableAboveMin * slab.rate) / 100;
    }
  }
  return 0;
}

/**
 * Calculate GST amount
 */
export function calculateGST(amount: number, rate: number = DEFAULTS.GST_RATE): number {
  return (amount * rate) / 100;
}

/**
 * Calculate withholding tax
 */
export function calculateWHT(
  amount: number,
  isFiler: boolean,
  type: "services" | "goods"
): number {
  const rate =
    type === "services"
      ? isFiler
        ? DEFAULTS.WHT_SERVICES_FILER
        : DEFAULTS.WHT_SERVICES_NON_FILER
      : isFiler
        ? DEFAULTS.WHT_GOODS_FILER
        : DEFAULTS.WHT_GOODS_NON_FILER;
  return (amount * rate) / 100;
}

/**
 * Get Pakistan fiscal year for a given date
 */
export function getFiscalYear(date: Date): number {
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();
  return month >= DEFAULTS.FISCAL_YEAR_START_MONTH ? year : year - 1;
}

/**
 * Get fiscal period (1-12) within the fiscal year
 */
export function getFiscalPeriod(date: Date): number {
  const month = date.getMonth() + 1;
  const startMonth = DEFAULTS.FISCAL_YEAR_START_MONTH;
  return month >= startMonth ? month - startMonth + 1 : month + (12 - startMonth) + 1;
}

/**
 * Format PKR currency
 */
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if a point is within a geofence radius (Haversine formula)
 */
export function isWithinGeofence(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number
): boolean {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
}
