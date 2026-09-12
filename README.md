# 437 4th Avenue, Westwood NJ — property site

Open-house property site with a registration-gated buyer packet and lead capture
that fans out to email and Lofty.

Plain HTML, CSS and JavaScript plus one serverless function. No build step, no
framework, no dependencies. Runs on any static host; the `/api` route needs
Vercel (or any Node serverless host).

```
index.html          the page (source of truth)
styles.css          design tokens + all styling; light and dark themes
app.js              gallery, lightbox, packet unlock, form   ← CONFIG at the top
api/register.js     lead intake: webhook + email + Lofty fan-out
vercel.json         headers and caching
docs/               the 7 buyer-packet PDFs
img/                hero, 34 gallery photos (full + thumb), floor plans, headshot
qr/                 generated QR code and printable sign
make_qr.py          regenerates qr/ for a given URL
build_artifact.py   regenerates build/artifact.html for publishing as an Artifact
```

## 1. Lead delivery — pick one of two paths

Both are built. **A** needs no server and works anywhere. **B** keeps everything
on your own domain. You can run both.

### A. Direct webhook (simplest, recommended)

One Zapier Zap sends the lead to your inbox *and* creates the Lofty lead.

1. In Zapier, create a Zap. Trigger: **Webhooks by Zapier → Catch Hook**. Copy
   the hook URL it gives you.
2. Action 1: **Lofty → Create Lead**. Map `name`, `email`, `phone`, and put the
   rest in the notes/comments field.
3. Action 2: **Gmail → Send Email** to yourself, so you get it on your phone
   while you are still standing at the door.
4. Open `app.js` and paste the hook URL on line ~17:

   ```js
   const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/000000/abcdef/";
   ```

5. Commit and push. Vercel redeploys on push.

### B. The serverless route

Leave `WEBHOOK_URL` empty and the form posts to `/api/register`, which fans the
lead out to whichever of these you set in **Vercel → Project → Settings →
Environment Variables**. Every one is optional and independent:

| Variable | What it does |
| --- | --- |
| `LEAD_WEBHOOK_URL` | Forwards the full JSON record. Point it at the same Zapier catch hook as above. |
| `RESEND_API_KEY` | API key from resend.com — switches on the two email channels. |
| `LEAD_EMAIL_TO` | Where your notification lands, e.g. `HugoPalacios@kw.com`. |
| `LEAD_EMAIL_FROM` | Verified sender. Defaults to Resend's shared test sender, which can only deliver to the Resend account's own address — set a real one once your domain is verified. |
| `LOFTY_PARSE_EMAIL` | Lofty's lead-parsing inbox, if your account has one. Gets a second copy formatted as `Label: value` lines for the parser. |

### If nothing is configured

The form still works and still validates. The visitor's packet unlocks, the
registration is saved on their device, and a pre-filled email to you opens for
them to send. Every registration is also written to the Vercel runtime log, so
it is recoverable. **A lead is never silently dropped** — but until you finish
step A or B above, delivery depends on the visitor pressing send.

### The door sign-in sheet

Registrations are also stored on the device that submitted them. On the iPad or
phone you hand people at the door, open the site with `#signins` on the end of
the URL to list everyone who signed in on that device and export them as CSV.

## 2. The QR code

```bash
python make_qr.py https://your-real-url.com
```

Writes `qr/437-open-house-qr.svg` (use for print), `qr/437-open-house-qr.png`
(social, slides, MLS) and `qr/437-open-house-sign.html` — open that and print to
PDF, US Letter portrait.

The code encodes `/?src=qr#register`, so a scan lands straight on the form and
that lead arrives tagged `qr`, separate from social traffic. **Re-run this any
time the site URL changes**, including when you add a custom domain.

Requires `pip install segno`.

## 3. How the gate works

The property page is fully public — photos, story, 3D tour, floor plans,
payment estimates, neighborhood — so it previews properly when shared on
social. Only the **buyer packet** (7 PDFs) is gated. Registering unlocks it and
the unlock is remembered on that device.

This is a lead gate, not security. The PDFs sit at ordinary public URLs under
`/docs/`; someone determined can reach them directly. That is the normal
trade-off for an open-house funnel — the gate captures the 95% who play along
without breaking sharing or SEO.

## 4. Before more traffic hits it

- [ ] **Broker compensation.** The open-house card states *2.0% − $300*, from
      your agent info sheet. That figure is normally agent-facing — delete that
      `<span class="note">` line in `index.html` if you don't want it public.
- [ ] **Financing numbers** are dated 9/9/2026. Refresh or remove when stale.
- [ ] **Twilight photo** is disclosed in the footer as virtually enhanced.
- [ ] **School ratings** are third-party, shown as data with a "verify with the
      district" note. Keep that note.
- [ ] **Broker review.** Licenses (NJ 2078904 / NY 10401401027), the office
      address and Equal Housing are on the page; have your office confirm it
      meets KW's branding and NJ advertising rules.
- [ ] **Social links.** LinkedIn / Facebook / Instagram are not on the page yet
      — no URLs were supplied.
- [ ] **Logos.** The KW Luxury, HPG and NJ REALTORS award marks aren't included;
      the award is rendered typographically. Drop the image files in `img/` to
      swap them in.

## 5. Editing

- **Photo captions and order** — the `PHOTOS` array at the top of `app.js`.
  `g` is the filter group, `c` the caption, `feature: true` spans two columns.
- **Packet documents** — the `DOCS` array in `app.js`, files in `docs/`.
- **Colors and type** — the `:root` token block at the top of `styles.css`.
  Change a token once and it updates everywhere, in both themes.
- **Open house dates** — the three `.oh-card` blocks in `index.html`. The
  `data-end` timestamp greys each card out automatically once it has passed.
