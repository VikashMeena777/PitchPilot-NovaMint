"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  updateProspectNotes,
  updateProspectTags,
} from "@/lib/actions/prospects";
import {
  ArrowLeft,
  Mail,
  Globe,
  Building2,
  Briefcase,
  Clock,
  Zap,
  Send,
  Eye,
  MousePointer,
  MessageSquare,
  Brain,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
  Activity,
  Edit3,
  Plus,
  X,
  Save,
} from "lucide-react";

type Prospect = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  research_status: string | null;
  research_data: Record<string, unknown> | null;
  research_completed_at: string | null;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  last_contacted_at: string | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
};

type Email = {
  id: string;
  subject: string;
  body_text: string | null;
  status: string;
  sent_at: string | null;
  open_count: number;
  click_count: number;
  first_opened_at: string | null;
  has_reply: boolean;
  reply_category: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  new: "bg-zinc-500/20 text-zinc-300",
  contacted: "bg-blue-500/20 text-blue-300",
  opened: "bg-amber-500/20 text-amber-300",
  replied: "bg-green-500/20 text-green-300",
  interested: "bg-emerald-500/20 text-emerald-300",
  not_interested: "bg-red-500/20 text-red-300",
  meeting_booked: "bg-violet-500/20 text-violet-300",
  unsubscribed: "bg-zinc-600/20 text-zinc-400",
};

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);

  // Inline editing state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  const prospectId = params.id as string;

  const fetchProspect = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      toast.error("Prospect not found");
      router.push("/prospects");
      return;
    }

    setProspect(data as unknown as Prospect);

    // Fetch emails
    const { data: emailData } = await supabase!
      .from("emails")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false });

    if (emailData) setEmails(emailData as Email[]);
    setLoading(false);
  }, [prospectId, router]);

  useEffect(() => {
    fetchProspect();
  }, [fetchProspect]);

  const handleResearch = async () => {
    if (!prospect) return;
    setResearching(true);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });

      if (!res.ok) throw new Error("Research failed");

      toast.success("Research started! Results will appear shortly.");
      // Poll for results
      setTimeout(() => fetchProspect(), 5000);
      setTimeout(() => fetchProspect(), 15000);
    } catch {
      // Fallback: use the server action directly
      const { runResearchPipeline } = await import(
        "@/lib/scraping/research-pipeline"
      );

      const supabase = createClient();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from("users")
        .select("value_proposition, target_audience")
        .eq("id", user.id)
        .single();

      const result = await runResearchPipeline(
        {
          prospectId: prospect.id,
          firstName: prospect.first_name,
          lastName: prospect.last_name,
          email: prospect.email,
          companyName: prospect.company_name,
          jobTitle: prospect.job_title,
          linkedinUrl: prospect.linkedin_url,
          websiteUrl: prospect.website_url,
          notes: prospect.notes,
        },
        {
          value_proposition: userProfile?.value_proposition || "",
          target_audience: userProfile?.target_audience || "",
        }
      );

      if (result.success) {
        toast.success("Research completed!");
        fetchProspect();
      } else {
        toast.error(result.error || "Research failed");
      }
    } finally {
      setResearching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!prospect) return null;

  const name = [prospect.first_name, prospect.last_name]
    .filter(Boolean)
    .join(" ");
  const researchRaw = prospect.research_data;
  const research = researchRaw as { summary?: string; pain_points?: string[]; personalization_hooks?: string[]; recommended_angle?: string; icebreaker?: string } | null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/prospects")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {name || prospect.email}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
              {prospect.job_title && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {prospect.job_title}
                </span>
              )}
              {prospect.company_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {prospect.company_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={statusColors[prospect.status] || "bg-zinc-500/20 text-zinc-300"}>
            {prospect.status.replace("_", " ")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResearch}
            disabled={researching}
          >
            {researching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {researching ? "Researching..." : "Research"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Info + Stats */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <User className="h-4 w-4" /> Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
                <a
                  href={`mailto:${prospect.email}`}
                  className="text-blue-400 hover:underline truncate"
                >
                  {prospect.email}
                </a>
              </div>
              {prospect.linkedin_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
                  <a
                    href={prospect.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {prospect.website_url && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
                  <a
                    href={prospect.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline truncate"
                  >
                    {prospect.website_url}
                  </a>
                </div>
              )}
              {prospect.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-500">📞</span>
                  <span className="text-zinc-300">{prospect.phone}</span>
                </div>
              )}
              {/* Editable Notes */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-500">Notes</p>
                  {!editingNotes ? (
                    <button
                      onClick={() => {
                        setNotesValue(prospect.notes || "");
                        setEditingNotes(true);
                      }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        disabled={savingNotes}
                        onClick={async () => {
                          setSavingNotes(true);
                          const result = await updateProspectNotes(prospect.id, notesValue);
                          if (result.error) {
                            toast.error(result.error);
                          } else {
                            setProspect({ ...prospect, notes: notesValue });
                            toast.success("Notes saved");
                          }
                          setSavingNotes(false);
                          setEditingNotes(false);
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={3}
                    className="w-full text-sm bg-zinc-800/50 border border-zinc-700 rounded-md px-2 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                    placeholder="Add notes about this prospect..."
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-zinc-300">
                    {prospect.notes || <span className="text-zinc-600 italic">No notes yet — click edit to add</span>}
                  </p>
                )}
              </div>

              {/* Editable Tags */}
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(prospect.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-zinc-800 text-zinc-400 group pr-1"
                    >
                      {tag}
                      <button
                        onClick={async () => {
                          const newTags = (prospect.tags || []).filter((t) => t !== tag);
                          const result = await updateProspectTags(prospect.id, newTags);
                          if (result.error) {
                            toast.error(result.error);
                          } else {
                            setProspect({ ...prospect, tags: newTags });
                          }
                        }}
                        className="ml-1 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {addingTag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && newTag.trim()) {
                            const updatedTags = [...(prospect.tags || []), newTag.trim()];
                            const result = await updateProspectTags(prospect.id, updatedTags);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              setProspect({ ...prospect, tags: updatedTags });
                              setNewTag("");
                            }
                          }
                          if (e.key === "Escape") {
                            setAddingTag(false);
                            setNewTag("");
                          }
                        }}
                        className="h-6 w-24 text-xs bg-zinc-800 border-zinc-700"
                        placeholder="Tag name..."
                        autoFocus
                      />
                      <button
                        onClick={() => { setAddingTag(false); setNewTag(""); }}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTag(true)}
                      className="flex items-center gap-0.5 text-xs text-zinc-600 hover:text-violet-400 transition-colors px-1.5 py-0.5 rounded border border-dashed border-zinc-700 hover:border-violet-500"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {prospect.total_emails_sent || 0}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <Send className="h-3 w-3" /> Sent
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">
                    {prospect.total_opens || 0}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" /> Opens
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {prospect.total_clicks || 0}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <MousePointer className="h-3 w-3" /> Clicks
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {emails.filter((e) => e.has_reply).length}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Replies
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                {prospect.last_contacted_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Last Contacted</span>
                    <span className="text-zinc-300">
                      {new Date(prospect.last_contacted_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {prospect.last_opened_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Last Opened</span>
                    <span className="text-zinc-300">
                      {new Date(prospect.last_opened_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Added</span>
                  <span className="text-zinc-300">
                    {new Date(prospect.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs (Research, Emails, Activity) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="research" className="w-full">
            <TabsList className="bg-zinc-900/50 border border-zinc-800 w-full justify-start">
              <TabsTrigger value="research" className="gap-2">
                <Brain className="h-4 w-4" /> Research
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="h-4 w-4" /> Emails ({emails.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Clock className="h-4 w-4" /> Activity
              </TabsTrigger>
            </TabsList>

            {/* Research Tab */}
            <TabsContent value="research" className="mt-4">
              {prospect.research_status === "researching" ? (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="h-8 w-8 mb-3 mx-auto text-blue-400 animate-spin" />
                    <p className="text-zinc-300">Researching prospect...</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      This may take 15-30 seconds
                    </p>
                  </CardContent>
                </Card>
              ) : research ? (
                <div className="space-y-4">
                  {research.summary && (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {String(research.summary || "")}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {research.pain_points && (
                      <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Pain Points
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {(Array.isArray(research.pain_points) ? research.pain_points as string[] : []).map(
                              (point, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-zinc-300 flex items-start gap-2"
                                >
                                  <span className="text-red-400 mt-0.5 shrink-0">
                                    •
                                  </span>
                                  {String(point)}
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {research.personalization_hooks && (
                      <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-amber-400 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Personalization Hooks
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {(Array.isArray(research.personalization_hooks) ? research.personalization_hooks as string[] : []).map(
                              (hook, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-zinc-300 flex items-start gap-2"
                                >
                                  <span className="text-amber-400 mt-0.5 shrink-0">
                                    •
                                  </span>
                                  {String(hook)}
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {research.recommended_angle && (
                    <Card className="bg-gradient-to-r from-blue-500/5 to-violet-500/5 border-blue-800/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
                          <Zap className="h-4 w-4" /> Recommended Angle
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {String(research.recommended_angle || "")}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {research.icebreaker && (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Suggested
                          Icebreaker
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-zinc-300 italic">
                          &ldquo;{String(research.icebreaker || "")}&rdquo;
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {prospect.research_completed_at && (
                    <p className="text-xs text-zinc-600 text-right">
                      Researched on{" "}
                      {new Date(
                        prospect.research_completed_at
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Brain className="h-10 w-10 mb-3 mx-auto text-zinc-600" />
                    <p className="text-zinc-400 font-medium">
                      No research data yet
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 mb-4">
                      AI will analyze this prospect&apos;s company, role, and
                      online presence to find personalization angles
                    </p>
                    <Button
                      onClick={handleResearch}
                      disabled={researching}
                      size="sm"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Run AI Research
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Emails Tab */}
            <TabsContent value="emails" className="mt-4">
              {emails.length === 0 ? (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Mail className="h-10 w-10 mb-3 mx-auto text-zinc-600" />
                    <p className="text-zinc-400 font-medium">
                      No emails sent yet
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Compose an email or add this prospect to a sequence
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {emails.map((email) => (
                    <Card
                      key={email.id}
                      className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white truncate">
                                {email.subject}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-xs shrink-0 ${
                                  email.status === "sent"
                                    ? "text-green-400 border-green-400/30"
                                    : email.status === "queued"
                                    ? "text-amber-400 border-amber-400/30"
                                    : email.status === "failed"
                                    ? "text-red-400 border-red-400/30"
                                    : "text-zinc-400 border-zinc-400/30"
                                }`}
                              >
                                {email.status}
                              </Badge>
                              {email.has_reply && (
                                <Badge className="text-xs bg-green-500/20 text-green-300 shrink-0">
                                  {email.reply_category || "replied"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2">
                              {email.body_text}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {email.open_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />{" "}
                              {email.click_count || 0}
                            </span>
                            <span>
                              {email.sent_at
                                ? new Date(email.sent_at).toLocaleDateString()
                                : new Date(
                                    email.created_at
                                  ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-6">
                  <div className="space-y-4">
                    {/* Build timeline from emails + status changes */}
                    {prospect.created_at && (
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-zinc-300">
                            Prospect added
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(prospect.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {prospect.research_completed_at && (
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-zinc-300">
                            AI research completed
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(
                              prospect.research_completed_at
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {emails.map((email) => (
                      <div key={email.id} className="flex items-start gap-3">
                        <div
                          className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                            email.status === "sent"
                              ? "bg-green-500"
                              : email.status === "failed"
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm text-zinc-300">
                            Email {email.status}: &ldquo;{email.subject}&rdquo;
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(
                              email.sent_at || email.created_at
                            ).toLocaleString()}
                          </p>
                          {email.first_opened_at && (
                            <p className="text-xs text-amber-400 mt-0.5">
                              Opened{" "}
                              {new Date(
                                email.first_opened_at
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {prospect.last_contacted_at && (
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm text-zinc-300">
                            Last contacted
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(
                              prospect.last_contacted_at
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
