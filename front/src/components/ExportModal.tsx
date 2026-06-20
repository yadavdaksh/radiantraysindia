import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { IconDownload, IconX, IconTableExport } from "@tabler/icons-react";

export interface ExportColumn {
  key: string;
  label: string;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ExportColumn[];
  data: any[];
}

function exportToExcel(
  filename: string,
  columns: ExportColumn[],
  selectedKeys: string[],
  data: any[]
) {
  const headers = columns.filter(c => selectedKeys.includes(c.key)).map(c => c.label);
  const rows = data.map(row =>
    columns.filter(c => selectedKeys.includes(c.key)).map(c => {
      const val = c.key.split(".").reduce((obj: any, k: string) => obj?.[k], row);
      return val ?? "";
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function ExportModal({ open, onClose, title, columns, data }: ExportModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(columns.map(c => c.key));

  // Reset selection when columns change or modal opens
  useEffect(() => {
    if (open) setSelectedKeys(columns.map(c => c.key));
  }, [open, columns]);

  if (!open) return null;

  const allSelected = selectedKeys.length === columns.length;
  const noneSelected = selectedKeys.length === 0;

  const toggle = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    if (noneSelected) return;
    const filename = title.toLowerCase().replace(/\s+/g, "_");
    exportToExcel(filename, columns, selectedKeys, data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#035F96" }}>
              <IconTableExport size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{title}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{data.length} rows · select columns to export</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <IconX size={18} />
          </button>
        </div>

        {/* Column checklist */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Columns ({selectedKeys.length} / {columns.length} selected)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedKeys(columns.map(c => c.key))}
                disabled={allSelected}
                className="text-[10px] font-bold text-sky-600 hover:text-sky-800 disabled:text-slate-300 transition"
              >
                Select All
              </button>
              <span className="text-slate-200">|</span>
              <button
                onClick={() => setSelectedKeys([])}
                disabled={noneSelected}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 disabled:text-slate-300 transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {columns.map(col => {
              const checked = selectedKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition select-none ${
                    checked
                      ? "border-sky-200 bg-sky-50/70 text-sky-800"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(col.key)}
                    className="sr-only"
                  />
                  <span
                    className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                      checked ? "border-sky-600 bg-sky-600" : "border-slate-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs font-semibold truncate">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100 mt-3">
          <p className="text-[10px] text-slate-400">
            Exports as <span className="font-bold text-slate-600">.xlsx</span> (Excel)
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={noneSelected}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: noneSelected ? undefined : "#035F96" }}
            >
              <IconDownload size={13} />
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
