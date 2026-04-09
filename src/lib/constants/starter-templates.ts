// Starter email templates — seeded on first use
// Separated from server actions file because "use server" files
// can only export async functions, not constants.

export const STARTER_TEMPLATES = [
  {
    name: "Cold Outreach — Value First",
    subject: "Quick thought on {{company_name}}'s {{pain_point}}",
    body: `Hi {{first_name}},

I noticed {{company_name}} is doing impressive work in {{industry}}. I had a thought about how you might {{benefit}}.

We've helped companies like {{social_proof}} achieve {{result}}.

Would you be open to a quick 15-minute chat this week?

Best,
{{sender_name}}`,
    category: "outreach",
  },
  {
    name: "Follow-Up — Gentle Nudge",
    subject: "Re: Quick thought on {{company_name}}",
    body: `Hi {{first_name}},

Just wanted to follow up on my previous email. I know you're busy — here's the key point:

{{one_line_value_prop}}

Happy to share a quick case study if that would be helpful. No pressure either way.

Cheers,
{{sender_name}}`,
    category: "follow_up",
  },
  {
    name: "Break-Up Email",
    subject: "Should I close your file?",
    body: `Hi {{first_name}},

I've reached out a few times and haven't heard back, which is totally fine. I don't want to be a pest.

I'll assume the timing isn't right and close your file for now. If things change down the road, feel free to reply to this thread.

Wishing you and the {{company_name}} team all the best!

{{sender_name}}`,
    category: "follow_up",
  },
  {
    name: "Referral Request",
    subject: "Who handles {{function}} at {{company_name}}?",
    body: `Hi {{first_name}},

I wasn't sure if you're the right person to speak with about {{topic}}. If not, could you point me in the right direction?

I'd really appreciate it. Thanks!

Best,
{{sender_name}}`,
    category: "outreach",
  },
  {
    name: "Meeting Confirmation",
    subject: "Confirmed: Our call on {{date}}",
    body: `Hi {{first_name}},

Looking forward to our chat on {{date}} at {{time}}.

Here's what I'd love to cover:
1. {{agenda_item_1}}
2. {{agenda_item_2}}
3. Your questions

Talk soon!

{{sender_name}}`,
    category: "meeting",
  },
];
