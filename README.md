# Locksecure QR Business Card

A single-file, no-build web app for designing business cards and email
signatures in Locksecure's corporate style, generating QR codes (including
scannable vCard QR codes on each card), and maintaining a shared team
directory of saved contacts — with **live publishing** from the app itself.

The app is one file, **`index.html`** — no npm packages, no bundler. The
one piece of real backend is a small Cloudflare Pages Function
(`functions/api/save-contacts.js`) that holds a GitHub write token and
commits directory updates on the app's behalf.

## Features

- **Business Card designer** — Title, Name, Surname, Contact Number, Email
  (plus optional Company, Website, Address), rendered live onto a canvas in
  Locksecure's navy/bronze signature style, with 3 theme variants. Exports as
  PNG or as a `.vcf` contact file.
- **Email Signature designer** — reuses the same contact details and adds a
  second phone number, an editable "Our Offices" / "Our Hubs" city list, a
  stylised South Africa map graphic, and an editable legal disclaimer
  footer.
- **QR code generator** — standalone tab for turning any text/URL into a
  downloadable QR code (via [QRious](https://github.com/neocotic/qrious)).
- **Team Directory** — browse contacts, add/edit/delete them, and
  **Publish Changes** to update `contacts.json` live for everyone — no
  manual download/commit needed. Each row also has a **Download Card**
  button to grab that person's business card PNG (QR included) directly.

## Running it

Open `index.html` in a browser. It loads two things from a CDN at runtime:

- [QRious](https://cdnjs.com/libraries/qrious) — QR code generation
- Google Fonts (Barlow Condensed, Inter, IBM Plex Mono)

Everything else — canvas drawing, icons, the map graphic, vCard encoding,
and directory logic — is plain JavaScript in the page itself. The
**Publish Changes** button needs the Cloudflare Pages Function to be
deployed (see below) — without it, publishing will fail with a network/404
error, but everything else in the app still works.

## Hosting: Cloudflare Pages (required for live publishing)

The Team Directory's live **Publish Changes** button depends on a
same-origin API route, which means it only works when this site is served
by **Cloudflare Pages** with Pages Functions enabled (not GitHub Pages,
Netlify, or a plain static host — those don't run the function).

### 1. Connect the repo to Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
   Connect to Git**, and select this repository.
2. Build settings: **Framework preset: None**, **Build command: (leave
   blank)**, **Build output directory: `/`** (this is a static site with no
   build step — Cloudflare will still auto-detect the `functions/` folder
   and deploy it as Pages Functions).
3. Deploy. Every future `git push` to `main` auto-redeploys, including the
   function.

### 2. Create a GitHub token for the function to use

1. Go to **GitHub → Settings → Developer settings → Personal access tokens
   → Fine-grained tokens → Generate new token**.
2. Scope it to **only this repository**.
3. Under **Repository permissions**, set **Contents: Read and write**
   (nothing else is needed).
4. Generate it and copy the token — you won't see it again.

### 3. Add secrets in Cloudflare

In the Pages project: **Settings → Environment variables**, add these
(mark the first two as **Secret**, not plain text):

| Name             | Value                                          |
|------------------|-------------------------------------------------|
| `GITHUB_TOKEN`   | the fine-grained token from step 2              |
| `ADMIN_PASSCODE` | a passcode you make up and share with admins    |
| `GITHUB_OWNER`   | `Bdrap` (optional — this is already the default) |
| `GITHUB_REPO`    | `Locksecure-QR-Business-Card` (optional — already the default) |
| `GITHUB_BRANCH`  | `main` (optional — already the default) |

Redeploy after adding secrets (Cloudflare Pages picks up new environment
variables on the next deployment, not the currently-live one).

### 4. Use it

In the app's **Team Directory** tab, add/edit/delete contacts as needed,
type the admin passcode into the field next to **Publish Changes**, and
click it. The function commits the updated `contacts.json` straight to the
repo — Cloudflare Pages then auto-redeploys with the new file, and
everyone's next page load (or **Reload from File** click) sees it.

## How the directory data model works

- **`baseEntries`** — whatever was last fetched from `contacts.json`.
- **Session overrides/deletes** — anything you add, edit, or remove in the
  app during the current session, kept separately.
- The displayed/exported/published list is always these two merged
  together, so local edits are never silently lost or silently clobbered
  by a background fetch, regardless of the order you do things in.
- **Publish Changes** sends the merged list to the function; on success,
  it becomes the new baseline and session overrides are cleared (they're
  no longer "pending" — they're in the file).
- **Reload from File** explicitly discards session overrides and re-fetches
  `contacts.json` — the one action that intentionally throws away unsaved
  local edits.
- **Download contacts.json** remains available as a manual backup/export,
  independent of publishing.

### Why a passcode instead of real login

The passcode is a lightweight gate, not a full auth system — anyone who
knows it can publish, and it's sent from the browser on every publish
click (over HTTPS, but still client-supplied). That's an intentional,
proportionate trade-off for a tool maintained by 1–2 trusted admins without
standing up a real auth system. If that stops being an appropriate level of
protection, rotate the passcode via the Cloudflare secret, or replace the
passcode check in `functions/api/save-contacts.js` with real
authentication.

The GitHub token itself is never exposed to the browser under any
circumstance — it only exists as a Cloudflare secret, used server-side by
the function.

### `contacts.json` shape

```json
[
  {
    "id": "unique-id",
    "title": "Job Title",
    "name": "First",
    "surname": "Last",
    "phone": "+27 ...",
    "email": "person@locksecure.co.za",
    "company": "LOCKSECURE",
    "website": "www.locksecure.co.za",
    "address": "Optional office address",
    "theme": 0,
    "updatedAt": 1700000000000
  }
]
```

`theme` is the index into the app's 3 built-in themes (0 = Signature White,
1 = Navy Card, 2 = Ivory Bronze). `updatedAt` is a millisecond timestamp,
used only for display ("updated 3 Sep 2026").

## License

Internal tool for Locksecure. Add a license here if you intend to open this
repository up more broadly.
