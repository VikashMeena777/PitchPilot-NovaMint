const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "dispostable.com",
  "maildrop.cc",
]);

const ROLE_BASED_PREFIXES = new Set([
  "info",
  "admin",
  "support",
  "sales",
  "contact",
  "help",
  "noreply",
  "no-reply",
  "webmaster",
  "postmaster",
  "abuse",
  "security",
  "billing",
  "team",
  "hello",
  "office",
  "feedback",
  "marketing",
  "press",
  "media",
  "jobs",
  "careers",
  "hr",
]);

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  errors: string[];
  warnings: string[];
}

export function validateEmail(email: string): EmailValidationResult {
  const result: EmailValidationResult = {
    valid: true,
    email: email.trim().toLowerCase(),
    errors: [],
    warnings: [],
  };

  // Basic format check
  if (!EMAIL_REGEX.test(result.email)) {
    result.valid = false;
    result.errors.push("Invalid email format");
    return result;
  }

  const [localPart, domain] = result.email.split("@");

  // Check disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    result.valid = false;
    result.errors.push("Disposable email addresses are not allowed");
    return result;
  }

  // Check role-based emails (warn, don't block)
  if (ROLE_BASED_PREFIXES.has(localPart)) {
    result.warnings.push(
      "Role-based emails (info@, support@) typically have lower response rates"
    );
  }

  // Check for common typos in popular domains
  const domainTypos: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gnail.com": "gmail.com",
    "outloo.com": "outlook.com",
    "outlok.com": "outlook.com",
    "hotmal.com": "hotmail.com",
    "yahooo.com": "yahoo.com",
    "yaho.com": "yahoo.com",
  };

  if (domainTypos[domain]) {
    result.warnings.push(
      `Did you mean ${localPart}@${domainTypos[domain]}?`
    );
  }

  return result;
}

export function validateEmails(
  emails: string[]
): Map<string, EmailValidationResult> {
  const results = new Map<string, EmailValidationResult>();
  for (const email of emails) {
    results.set(email, validateEmail(email));
  }
  return results;
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
