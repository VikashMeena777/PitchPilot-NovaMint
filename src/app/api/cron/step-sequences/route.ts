import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmail } from "@/lib/ai/engine";

/**
 * Cron Job: Sequence Stepper
 * Schedule: Every 10 minutes
 * Advances active sequence enrollments to their next step
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find enrollments ready for their next step
  const { data: enrollments, error: fetchError } = await supabase
    .from("sequence_enrollments")
    .select(
      `*,
       sequences(*, users(company_name, value_proposition, target_audience, tone_preset, sending_email, sending_name)),
       prospects(*)
      `
    )
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString())
    .limit(20);

  if (fetchError || !enrollments) {
    return NextResponse.json(
      { error: fetchError?.message || "No enrollments found" },
      { status: 500 }
    );
  }

  let processed = 0;
  let emailsQueued = 0;

  for (const enrollment of enrollments) {
    try {
      const sequence = enrollment.sequences;
      const prospect = enrollment.prospects;
      const user = sequence?.users;

      if (!sequence || !prospect || !user) continue;

      // Check if prospect has replied (stop sequence)
      if (prospect.status === "replied" || prospect.status === "interested" || prospect.status === "unsubscribed") {
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", enrollment.id);
        processed++;
        continue;
      }

      // Get the next step
      const nextStepNumber = (enrollment.current_step || 0) + 1;

      const { data: nextStep } = await supabase
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", sequence.id)
        .eq("step_number", nextStepNumber)
        .single();

      if (!nextStep) {
        // No more steps — mark enrollment as completed
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", enrollment.id);
        processed++;
        continue;
      }

      if (nextStep.step_type === "email") {
        // Generate email using AI
        const research = prospect.research_data || null;

        const generated = nextStep.use_ai_generation
          ? await generateEmail({
              prospect: {
                first_name: prospect.first_name,
                last_name: prospect.last_name,
                email: prospect.email,
                company_name: prospect.company_name,
                job_title: prospect.job_title,
              },
              sender: {
                name: user.sending_name || user.company_name || "Unknown",
                company: user.company_name || "Unknown",
                value_proposition: user.value_proposition || "",
                target_audience: user.target_audience || "",
              },
              tone: user.tone_preset || "professional",
              research,
              sequenceContext: {
                stepNumber: nextStepNumber,
                totalSteps: sequence.total_steps || 1,
              },
              customInstructions: nextStep.ai_prompt_instructions || undefined,
            })
          : null;

        const subject = generated?.subject || nextStep.subject_template || "Follow up";
        const bodyHtml = generated?.body_html || nextStep.body_template || "";
        const bodyText = generated?.body || nextStep.body_template || "";

        // Add random jitter (0-30 min delay)
        const jitterMs = Math.floor(Math.random() * 30 * 60 * 1000);
        const scheduledAt = new Date(Date.now() + jitterMs).toISOString();

        // Create queued email
        await supabase.from("emails").insert({
          user_id: enrollment.user_id,
          prospect_id: prospect.id,
          sequence_id: sequence.id,
          sequence_step_id: nextStep.id,
          enrollment_id: enrollment.id,
          from_email: user.sending_email,
          from_name: user.sending_name,
          to_email: prospect.email,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          status: "queued",
          scheduled_at: scheduledAt,
        });

        emailsQueued++;
      }

      // Calculate next_send_at based on the step after this
      const nextNextStep = nextStepNumber + 1;
      const { data: futureStep } = await supabase
        .from("sequence_steps")
        .select("delay_days, delay_hours")
        .eq("sequence_id", sequence.id)
        .eq("step_number", nextNextStep)
        .single();

      const delayMs = futureStep
        ? ((futureStep.delay_days || 2) * 24 * 60 + (futureStep.delay_hours || 0) * 60) * 60 * 1000
        : null;

      await supabase
        .from("sequence_enrollments")
        .update({
          current_step: nextStepNumber,
          next_send_at: delayMs ? new Date(Date.now() + delayMs).toISOString() : null,
        })
        .eq("id", enrollment.id);

      processed++;
    } catch (error) {
      console.error(
        `[Cron] Error processing enrollment ${enrollment.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    processed,
    emailsQueued,
    timestamp: new Date().toISOString(),
  });
}
