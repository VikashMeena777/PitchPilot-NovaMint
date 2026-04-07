"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  STARTER_TEMPLATES,
  type EmailTemplate,
} from "@/lib/actions/templates";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Copy,
  FileText,
  Sparkles,
  Search,
  LayoutGrid,
  FolderOpen,
  X,
  Save,
  BarChart2,
} from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Templates" },
  { value: "outreach", label: "Outreach" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "meeting", label: "Meeting" },
  { value: "general", label: "General" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Create form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body: "",
    category: "general",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabaseReady(!!client);
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }
    const result = await getTemplates(category !== "all" ? category : undefined);
    setTemplates((result.data || []) as EmailTemplate[]);
    setLoading(false);
  }, [category, supabaseReady]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    const result = await createTemplate(newTemplate);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template created!");
      setNewTemplate({ name: "", subject: "", body: "", category: "general" });
      setShowCreate(false);
      loadTemplates();
    }
    setCreating(false);
  };

  const handleSeedStarters = async () => {
    let count = 0;
    for (const template of STARTER_TEMPLATES) {
      const result = await createTemplate(template);
      if (!result.error) count++;
    }
    toast.success(`Added ${count} starter templates!`);
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTemplate(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template deleted");
      loadTemplates();
    }
  };

  const handleCopy = (template: EmailTemplate) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const filtered = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.body.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-violet-400" />
            Email Templates
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Save and reuse your best-performing email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {templates.length === 0 && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedStarters}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Add Starters
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === cat.value
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-zinc-900/80 border-violet-500/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Create Template
                  </h3>
                  <button onClick={() => setShowCreate(false)}>
                    <X className="h-4 w-4 text-zinc-500 hover:text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Template name..."
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <Select
                    value={newTemplate.category}
                    onValueChange={(v: string | null) =>
                      setNewTemplate({ ...newTemplate, category: v || "general" })
                    }
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="follow_up">Follow-Up</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Subject line..."
                  value={newTemplate.subject}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, subject: e.target.value })
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
                <Textarea
                  placeholder="Email body... Use {{first_name}}, {{company_name}}, etc. for variables"
                  value={newTemplate.body}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, body: e.target.value })
                  }
                  rows={6}
                  className="bg-zinc-800 border-zinc-700 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {creating ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800 animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="h-16 bg-zinc-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No templates yet
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Create your first template or add our starter collection
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSeedStarters}>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Add 5 Starter Templates
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create Custom
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {template.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-zinc-800 text-zinc-400"
                        >
                          {template.category}
                        </Badge>
                        {template.is_ai_generated && (
                          <Badge className="text-xs bg-violet-500/20 text-violet-300">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            AI
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-600 flex items-center gap-0.5">
                          <BarChart2 className="h-3 w-3" />
                          Used {template.use_count}×
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(template)}
                        className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs text-zinc-500">Subject:</p>
                    <p className="text-sm text-zinc-300 font-medium">
                      {template.subject}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 mt-3 line-clamp-3 leading-relaxed">
                    {template.body}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      {templates.length > 0 && (
        <div className="flex items-center justify-center gap-6 text-xs text-zinc-600 pt-4 border-t border-zinc-800/50">
          <span className="flex items-center gap-1">
            <LayoutGrid className="h-3.5 w-3.5" />
            {templates.length} templates
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3.5 w-3.5" />
            {templates.reduce((sum, t) => sum + (t.use_count || 0), 0)} total uses
          </span>
        </div>
      )}
    </div>
  );
}
