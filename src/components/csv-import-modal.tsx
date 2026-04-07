"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { importProspectsFromCsv, type CsvRow } from "@/lib/actions/prospects";
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const DB_FIELDS = [
  { value: "email", label: "Email *" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "company_name", label: "Company" },
  { value: "job_title", label: "Job Title" },
  { value: "linkedin_url", label: "LinkedIn URL" },
  { value: "website_url", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "location", label: "Location" },
  { value: "industry", label: "Industry" },
  { value: "company_size", label: "Company Size" },
  { value: "", label: "— Skip —" },
];

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [step, setStep] = useState<"upload" | "map" | "importing" | "done">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ successCount: number; failCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCsv = (text: string): { headers: string[]; rows: CsvRow[] } => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: CsvRow = {};
      headers.forEach((h, j) => {
        row[h] = values[j] || "";
      });
      rows.push(row);
    }

    return { headers, rows };
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { headers, rows } = parseCsv(text);
        setCsvHeaders(headers);
        setCsvRows(rows);

        // Auto-map obvious columns
        const autoMap: Record<string, string> = {};
        headers.forEach((h) => {
          const lower = h.toLowerCase().replace(/[^a-z]/g, "");
          if (lower.includes("email")) autoMap[h] = "email";
          else if (lower.includes("firstname") || lower === "first") autoMap[h] = "first_name";
          else if (lower.includes("lastname") || lower === "last") autoMap[h] = "last_name";
          else if (lower.includes("company")) autoMap[h] = "company_name";
          else if (lower.includes("title") || lower.includes("role") || lower.includes("position")) autoMap[h] = "job_title";
          else if (lower.includes("linkedin")) autoMap[h] = "linkedin_url";
          else if (lower.includes("website") || lower.includes("url") || lower.includes("domain")) autoMap[h] = "website_url";
          else if (lower.includes("phone") || lower.includes("mobile")) autoMap[h] = "phone";
          else if (lower.includes("location") || lower.includes("city") || lower.includes("country")) autoMap[h] = "location";
          else if (lower.includes("industry") || lower.includes("sector")) autoMap[h] = "industry";
          else if (lower.includes("size") || lower.includes("employees")) autoMap[h] = "company_size";
        });
        setMapping(autoMap);
        setStep("map");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileUpload(fakeEvent);
  }, [handleFileUpload]);

  const handleImport = async () => {
    if (!mapping || !Object.values(mapping).includes("email")) {
      setError("You must map at least the Email column");
      return;
    }

    setStep("importing");
    const res = await importProspectsFromCsv(csvRows, mapping);
    if (res.error) {
      setError(res.error);
      setStep("map");
    } else {
      setResult({ successCount: res.successCount || 0, failCount: res.failCount || 0 });
      setStep("done");
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-strong rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--pp-border-subtle)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--pp-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                    Import CSV
                  </h2>
                  <p className="text-xs text-[var(--pp-text-muted)] mt-0.5">
                    {step === "upload" && "Upload your prospect CSV file"}
                    {step === "map" && `${csvRows.length} rows found — map your columns`}
                    {step === "importing" && "Importing prospects..."}
                    {step === "done" && "Import complete!"}
                  </p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--pp-bg-surface2)] text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {/* STEP: Upload */}
                {step === "upload" && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-[var(--pp-border-default)] rounded-xl p-10 text-center hover:border-[var(--pp-accent1)]/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-10 h-10 mx-auto text-[var(--pp-text-muted)] mb-4" />
                    <p className="text-sm text-[var(--pp-text-secondary)] mb-2">
                      Drag &amp; drop your CSV file here
                    </p>
                    <p className="text-xs text-[var(--pp-text-muted)] mb-4">or</p>
                    <label className="inline-block cursor-pointer">
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                      <span className="px-4 py-2 rounded-lg bg-[var(--pp-accent1)]/15 text-[var(--pp-accent1-light)] text-sm font-medium hover:bg-[var(--pp-accent1)]/25 transition-colors">
                        Browse files
                      </span>
                    </label>
                  </div>
                )}

                {/* STEP: Column Mapping */}
                {step === "map" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--pp-text-muted)] mb-4">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{csvRows.length} rows • {csvHeaders.length} columns detected</span>
                    </div>

                    {csvHeaders.map((header) => (
                      <div key={header} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--pp-text-secondary)] w-32 truncate flex-shrink-0" title={header}>
                          {header}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[var(--pp-text-muted)] flex-shrink-0" />
                        <select
                          value={mapping[header] || ""}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                          className="flex-1 bg-[var(--pp-bg-deepest)] border border-[var(--pp-border-default)] rounded-lg px-3 py-1.5 text-sm text-[var(--pp-text-primary)] focus:border-[var(--pp-accent1)] outline-none cursor-pointer"
                        >
                          {DB_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button variant="ghost" onClick={handleClose} className="text-[var(--pp-text-muted)] cursor-pointer">Cancel</Button>
                      <Button onClick={handleImport} className="bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo">
                        Import {csvRows.length} Prospects
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP: Importing */}
                {step === "importing" && (
                  <div className="text-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--pp-accent1)] mx-auto mb-4" />
                    <p className="text-sm text-[var(--pp-text-secondary)]">Importing {csvRows.length} prospects...</p>
                    <p className="text-xs text-[var(--pp-text-muted)] mt-1">This may take a moment</p>
                  </div>
                )}

                {/* STEP: Done */}
                {step === "done" && result && (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-[var(--pp-accent2)]/15 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-7 h-7 text-[var(--pp-accent2)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--pp-text-primary)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      Import Complete!
                    </h3>
                    <p className="text-sm text-[var(--pp-text-secondary)]">
                      <span className="text-[var(--pp-accent2)] font-semibold">{result.successCount}</span> prospects imported
                      {result.failCount > 0 && (
                        <span className="text-[var(--pp-text-muted)]"> • {result.failCount} failed</span>
                      )}
                    </p>
                    <Button onClick={handleClose} className="mt-6 bg-gradient-to-r from-[var(--pp-accent1)] to-[var(--pp-accent1-dark)] text-white font-semibold cursor-pointer btn-hover glow-indigo">
                      Done
                    </Button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
