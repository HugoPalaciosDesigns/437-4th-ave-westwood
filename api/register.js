/**
 * POST /api/register — open-house registration intake.
 *
 * Fans one registration out to every channel that is configured, and reports
 * back whether at least one of them accepted it. Nothing here is required:
 * with no environment variables set the route still answers 200 with
 * delivered:false, and the page falls back to a pre-filled email so the lead
 * is never silently dropped.
 *
 * Environment variables (set them in Vercel → Project → Settings → Environment
 * Variables; every one is optional and independent):
 *
 *   LEAD_WEBHOOK_URL   A webhook that receives the full JSON record. This is
 *                      the Lofty path: point it at a Zapier "Catch Hook" and
 *                      have the Zap create the Lofty lead (and anything else).
 *   RESEND_API_KEY     API key from resend.com — enables the two email channels.
 *   LEAD_EMAIL_TO      Where the notification email goes (e.g. hugopalacios@kw.com).
 *   LEAD_EMAIL_FROM    Verified sender. Defaults to Resend's shared test sender,
 *                      which can only deliver to the Resend account's own address.
 *   LOFTY_PARSE_EMAIL  Lofty's lead-parsing inbox, if your account has one.
 *                      Gets a second, plainly formatted copy.
 */

const FIELDS = [
  "name", "phone", "email", "working_with_agent", "financing",
  "timeline", "home_to_sell", "visiting", "notes", "source", "page", "property"
];

const LABELS = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  working_with_agent: "Working with an agent",
  financing: "Financing",
  timeline: "Timeline",
  home_to_sell: "Has a home to sell",
  visiting: "Attending",
  notes: "Notes",
  source: "Came from",
  page: "Page",
  property: "Property"
};

function clean(body) {
  const rec = {};
  for (const f of FIELDS) {
    const v = body[f];
    rec[f] = typeof v === "string" ? v.trim().slice(0, 2000) : "";
  }
  rec.consent = body.consent === true;
  rec.submitted_at = new Date().toISOString();
  return rec;
}

function looksLikeEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function asText(rec) {
  const lines = [
    "OPEN HOUSE REGISTRATION",
    rec.property || "437 4th Avenue, Westwood, NJ 07675",
    ""
  ];
  for (const f of FIELDS) {
    if (f === "property") continue;
    if (rec[f]) lines.push(LABELS[f].padEnd(22) + rec[f]);
  }
  lines.push("Contact consent".padEnd(22) + (rec.consent ? "Yes" : "No"));
  lines.push("Submitted".padEnd(22) + rec.submitted_at);
  return lines.join("\n");
}

/** Lofty and most CRM parsers want bare Label: value lines and nothing else. */
function asParsable(rec) {
  const [first, ...rest] = (rec.name || "").split(" ");
  return [
    "Lead Type: Buyer",
    "Source: Open House - 437 4th Ave Westwood",
    "First Name: " + first,
    "Last Name: " + (rest.join(" ") || first),
    "Email: " + rec.email,
    "Phone: " + rec.phone,
    "Property: " + (rec.property || "437 4th Avenue, Westwood, NJ 07675"),
    "Comments: " + [
      rec.working_with_agent && "Agent: " + rec.working_with_agent,
      rec.financing && "Financing: " + rec.financing,
      rec.timeline && "Timeline: " + rec.timeline,
      rec.home_to_sell && "Home to sell: " + rec.home_to_sell,
      rec.visiting && "Attending: " + rec.visiting,
      rec.source && "Came from: " + rec.source,
      rec.notes
    ].filter(Boolean).join(" | ")
  ].join("\n");
}

/**
 * Lofty's "Create Lead" action, pre-mapped.
 *
 * Field names and enum values below are the real ones from Lofty's Zapier
 * action, so a Zap can map these one-to-one with no formatter steps. Two
 * fields are deliberately absent because they are account-specific dropdowns
 * you pick in Zapier: `group` (Segment) and `ownership` (Lead Ownership Level).
 */
const TIMEFRAME = {
  "Right away — 0 to 3 months": "1-3",
  "3 to 6 months": "3-6",
  "6 to 12 months": "6-12",
  "Just starting to look": "Just Looking"
};

function loftyMapping(rec) {
  const parts = (rec.name || "").trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || firstName;
  const selling = /^Yes/i.test(rec.home_to_sell || "");
  const consented = rec.consent === true;

  const note = [
    rec.working_with_agent && "Working with an agent: " + rec.working_with_agent,
    rec.financing && "Financing: " + rec.financing,
    rec.timeline && "Timeline: " + rec.timeline,
    rec.home_to_sell && "Home to sell: " + rec.home_to_sell,
    rec.visiting && "Attending: " + rec.visiting,
    rec.source && "Came from: " + rec.source,
    rec.notes && "Said: " + rec.notes,
    "Registered " + new Date(rec.submitted_at).toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"
  ].filter(Boolean).join("\n");

  return {
    firstName,
    lastName,
    email: rec.email,
    phone: rec.phone,
    source: "Open House - 437 4th Ave Westwood",
    leadType: selling ? "Seller" : "Buyer",
    tag: "437 4th Ave Open House",
    note,
    cityForBuyer: "Westwood",
    stateForBuyer: "NJ",
    timeFrameForBuyer: TIMEFRAME[rec.timeline] || "",
    // The consent checkbox on the form is the only thing that may switch these on.
    callOptIn: consented ? "true" : "false",
    textOptIn: consented ? "true" : "false",
    emailOptIn: consented ? "true" : "false",
    numberConsent: consented ? "USER_RECORDED" : "UNKNOWN_CONSENT"
  };
}

async function sendEmail(key, from, to, subject, text, replyTo) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  if (!res.ok) {
    throw new Error("Resend " + res.status + ": " + (await res.text()).slice(0, 300));
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = null; }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "Expected a JSON body." });
  }

  const rec = clean(body);
  if (!rec.name || !looksLikeEmail(rec.email)) {
    return res.status(400).json({ ok: false, error: "A name and a valid email are required." });
  }

  const {
    LEAD_WEBHOOK_URL,
    RESEND_API_KEY,
    LEAD_EMAIL_TO,
    LEAD_EMAIL_FROM,
    LOFTY_PARSE_EMAIL
  } = process.env;

  const from = LEAD_EMAIL_FROM || "437 4th Ave <onboarding@resend.dev>";
  const subject = "Open house registration — " + rec.name + " — 437 4th Ave";
  const delivered = [];
  const failed = [];

  const attempts = [];

  if (LEAD_WEBHOOK_URL) {
    attempts.push(["webhook", (async () => {
      const r = await fetch(LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rec, lofty: loftyMapping(rec) })
      });
      if (!r.ok) throw new Error("Webhook " + r.status);
    })()]);
  }

  if (RESEND_API_KEY && LEAD_EMAIL_TO) {
    attempts.push(["email", sendEmail(
      RESEND_API_KEY, from, LEAD_EMAIL_TO, subject, asText(rec), rec.email
    )]);
  }

  if (RESEND_API_KEY && LOFTY_PARSE_EMAIL) {
    attempts.push(["lofty-email", sendEmail(
      RESEND_API_KEY, from, LOFTY_PARSE_EMAIL,
      "New Lead: " + rec.name + " - 437 4th Ave Open House",
      asParsable(rec), rec.email
    )]);
  }

  const results = await Promise.allSettled(attempts.map(a => a[1]));
  results.forEach((r, i) => {
    const channel = attempts[i][0];
    if (r.status === "fulfilled") delivered.push(channel);
    else {
      failed.push(channel);
      console.error("[register] channel failed:", channel, r.reason && r.reason.message);
    }
  });

  // Always log the record itself: with zero channels configured, or every
  // channel down, this is what makes the lead recoverable from Vercel's logs.
  console.log("[register] " + JSON.stringify({ ...rec, delivered, failed }));

  return res.status(200).json({
    ok: true,
    delivered: delivered.length > 0,
    channels: delivered
  });
};
