import React, { useMemo, useState, useEffect } from 'react';
import { Risk, Incident, User } from '../types';

type ReportTab = 'risks' | 'incidents';

interface ReportsDashboardProps {
  risks: Risk[];
  incidents: Incident[];
  departments: string[]; // include 'All' first
  currentUser: User | null;
}

const riskColumns = [
  { key: 'riskNo', label: 'Risk ID' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'department', label: 'Department' },
  { key: 'identification', label: 'Identification' },
  { key: 'existingControlInPlace', label: 'Existing Control' },
  { key: 'planOfAction', label: 'Plan of Action' },
  { key: 'impact', label: 'Impact' },
  { key: 'likelihood', label: 'Likelihood' },
  { key: 'status', label: 'Status' },
  { key: 'raisedByName', label: 'Raised By' },
  { key: 'updatedAt', label: 'Updated' },
];

const incidentColumns = [
  { key: 'summary', label: 'Incident Summary' },
  { key: 'riskNo', label: 'Risk ID' },
  { key: 'occurredAt', label: 'Incident Reported Date' },
  { key: 'description', label: 'Incident Description' },
  { key: 'mitigationSteps', label: 'Mitigation Steps' },
  { key: 'currentStatusText', label: 'Current Status' },
  { key: 'closedDate', label: 'Closed Date' },
];

// Load jsPDF + autotable from CDN on demand and return jsPDF constructor
async function getJsPDF(): Promise<any> {
  // @ts-ignore
  if (window.jspdf?.jsPDF) {
    // @ts-ignore
    return window.jspdf.jsPDF;
  }
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  });
  // @ts-ignore
  return window.jspdf.jsPDF;
}

async function ensureAutoTable() {
  // @ts-ignore
  if ((window as any).jspdfAutotableLoaded) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      (window as any).jspdfAutotableLoaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error('Failed to load jsPDF Autotable'));
    document.head.appendChild(s);
  });
}

function toCSV(rows: any[], columns: { key: string; label: string }[]) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(r => columns.map(c => {
    const val = r[c.key] ?? '';
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(','));
  return [header, ...lines].join('\r\n');
}

function downloadBlob(content: string, filename: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

function printHTMLTable(html: string, title = 'Report') {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #f4f4f4; text-align: left; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${html}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ risks, incidents, departments, currentUser }) => {
  const [active, setActive] = useState<ReportTab>('risks');
  const [dept, setDept] = useState<string>(departments[0] || 'All');
  const [riskId, setRiskId] = useState<string>('All');
  const [selectedRiskCols, setSelectedRiskCols] = useState<Record<string, boolean>>({});
  const [selectedIncidentCols, setSelectedIncidentCols] = useState<Record<string, boolean>>({});
  const [selectedRiskRows, setSelectedRiskRows] = useState<Record<string, boolean>>({});
  const [selectedIncidentRows, setSelectedIncidentRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initCols = Object.fromEntries(riskColumns.map(c => [c.key, true]));
    setSelectedRiskCols(initCols);
    const initColsI = Object.fromEntries(incidentColumns.map(c => [c.key, true]));
    setSelectedIncidentCols(initColsI);
  }, []);

  const filteredRisks = useMemo(() => {
    const base = dept === 'All' ? risks : risks.filter(r => (r.department || '').toLowerCase() === dept.toLowerCase());
    // Make sure row selection covers visible rows
    const map: Record<string, boolean> = {};
    base.forEach(r => { map[r.id] = selectedRiskRows[r.id] ?? true; });
    setSelectedRiskRows(map);
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, risks]);

  const departmentRiskNos = useMemo(() => {
    const set = new Set<string>();
    filteredRisks.forEach(r => { if (r.riskNo) set.add(r.riskNo); });
    return ['All', ...Array.from(set)];
  }, [filteredRisks]);

  const filteredIncidents = useMemo(() => {
    const byDept = dept === 'All'
      ? incidents
      : incidents.filter(i => {
          const r = risks.find(x => x.id === i.riskId);
          return (r?.department || '').toLowerCase() === dept.toLowerCase();
        });
    const withRiskNo = byDept.map(i => ({
      ...i,
      riskNo: risks.find(r => r.id === i.riskId)?.riskNo || '',
    }));
    const final = riskId === 'All' ? withRiskNo : withRiskNo.filter(i => (i as any).riskNo === riskId);
    const map: Record<string, boolean> = {};
    final.forEach(i => { map[i.id] = selectedIncidentRows[i.id] ?? true; });
    setSelectedIncidentRows(map);
    return final;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, riskId, incidents, risks]);

  const selectedRiskColsList = useMemo(
    () => riskColumns.filter(c => selectedRiskCols[c.key]),
    [selectedRiskCols]
  );
  const selectedIncidentColsList = useMemo(
    () => incidentColumns.filter(c => selectedIncidentCols[c.key]),
    [selectedIncidentCols]
  );

  const onExportRisksCSV = () => {
    const rows = filteredRisks
      .filter(r => selectedRiskRows[r.id])
      .map(r => ({
        riskNo: r.riskNo,
        category: r.category || '',
        description: r.description,
        department: r.department || '',
        identification: (r as any).identification || '',
        existingControlInPlace: (r as any).existingControlInPlace || '',
        planOfAction: (r as any).planOfAction || '',
        impact: r.impact,
        likelihood: r.likelihood,
        status: r.status,
        raisedByName: r.raisedByName || '',
        updatedAt: r.updatedAt,
      }));
    const csv = toCSV(rows, selectedRiskColsList);
    downloadBlob(csv, 'risks_report.csv');
  };

  const onExportIncidentsCSV = () => {
    const rows = filteredIncidents
      .filter(i => selectedIncidentRows[i.id])
      .map(i => ({
        summary: i.summary || '',
        riskNo: (i as any).riskNo || '',
        occurredAt: i.occurredAt || '',
        description: i.description,
        mitigationSteps: i.mitigationSteps || '',
        currentStatusText: i.currentStatusText || '',
        closedDate: i.closedDate || '',
      }));
    const csv = toCSV(rows, selectedIncidentColsList);
    downloadBlob(csv, 'incidents_report.csv');
  };

  const onExportRisksPDF = async () => {
    const jsPDF = await getJsPDF();
    await ensureAutoTable();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const head = [selectedRiskColsList.map(c => c.label)];
    const rows = filteredRisks
      .filter(r => selectedRiskRows[r.id])
      .map(r => {
        const row: Record<string, any> = {
          riskNo: r.riskNo,
          category: r.category || '',
          description: r.description,
          department: r.department || '',
          identification: (r as any).identification || '',
          existingControlInPlace: (r as any).existingControlInPlace || '',
          planOfAction: (r as any).planOfAction || '',
          impact: r.impact,
          likelihood: r.likelihood,
          status: r.status,
          raisedByName: r.raisedByName || '',
          updatedAt: new Date(r.updatedAt).toLocaleDateString(),
        };
        return selectedRiskColsList.map(c => String(row[c.key] ?? ''));
      });
    (doc as any).autoTable({
      head,
      body: rows,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [244, 244, 244], textColor: 20 },
      margin: { left: 24, right: 24 },
      didDrawPage: (data: any) => {
        doc.setFontSize(14);
        doc.text('Risks Report', 24, 24);
      }
    });
    doc.save('risks_report.pdf');
  };

  const onExportIncidentsPDF = async () => {
    const jsPDF = await getJsPDF();
    await ensureAutoTable();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const head = [selectedIncidentColsList.map(c => c.label)];
    const body = filteredIncidents
      .filter(i => selectedIncidentRows[i.id])
      .map(i => {
        const row: Record<string, any> = {
          summary: i.summary || '',
          riskNo: (i as any).riskNo || '',
          occurredAt: i.occurredAt ? new Date(i.occurredAt).toLocaleDateString() : '',
          description: i.description,
          mitigationSteps: i.mitigationSteps || '',
          currentStatusText: i.currentStatusText || '',
          closedDate: i.closedDate ? new Date(i.closedDate).toLocaleDateString() : '',
        };
        return selectedIncidentColsList.map(c => String(row[c.key] ?? ''));
      });
    (doc as any).autoTable({
      head,
      body,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [244, 244, 244], textColor: 20 },
      margin: { left: 24, right: 24 },
      didDrawPage: (data: any) => {
        doc.setFontSize(14);
        doc.text('Incidents Report', 24, 24);
      }
    });
    doc.save('incidents_report.pdf');
  };

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-base-content dark:text-dark-content">Reports</h1>
      <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">Download Risks and Incidents as Excel (CSV) or PDF with custom selections.</p>

      <div className="mt-4 inline-flex items-center gap-2">
        <button onClick={() => setActive('risks')} className={`px-3 py-1.5 text-sm rounded-md border ${active==='risks'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Risks Report</button>
        <button onClick={() => setActive('incidents')} className={`px-3 py-1.5 text-sm rounded-md border ${active==='incidents'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Incidents Report</button>
      </div>

      {active === 'risks' ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Columns</label>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {riskColumns.map(c => (
                  <label key={c.key} className="inline-flex items-center gap-1 text-sm text-base-content dark:text-dark-content">
                    <input type="checkbox" checked={!!selectedRiskCols[c.key]} onChange={(e) => setSelectedRiskCols(s => ({ ...s, [c.key]: e.target.checked }))} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={onExportRisksCSV} className="rounded-md bg-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary shadow-sm hover:bg-brand-primary/30">Export CSV</button>
              <button onClick={onExportRisksPDF} className="rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90">Export PDF</button>
            </div>
          </div>
          <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed divide-y divide-base-300 dark:divide-dark-300">
              <thead className="bg-brand-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Select</th>
                  {riskColumns.map(c => selectedRiskCols[c.key] && (
                    <th key={c.key} className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                {filteredRisks.map(r => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-sm">
                      <input type="checkbox" checked={!!selectedRiskRows[r.id]} onChange={(e) => setSelectedRiskRows(s => ({ ...s, [r.id]: e.target.checked }))} />
                    </td>
                    {riskColumns.map(c => selectedRiskCols[c.key] && (
                      <td key={c.key} className="px-3 py-2 text-sm text-base-content dark:text-dark-content">
                        {c.key === 'updatedAt' ? new Date(r.updatedAt).toLocaleDateString() :
                         // @ts-ignore
                         (r[c.key] ?? (r as any)[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredRisks.length === 0 && (
                  <tr><td className="px-3 py-6 text-center text-sm text-base-content-muted dark:text-dark-content-muted" colSpan={riskColumns.length + 1}>No risks found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Department</label>
              <select value={dept} onChange={(e) => { setDept(e.target.value); setRiskId('All'); }} className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Risk ID</label>
              <select value={riskId} onChange={(e) => setRiskId(e.target.value)} className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content">
                {departmentRiskNos.map(no => <option key={no} value={no}>{no}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Columns</label>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {incidentColumns.map(c => (
                  <label key={c.key} className="inline-flex items-center gap-1 text-sm text-base-content dark:text-dark-content">
                    <input type="checkbox" checked={!!selectedIncidentCols[c.key]} onChange={(e) => setSelectedIncidentCols(s => ({ ...s, [c.key]: e.target.checked }))} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={onExportIncidentsCSV} className="rounded-md bg-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary shadow-sm hover:bg-brand-primary/30">Export CSV</button>
              <button onClick={onExportIncidentsPDF} className="rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90">Export PDF</button>
            </div>
          </div>
          <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed divide-y divide-base-300 dark:divide-dark-300">
              <thead className="bg-brand-secondary">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Select</th>
                  {incidentColumns.map(c => selectedIncidentCols[c.key] && (
                    <th key={c.key} className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                {filteredIncidents.map(i => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 text-sm">
                      <input type="checkbox" checked={!!selectedIncidentRows[i.id]} onChange={(e) => setSelectedIncidentRows(s => ({ ...s, [i.id]: e.target.checked }))} />
                    </td>
                    {incidentColumns.map(c => selectedIncidentCols[c.key] && (
                      <td key={c.key} className="px-3 py-2 text-sm text-base-content dark:text-dark-content">
                        {c.key === 'riskNo' ? (risks.find(r => r.id === i.riskId)?.riskNo || (i as any).riskNo || '')
                          : c.key === 'occurredAt' || c.key === 'closedDate'
                          ? (i as any)[c.key] ? new Date((i as any)[c.key]).toLocaleDateString() : ''
                          : // @ts-ignore
                            ((i as any)[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredIncidents.length === 0 && (
                  <tr><td className="px-3 py-6 text-center text-sm text-base-content-muted dark:text-dark-content-muted" colSpan={incidentColumns.length + 1}>No incidents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;

