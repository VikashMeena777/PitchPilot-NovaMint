"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  bulkUpdateProspectStatus,
  bulkAddTag,
  bulkDeleteProspects,
  exportProspectsToCsv,
} from "@/lib/actions/bulk-actions";
import {
  Trash2,
  Tag,
  Download,
  CheckSquare,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type BulkActionsToolbarProps = {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
};

export function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const count = selectedIds.length;
  if (count === 0) return null;

  const handleStatusUpdate = async (status: string | null) => {
    if (!status) return;
    setLoading(true);
    const result = await bulkUpdateProspectStatus(selectedIds, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Updated ${result.count} prospects to "${status}"`);
      onClearSelection();
      onRefresh();
    }
    setLoading(false);
  };

  const handleAddTag = async () => {
    if (!tagValue.trim()) return;
    setLoading(true);
    const result = await bulkAddTag(selectedIds, tagValue.trim());
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Tagged ${result.count} prospects with "${tagValue}"`);
      setTagValue("");
      setShowTagInput(false);
      onRefresh();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await bulkDeleteProspects(selectedIds);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Deleted ${result.count} prospects`);
      setShowDeleteConfirm(false);
      onClearSelection();
      onRefresh();
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setLoading(true);
    const result = await exportProspectsToCsv(selectedIds);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      // Download CSV
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pitchpilot-prospects-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} prospects to CSV`);
    }
    setLoading(false);
  };

  return (
    <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-xl border border-violet-500/30 rounded-xl p-3 shadow-lg shadow-violet-500/5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        {/* Count indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
          <CheckSquare className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white">
            {count} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status update */}
        <Select onValueChange={handleStatusUpdate} disabled={loading}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-zinc-900 border-zinc-800">
            <SelectValue placeholder="Set status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unresponsive">Unresponsive</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
          </SelectContent>
        </Select>

        {/* Tag */}
        {showTagInput ? (
          <div className="flex items-center gap-1">
            <Input
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") {
                  setShowTagInput(false);
                  setTagValue("");
                }
              }}
              placeholder="Tag name..."
              className="h-8 w-28 text-xs bg-zinc-900 border-zinc-800"
              autoFocus
              disabled={loading}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => {
                setShowTagInput(false);
                setTagValue("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setShowTagInput(true)}
            disabled={loading}
          >
            <Tag className="h-3.5 w-3.5 mr-1" />
            Tag
          </Button>
        )}

        {/* Export */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={handleExport}
          disabled={loading}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>

        {/* Delete */}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Delete {count}?
            </span>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
