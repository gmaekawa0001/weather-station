"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Thermometer,
  Droplets,
  Gauge,
  CloudRain,
  Sunrise,
  Sunset,
  Moon,
  Sun,
  RefreshCw,
  MapPin,
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
  Brush,
} from "recharts";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("24h");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [currentData, setCurrentData] = useState<any>(null);
  const [baseData, setBaseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: latest } = await supabase
        .from('dados_estacao')
        .select('*')
        .order('data_hora', { ascending: false })
        .limit(1);
        
      if (latest && latest.length > 0) {
        setCurrentData(latest[0]);
        const dateObj = new Date(latest[0].data_hora);
        setLastUpdate(dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }

      let startIso = "";
      let endIso = "";
      
      if (activeFilter === "24h") {
        const now = new Date();
        endIso = now.toISOString();
        now.setHours(now.getHours() - 24);
        startIso = now.toISOString();
      } else {
        startIso = new Date(`${customStartDate}T00:00:00`).toISOString();
        endIso = new Date(`${customEndDate}T23:59:59`).toISOString();
      }

      const spanMs = new Date(endIso).getTime() - new Date(startIso).getTime();
      let dbInterval = "10 minutes";
      if (spanMs > 30 * 24 * 3600 * 1000) dbInterval = "1 day";
      else if (spanMs > 7 * 24 * 3600 * 1000) dbInterval = "1 hour";
      else dbInterval = "10 minutes";

      const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_medias_estacao', {
        data_inicio: startIso,
        data_fim: endIso,
        intervalo: dbInterval
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        setBaseData([]);
      } else if (rpcData && rpcData.length > 0) {
        const formatted = rpcData.map((d: any) => ({
          rawTime: new Date(d.tempo_agrupado).getTime(),
          temp: d.temp_media,
          humidity: d.umidade_media,
          pressure: d.pressao_media,
          rain: d.chuva_media,
        })).sort((a: any, b: any) => a.rawTime - b.rawTime);
        
        setBaseData(formatted);
        
        let sMs = formatted[0].rawTime;
        let eMs = formatted[formatted.length - 1].rawTime;
        if (sMs === eMs) eMs += 1000;
        setZoomDomain([sMs, eMs]);
      } else {
        setBaseData([]);
        setZoomDomain(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeFilter, customStartDate, customEndDate]);

  const chartData = useMemo(() => {
    if (!baseData.length || !zoomDomain) return [];
    
    const span = zoomDomain[1] - zoomDomain[0];
    let period = "10m";
    if (span >= 3 * 24 * 3600 * 1000) period = "1d";
    else if (span >= 12 * 3600 * 1000) period = "1h";
    else if (span >= 4 * 3600 * 1000) period = "30m";

    const groups: Record<string, any> = {};
    
    baseData.forEach((d: any) => {
      const dTime = new Date(d.rawTime);
      let key = "";
      let labelTime = "";
      
      if (period === "1d") {
        key = `${dTime.getFullYear()}-${dTime.getMonth()}-${dTime.getDate()}`;
        const dd = dTime.getDate().toString().padStart(2, '0');
        const mm = (dTime.getMonth() + 1).toString().padStart(2, '0');
        labelTime = `${dd}/${mm}`;
      } else if (period === "1h") {
        key = `${dTime.getFullYear()}-${dTime.getMonth()}-${dTime.getDate()}-${dTime.getHours()}`;
        const dd = dTime.getDate().toString().padStart(2, '0');
        const mm = (dTime.getMonth() + 1).toString().padStart(2, '0');
        const hh = dTime.getHours().toString().padStart(2, '0');
        labelTime = `${dd}/${mm} - ${hh}:00`;
      } else if (period === "30m") {
        const mins = dTime.getMinutes() < 30 ? '00' : '30';
        key = `${dTime.getFullYear()}-${dTime.getMonth()}-${dTime.getDate()}-${dTime.getHours()}:${mins}`;
        const dd = dTime.getDate().toString().padStart(2, '0');
        const mm = (dTime.getMonth() + 1).toString().padStart(2, '0');
        const hh = dTime.getHours().toString().padStart(2, '0');
        labelTime = `${dd}/${mm} - ${hh}:${mins}`;
      } else {
        const mins = Math.floor(dTime.getMinutes() / 10) * 10;
        key = `${dTime.getFullYear()}-${dTime.getMonth()}-${dTime.getDate()}-${dTime.getHours()}:${mins}`;
        const dd = dTime.getDate().toString().padStart(2, '0');
        const mm = (dTime.getMonth() + 1).toString().padStart(2, '0');
        const hh = dTime.getHours().toString().padStart(2, '0');
        const mmStr = mins.toString().padStart(2, '0');
        labelTime = `${dd}/${mm} - ${hh}:${mmStr}`;
      }

      if (!groups[key]) {
        groups[key] = {
          time: labelTime,
          rawTime: dTime.getTime(),
          tempSum: 0, tempCount: 0,
          humSum: 0, humCount: 0,
          pressSum: 0, pressCount: 0,
          rainSum: 0, rainCount: 0,
        };
      }
      
      if (d.temp != null) { groups[key].tempSum += Number(d.temp); groups[key].tempCount++; }
      if (d.humidity != null) { groups[key].humSum += Number(d.humidity); groups[key].humCount++; }
      if (d.pressure != null) { groups[key].pressSum += Number(d.pressure); groups[key].pressCount++; }
      if (d.rain != null) { groups[key].rainSum += Number(d.rain); groups[key].rainCount++; }
    });

    return Object.values(groups).map((g: any) => ({
      time: g.time,
      rawTime: g.rawTime,
      temp: g.tempCount ? Number((g.tempSum / g.tempCount).toFixed(1)) : null,
      humidity: g.humCount ? Number((g.humSum / g.humCount).toFixed(1)) : null,
      pressure: g.pressCount ? Number((g.pressSum / g.pressCount).toFixed(2)) : null,
      rain: g.rainCount ? Number((g.rainSum / g.rainCount).toFixed(2)) : null,
    })).sort((a: any, b: any) => a.rawTime - b.rawTime);
  }, [baseData, zoomDomain]);

  const brushIndices = useMemo(() => {
    if (chartData.length <= 1 || !zoomDomain) return { startIndex: 0, endIndex: 0 };
    
    let startIndex = 0;
    let endIndex = chartData.length - 1;

    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].rawTime >= zoomDomain[0]) {
        startIndex = i;
        break;
      }
    }
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].rawTime <= zoomDomain[1]) {
        endIndex = i;
        break;
      }
    }
    
    if (startIndex >= endIndex) endIndex = startIndex + 1;
    if (endIndex >= chartData.length) endIndex = chartData.length - 1;
    if (startIndex >= endIndex) startIndex = Math.max(0, endIndex - 1);
    
    return { startIndex, endIndex };
  }, [chartData, zoomDomain]);

  const handleBrushChange = (newRange: any) => {
    if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
      if (chartData[newRange.startIndex] && chartData[newRange.endIndex]) {
        const s = chartData[newRange.startIndex].rawTime;
        const e = chartData[newRange.endIndex].rawTime;
        setZoomDomain([s, e]);
      }
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!zoomDomain || !baseData.length) return;
    e.preventDefault();
    
    const zoomFactor = 0.1;
    const span = zoomDomain[1] - zoomDomain[0];
    let newStart = zoomDomain[0];
    let newEnd = zoomDomain[1];
    
    if (e.deltaY < 0) {
      newStart += span * zoomFactor;
      newEnd -= span * zoomFactor;
    } else {
      newStart -= span * zoomFactor;
      newEnd += span * zoomFactor;
    }
    
    const minTime = baseData[0].rawTime;
    const maxTime = baseData[baseData.length - 1].rawTime;
    
    if (newStart < minTime) newStart = minTime;
    if (newEnd > maxTime) newEnd = maxTime;
    if (newStart >= newEnd) {
      const mid = (newStart + newEnd) / 2;
      newStart = mid - 1000;
      newEnd = mid + 1000;
    }
    
    setZoomDomain([newStart, newEnd]);
  }, [zoomDomain, baseData]);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dados_estacao' },
        (payload) => {
          setCurrentData(payload.new);
          const dateObj = new Date(payload.new.data_hora);
          setLastUpdate(dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Thermometer className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estação Meteorológica</h1>
              <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span>E.M. Pe. Tomaz Ghirardelli</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
            <button onClick={() => setIsDarkMode(prev => !prev)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Última atualização</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {loading && !lastUpdate ? "Carregando..." : (lastUpdate || "Sem dados")}
              </div>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-50 dark:bg-slate-800/50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </header>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 pt-2">Condições Atuais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Temperatura</h3>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {currentData?.temperatura_c ?? '--'}<span className="text-xl font-normal text-slate-500 dark:text-slate-400">°C</span>
                </div>
              </div>
              <div className="bg-orange-500 p-2 rounded-full text-white">
                <Thermometer className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Umidade</h3>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {currentData?.umidade_pct ?? '--'}<span className="text-xl font-normal text-slate-500 dark:text-slate-400">%</span>
                </div>
              </div>
              <div className="bg-emerald-500 p-2 rounded-full text-white">
                <Droplets className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pressão Atmosférica</h3>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {currentData?.pressao_hpa != null ? Number(currentData.pressao_hpa).toFixed(2) : '--'}<span className="text-xl font-normal text-slate-500 dark:text-slate-400"> hPa</span>
                </div>
              </div>
              <div className="bg-emerald-500 p-2 rounded-full text-white">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gás (MQ135)</h3>
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {currentData?.gas_mq135 ?? '--'}
                </div>
              </div>
              <div className="bg-blue-500 p-2 rounded-full text-white">
                <Cloud className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gás Combustível (MQ02)</h3>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {currentData?.gas_mq02 ?? '--'}
              </div>
            </div>
            <div className="bg-red-500 p-3 rounded-full text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chuva Diária</h3>
              <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {currentData?.chuva_diaria_mm ?? '--'}<span className="text-xl font-normal text-slate-500 dark:text-slate-400"> mm</span>
              </div>
            </div>
            <div className="bg-blue-600 p-3 rounded-full text-white">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Nascer do Sol</h3>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">06:24</div>
              </div>
              <Sunrise className="w-8 h-8 text-orange-400" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-900 w-full" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Pôr do Sol</h3>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">18:42</div>
              </div>
              <Sunset className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 pt-6">Histórico</h2>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Filtrar Banco de Dados</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {[
                { id: "24h", label: "Últimas 24h" },
                { id: "custom", label: "Personalizado" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {activeFilter === "custom" && (
              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none"
                />
                <span className="text-slate-400 text-sm">até</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="space-y-4" ref={chartContainerRef}>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-4">Temperatura (°C)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    {chartData.length > 1 && <Brush dataKey="time" height={30} stroke="#ef4444" fill="transparent" startIndex={brushIndices.startIndex} endIndex={brushIndices.endIndex} onChange={handleBrushChange} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-4">Umidade (%)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    {chartData.length > 1 && <Brush dataKey="time" height={30} stroke="#3b82f6" fill="transparent" startIndex={brushIndices.startIndex} endIndex={brushIndices.endIndex} onChange={handleBrushChange} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-4">Pressão Atmosférica (hPa)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="pressure" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    {chartData.length > 1 && <Brush dataKey="time" height={30} stroke="#8b5cf6" fill="transparent" startIndex={brushIndices.startIndex} endIndex={brushIndices.endIndex} onChange={handleBrushChange} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-slate-700 dark:text-slate-200 font-bold mb-4">Chuva Diária (mm)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="rain" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    {chartData.length > 1 && <Brush dataKey="time" height={30} stroke="#10b981" fill="transparent" startIndex={brushIndices.startIndex} endIndex={brushIndices.endIndex} onChange={handleBrushChange} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          !loading && <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            Nenhum dado encontrado ou a função RPC não foi criada no Supabase ainda.
          </div>
        )}
      </div>
    </div>
  );
}
