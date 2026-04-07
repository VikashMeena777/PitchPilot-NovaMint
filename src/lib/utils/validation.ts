// Input validation utilities for forms and API routes

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateRequired(
  fields: Record<string, unknown>,
  required: string[]
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const field of required) {
    const val = fields[field];
    if (val === undefined || val === null || val === "") {
      errors[field] = `${field} is required`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProspect(data: {
  email?: string;
  first_name?: string;
  company_name?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = "Email is required";
  } else if (!validateEmail(data.email)) {
    errors.email = "Invalid email address";
  }

  if (!data.first_name?.trim()) {
    errors.first_name = "First name is required";
  }

  if (data.first_name && data.first_name.length > 100) {
    errors.first_name = "First name must be under 100 characters";
  }

  if (data.company_name && data.company_name.length > 200) {
    errors.company_name = "Company name must be under 200 characters";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSequenceStep(data: {
  subject_template?: string;
  body_template?: string;
  delay_days?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.subject_template?.trim()) {
    errors.subject_template = "Subject is required";
  } else if (data.subject_template.length > 200) {
    errors.subject_template = "Subject must be under 200 characters";
  }

  if (!data.body_template?.trim()) {
    errors.body_template = "Email body is required";
  }

  if (data.delay_days !== undefined && (data.delay_days < 0 || data.delay_days > 90)) {
    errors.delay_days = "Delay must be between 0 and 90 days";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSmtpConfig(data: {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.host?.trim()) {
    errors.host = "SMTP host is required";
  }

  if (!data.port || data.port < 1 || data.port > 65535) {
    errors.port = "Valid port (1-65535) is required";
  }

  if (!data.username?.trim()) {
    errors.username = "SMTP username is required";
  }

  if (!data.password?.trim()) {
    errors.password = "SMTP password is required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
