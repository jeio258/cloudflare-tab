import { cachedJson, fetchJson } from './widgets';

// 中国天气网风格的图标 id（/images/w{id}.png），由 WMO 码映射
const WMO: Record<number, { icon: number; text: string }> = {
  0: { icon: 0, text: '晴' },
  1: { icon: 0, text: '晴' },
  2: { icon: 1, text: '多云' },
  3: { icon: 2, text: '阴' },
  45: { icon: 18, text: '雾' },
  48: { icon: 18, text: '雾' },
  51: { icon: 7, text: '小雨' },
  53: { icon: 7, text: '小雨' },
  55: { icon: 7, text: '小雨' },
  56: { icon: 6, text: '雨夹雪' },
  57: { icon: 6, text: '雨夹雪' },
  61: { icon: 7, text: '小雨' },
  63: { icon: 8, text: '中雨' },
  65: { icon: 9, text: '大雨' },
  66: { icon: 19, text: '冻雨' },
  67: { icon: 19, text: '冻雨' },
  71: { icon: 14, text: '小雪' },
  73: { icon: 15, text: '中雪' },
  75: { icon: 16, text: '大雪' },
  77: { icon: 13, text: '阵雪' },
  80: { icon: 3, text: '阵雨' },
  81: { icon: 8, text: '中雨' },
  82: { icon: 10, text: '暴雨' },
  85: { icon: 13, text: '阵雪' },
  86: { icon: 13, text: '阵雪' },
  95: { icon: 4, text: '雷阵雨' },
  96: { icon: 5, text: '雷阵雨' },
  99: { icon: 5, text: '雷阵雨' },
};

const windDir = (deg: number): string => {
  const dirs = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
};

const beaufort = (kmh: number): string => {
  const table = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  let lv = 0;
  for (let i = 0; i < table.length; i++) if (kmh >= table[i]) lv = i + 1;
  return `${lv}级`;
};

const fmt = (n: number) => `${Math.round(n)}°`;

interface OM {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m?: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m?: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function weatherOf(lat: number, lon: number, city: string) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=7`;
  const om = await cachedJson<OM>(`weather:${lat},${lon}`, 10 * 60_000, () => fetchJson(url) as Promise<OM>);
  return build(om, city);
}

function build(om: OM, city: string) {
  const wmo = (code: number) => WMO[code] || { icon: 1, text: '多云' };
  const cur = om.current;
  const curW = wmo(cur.weather_code);

  const forecast_list = om.daily.time.slice(0, 7).map((date, i) => {
    const w = wmo(om.daily.weather_code[i]);
    return {
      date,
      high_temperature: fmt(om.daily.temperature_2m_max[i]),
      low_temperature: fmt(om.daily.temperature_2m_min[i]),
      weather_icon_id: String(w.icon),
      condition: w.text,
    };
  });
  const tHighC = fmt(om.daily.temperature_2m_max[0]);
  const tLowC = fmt(om.daily.temperature_2m_min[0]);
  const tomorrow = forecast_list[1];
  const wToday = wmo(om.daily.weather_code[0]);

  // 从当前小时起的 24 小时逐时
  const hourly_forecast = [];
  const startIdx = om.hourly.time.findIndex((t) => t >= om.current.time);
  const from = Math.max(startIdx, 0);
  for (let i = from; i < from + 24 && i < om.hourly.time.length; i++) {
    const w = wmo(om.hourly.weather_code[i]);
    hourly_forecast.push({
      hour: Number(om.hourly.time[i].slice(11, 13)),
      temperature: fmt(om.hourly.temperature_2m[i]),
      weather_icon_id: String(w.icon),
    });
  }

  const weather = {
    city,
    current_temperature: Math.round(cur.temperature_2m).toString(),
    current_condition: curW.text,
    weather_icon_id: String(curW.icon),
    aqi: '',
    quality_level: '',
    wind_direction: cur.wind_direction_10m != null ? windDir(cur.wind_direction_10m) : '',
    wind_level: beaufort(cur.wind_speed_10m),
    update_time: om.current.time,
    tips: '',
    tomorrow_condition: tomorrow ? tomorrow.condition : '',
    tomorrow_high_temperature: tomorrow ? tomorrow.high_temperature : '',
    tomorrow_low_temperature: tomorrow ? tomorrow.low_temperature : '',
    high_temperature: tHighC,
    low_temperature: tLowC,
    day_condition: wToday.text,
    night_condition: wToday.text,
    dat_high_temperature: tHighC,
    dat_low_temperature: tLowC,
    forecast_list,
    hourly_forecast,
  };

  return { city, weather };
}
