import React from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Battery, Thermometer, Droplet, Gauge, AlertTriangle, Cpu } from 'lucide-react';
import { analyzeVehicleHealth } from '../services/geminiService';

interface TelemetryPanelProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ vehicle, onClose }) => {
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Clear analysis when vehicle changes
  React.useEffect(() => {
    setAnalysis(null);
  }, [vehicle?.id]);

  if (!vehicle) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 p-8 border-l border-slate-700 bg-slate-900">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a vehicle to view telemetry</p>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeVehicleHealth(vehicle);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const chartData = vehicle.history.map((h, i) => ({
    time: i,
    speed: Math.round(h.speed),
    rpm: Math.round(h.rpm / 100) // scale down for visual comparison
  }));

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 overflow-y-auto w-96 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur z-20">
        <div className="flex justify-between items-start mb-2">
           <div>
             <h2 className="text-xl font-bold text-white">{vehicle.name}</h2>
             <span className="text-sm text-slate-400">Driver: {vehicle.driver}</span>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <div className="flex gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                vehicle.status === VehicleStatus.Alert ? 'bg-red-900/30 text-red-400 border-red-800' : 
                vehicle.status === VehicleStatus.Moving ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
                {vehicle.status.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-600">
                {vehicle.type}
            </span>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        
        {/* Primary Gauges */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Gauge className="w-3 h-3" /> Speed
                </div>
                <div className="text-2xl font-mono font-bold text-white">{Math.round(vehicle.telemetry.speed)} <span className="text-sm text-slate-500">km/h</span></div>
            </div>
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Activity className="w-3 h-3" /> RPM
                </div>
                <div className="text-2xl font-mono font-bold text-white">{Math.round(vehicle.telemetry.rpm)}</div>
            </div>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                    <Droplet className="w-4 h-4 text-blue-400" /> Fuel Level
                </div>
                <div className="font-mono text-white">{Math.round(vehicle.telemetry.fuelLevel)}%</div>
            </div>
             <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                    <Thermometer className="w-4 h-4 text-orange-400" /> Engine Temp
                </div>
                <div className={`font-mono ${vehicle.telemetry.engineTemp > 100 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {Math.round(vehicle.telemetry.engineTemp)}°C
                </div>
            </div>
             <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-300">
                    <Battery className="w-4 h-4 text-green-400" /> Battery
                </div>
                <div className="font-mono text-white">{vehicle.telemetry.batteryVoltage.toFixed(1)}V</div>
            </div>
        </div>

        {/* Chart */}
        <div className="h-40 w-full mt-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Speed History</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 140]} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        {/* AI Diagnostics */}
        <div className="pt-4 border-t border-slate-700">
             <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-indigo-400 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
             >
                {isAnalyzing ? (
                   <>Processing <Cpu className="w-4 h-4 animate-spin" /></>
                ) : (
                   <>Run AI Diagnostics <Cpu className="w-4 h-4" /></>
                )}
             </button>

             {analysis && (
                 <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-sm text-slate-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                     <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                         <AlertTriangle className="w-4 h-4" /> Gemini Analysis
                     </div>
                     <div className="prose prose-invert prose-sm max-w-none">
                        <p className="whitespace-pre-line">{analysis}</p>
                     </div>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default TelemetryPanel;
