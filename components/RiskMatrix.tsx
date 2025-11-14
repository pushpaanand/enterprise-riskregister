import React, { useMemo } from 'react';
import { Risk, RiskImpact, RiskLikelihood } from '../types';

const IMPACTS: RiskImpact[] = ['Severe','Significant','Moderate','Minor','Negligible'];
const LIKELIHOODS: RiskLikelihood[] = ['Very likely','Likely','Possible','Unlikely','Very Unlikely'];

interface RiskMatrixProps {
  risks: Risk[];
  onCellClick?: (impact: RiskImpact, likelihood: RiskLikelihood) => void;
}

const cellBg = (impact: RiskImpact, likelihood: RiskLikelihood) => {
  // Simple heatmap: higher impact/likelihood -> warmer
  const i = IMPACTS.indexOf(impact);
  const j = LIKELIHOODS.indexOf(likelihood);
  const score = (4 - i) + (4 - j); // 0..8
  if (score >= 7) return 'bg-red-500/50 text-red-900 dark:text-red-300';
  if (score >= 5) return 'bg-orange-500/50 text-orange-900 dark:text-orange-300';
  if (score >= 3) return 'bg-yellow-400/60 text-yellow-900 dark:text-yellow-300';
  return 'bg-green-500/45 text-green-900 dark:text-green-300';
};

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, onCellClick }) => {
  const matrix = useMemo(() => {
    const counts: Record<RiskImpact, Record<RiskLikelihood, number>> = {
      'Severe': { 'Very likely': 0, 'Likely': 0, 'Possible': 0, 'Unlikely': 0, 'Very Unlikely': 0 },
      'Significant': { 'Very likely': 0, 'Likely': 0, 'Possible': 0, 'Unlikely': 0, 'Very Unlikely': 0 },
      'Moderate': { 'Very likely': 0, 'Likely': 0, 'Possible': 0, 'Unlikely': 0, 'Very Unlikely': 0 },
      'Minor': { 'Very likely': 0, 'Likely': 0, 'Possible': 0, 'Unlikely': 0, 'Very Unlikely': 0 },
      'Negligible': { 'Very likely': 0, 'Likely': 0, 'Possible': 0, 'Unlikely': 0, 'Very Unlikely': 0 },
    };
    for (const r of risks) {
      const impact: RiskImpact = (IMPACTS as string[]).includes((r as any).impact) ? (r as any).impact : 'Moderate';
      const likelihood: RiskLikelihood = (LIKELIHOODS as string[]).includes((r as any).likelihood) ? (r as any).likelihood : 'Possible';
      counts[impact][likelihood] += 1;
    }
    return counts;
  }, [risks]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-base-300 dark:border-dark-300">
        <thead className="bg-brand-secondary">
          <tr>
            <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Impact</th>
            {LIKELIHOODS.map(l => (
              <th key={l} className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {IMPACTS.map(imp => (
            <tr key={imp}>
              <td className="px-3 py-2 text-sm font-medium text-base-content dark:text-dark-content">{imp}</td>
              {LIKELIHOODS.map(l => (
                <td key={l} className={`px-1 py-1 text-sm text-center rounded ${cellBg(imp, l)}`}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                    onClick={() => onCellClick && matrix[imp][l] > 0 && onCellClick(imp, l)}
                    disabled={matrix[imp][l] === 0}
                    aria-label={`${imp} × ${l} has ${matrix[imp][l]} risks`}
                  >
                    {matrix[imp][l]}
                  </button>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content">Total</td>
            {LIKELIHOODS.map(l => (
              <td key={l} className="px-3 py-2 text-sm text-center text-base-content dark:text-dark-content">
                {risks.filter(r => r.likelihood === l).length}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RiskMatrix;

