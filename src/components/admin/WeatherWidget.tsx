import { useState, useEffect, useCallback } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Thermometer, RefreshCw } from "lucide-react";

interface WeatherData {
  temperature: number;
  weathercode: number;
  city?: string;
  updatedAt?: number;
}

const getWeatherIconAndDesc = (code: number) => {
  if (code === 0) return { icon: <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" />, desc: "Céu Limpo" };
  if (code === 1 || code === 2 || code === 3) return { icon: <Cloud className="h-5 w-5 text-slate-400" />, desc: "Parcialmente Nublado" };
  if (code === 45 || code === 48) return { icon: <CloudFog className="h-5 w-5 text-slate-400" />, desc: "Neblina" };
  if (code === 51 || code === 53 || code === 55) return { icon: <CloudDrizzle className="h-5 w-5 text-blue-400" />, desc: "Chuvisco" };
  if (code === 61 || code === 63 || code === 65) return { icon: <CloudRain className="h-5 w-5 text-blue-500" />, desc: "Chuva" };
  if (code === 71 || code === 73 || code === 75) return { icon: <CloudSnow className="h-5 w-5 text-sky-300" />, desc: "Neve" };
  if (code === 95 || code === 96 || code === 99) return { icon: <CloudLightning className="h-5 w-5 text-yellow-500 animate-pulse" />, desc: "Tempestade" };
  return { icon: <Sun className="h-5 w-5 text-amber-500" />, desc: "Ensolarado" };
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    try {
      const cached = localStorage.getItem("jarvis_weather");
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore cache parse error
    }
    return null;
  });

  const [loading, setLoading] = useState(!weather);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setRefreshing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s strict timeout

    try {
      const [weatherRes, geoRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
          signal: controller.signal,
        }),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`, {
          signal: controller.signal,
        }).catch(() => null), // If geocode fails, gracefully fall back
      ]);

      clearTimeout(timeoutId);

      if (!weatherRes.ok) throw new Error("Erro Open-Meteo");

      const data = await weatherRes.json();
      let city = "Sua Região";

      if (geoRes && geoRes.ok) {
        const geoData = await geoRes.json();
        city = geoData.city || geoData.locality || "Sua Região";
      }

      if (data.current_weather) {
        const w: WeatherData = {
          temperature: Math.round(data.current_weather.temperature),
          weathercode: data.current_weather.weathercode,
          city,
          updatedAt: Date.now(),
        };
        setWeather(w);
        localStorage.setItem("jarvis_weather", JSON.stringify(w));
      }
    } catch (e) {
      console.warn("⚠️ Weather fetch fallback executed:", e);
      // If we don't have weather yet, set a sensible default so UI never blocks
      if (!weather) {
        setWeather({ temperature: 24, weathercode: 0, city: "Curitiba / SP" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weather]);

  useEffect(() => {
    // If cache is fresh (< 30 min old), don't even re-fetch automatically unless user requests
    if (weather?.updatedAt && Date.now() - weather.updatedAt < 30 * 60 * 1000) {
      setLoading(false);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(-23.55, -46.63), // Default SP fallback
        { timeout: 3000, maximumAge: 600000 } // Fast 3s timeout
      );
    } else {
      fetchWeather(-23.55, -46.63);
    }
  }, [fetchWeather]);

  if (loading && !weather) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 animate-pulse">
        <Thermometer className="h-4 w-4 text-slate-300" />
        <span className="text-[10px] font-bold text-slate-400">Carregando clima...</span>
      </div>
    );
  }

  if (!weather) return null;

  const { icon, desc } = getWeatherIconAndDesc(weather.weathercode);
  const dataHoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

  return (
    <div
      onClick={() => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeather(-23.55, -46.63),
            { timeout: 3000 }
          );
        }
      }}
      className="group relative flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-white dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border border-blue-200/80 dark:border-blue-900/60 shadow-sm transition-all hover:scale-105 hover:shadow-md cursor-pointer select-none"
      title="Clique para atualizar o clima agora"
    >
      <div className="shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-800 dark:text-white leading-none">{weather.temperature}°C</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 border-l border-slate-300 dark:border-zinc-700 pl-1.5 leading-none capitalize">
            {weather.city}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-black text-blue-700 dark:text-cyan-400 tracking-wider uppercase leading-none">{desc}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 border-l border-slate-300 dark:border-zinc-700 pl-1.5 leading-none">{dataHoje}</span>
        </div>
      </div>
      {refreshing && (
        <RefreshCw className="h-3 w-3 text-sky-500 animate-spin ml-1 opacity-70" />
      )}
    </div>
  );
}
