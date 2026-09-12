/* -------------------------------------------------------------------------
   CONFIG

   Registrations POST to this site's own /api/register serverless function,
   which fans the lead out to whichever channels are configured as environment
   variables in the Vercel dashboard (see README): a webhook (Zapier -> Lofty),
   a notification email, and/or Lofty's lead-parsing address.

   If the API is unreachable or no channel is configured, the form falls back
   to opening a pre-filled email to Hugo, and the registration is still saved
   on the visitor's device. A lead is never silently dropped.

   Add "#signins" to the URL to review and export every registration collected
   on this device as a CSV.
   ------------------------------------------------------------------------- */
/* WEBHOOK_URL — paste a Zapier "Catch Hook" URL here and every registration
   posts straight to it from the browser, with no server involved. That is the
   Lofty path: one Zap, two actions (Gmail -> you, Lofty -> create the lead).
   Works on any host, including static ones. Leave it empty to use the
   /api/register serverless function instead (Vercel only). */
const WEBHOOK_URL   = "";
const API_ENDPOINT  = "/api/register";
const AGENT_EMAIL   = "hugopalacios@kw.com";
const AGENT_PHONE   = "973-670-7046";
const MATTERPORT    = "https://my.matterport.com/show/?m=VK7uKFxX1Vh";

/* --------------------------------------------------------------- photos --- */

const PHOTOS = [
  { n: "02", g: "exterior", c: "The gambrel roofline at dusk — virtually enhanced twilight", feature: true },
  { n: "01", g: "exterior", c: "437 4th Avenue from the street" },
  { n: "03", g: "exterior", c: "The covered front porch runs nearly 24 feet" },
  { n: "04", g: "exterior", c: "The front door, under the porch roof" },

  { n: "05", g: "living",   c: "Living room, looking back toward the front door" },
  { n: "22", g: "living",   c: "Afternoon light across the first floor" },
  { n: "06", g: "living",   c: "Living room through to the kitchen" },
  { n: "23", g: "living",   c: "The front room, with the porch beyond" },
  { n: "07", g: "living",   c: "Living room and staircase" },
  { n: "08", g: "living",   c: "Dining area" },
  { n: "09", g: "living",   c: "Dining area toward the kitchen" },
  { n: "10", g: "living",   c: "Dining area and kitchen doorway" },

  { n: "11", g: "kitchen",  c: "Updated kitchen: gas range, stainless appliances, pantry storage", feature: true },
  { n: "12", g: "kitchen",  c: "Kitchen, with pendants over the counter" },

  { n: "13", g: "bedrooms", c: "Primary bedroom with ductless mini-split" },
  { n: "14", g: "bedrooms", c: "Primary bedroom, toward the walk-in closet" },
  { n: "15", g: "bedrooms", c: "Second bedroom, two exposures" },
  { n: "16", g: "bedrooms", c: "Second bedroom toward the hall" },
  { n: "17", g: "bedrooms", c: "Closets and mini-split" },
  { n: "18", g: "bedrooms", c: "Built-in closet storage" },
  { n: "19", g: "bedrooms", c: "Upstairs, looking through to the bath" },

  { n: "20", g: "bath",     c: "Updated full bath: new vanity, sink, flooring and toilet" },
  { n: "21", g: "bath",     c: "Tub and shower, with a window" },

  { n: "24", g: "basement", c: "Finished basement family room" },
  { n: "25", g: "basement", c: "Family room with its own mini-split" },
  { n: "26", g: "basement", c: "Bonus room — office, gym, or guests" },
  { n: "27", g: "basement", c: "Bonus room, second angle" },
  { n: "28", g: "basement", c: "Separate laundry and utility room" },

  { n: "29", g: "barn",     c: "Inside the barn: planked cathedral ceiling and an open floor", feature: true },
  { n: "34", g: "barn",     c: "The barn at the back of the lot" },

  { n: "30", g: "yard",     c: "Paver patio, gazebo, and room to spread out", feature: true },
  { n: "31", g: "yard",     c: "The lawn runs the full depth of the lot" },
  { n: "32", g: "yard",     c: "Looking back at the house from the garden" },
  { n: "33", g: "yard",     c: "Gravel lounge and patio, framed by evergreens" }
];

const GROUPS = [
  { k: "all",      label: "All 34" },
  { k: "exterior", label: "Exterior & Porch" },
  { k: "living",   label: "Living & Dining" },
  { k: "kitchen",  label: "Kitchen" },
  { k: "bedrooms", label: "Bedrooms" },
  { k: "bath",     label: "Bath" },
  { k: "basement", label: "Finished Basement" },
  { k: "barn",     label: "The Barn" },
  { k: "yard",     label: "Backyard" }
];

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* -------------------------------------------------------------- gallery --- */

let view = PHOTOS.slice();

function renderFilters() {
  const box = $("#galFilters");
  if (!box) return;
  box.innerHTML = "";
  GROUPS.forEach((g, i) => {
    const count = g.k === "all" ? PHOTOS.length : PHOTOS.filter(p => p.g === g.k).length;
    if (!count) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = g.k === "all" ? g.label : g.label + " (" + count + ")";
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.addEventListener("click", () => {
      $$("#galFilters .chip").forEach(c => c.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      view = g.k === "all" ? PHOTOS.slice() : PHOTOS.filter(p => p.g === g.k);
      renderGallery();
    });
    box.appendChild(b);
  });
}

function renderGallery() {
  const grid = $("#gal");
  if (!grid) return;
  grid.innerHTML = "";
  view.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "gal-item" + (p.feature ? " wide" : "");
    b.setAttribute("aria-label", "Open photo: " + p.c);
    b.innerHTML =
      '<img src="img/thumb/' + p.n + '.jpg" alt="' + escapeAttr(p.c) + '" loading="' +
      (i < 4 ? "eager" : "lazy") + '" decoding="async" width="760" height="507">' +
      '<figcaption>' + escapeHtml(p.c) + '</figcaption>';
    b.addEventListener("click", () => openLb(i));
    grid.appendChild(b);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------- lightbox --- */

let lbIndex = 0, lastFocus = null;

function openLb(i) {
  lbIndex = i;
  lastFocus = document.activeElement;
  $("#lb").classList.add("is-open");
  document.body.style.overflow = "hidden";
  paintLb();
  $("#lbClose").focus();
}
function closeLb() {
  $("#lb").classList.remove("is-open");
  document.body.style.overflow = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function stepLb(d) {
  lbIndex = (lbIndex + d + view.length) % view.length;
  paintLb();
}
function paintLb() {
  const p = view[lbIndex];
  const img = $("#lbImg");
  img.src = "img/full/" + p.n + ".jpg";
  img.alt = p.c;
  $("#lbCap").textContent = p.c;
  $("#lbCount").textContent = (lbIndex + 1) + " / " + view.length;
  // warm the neighbours so paging feels instant
  [1, -1].forEach(d => {
    const q = view[(lbIndex + d + view.length) % view.length];
    new Image().src = "img/full/" + q.n + ".jpg";
  });
}

function wireLightbox() {
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => stepLb(-1));
  $("#lbNext").addEventListener("click", () => stepLb(1));
  $("#lb").addEventListener("click", e => { if (e.target.id === "lb" || e.target.classList.contains("lb-stage")) closeLb(); });

  document.addEventListener("keydown", e => {
    if (!$("#lb").classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") stepLb(1);
    else if (e.key === "ArrowLeft") stepLb(-1);
  });

  let x0 = null;
  const stage = $(".lb-stage");
  stage.addEventListener("touchstart", e => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) stepLb(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
}

/* ---------------------------------------------------------- floor plans --- */

const PLAN_ALT = {
  first:    "First floor plan: porch, living room, dining area, kitchen with pantry, and rear deck.",
  second:   "Second floor plan: primary bedroom, second bedroom, full bath and walk-in closet.",
  basement: "Finished basement plan: family room, bonus room, and laundry and utility room.",
  all:      "All three levels shown together."
};

function wirePlans() {
  $$("#planTabs .chip").forEach(tab => {
    tab.addEventListener("click", () => {
      $$("#planTabs .chip").forEach(t => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");
      const k = tab.dataset.plan;
      const img = $("#planImg");
      img.src = "img/plan/" + k + ".jpg";
      img.alt = PLAN_ALT[k];
    });
  });
}

/* ----------------------------------------------------------------- tour --- */

function wireTour() {
  const btn = $("#tourBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const shell = $("#tourShell");
    const f = document.createElement("iframe");
    f.src = MATTERPORT + "&play=1&brand=0";
    f.title = "3D Matterport walkthrough of 437 4th Avenue";
    f.allow = "fullscreen; xr-spatial-tracking";
    f.allowFullscreen = true;
    shell.innerHTML = "";
    shell.appendChild(f);
    // If the tour cannot be framed here, send them to the real thing.
    setTimeout(() => {
      try {
        if (!f.contentWindow) window.open(MATTERPORT, "_blank", "noopener");
      } catch (_) { /* cross-origin is the expected, healthy case */ }
    }, 2500);
  });
}

/* ------------------------------------------------------------ open house --- */

function wireOpenHouse() {
  const cards = $$("#ohGrid .oh-card");
  const now = new Date();
  let upcoming = 0;
  cards.forEach(c => {
    const end = new Date(c.dataset.end);
    if (end < now) c.classList.add("is-past");
    else upcoming++;
  });
  const pill = $("#ohPill");
  if (pill && !upcoming) pill.textContent = "Private showings available";
}

/* ---------------------------------------------------------------- chrome --- */

function wireChrome() {
  const bar = $("#topbar");
  const onScroll = () => bar.classList.toggle("is-stuck", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

let toastTimer;
function toast(msg, ms) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), ms || 4200);
}


/* ---------------------------------------------------------------- docs --- */

const UNLOCK_KEY = "oh437-unlocked";

const DOCS = [
  { f: "437-4th-Ave-Features-and-Amenities.pdf",               t: "Features & Amenities",                   d: "Every feature of the house, inside and out \u2014 1 page" },
  { f: "437-4th-Ave-Floor-Plans.pdf",                          t: "Floor Plans & Room Dimensions",          d: "All three levels, measured \u2014 1 page" },
  { f: "437-4th-Ave-Financing-Options.pdf",                    t: "Financing Options",                      d: "FHA, 10% and 20% down, side by side \u2014 1 page" },
  { f: "437-4th-Ave-Payment-Illustration.pdf",                 t: "Estimated Monthly Payment",              d: "Principal & interest at sample rates \u2014 1 page" },
  { f: "437-4th-Ave-Flyer-and-Neighborhood-Report.pdf",        t: "Property Flyer & Neighborhood Report",   d: "Walkability, schools, parks and dining \u2014 2 pages" },
  { f: "437-4th-Ave-Sellers-Property-Condition-Disclosure.pdf", t: "Seller's Property Condition Disclosure", d: "The seller's own statements about the property" },
  { f: "437-4th-Ave-Lead-Paint-Disclosure.pdf",                t: "Lead Paint Disclosure",                  d: "Federally required for homes built before 1978" }
];

const ICON_FILE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
const ICON_LOCK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const ICON_OPEN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

function isUnlocked() {
  try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (_) { return false; }
}

function renderDocs() {
  const list = $("#docs");
  if (!list) return;
  const open = isUnlocked();
  list.innerHTML = "";

  DOCS.forEach(doc => {
    const li = document.createElement("li");
    const inner =
      '<span class="ic">' + (open ? ICON_FILE : ICON_LOCK) + '</span>' +
      '<span class="meta"><b>' + escapeHtml(doc.t) + '</b><span>' + escapeHtml(doc.d) + '</span></span>' +
      '<span class="act">' + (open ? "Open \u2197" : "Locked") + '</span>';

    let row;
    if (open) {
      row = document.createElement("a");
      row.href = "docs/" + doc.f;
      row.target = "_blank";
      row.rel = "noopener";
    } else {
      row = document.createElement("span");
    }
    row.className = "row";
    row.innerHTML = inner;
    li.appendChild(row);
    list.appendChild(li);
  });

  $("#packet").classList.toggle("is-locked", !open);
  const state = $("#packetState");
  state.className = "state " + (open ? "open" : "locked");
  state.innerHTML = (open ? ICON_OPEN : ICON_LOCK) +
    '<span id="packetStateText">' + (open ? "Unlocked" : "Locked") + '</span>';

  if (open) {
    $("#packetWhy").textContent = "All seven documents are open on this device.";
    const cta = $("#packetCta");
    cta.textContent = "Questions? Call " + AGENT_PHONE;
    cta.setAttribute("href", "tel:+19736707046");
  }
}

function unlockPacket() {
  try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (_) { /* unlocked for this view only */ }
  renderDocs();
}

/* --------------------------------------------------------------- source --- */
/* The QR code links to /?src=qr so door traffic is distinguishable from social. */

function leadSource() {
  try {
    const q = new URLSearchParams(window.location.search).get("src");
    if (q) return q.slice(0, 40);
  } catch (_) { /* ignore */ }
  const r = document.referrer || "";
  if (!r) return "direct";
  try { return "referral:" + new URL(r).hostname; } catch (_) { return "referral"; }
}

/* ------------------------------------------------------------------ form --- */

const STORE_KEY = "oh437-signins";

function loadSignins() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
  catch (_) { return []; }
}
function saveSignin(rec) {
  try {
    const all = loadSignins();
    all.push(rec);
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch (_) { /* private browsing — the email handoff still carries the lead */ }
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function validPhone(v) { return (v.match(/\d/g) || []).length >= 10; }

function setError(name, msg) {
  const slot = $('[data-err="' + name + '"]');
  const input = $('[name="' + name + '"]');
  if (slot) slot.textContent = msg || "";
  if (input) {
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }
}

function readForm(form) {
  const fd = new FormData(form);
  const rec = {};
  ["name", "phone", "email", "working_with_agent", "financing", "timeline", "home_to_sell", "visiting", "notes"]
    .forEach(k => { rec[k] = (fd.get(k) || "").toString().trim(); });
  rec.consent = form.querySelector("#f-consent").checked;
  rec.property = "437 4th Avenue, Westwood, NJ 07675";
  rec.source = leadSource();
  rec.page = window.location.href;
  rec.submitted_at = new Date().toISOString();
  return rec;
}

function mailtoFor(rec) {
  const lines = [
    "OPEN HOUSE REGISTRATION — 437 4th Avenue, Westwood NJ",
    "",
    "Name:              " + rec.name,
    "Phone:             " + rec.phone,
    "Email:             " + rec.email,
    "Working w/ agent:  " + (rec.working_with_agent || "—"),
    "Financing:         " + (rec.financing || "—"),
    "Timeline:          " + (rec.timeline || "—"),
    "Home to sell:      " + (rec.home_to_sell || "—"),
    "Visiting:          " + (rec.visiting || "—"),
    "Notes:             " + (rec.notes || "—"),
    "Contact consent:   " + (rec.consent ? "Yes" : "No"),
    "Came from:         " + (rec.source || "—"),
    "Submitted:         " + new Date(rec.submitted_at).toLocaleString()
  ];
  return "mailto:" + AGENT_EMAIL +
    "?subject=" + encodeURIComponent("Open house registration — " + rec.name + " — 437 4th Ave") +
    "&body=" + encodeURIComponent(lines.join("\n"));
}

async function postLead(rec) {
  if (WEBHOOK_URL) {
    // Zapier catch hooks accept a cross-origin POST and answer with CORS
    // headers, so this works from any host without a server of our own.
    const r = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec)
    });
    if (!r.ok) throw new Error("Webhook returned " + r.status);
    return true;
  }

  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rec)
  });
  if (!res.ok) throw new Error("Register endpoint returned " + res.status);
  const body = await res.json().catch(() => ({}));
  // The route answers delivered:false when no channel is configured yet, so the
  // visitor still gets their packet and the lead still reaches Hugo by email.
  return body.delivered === true;
}

function wireForm() {
  const form = $("#regForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const rec = readForm(form);
    let bad = null;

    setError("name", ""); setError("phone", ""); setError("email", ""); setError("consent", "");

    if (!rec.name) { setError("name", "Please tell me your name."); bad = bad || "#f-name"; }
    if (!validPhone(rec.phone)) { setError("phone", "A 10-digit mobile number, please."); bad = bad || "#f-phone"; }
    if (!validEmail(rec.email)) { setError("email", "That email address doesn't look right."); bad = bad || "#f-email"; }
    if (!rec.consent) { setError("consent", "I need your permission before I can follow up."); bad = bad || "#f-consent"; }

    if (bad) { $(bad).focus(); return; }

    const btn = $("#regSubmit");
    btn.disabled = true;
    btn.textContent = "Sending…";

    saveSignin(rec);

    let delivered = false;
    try { delivered = await postLead(rec); }
    catch (err) { delivered = false; }

    unlockPacket();

    form.classList.add("is-off");
    $("#regDone").classList.add("is-on");

    if (delivered) {
      $("#regDoneMsg").innerHTML =
        "Thanks, " + escapeHtml(rec.name.split(" ")[0]) + " — you're registered and the buyer packet is now unlocked. " +
        '<a href="#documents" style="font-weight:600">Open all seven documents →</a>';
    } else {
      $("#regDoneMsg").innerHTML =
        "Thanks, " + escapeHtml(rec.name.split(" ")[0]) + " — the buyer packet is unlocked. " +
        '<a href="#documents" style="font-weight:600">Open all seven documents →</a><br><br>' +
        "One last step so I actually receive your details: your email app is opening with the registration filled in — please press send. " +
        'Or just call or text me at <a href="tel:+19736707046" style="font-weight:600">' + AGENT_PHONE + "</a>.";
      window.location.href = mailtoFor(rec);
    }

    $("#regDone").scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

/* -------------------------------------------------- sign-in sheet export --- */
/* Add #signins to the URL on the device you collect sign-ins with.           */

function wireSigninSheet() {
  if (window.location.hash !== "#signins") return;
  const all = loadSignins();
  const host = $("#register .wrap");
  const box = document.createElement("div");
  box.className = "disclaimer";
  box.style.marginTop = "2rem";

  if (!all.length) {
    box.innerHTML = "<b>Sign-in sheet</b><br>No registrations have been collected on this device yet.";
    host.appendChild(box);
    return;
  }

  const cols = ["submitted_at", "name", "phone", "email", "working_with_agent", "financing", "timeline", "home_to_sell", "visiting", "consent", "notes"];
  const csv = [cols.join(",")].concat(
    all.map(r => cols.map(c => '"' + String(r[c] == null ? "" : r[c]).replace(/"/g, '""') + '"').join(","))
  ).join("\r\n");

  box.innerHTML = "<b>Sign-in sheet — " + all.length + " registration" + (all.length === 1 ? "" : "s") +
    " on this device</b><br>" + all.map(r => escapeHtml(r.name + " · " + r.phone + " · " + r.email)).join("<br>");

  const dl = document.createElement("a");
  dl.className = "btn btn-primary";
  dl.style.marginTop = "1rem";
  dl.textContent = "Download CSV";
  dl.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  dl.download = "437-4th-ave-signins.csv";
  box.appendChild(document.createElement("br"));
  box.appendChild(dl);
  host.appendChild(box);
}

/* ------------------------------------------------------------------ boot --- */

function boot() {
  renderDocs();
  renderFilters();
  renderGallery();
  wireLightbox();
  wirePlans();
  wireTour();
  wireOpenHouse();
  wireChrome();
  wireForm();
  wireSigninSheet();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
