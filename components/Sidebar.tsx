import React from 'react';
import { Vehicle, VehicleStatus } from '../types';
import { Truck, Car, Box, Search, BarChart3 } from 'lucide-react';

interface SidebarProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowInsights: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ vehicles, selectedId, onSelect, onShowInsights }) => {
  const [filter, setFilter] = React.useState('');

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(filter.toLowerCase()) || 
    v.driver.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === VehicleStatus.Moving).length,
    alert: vehicles.filter(v => v.status === VehicleStatus.Alert).length,
  };

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-700">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Truck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">FleetCommand</h1>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-4 px-1">
           <div>
             <span className="block text-white font-bold text-lg">{stats.total}</span>
             <span>Total</span>
           </div>
           <div>
             <span className="block text-emerald-400 font-bold text-lg">{stats.active}</span>
             <span>Active</span>
           </div>
           <div>
             <span className="block text-red-400 font-bold text-lg">{stats.alert}</span>
             <span>Alerts</span>
           </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="p-4 border-b border-slate-800">
          <button 
            onClick={onShowInsights}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
          >
             <BarChart3 className="w-4 h-4" /> Fleet Insights
          </button>
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Search fleet..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredVehicles.map(vehicle => (
            <button
                key={vehicle.id}
                onClick={() => onSelect(vehicle.id)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                    selectedId === vehicle.id 
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 border border-indigo-500' 
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                        vehicle.status === VehicleStatus.Moving ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                        vehicle.status === VehicleStatus.Alert ? 'bg-red-500 animate-pulse' :
                        'bg-slate-500'
                    }`} />
                    <div>
                        <div className={`font-medium text-sm ${selectedId === vehicle.id ? 'text-white' : 'text-slate-200'}`}>{vehicle.name}</div>
                        <div className={`text-xs ${selectedId === vehicle.id ? 'text-indigo-200' : 'text-slate-500'}`}>{vehicle.driver}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`font-mono text-sm ${selectedId === vehicle.id ? 'text-white' : 'text-slate-300'}`}>
                        {Math.round(vehicle.telemetry.speed)} <span className="text-[10px]">km/h</span>
                    </div>
                </div>
            </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
