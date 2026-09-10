import { cachedJson, fetchJson } from './widgets';

// 中国天气网 3 位图标码 -> 项目内置 /images/w{id}.png
const ICON_BY_CODE: Record<string, string> = {
  '100': '0', '101': '1', '102': '1', '103': '1', '104': '2',
  '300': '3', '301': '3', '302': '4', '303': '4', '304': '4',
  '305': '7', '306': '8', '307': '9', '308': '10', '309': '7', '310': '7', '311': '7', '312': '8', '313': '10', '399': '7',
  '400': '14', '401': '15', '402': '16', '403': '16', '404': '6', '405': '6', '406': '14', '407': '15', '408': '16',
  '409': '6', '410': '13', '411': '14', '412': '15', '413': '16', '499': '14',
  '500': '18', '501': '18', '502': '18', '503': '18', '504': '18', '505': '18', '506': '18', '518': '18',
  '507': '29', '508': '29', '509': '29', '510': '29', '511': '29', '512': '29', '513': '29', '514': '29', '515': '29',
  '200': '20', '201': '20', '202': '20', '203': '20', '204': '20', '205': '20', '206': '20',
  '900': '30', '901': '31',
};

// 天气文本 -> 图标 id（逐时/预报上游返回文字）
function iconByText(text: string): string {
  const t = String(text || '');
  if (/雷阵雨|雷电|雷/.test(t)) return '4';
  if (/冻雨/.test(t)) return '19';
  if (/雨夹雪/.test(t)) return '6';
  if (/阵雪/.test(t)) return '13';
  if (/暴雪/.test(t)) return '16';
  if (/大雪/.test(t)) return '16';
  if (/中雪/.test(t)) return '15';
  if (/小雪/.test(t)) return '14';
  if (/雪/.test(t)) return '14';
  if (/暴雨/.test(t)) return '10';
  if (/大雨/.test(t)) return '9';
  if (/中雨/.test(t)) return '8';
  if (/阵雨/.test(t)) return '3';
  if (/雨/.test(t)) return '7';
  if (/雾/.test(t)) return '18';
  if (/霾/.test(t)) return '29';
  if (/阴/.test(t)) return '2';
  if (/多云/.test(t)) return '1';
  if (/晴/.test(t)) return '0';
  return '1';
}

const fmtTemp = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n)}°` : '';
};

interface UWeather {
  city?: string;
  weather?: string;
  weather_icon?: string;
  temperature?: string | number;
  wind_direction?: string;
  wind_power?: string;
  report_time?: string;
  temp_max?: string | number;
  temp_min?: string | number;
  forecast?: Array<{ date?: string; temp_max?: string | number; temp_min?: string | number; weather_day?: string; weather_night?: string }>;
  hourly_forecast?: Array<{ time?: string; temperature?: string | number; weather?: string }>;
}

export async function weatherOf(city: string) {
  const url =
    `https://uapis.cn/api/v1/misc/weather?city=${encodeURIComponent(city)}&forecast=true&hourly=true`;
  const w = await cachedJson<UWeather>(
    `weather:${city}`,
    10 * 60_000,
    () => fetchJson(url) as Promise<UWeather>
  );
  return build(w, city);
}

function build(w: UWeather, city: string) {
  const name = w.city || city;
  const curIcon = ICON_BY_CODE[String(w.weather_icon || '')] || iconByText(w.weather || '');

  const forecast_list = (w.forecast || []).slice(0, 7).map((d) => ({
    date: d.date || '',
    high_temperature: fmtTemp(d.temp_max),
    low_temperature: fmtTemp(d.temp_min),
    weather_icon_id: iconByText(d.weather_day || ''),
    condition: d.weather_day || d.weather_night || '',
  }));
  const hourly_forecast = (w.hourly_forecast || []).slice(0, 24).map((h) => ({
    hour: Number(String(h.time || '').slice(11, 13) || 0),
    temperature: fmtTemp(h.temperature),
    weather_icon_id: iconByText(h.weather || ''),
  }));

  const today = forecast_list[0];
  const tomorrow = forecast_list[1];
  const todayDay = w.forecast?.[0]?.weather_day || '';
  const todayNight = w.forecast?.[0]?.weather_night || '';

  const weather = {
    city: name,
    current_temperature: fmtTemp(w.temperature),
    current_condition: w.weather || '',
    weather_icon_id: curIcon,
    aqi: '',
    quality_level: '',
    wind_direction: w.wind_direction || '',
    wind_level: w.wind_power || '',
    update_time: w.report_time || '',
    tips: '',
    tomorrow_condition: tomorrow ? tomorrow.condition : '',
    tomorrow_high_temperature: tomorrow ? tomorrow.high_temperature : '',
    tomorrow_low_temperature: tomorrow ? tomorrow.low_temperature : '',
    high_temperature: today ? today.high_temperature : fmtTemp(w.temp_max),
    low_temperature: today ? today.low_temperature : fmtTemp(w.temp_min),
    day_condition: todayDay || w.weather || '',
    night_condition: todayNight || w.weather || '',
    // 契约：字段名沿用前端读取口径（day→dat 为历史拼写，勿改）
    dat_high_temperature: today ? today.high_temperature : '',
    dat_low_temperature: today ? today.low_temperature : '',
    forecast_list,
    hourly_forecast,
  };

  return { city: name, weather };
}
