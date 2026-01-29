import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapVisualization from './components/MapVisualization';
import TelemetryPanel from './components/TelemetryPanel';
import { initialFleet, updateVehicles } from './services/mockDataService';
import { Vehicle } from './types';
import { getFleetInsights } from './services/geminiService';
import { X, Sparkles, AlertOctagon } from 'lucide-react';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialFleet);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [fleetReport, setFleetReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);

  // Simulation loop
  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyError(true);
    }

    const interval = setInterval(() => {
      setVehicles(prev => updateVehicles(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  const handleGenerateReport = useCallback(async () => {
    setLoadingReport(true);
    const report = await getFleetInsights(vehicles);
    setFleetReport(report);
    setLoadingReport(false);
  }, [vehicles]);

  // Generate report when modal opens
  useEffect(() => {
    if (showInsights && !fleetReport) {
        handleGenerateReport();
    }
  }, [showInsights, fleetReport, handleGenerateReport]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        vehicles={vehicles} 
        selectedId={selectedVehicleId} 
        onSelect={setSelectedVehicleId} 
        onShowInsights={() => setShowInsights(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex relative p-4 gap-4">
        
        {/* Map Area */}
        <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-10">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">Live Operations Map</h2>
                <div className="text-sm text-slate-400 drop-shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    System Online • Latency 24ms
                </div>
            </div>
            
            {apiKeyError && (
              <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-red-400">
                <AlertOctagon className="w-5 h-5" />
                <span>Error: API_KEY missing in environment variables. Gemini features disabled.</span>
              </div>
            )}

            <MapVisualization 
                vehicles={vehicles} 
                selectedVehicleId={selectedVehicleId} 
                onSelectVehicle={setSelectedVehicleId}
            />
        </div>

        {/* Details Panel (Right side) - Conditionally rendered or sliding */}
        <div className={`transition-all duration-300 ease-in-out ${selectedVehicle ? 'w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 pointer-events-none'}`}>
             <TelemetryPanel 
                vehicle={selectedVehicle} 
                onClose={() => setSelectedVehicleId(null)}
             />
        </div>

      </main>

      {/* Fleet Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">AI Fleet Intelligence</h2>
                    </div>
                    <button onClick={() => setShowInsights(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto">
                    {loadingReport ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-purple-300 animate-pulse">Analyzing fleet telemetry vectors...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-lg max-w-none">
                            <p className="whitespace-pre-line text-slate-300 leading-relaxed">
                                {fleetReport}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl flex justify-end">
                    <button 
                        onClick={handleGenerateReport}
                        disabled={loadingReport}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors text-sm font-medium"
                    >
                        Refresh Analysis
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;
