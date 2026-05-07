"use client";

import React, { useState, useEffect } from "react";
import {
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Eye,
  CloudRain,
  Sunrise,
  Sunset,
  Moon,
  RefreshCw,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Cloud,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("24h");
  const [currentData, setCurrentData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch latest 24 hours (or based on filter, for now let's just fetch latest 100 for charts)
      const { data, error } = await supabase
        .from('dados_estacao')
        .select('*')
        .order('data_hora', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching data:", error);
      } else if (data && data.length > 0) {
        // Latest reading is the first one
        setCurrentData(data[0]);
        
        // Format date for last update
        const dateObj = new Date(data[0].data_hora);
        setLastUpdate(dateObj.toLocaleTimeString('pt-BR'));

        // Prepare chart data (reverse to chronological order)
        const chartFormatted = data.reverse().map((d: any) => {
          const dTime = new Date(d.data_hora);
          return {
            time: `${dTime.getHours().toString().padStart(2, '0')}:${dTime.getMinutes().toString().padStart(2, '0')}`,
            temp: d.temperatura_c,
            humidity: d.umidade_pct,
            pressure: d.pressao_hpa,
            rain: d.chuva_diaria_mm,
          };
        });
        setHistoryData(chartFormatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up polling every 1 minute
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Thermometer className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Estação Meteorológica</h1>
              <div className="flex items-center text-slate-500 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span>E.M. Pe. Tomaz Ghirardelli</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Moon className="w-6 h-6" />
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase font-semibold">Última atualização</div>
              <div className="text-lg font-bold text-slate-800">
                {loading && !lastUpdate ? "Carregando..." : (lastUpdate || "Sem dados")}
              </div>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </header>

        <h2 className="text-xl font-bold text-slate-800 pt-2">Condições Atuais</h2>

        {/* Current Conditions - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Temperature */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Temperatura</h3>
                <div className="text-3xl font-bold text-slate-800 mt-1">
                  {currentData?.temperatura_c ?? '--'}<span className="text-xl font-normal text-slate-500">°C</span>
                </div>
              </div>
              <div className="bg-orange-500 p-2 rounded-full text-white">
                <Thermometer className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Umidade</h3>
                <div className="text-3xl font-bold text-slate-800 mt-1">
                  {currentData?.umidade_pct ?? '--'}<span className="text-xl font-normal text-slate-500">%</span>
                </div>
              </div>
              <div className="bg-emerald-500 p-2 rounded-full text-white">
                <Droplets className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Pressão Atmosférica</h3>
                <div className="text-3xl font-bold text-slate-800 mt-1">
                  {currentData?.pressao_hpa != null ? Number(currentData.pressao_hpa).toFixed(2) : '--'}<span className="text-xl font-normal text-slate-500"> hPa</span>
                </div>
              </div>
              <div className="bg-emerald-500 p-2 rounded-full text-white">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Gás MQ135 (Air Quality) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 text-sm font-medium">Gás (MQ135)</h3>
                <div className="text-3xl font-bold text-slate-800 mt-1">
                  {currentData?.gas_mq135 ?? '--'}
                </div>
              </div>
              <div className="bg-blue-500 p-2 rounded-full text-white">
                <Cloud className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Current Conditions - Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gás MQ02 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-slate-500 text-sm font-medium">Gás Combustível (MQ02)</h3>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {currentData?.gas_mq02 ?? '--'}
              </div>
            </div>
            <div className="bg-red-500 p-3 rounded-full text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Precipitation */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-slate-500 text-sm font-medium">Chuva Diária</h3>
              <div className="text-3xl font-bold text-slate-800 mt-1">
                {currentData?.chuva_diaria_mm ?? '--'}<span className="text-xl font-normal text-slate-500"> mm</span>
              </div>
            </div>
            <div className="bg-blue-600 p-3 rounded-full text-white">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>

          {/* Sun */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 text-xs font-medium">Nascer do Sol</h3>
                <div className="text-xl font-bold text-slate-800 mt-1">06:24</div>
              </div>
              <Sunrise className="w-8 h-8 text-orange-400" />
            </div>
            <div className="h-px bg-slate-100 w-full" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 text-xs font-medium">Pôr do Sol</h3>
                <div className="text-xl font-bold text-slate-800 mt-1">18:42</div>
              </div>
              <Sunset className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* History Section */}
        <h2 className="text-xl font-bold text-slate-800 pt-6">Histórico</h2>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Filtrar Período</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "24h", label: "Últimas Leituras" }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Container */}
        {historyData.length > 0 ? (
          <div className="space-y-4">
            {/* Temperature Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-slate-700 font-bold mb-4">Temperatura (°C)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Humidity Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-slate-700 font-bold mb-4">Umidade (%)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pressure Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-slate-700 font-bold mb-4">Pressão Atmosférica (hPa)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="pressure" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rain Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-slate-700 font-bold mb-4">Chuva Diária (mm)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="rain" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          !loading && <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500">Nenhum dado histórico encontrado no momento. Aguardando sincronização.</div>
        )}
      </div>
    </div>
  );
}
