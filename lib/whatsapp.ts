/**
 * BD WhatsApp Integration
 * =======================
 * Sends WhatsApp messages via the Meta Graph API (same provider as GFA).
 * All templates must be pre-approved by Meta as "Utility" category.
 *
 * SETUP (Asif — see MOODLE_SETUP.md):
 * ------------------------------------
 * Add to .env.local:
 *   META_WA_TOKEN=your_meta_access_token
 *   META_WA_PHONE_NUMBER_ID=your_phone_number_id
 *   META_WA_API_VERSION=v19.0   (or latest)
 *
 * TEMPLATES TO SUBMIT TO META (Utility category):
 * ------------------------------------------------
 * All templates below must be created and approved in:
 *   Meta Business Suite → WhatsApp Manager → Message Templates
 *
 * See docs/handover/16-WHATSAPP-TEMPLATE-SPEC.md for the exact approved copy.
 *
 * Template names and their parameter counts:
 *
 *   bd_welcome_first_login  — {{1}} = driver name, {{2}} = programme name
 *                             (portal URL is hardcoded in the template body)
 *   bd_module_complete      — {{1}} = driver name, {{2}} = module number
 *                             (portal URL is hardcoded in the template body)
 *   bd_inactivity_7day      — {{1}} = driver name, {{2}} = modules completed
 *                             (portal URL is hardcoded in the template body)
 *   bd_inactivity_14day     — {{1}} = driver name, {{2}} = modules completed
 *                             (portal URL is hardcoded in the template body)
 *   bd_programme_complete   — {{1}} = driver name, {{2}} = programme name
 *                             (portal URL is hardcoded in the template body)
 *
 * IMPORTANT: The portal URL (https://betterdriver.co.za/portal) is hardcoded
 * in the Meta template body, NOT passed as a variable. This is required for
 * Meta Utility category approval — passing a full URL as a variable causes
 * rejection because Meta cannot verify the destination.
 */

const META_WA_TOKEN = process.env.META_WA_TOKEN ?? "";
const META_WA_PHONE_NUMBER_ID = process.env.META_WA_PHONE_NUMBER_ID ?? "";
const META_WA_API_VERSION = process.env.META_WA_API_VERSION ?? "v19.0";

export interface WhatsAppComponent {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text" | "image" | "video" | "document";
    text?: string;
    image?: { link: string };
    video?: { link: string };
  }>;
  sub_type?: string;
  index?: number;
}

export interface SendWhatsAppParams {
  to: string;                       // E.164 format, e.g. +27821234567
  templateName: string;
  language: "en" | "zu";
  components?: WhatsAppComponent[];
}

/**
 * Send a WhatsApp template message via Meta Graph API.
 * Returns true on success, false on failure (logs error but does not throw).
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<boolean> {
  const { to, templateName, language, components } = params;

  if (!META_WA_TOKEN || !META_WA_PHONE_NUMBER_ID) {
    console.warn("[WHATSAPP] META_WA_TOKEN or META_WA_PHONE_NUMBER_ID not set — skipping send");
    return false;
  }

  // Normalise phone number to E.164 (strip spaces, ensure + prefix)
  const phone = to.replace(/\s+/g, "").replace(/^0/, "+27");

  // Map BD language codes to Meta language codes
  const metaLang = language === "zu" ? "zu" : "en_US";

  const body = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: metaLang },
      components: components ?? [],
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_WA_API_VERSION}/${META_WA_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${META_WA_TOKEN}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[WHATSAPP] Send failed:", res.status, JSON.stringify(err));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[WHATSAPP] Network error:", err);
    return false;
  }
}

/**
 * TRIGGER 2 — Welcome to BetterDriver (sent on first portal access)
 *
 * Template: bd_welcome_first_login
 *   {{1}} = driver first name
 *   {{2}} = programme name
 *   (portal URL is hardcoded in the Meta template body)
 */
export async function sendWelcomeMessage(params: {
  to: string;
  firstName: string;
  programmeName: string;
  language: "en" | "zu";
}): Promise<boolean> {
  return sendWhatsAppMessage({
    to: params.to,
    templateName: "bd_welcome_first_login",
    language: params.language,
    components: [
      { type: "body", parameters: [
        { type: "text", text: params.firstName },
        { type: "text", text: params.programmeName },
      ]},
    ],
  });
}
