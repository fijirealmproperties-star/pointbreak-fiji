export interface CountryCode {
  code: string;
  dial: string;
  flag: string;
  name: string;
  localLengths: number[];
  prefixes: string[];
}

export const COUNTRIES: CountryCode[] = [
  { code: "FJ", dial: "+679", flag: "🇫🇯", name: "Fiji", localLengths: [7], prefixes: ["7", "8", "9"] },
  { code: "VU", dial: "+678", flag: "🇻🇺", name: "Vanuatu", localLengths: [7], prefixes: ["2", "3"] },
  { code: "WS", dial: "+685", flag: "🇼🇸", name: "Samoa", localLengths: [7], prefixes: ["7", "2"] },
  { code: "TO", dial: "+676", flag: "🇹🇴", name: "Tonga", localLengths: [5, 7], prefixes: ["7", "2"] },
  { code: "PG", dial: "+675", flag: "🇵🇬", name: "Papua New Guinea", localLengths: [7, 8], prefixes: ["7"] },
  { code: "NZ", dial: "+64", flag: "🇳🇿", name: "New Zealand", localLengths: [8, 9, 10], prefixes: ["2", "3", "4", "6", "7", "8", "9"] },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia", localLengths: [9], prefixes: ["4", "5"] },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

export function detectCountry(rawDigits: string): CountryCode {
  const d = rawDigits.replace(/\D/g, "");
  if (d.length < 7) return DEFAULT_COUNTRY;
  for (const c of COUNTRIES) {
    if (c.localLengths.includes(d.length) && c.prefixes.some((p) => d.startsWith(p))) {
      return c;
    }
  }
  return DEFAULT_COUNTRY;
}

export function toE164(rawDigits: string, country: CountryCode): string {
  const d = rawDigits.replace(/\D/g, "");
  return `${country.dial}${d}`;
}
