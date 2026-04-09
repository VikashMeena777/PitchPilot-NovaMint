/**
 * White-Label Configuration System — Agency Plan
 *
 * Allows agencies to customize:
 * - Branding (logo, colors, name)
 * - Email footer/signature
 * - Client workspace isolation
 * - Custom domain mapping
 */

export type WhiteLabelConfig = {
  team_id: string;
  enabled: boolean;
  branding: {
    company_name: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color: string;       // hex
    accent_color: string;        // hex
    background_dark: string;     // hex for dark mode
    custom_css?: string;         // injected on pages
  };
  email: {
    from_name: string;
    from_email: string;
    reply_to?: string;
    signature_html?: string;
    footer_html?: string;
    unsubscribe_text: string;
  };
  domain: {
    custom_domain?: string;       // e.g. outreach.agencyname.com
    verified: boolean;
    ssl_provisioned: boolean;
  };
  features: {
    max_users: number;
    max_clients: number;
    max_prospects_per_client: number;
    custom_api_access: boolean;
    priority_support: boolean;
    dedicated_ip: boolean;
  };
};

// Default white-label configuration
const DEFAULT_CONFIG: Omit<WhiteLabelConfig, "team_id"> = {
  enabled: false,
  branding: {
    company_name: "PitchMint",
    primary_color: "#6366f1",
    accent_color: "#8b5cf6",
    background_dark: "#0a0a0f",
  },
  email: {
    from_name: "PitchMint",
    from_email: "outreach@pitchmint.io",
    unsubscribe_text: "Unsubscribe from future emails",
  },
  domain: {
    verified: false,
    ssl_provisioned: false,
  },
  features: {
    max_users: 5,
    max_clients: 10,
    max_prospects_per_client: 5000,
    custom_api_access: true,
    priority_support: true,
    dedicated_ip: false,
  },
};

/**
 * Get white-label config for a team
 * Falls back to PitchMint defaults
 */
export function getWhiteLabelConfig(
  teamConfig?: Partial<WhiteLabelConfig>
): WhiteLabelConfig {
  if (!teamConfig?.enabled) {
    return { team_id: teamConfig?.team_id || "default", ...DEFAULT_CONFIG };
  }

  return {
    team_id: teamConfig.team_id || "default",
    enabled: true,
    branding: {
      ...DEFAULT_CONFIG.branding,
      ...teamConfig.branding,
    },
    email: {
      ...DEFAULT_CONFIG.email,
      ...teamConfig.email,
    },
    domain: {
      ...DEFAULT_CONFIG.domain,
      ...teamConfig.domain,
    },
    features: {
      ...DEFAULT_CONFIG.features,
      ...teamConfig.features,
    },
  };
}

/**
 * Generate CSS variables from branding config
 * Inject into <head> for white-label theming
 */
export function getBrandingCSS(branding: WhiteLabelConfig["branding"]): string {
  return `
    :root {
      --brand-primary: ${branding.primary_color};
      --brand-accent: ${branding.accent_color};
      --brand-bg-dark: ${branding.background_dark};
      --brand-name: "${branding.company_name}";
    }
    ${branding.custom_css || ""}
  `.trim();
}

/**
 * Generate email footer HTML from white-label config
 */
export function getEmailFooter(config: WhiteLabelConfig): string {
  if (config.email.footer_html) {
    return config.email.footer_html;
  }

  const unsubscribeLink = `{{unsubscribe_url}}`;

  return `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #2a2a3d; font-size: 12px; color: #666;">
      <p>Sent by ${config.branding.company_name}</p>
      <p><a href="${unsubscribeLink}" style="color: #888;">${config.email.unsubscribe_text}</a></p>
    </div>
  `.trim();
}

/**
 * Validate a custom domain configuration
 * Returns required DNS records for the user to set up
 */
export function getDomainSetupInstructions(domain: string): {
  records: Array<{
    type: "CNAME" | "TXT" | "A";
    name: string;
    value: string;
    purpose: string;
  }>;
} {
  return {
    records: [
      {
        type: "CNAME",
        name: domain,
        value: "cname.vercel-dns.com",
        purpose: "Route traffic to PitchMint (required)",
      },
      {
        type: "TXT",
        name: `_pitchmint.${domain}`,
        value: `verify=pp_${Buffer.from(domain).toString("base64").slice(0, 20)}`,
        purpose: "Domain ownership verification (required)",
      },
      {
        type: "TXT",
        name: domain,
        value: "v=spf1 include:_spf.google.com ~all",
        purpose: "SPF record for email deliverability (recommended)",
      },
    ],
  };
}

/**
 * Client workspace isolation — used in Agency plan
 */
export type ClientWorkspace = {
  id: string;
  team_id: string;
  client_name: string;
  client_domain?: string;
  prospect_count: number;
  sequence_count: number;
  created_at: string;
  status: "active" | "paused" | "archived";
  settings: {
    daily_send_limit: number;
    sending_email?: string;
    timezone: string;
  };
};

/**
 * Get plan-level white-label capabilities
 */
export function getWhiteLabelCapabilities(plan: string): {
  available: boolean;
  features: string[];
  limitations: string[];
} {
  switch (plan) {
    case "agency":
      return {
        available: true,
        features: [
          "Custom branding (logo, colors, name)",
          "Custom email domain",
          "Client workspace isolation",
          "Up to 10 client accounts",
          "Priority API access",
          "Custom CSS injection",
        ],
        limitations: [
          "Dedicated IP requires add-on ($49/m)",
        ],
      };
    case "growth":
      return {
        available: false,
        features: [],
        limitations: [
          "Upgrade to Agency plan for white-label features",
        ],
      };
    default:
      return {
        available: false,
        features: [],
        limitations: [
          "White-label requires Agency plan",
        ],
      };
  }
}
