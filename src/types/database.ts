// =============================================
// PitchPilot — Database Types
// =============================================

export type UserPlan = "free" | "starter" | "growth" | "agency";
export type TonePreset = "professional" | "casual" | "bold" | "consultative";

export type ProspectStatus =
  | "new"
  | "contacted"
  | "opened"
  | "replied"
  | "interested"
  | "not_interested"
  | "meeting_booked"
  | "unsubscribed";

export type ResearchStatus = "pending" | "researching" | "completed" | "failed";
export type SequenceStatus = "draft" | "active" | "paused" | "completed";
export type EnrollmentStatus = "active" | "paused" | "completed" | "replied" | "bounced" | "unsubscribed";
export type EmailStatus = "draft" | "queued" | "sending" | "sent" | "failed" | "bounced";
export type ReplyCategory = "interested" | "not_interested" | "out_of_office" | "wrong_person" | "ask_later";
export type StepType = "email" | "delay" | "condition";
export type ConditionType = "opened" | "not_opened" | "clicked" | "replied";
export type ProspectSource = "manual" | "csv_upload" | "api";
export type CsvUploadStatus = "pending" | "processing" | "completed" | "failed";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  value_proposition: string | null;
  target_audience: string | null;
  tone_preset: TonePreset;
  plan: UserPlan;
  monthly_prospect_count: number;
  monthly_prospect_limit: number;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password_encrypted: string | null;
  gmail_refresh_token_encrypted: string | null;
  sending_email: string | null;
  sending_name: string | null;
  daily_send_limit: number;
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchData {
  company_description?: string;
  recent_posts?: string[];
  tech_stack?: string[];
  funding_info?: string;
  pain_points?: string[];
  personalization_hooks?: string[];
  recommended_angle?: string;
  raw_website_content?: string;
  raw_search_results?: string;
}

export interface Prospect {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  phone: string | null;
  location: string | null;
  industry: string | null;
  company_size: string | null;
  research_data: ResearchData;
  research_status: ResearchStatus;
  research_completed_at: string | null;
  status: ProspectStatus;
  tags: string[] | null;
  notes: string | null;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  last_contacted_at: string | null;
  last_opened_at: string | null;
  last_replied_at: string | null;
  source: ProspectSource;
  csv_upload_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: SequenceStatus;
  total_steps: number;
  send_start_hour: number;
  send_end_hour: number;
  send_days: number[];
  respect_prospect_timezone: boolean;
  total_prospects: number;
  total_sent: number;
  total_opens: number;
  total_replies: number;
  total_interested: number;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  step_type: StepType;
  subject_template: string | null;
  body_template: string | null;
  use_ai_generation: boolean;
  ai_prompt_instructions: string | null;
  delay_days: number;
  delay_hours: number;
  condition_type: ConditionType | null;
  total_sent: number;
  total_opens: number;
  total_replies: number;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  prospect_id: string;
  user_id: string;
  status: EnrollmentStatus;
  current_step: number;
  next_send_at: string | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface Email {
  id: string;
  user_id: string;
  prospect_id: string;
  sequence_id: string | null;
  sequence_step_id: string | null;
  enrollment_id: string | null;
  from_email: string | null;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: EmailStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  resend_id: string | null;
  message_id: string | null;
  tracking_pixel_id: string;
  open_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  click_count: number;
  first_clicked_at: string | null;
  has_reply: boolean;
  reply_received_at: string | null;
  reply_content: string | null;
  reply_category: ReplyCategory | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

export interface CsvUpload {
  id: string;
  user_id: string;
  filename: string | null;
  file_url: string | null;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: CsvUploadStatus;
  error_log: Record<string, unknown>[];
  created_at: string;
}

export interface AnalyticsDaily {
  id: string;
  user_id: string;
  date: string;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;
  positive_replies: number;
  meetings_booked: number;
  prospects_added: number;
}
