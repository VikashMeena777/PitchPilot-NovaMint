"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Clock,
  GripVertical,
  Sparkles,
  Save,
  Play,
  Pause,
  Users,
  ArrowDown,
  Wand2,
  GitBranch,
  ToggleRight,
} from "lucide-react";

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_steps: number;
  enrolled_count: number;
  created_at: string;
};

type SequenceStep = {
  id?: string;
  sequence_id: string;
  step_number: number;
  step_type: string;
  subject_template: string;
  body_template: string;
  delay_days: number;
  delay_hours: number;
  use_ai_generation: boolean;
  ai_prompt_instructions: string;
  is_new?: boolean;
  // A/B testing
  ab_enabled?: boolean;
  ab_subject_b?: string;
  ab_body_b?: string;
  // Condition steps
  condition_type?: string;
  condition_value?: string;
};

export default function SequenceEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const sequenceId = params.id as string;

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: seqData, error: seqError } = await supabase
      .from("sequences")
      .select("*")
      .eq("id", sequenceId)
      .eq("user_id", user.id)
      .single();

    if (seqError || !seqData) {
      toast.error("Sequence not found");
      router.push("/sequences");
      return;
    }
    setSequence(seqData as Sequence);

    const { data: stepsData } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("step_number", { ascending: true });

    if (stepsData) setSteps(stepsData as SequenceStep[]);
    setLoading(false);
  }, [sequenceId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addStep = () => {
    const newStep: SequenceStep = {
      sequence_id: sequenceId,
      step_number: steps.length + 1,
      step_type: "email",
      subject_template: "",
      body_template: "",
      delay_days: steps.length === 0 ? 0 : 2,
      delay_hours: 0,
      use_ai_generation: true,
      ai_prompt_instructions: "",
      is_new: true,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      step_number: i + 1,
    }));
    setSteps(updated);
  };

  const updateStep = (
    index: number,
    field: keyof SequenceStep,
    value: unknown
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!sequence) return;
    setSaving(true);

    try {
      const supabase = createClient();
      if (!supabase) return;
      // Delete existing steps
      await supabase
        .from("sequence_steps")
        .delete()
        .eq("sequence_id", sequenceId);

      // Insert all steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((s) => ({
          sequence_id: sequenceId,
          step_number: s.step_number,
          step_type: s.step_type,
          subject_template: s.subject_template,
          body_template: s.body_template,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          use_ai_generation: s.use_ai_generation,
          ai_prompt_instructions: s.ai_prompt_instructions,
          // A/B test data
          ab_test: s.ab_enabled
            ? {
                enabled: true,
                subject_b: s.ab_subject_b || "",
                body_b: s.ab_body_b || "",
              }
            : null,
          // Condition data
          condition_type: s.step_type === "condition" ? (s.condition_type || "opened") : null,
          condition_value: s.step_type === "condition" && s.condition_value
            ? { value: s.condition_value }
            : null,
        }));

        const { error: insertError } = await supabase
          .from("sequence_steps")
          .insert(stepsToInsert);

        if (insertError) throw insertError;
      }

      // Update sequence total_steps
      await supabase
        .from("sequences")
        .update({ total_steps: steps.length })
        .eq("id", sequenceId);

      toast.success("Sequence saved!");
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save sequence");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!sequence) return;
    const supabase = createClient();
    if (!supabase) return;
    const newStatus = sequence.status === "active" ? "paused" : "active";

    const { error } = await supabase
      .from("sequences")
      .update({ status: newStatus })
      .eq("id", sequenceId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    setSequence({ ...sequence, status: newStatus });
    toast.success(`Sequence ${newStatus === "active" ? "activated" : "paused"}`);
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const { suggestSequenceEmails } = await import("@/lib/ai/engine");

      const supabase = createClient();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("value_proposition, target_audience, tone_preset")
        .eq("id", user.id)
        .single();

      const suggestions = await suggestSequenceEmails({
        totalSteps: 4,
        value_proposition: profile?.value_proposition || "",
        target_audience: profile?.target_audience || "",
        tone: profile?.tone_preset || "professional",
      });

      if (suggestions && suggestions.length > 0) {
        const newSteps: SequenceStep[] = suggestions.map((s) => ({
          sequence_id: sequenceId,
          step_number: s.step,
          step_type: "email",
          subject_template: s.subject_template,
          body_template: s.body_template,
          delay_days: s.delay_days,
          delay_hours: 0,
          use_ai_generation: true,
          ai_prompt_instructions: "",
          is_new: true,
        }));
        setSteps(newSteps);
        toast.success("AI generated sequence steps! Review and save.");
      } else {
        toast.error("AI couldn't generate suggestions. Check your API keys.");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate AI suggestions");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!sequence) return null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sequences")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{sequence.name}</h1>
            {sequence.description && (
              <p className="text-sm text-zinc-400 mt-0.5">
                {sequence.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              sequence.status === "active"
                ? "bg-green-500/20 text-green-300"
                : sequence.status === "paused"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-zinc-500/20 text-zinc-300"
            }
          >
            {sequence.status}
          </Badge>
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {sequence.enrolled_count || 0} enrolled
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
          >
            {sequence.status === "active" ? (
              <>
                <Pause className="h-4 w-4 mr-1.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" /> Activate
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* AI Generate */}
      {steps.length === 0 && (
        <Card className="bg-gradient-to-r from-violet-500/5 to-blue-500/5 border-violet-800/30">
          <CardContent className="p-6 text-center">
            <Wand2 className="h-10 w-10 mb-3 mx-auto text-violet-400" />
            <h3 className="text-lg font-semibold text-white mb-1">
              AI Sequence Generator
            </h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto">
              Let AI create a complete email sequence based on your product and
              target audience. You can customize each step after.
            </p>
            <Button
              onClick={handleAIGenerate}
              disabled={generating}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {generating ? (
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generating ? "Generating..." : "Generate with AI"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Steps Timeline */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={index}>
            {/* Connection line */}
            {index > 0 && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="h-6 w-px bg-zinc-700" />
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Wait {step.delay_days}d {step.delay_hours > 0 ? `${step.delay_hours}h` : ""}
                  </span>
                  <div className="h-6 w-px bg-zinc-700" />
                </div>
              </div>
            )}

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-zinc-600" />
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-medium text-white">
                      Step {step.step_number}
                    </CardTitle>
                    {step.is_new && (
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {index > 0 && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-zinc-500">
                          Delay
                        </Label>
                        <Input
                          type="number"
                          value={step.delay_days}
                          onChange={(e) =>
                            updateStep(
                              index,
                              "delay_days",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 h-7 text-xs bg-zinc-800 border-zinc-700"
                          min={0}
                        />
                        <span className="text-xs text-zinc-500">days</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
                      className="h-7 w-7 text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={step.use_ai_generation}
                      onCheckedChange={(checked) =>
                        updateStep(index, "use_ai_generation", checked)
                      }
                    />
                    <Label className="text-sm text-zinc-400">
                      <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                      AI-generated (personalized per prospect)
                    </Label>
                  </div>
                  <Select
                    value={step.step_type}
                    onValueChange={(val) => updateStep(index, "step_type", val)}
                  >
                    <SelectTrigger className="w-32 h-7 text-xs bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="wait">Wait</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {step.use_ai_generation ? (
                  <div>
                    <Label className="text-xs text-zinc-500 mb-1.5 block">
                      AI Instructions (optional — guide what the AI writes)
                    </Label>
                    <Textarea
                      placeholder="e.g., Focus on their recent funding round. Mention our case study with [similar company]. Keep it under 80 words."
                      value={step.ai_prompt_instructions}
                      onChange={(e) =>
                        updateStep(
                          index,
                          "ai_prompt_instructions",
                          e.target.value
                        )
                      }
                      className="bg-zinc-800 border-zinc-700 text-sm min-h-[60px]"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-500 mb-1.5 block">
                        Subject Line
                      </Label>
                      <Input
                        placeholder="Use {{first_name}}, {{company}} for personalization"
                        value={step.subject_template}
                        onChange={(e) =>
                          updateStep(index, "subject_template", e.target.value)
                        }
                        className="bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500 mb-1.5 block">
                        Email Body
                      </Label>
                      <Textarea
                        placeholder="Write your email template here. Use {{first_name}}, {{company}}, {{job_title}} for merge tags."
                        value={step.body_template}
                        onChange={(e) =>
                          updateStep(index, "body_template", e.target.value)
                        }
                        className="bg-zinc-800 border-zinc-700 text-sm min-h-[120px]"
                      />
                    </div>
                  </>
                )}

                {/* A/B Test Toggle (email steps only) */}
                {step.step_type === "email" && (
                  <div className="border-t border-zinc-800 pt-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Switch
                        checked={step.ab_enabled || false}
                        onCheckedChange={(checked) =>
                          updateStep(index, "ab_enabled", checked)
                        }
                      />
                      <Label className="text-sm text-zinc-400 flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5" />
                        A/B Test this step
                      </Label>
                      {step.ab_enabled && (
                        <Badge className="text-xs bg-amber-500/20 text-amber-300">50/50 split</Badge>
                      )}
                    </div>
                    {step.ab_enabled && (
                      <div className="bg-zinc-800/30 rounded-lg p-3 space-y-3 border border-zinc-700/50">
                        <p className="text-xs text-amber-400 font-medium">Variant B</p>
                        <Input
                          placeholder="Variant B subject line..."
                          value={step.ab_subject_b || ""}
                          onChange={(e) =>
                            updateStep(index, "ab_subject_b", e.target.value)
                          }
                          className="bg-zinc-800 border-zinc-700 text-sm"
                        />
                        <Textarea
                          placeholder="Variant B email body..."
                          value={step.ab_body_b || ""}
                          onChange={(e) =>
                            updateStep(index, "ab_body_b", e.target.value)
                          }
                          className="bg-zinc-800 border-zinc-700 text-sm min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Condition step UI */}
                {step.step_type === "condition" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ToggleRight className="h-4 w-4 text-blue-400" />
                      <Label className="text-xs text-zinc-500">Condition Type</Label>
                    </div>
                    <Select
                      value={step.condition_type || "opened"}
                      onValueChange={(val) => updateStep(index, "condition_type", val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opened">Opened previous email</SelectItem>
                        <SelectItem value="clicked">Clicked a link</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="not_opened">Did NOT open</SelectItem>
                        <SelectItem value="has_tag">Has tag</SelectItem>
                      </SelectContent>
                    </Select>
                    {step.condition_type === "has_tag" && (
                      <Input
                        placeholder="Tag name..."
                        value={step.condition_value || ""}
                        onChange={(e) =>
                          updateStep(index, "condition_value", e.target.value)
                        }
                        className="bg-zinc-800 border-zinc-700 text-sm"
                      />
                    )}
                    <p className="text-xs text-zinc-600">
                      ✅ TRUE → continues to next step &nbsp;|&nbsp; ❌ FALSE → skips to step after next
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Add Step */}
      <div className="flex items-center justify-center pt-2">
        {steps.length > 0 && (
          <div className="h-6 w-px bg-zinc-700 absolute" />
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={addStep}
          className="border-dashed border-zinc-700 text-zinc-400 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Step
        </Button>
        {steps.length > 0 && (
          <Button
            variant="outline"
            onClick={handleAIGenerate}
            disabled={generating}
            className="border-dashed border-violet-700/50 text-violet-400 hover:text-violet-300"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Regenerate with AI"}
          </Button>
        )}
      </div>

      {/* Tips */}
      <Card className="bg-zinc-900/30 border-zinc-800/50">
        <CardContent className="p-4 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400 mb-2">💡 Tips</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              Enable &ldquo;AI-generated&rdquo; for personalized emails per
              prospect — the AI uses research data to customize each email
            </li>
            <li>
              Best practices: 3-5 steps, 2-3 days between emails, stop on reply
            </li>
            <li>
              Steps with templates use merge tags: {`{{first_name}}`},{" "}
              {`{{company}}`}, {`{{job_title}}`}
            </li>
            <li>
              Sequences auto-pause when a prospect replies, is interested, or
              unsubscribes
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
