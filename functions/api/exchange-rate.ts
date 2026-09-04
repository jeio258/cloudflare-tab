import { ok } from '../lib/http';
import { cachedJson, fetchJson } from '../lib/widgets';

const CODES = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD', 'CHF', 'NZD'];

// 兜底静态汇率（相对 CNY=1，近似值），上游不可用时保证组件可用
const FALLBACK: Record<string, number> = {
  CNY: 1,
  USD: 7.16,
  EUR: 7.85,
  GBP: 9.1,
  JPY: 0.0478,
  HKD: 0.916,
  AUD: 4.72,
  CAD: 5.24,
  CHF: 8.1,
  NZD: 4.32,
};

export async function onRequestGet() {
  const rates = await cachedJson<Record<string, number>>('fx', 10 * 60_000, async () => {
    try {
      const j = (await fetchJson(`https://api.frankfurter.app/latest?from=CNY&to=${CODES.join(',')}`)) as {
        rates?: Record<string, number>;
      };
      const out: Record<string, number> = { CNY: 1 };
      for (const code of CODES) {
        const v = j?.rates?.[code];
        out[code] = v && v > 0 ? Math.round((1 / v) * 1e6) / 1e6 : FALLBACK[code];
      }
      return out;
    } catch {
      return { ...FALLBACK };
    }
  });
  return ok({ rates });
}
