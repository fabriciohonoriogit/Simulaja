import { useState, useEffect } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Thermometer } from "lucide-react";
import { toast } from "sonner";

interface WeatherData {
  temperature: number;
  weathercode: number;
  city?: string;
}

const getWeatherIconAndDesc = (code: number) => {
  if (code === 0) return { icon: <Sun className="h-5 w-5 text-amber-500" />, desc: "Céu Limpo" };
  if (code === 1 || code === 2 || code === 3) return { icon: <Cloud className="h-5 w-5 text-slate-400" />, desc: "Parcialmente Nublado" };
  if (code === 45 || code === 48) return { icon: <CloudFog className="h-5 w-5 text-slate-400" />, desc: "Neblina" };
  if (code === 51 || code === 53 || code === 55) return { icon: <CloudDrizzle className="h-5 w-5 text-blue-400" />, desc: "Chuvisco" };
  if (code === 61 || code === 63 || code === 65) return { icon: <CloudRain className="h-5 w-5 text-blue-500" />, desc: "Chuva" };
  if (code === 71 || code === 73 || code === 75) return { icon: <CloudSnow className="h-5 w-5 text-sky-300" />, desc: "Neve" };
  if (code === 95 || code === 96 || code === 99) return { icon: <CloudLightning className="h-5 w-5 text-yellow-500" />, desc: "Tempestade" };
  return { icon: <Sun className="h-5 w-5 text-amber-500" />, desc: "Ensolarado" };
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          const w = {
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
          };
          setWeather(w);
          localStorage.setItem("jarvis_weather", JSON.stringify(w));
        }
      } catch (e) {
        console.error("Erro ao buscar clima", e);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Erro geolocalizacao", error);
          // Fallback SP: -23.55, -46.63
          fetchWeather(-23.55, -46.63);
        }
      );
    } else {
      // Fallback
      fetchWeather(-23.55, -46.63);
    }
  }, []);

  if (loading || !weather) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 animate-pulse">
        <Thermometer className="h-4 w-4 text-slate-300" />
        <span className="text-[10px] font-bold text-slate-400">Calculando clima...</span>
      </div>
    );
  }

  const { icon, desc } = getWeatherIconAndDesc(weather.weathercode);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100/50 shadow-sm transition-all hover:scale-105 cursor-default">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs font-black text-slate-700 leading-none">{weather.temperature}°C</span>
        <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase leading-none mt-0.5">{desc}</span>
      </div>
    </div>
  );
}
