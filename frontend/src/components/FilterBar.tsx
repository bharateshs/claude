import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Filter, RefreshCw, Download } from 'lucide-react';
import { useDashboardStore, ALL_PLATFORMS } from '../store/dashboard';
import type { Platform } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { PLATFORM_CONFIG, DATE_PRESETS } from '../lib/constants';
import PlatformIcon from './PlatformIcon';

interface FilterBarProps {
  clients?: Array<{ id: string; name: string }>;
  onExport: (format: 'xlsx' | 'pdf' | 'ppt') => void;
  onRefresh: () => void;
  isExporting?: boolean;
}

export default function FilterBar({ clients, onExport, onRefresh, isExporting }: FilterBarProps) {
  const { user } = useAuthStore();
  const {
    selectedClient, setSelectedClient,
    selectedPlatforms, togglePlatform, setAllPlatforms,
    startDate, endDate, setDateRange,
  } = useDashboardStore();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handlePreset = (days: number) => {
    setDateRange(format(subDays(new Date(), days - 1), 'yyyy-MM-dd'), format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        {user?.role === 'admin' && clients?.length && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Client:</span>
            <select className="select text-sm" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Period:</span>
          <input type="date" className="select text-sm" value={startDate} max={endDate} onChange={(e) => setDateRange(e.target.value, endDate)} />
          <span className="text-gray-600 text-sm">→</span>
          <input type="date" className="select text-sm" value={endDate} min={startDate} max={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setDateRange(startDate, e.target.value)} />
        </div>

        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((preset) => (
            <button key={preset.days} onClick={() => handlePreset(preset.days)} className="text-xs px-2.5 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors whitespace-nowrap">
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Filter size={12} /> Platforms:
          </span>
          <button
            onClick={setAllPlatforms}
            className={`text-xs px-2 py-1 rounded transition-colors ${selectedPlatforms.length === ALL_PLATFORMS.length ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            All
          </button>
          {ALL_PLATFORMS.map((p: Platform) => {
            const isSelected = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                title={PLATFORM_CONFIG[p].label}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all ${isSelected ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-gray-800 text-gray-500 opacity-60 hover:opacity-100'}`}
              >
                <PlatformIcon platform={p} size={14} />
                <span className="hidden xl:inline">{PLATFORM_CONFIG[p].label}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={onRefresh} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting} className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <Download size={14} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {(['xlsx', 'pdf', 'ppt'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => { onExport(fmt); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2">
                    <span>{fmt === 'xlsx' ? '📊' : fmt === 'pdf' ? '📄' : '📑'}</span>
                    Export as {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
