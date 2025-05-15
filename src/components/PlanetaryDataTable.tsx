// src/components/PlanetaryDataTable.tsx
import React from 'react';

interface PlanetData {
  planet?: { en: string };
  zodiac_sign?: { name?: { en: string } };
  normDegree?: number;
  isRetro?: boolean | string;
}

interface PlanetaryDataTableProps {
  personName: string;
  planetaryData: { output: PlanetData[] } | null;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
}

const PlanetaryDataTable: React.FC<PlanetaryDataTableProps> = ({
  personName,
  planetaryData,
  isExpanded,
  onToggle,
  accentColor,
}) => {
  if (!planetaryData || !planetaryData.output) {
    return (
      <div className={`rounded-lg border border-slate-700 bg-slate-800/50 shadow-md max-h-[52px] overflow-hidden`}>
        <h3 
          className={`text-md lg:text-lg font-semibold ${accentColor} p-3 cursor-pointer hover:bg-slate-700/70 rounded-t-lg transition-colors duration-150 flex justify-between items-center`}
          onClick={onToggle}
        >
          {personName}
          <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
        </h3>
        {isExpanded && <p className="p-3 text-slate-400 text-sm">Dados não disponíveis.</p>}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-700 bg-slate-800/50 shadow-md transition-all duration-300 ease-in-out ${isExpanded ? 'flex-1 min-h-[150px]' : 'max-h-[52px] overflow-hidden'}`}>
      <h3 
        className={`text-md lg:text-lg font-semibold ${accentColor} p-3 cursor-pointer hover:bg-slate-700/70 rounded-t-lg transition-colors duration-150 flex justify-between items-center`}
        onClick={onToggle}
      >
        {personName}
        <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
      </h3>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] p-2' : 'max-h-0 p-0'}`}>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
          <table className="min-w-full text-[0.7rem] md:text-xs">
            <thead className="sticky top-0 bg-slate-700/80 backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2 text-slate-200 font-semibold text-left">Planeta</th>
                <th className="px-2 py-2 text-slate-200 font-semibold text-left">Signo</th>
                <th className="px-2 py-2 text-slate-200 font-semibold text-left">Grau</th>
                <th className="px-2 py-2 text-slate-200 font-semibold text-left">Retro?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {planetaryData.output.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-700/60 transition-colors duration-100">
                  <td className="px-2 py-1.5 text-slate-300 font-medium whitespace-nowrap">{item.planet?.en || 'N/A'}</td>
                  <td className="px-2 py-1.5 text-slate-300 whitespace-nowrap">{item.zodiac_sign?.name?.en || 'N/A'}</td>
                  <td className="px-2 py-1.5 text-slate-300 whitespace-nowrap">{item.normDegree?.toFixed(2) || 'N/A'}</td>
                  <td className="px-2 py-1.5 text-slate-300 whitespace-nowrap">{String(item.isRetro).toLowerCase() === "true" ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryDataTable;
