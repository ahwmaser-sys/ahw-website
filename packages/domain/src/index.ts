export type CurrencyCode = string;
export type EntityId = string;
export type LocaleCode = string;
export type ProjectId = string;
export type UserId = string;

export type Money = Readonly<{
  amount: string;
  currency: CurrencyCode;
}>;

export type LocalizedText = Readonly<Record<LocaleCode, string>>;
export * from "./project/index.js";
export * from "./boq/index.js";
export * from "./document/index.js";
export * from "./portal/index.js";
export * from "./identity/index.js";
export * from "./integration/index.js";
