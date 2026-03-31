// Pakistan defaults
export const DEFAULTS = {
  CURRENCY: "PKR",
  COUNTRY: "PK",
  TIMEZONE: "Asia/Karachi",
  LOCALE: "en-PK",
  FISCAL_YEAR_START_MONTH: 7, // July
  GST_RATE: 17,
  WHT_SERVICES_FILER: 8,
  WHT_SERVICES_NON_FILER: 16,
  WHT_GOODS_FILER: 4.5,
  WHT_GOODS_NON_FILER: 9,
  INSPECTION_MIN_FEE: 2500,
  GEOFENCE_RADIUS_M: 200,
} as const;

// Pakistan income tax slabs (FY 2025-26)
export const INCOME_TAX_SLABS = [
  { min: 0, max: 600_000, rate: 0, fixedTax: 0 },
  { min: 600_001, max: 1_200_000, rate: 2.5, fixedTax: 0 },
  { min: 1_200_001, max: 2_200_000, rate: 12.5, fixedTax: 15_000 },
  { min: 2_200_001, max: 3_200_000, rate: 22.5, fixedTax: 140_000 },
  { min: 3_200_001, max: 4_100_000, rate: 27.5, fixedTax: 365_000 },
  { min: 4_100_001, max: Infinity, rate: 35, fixedTax: 612_500 },
] as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// OZ Developers projects
export const RE_PROJECTS = [
  "Bahria Sky",
  "Bahria Sky 2",
  "Lahore Sky",
  "OZ Square",
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "JAZZCASH",
  "EASYPAISA",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "ONLINE_GATEWAY",
  "WALLET",
  "PAYORDER",
] as const;

// Supported currencies for overseas investors
export const SUPPORTED_CURRENCIES = [
  "PKR",
  "USD",
  "AED",
  "GBP",
  "AUD",
  "KWD",
  "EUR",
] as const;
