import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";

export interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
  parse?: (value: string) => any;
  format?: (value: any) => string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

interface DataImportExportProps {
  entityName: string; // "Category" or "Brand"
  entityNamePlural: string;
  columns: ColumnDef[];
  data: any[];
  exampleRow: Record<string, string>;
  onImport: (items: any[]) => Promise<void>;
  renderPreviewItem: (item: any, idx: number) => React.ReactNode;
}

// CSV parser
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      if (char === "\r") i++;
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
  }

  return rows;
}

export function DataImportExport({
  entityName,
  entityNamePlural,
  columns,
  data,
  exampleRow,
  onImport,
  renderPreviewItem,
}: DataImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const exportToCSV = () => {
    const headers = columns.map((c) => c.key);
    const csvRows = [
      headers.join(","),
      ...data.map((item) =>
        columns
          .map((col) => {
            const val = col.format ? col.format(item[col.key]) : item[col.key];
            const str = val == null ? "" : String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityNamePlural.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} ${entityNamePlural.toLowerCase()} to CSV`);
  };

  const downloadTemplate = () => {
    const headers = columns.map((c) => c.key);
    const example = columns.map((col) => {
      const val = exampleRow[col.key] || "";
      return val.includes(",") || val.includes('"') ? `"${val}"` : val;
    });

    const blob = new Blob([[headers.join(","), example.join(",")].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityName.toLowerCase()}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const dataRows = rows.slice(1);
      const parsed: any[] = [];
      const errors: { row: number; message: string }[] = [];

      dataRows.forEach((row, index) => {
        try {
          const getValue = (key: string) => {
            const idx = headers.indexOf(key);
            return idx >= 0 && idx < row.length ? row[idx] : "";
          };

          // Check required fields
          const missingFields = columns
            .filter((c) => c.required && !getValue(c.key).trim())
            .map((c) => c.label);

          if (missingFields.length > 0) {
            errors.push({
              row: index + 2,
              message: `Missing required: ${missingFields.join(", ")}`,
            });
            return;
          }

          const item: Record<string, any> = {};
          columns.forEach((col) => {
            const raw = getValue(col.key);
            item[col.key] = col.parse ? col.parse(raw) : raw;
          });

          parsed.push(item);
        } catch (err) {
          errors.push({ row: index + 2, message: "Failed to parse row" });
        }
      });

      setPreviewData(parsed);
      setImportResult({ success: parsed.length, failed: errors.length, errors });
      setImportDialogOpen(true);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    setImporting(true);
    setImportProgress(0);

    try {
      for (let i = 0; i <= 80; i += 20) {
        await new Promise((r) => setTimeout(r, 100));
        setImportProgress(i);
      }

      await onImport(previewData);
      setImportProgress(100);

      toast.success(`Successfully imported ${previewData.length} ${entityNamePlural.toLowerCase()}`);
      setImportDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import/Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export All ({data.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-accent" />
              Import {entityNamePlural}
            </DialogTitle>
            <DialogDescription>
              Review the import summary before confirming
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">Valid {entityNamePlural.toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed rows</p>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Errors found:
                  </p>
                  <ScrollArea className="h-32 rounded-lg border border-border bg-muted/50 p-3">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground mb-1">
                        <Badge variant="outline" className="mr-2">Row {error.row}</Badge>
                        {error.message}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5):</p>
                  <ScrollArea className="h-40 rounded-lg border border-border">
                    <div className="space-y-2 p-3">
                      {previewData.slice(0, 5).map((item, idx) => renderPreviewItem(item, idx))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    Importing... {importProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={confirmImport} disabled={importing || previewData.length === 0} className="gap-2">
              {importing ? "Importing..." : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {previewData.length} {entityNamePlural}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
