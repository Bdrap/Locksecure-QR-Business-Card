# Locksecure QR Business Card

A single-file, no-build web app for designing business cards and email
signatures in Locksecure's corporate style, generating QR codes (including
scannable vCard QR codes on each card), and browsing a shared team
directory of saved contacts.

Everything lives in **`index.html`** — no npm packages, no bundler, no
server-side code. Open the file in a browser, or host it as a static page.

## Features

- **Business Card designer** — Title, Name, Surname, Contact Number, Email
  (plus optional Company, Website, Address), rendered live onto a canvas in
  Locksecure's navy/bronze signature style, with 3 theme variants. Exports as
  PNG or as a `.vcf` contact file.
- **Email Signature designer** — reuses the same contact details and adds a
  second phone number, an editable "Our Offices" / "Our Hubs" city list, a
  stylised South Africa map graphic, and an editable legal disclaimer
  footer. The layout height is computed dynamically so it never overlaps
  regardless of how much text is entered.
- **QR code generator** — standalone tab for turning any text/URL into a
  downloadable QR code (via [QRious](https://github.com/neocotic/qrious)).
- **Team Directory** — browse saved contacts and download each one's
  business card PNG directly from the list. See **How the directory works**
  below.

## Running it

Just open `index.html` in a browser. It loads two things from a CDN at
runtime (both required, requires internet access):

- [QRious](https://cdnjs.com/libraries/qrious) — QR code generation
- Google Fonts (Barlow Condensed, Inter, IBM Plex Mono)

Everything else — canvas drawing, the icon shapes, the map graphic, vCard
encoding, and the directory logic — is plain JavaScript in the page itself.

## Hosting

Since it's a single static file with no build step, any static host works:

- **GitHub Pages** (this repo) — enable it under **Settings → Pages →
  Build and deployment → Deploy from a branch**, choose `main` and `/`
  (root). It'll serve at `https://<your-username>.github.io/<repo-name>/`
  because the file is named `index.html`.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the file or connect
  the repo.
- **Your own server** — upload `index.html` (and `contacts.json`) anywhere a
  web server can serve static files.

## How the directory works

The Team Directory is intentionally **read-mostly with an admin-controlled
write path**, so nobody has to run a server or expose a database
credential in the browser.

- On load, the app fetches **`contacts.json`** from right next to
  `index.html` and displays it. Anyone who opens the hosted page sees
  whatever is currently committed to that file — no login needed to view.
- There is **no live write-back to GitHub from the browser.** Editing or
  adding a contact in the app only updates an in-memory list for that
  browser session — it does not touch the file in the repo.

### If you're the admin maintaining the list

1. Open the hosted app (or `index.html` locally).
2. Go to **Team Directory** → **Reload from File** to make sure you're
   starting from the latest committed version.
3. Use **+ New Contact** / **Edit** / **Delete** as normal — these all just
   change your local in-session copy of the list.
4. When you're happy with it, click **Download contacts.json**.
5. Replace the `contacts.json` file in the repo with the one you just
   downloaded, and commit + push (or use GitHub's web UI to upload/replace
   the file directly — no special settings needed, just open the file in
   the repo and use the edit/upload button).
6. Anyone who reloads the hosted page now sees the update.

This deliberately avoids putting any GitHub credential in the page's
JavaScript — a token capable of writing to the repo would be visible to
anyone who opens dev tools, which is a much bigger risk than it looks. Since
only 1–2 people need to maintain this list, having them push the updated
JSON file directly is the simplest safe option.

### Supplying QR codes / cards to individual people

From the **Team Directory** list, each row has a **Download Card** button
that renders that person's business card (with their scannable QR code
baked in) straight to a PNG — no need to load them into the form first.
The intended flow is: admin downloads the card, then sends it to that
person directly (email, Slack, printed handout, etc.) — the app doesn't
need to do that distribution part itself.

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
just used for display ("updated 3 Sep 2026").

### If you want live shared editing instead

If down the line you want *anyone* using the hosted page to be able to hit
Save and have it stick for everyone (not just 1–2 admins editing and
pushing a file), you'd need a real backend — Firebase or Supabase are the
lightest-weight options — since that requires a write credential that can't
safely live in client-side JavaScript the way this JSON-file approach does.

## License

Internal tool for Locksecure. Add a license here if you intend to open this
repository up more broadly.
