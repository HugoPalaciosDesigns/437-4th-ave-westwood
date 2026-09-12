# 437 4th Avenue, Westwood NJ — property site

A single-page property site: hero, open-house times, photo gallery with lightbox,
the barn feature, 3D Matterport tour, floor plans, payment estimates, neighborhood
data, open-house registration, and an agent/funnel section.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.
It will run from any static host, or straight off a USB stick.

```
site/
  index.html          the page (source of truth)
  styles.css          design tokens + all styling; light and dark themes
  app.js              gallery, lightbox, plan tabs, tour, form  ← CONFIG is at the top
  img/
    hero.jpg          virtual twilight exterior (hero)
    hero-day.jpg      daylight exterior (spare hero)
    full/01–34.jpg    1700px gallery images
    thumb/01–34.jpg   760px grid thumbnails
    plan/*.jpg        first / second / basement / all
    agent/hugo.jpg    headshot
  build_artifact.py   regenerates build/artifact.html for publishing as a Claude Artifact
  build/              generated — not edited by hand
```

## 1. Make the registration form deliver

Out of the box the form works with **no backend**: every registration is saved in the
visitor's browser and a pre-filled email to `hugopalacios@kw.com` opens for them to
send. That is a safety net, not a system — it depends on the visitor pressing send.

To capture leads properly, open `app.js` and set one value on line ~18:

```js
const FORM_ENDPOINT = "https://formspree.io/f/xxxxxxxx";
```

Any service that accepts a JSON `POST` works. The fastest is
[Formspree](https://formspree.io) — free tier, about two minutes:

1. Sign up, create a form, choose **437 4th Ave — Open House**.
2. Copy the endpoint URL it gives you.
3. Paste it as `FORM_ENDPOINT` and re-upload `app.js`.

Registrations then arrive in your inbox and in the Formspree dashboard, and the
visitor sees a clean "You're registered" confirmation instead of an email draft.

Alternatives that work identically: Getform, Basin, Web3Forms, or a Google Apps
Script web app writing rows into a Google Sheet.

### The door sign-in sheet

Every registration is also stored on the device that submitted it. On the iPad or
phone you hand people at the door, open the site with `#signins` on the end of the
URL — e.g. `https://…/#signins` — to see everyone who signed in on that device and
download them as a CSV.

## 2. Publish it

Any static host. The whole folder is ~10 MB.

| Host | How |
| --- | --- |
| **Vercel** | Drag the `site` folder onto vercel.com/new, or `vercel --prod` inside it |
| **Netlify** | Drag the `site` folder onto app.netlify.com/drop |
| **Cloudflare Pages** | Upload the folder as a direct-upload project |
| **GitHub Pages** | Commit `site/` and enable Pages on that folder |

A short custom domain reads much better on a QR code and a yard sign — something
like `437fourth.com` or `westwoodbarnhouse.com`.

## 3. Before it goes public — check these

- [ ] **Broker compensation.** The open-house card states *2.0% − $300*, taken from
      your agent info sheet. Confirm you want that figure on a page buyers can read;
      if not, delete that `<span class="note">` line in `index.html`.
- [ ] **Disclosures.** The site *promises* the seller's disclosure and lead-paint
      disclosure on request; it does not host them. Those PDFs carry the seller's
      name and signature, so they are handled by you, not posted.
- [ ] **Twilight photo.** Disclosed in the footer as virtually enhanced, per MLS rules.
- [ ] **Financing numbers.** Dated 9/9/2026 in the copy. Refresh the rates, or drop
      the section, once they are stale.
- [ ] **School ratings.** Third-party, presented as data with a "verify with the
      district" note — keep that note.
- [ ] **Brokerage compliance.** Run the page past your broker for the required KW
      branding, license number and any state-specific disclosure your office wants.

## 4. Editing

- **Photo captions and ordering** — the `PHOTOS` array at the top of `app.js`.
  `g` is the filter group, `c` is the caption, `feature: true` makes it span two
  columns in the grid.
- **Colors and type** — the `:root` token block at the top of `styles.css`.
  Change a token once and it updates everywhere, in both light and dark themes.
- **Open house dates** — the three `.oh-card` blocks in `index.html`. The
  `data-end` timestamp on each greys the card out automatically once it has passed.
