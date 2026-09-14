# Locksecure QR Business Card

A single-file, no-build web app for designing business cards and email
signatures in Locksecure's corporate style, generating QR codes (including
scannable vCard QR codes on each card), and maintaining a shared team
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
- **Team Directory** — save, edit, and delete contact cards for a team. See
  **Important caveat** below before relying on this outside Claude.ai.

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
- **Your own server** — upload `index.html` anywhere a web server can serve
  static files.

## ⚠️ Important caveat: the Team Directory tab

The **Team Directory** feature (save/list/edit/delete contacts) is built on
`window.storage`, a key-value storage API that Claude.ai injects into
artifacts it renders. **It is not a standard browser API.**

- Inside a Claude.ai artifact, it works and persists data in Claude's own
  shared storage for that artifact.
- Hosted anywhere else (GitHub Pages, your own server, etc.), `window.storage`
  is `undefined`. The tab will still render, but Save/Load/Delete will fail
  with an on-screen error (the code catches the exception rather than
  crashing the page) — no data will actually persist.

The **Business Card**, **Email Signature**, and **Quick QR Code** tabs do
not depend on this API and work identically everywhere.

### If you want the directory to work once hosted outside Claude.ai

You'll need to swap the storage backend for something real. Two
straightforward options:

1. **`localStorage`** — simplest change, but data is private to each
   visitor's own browser and device, not shared across a team.
2. **A real backend** (Firebase, Supabase, or a small REST API) — actual
   shared, persistent storage across everyone who uses the hosted page, at
   the cost of setting up an account/API key and updating the `saveCurrentCard`,
   `loadDirectory`, and delete logic in `index.html` to call it instead of
   `window.storage`.

Happy to help implement either of these if you want the directory feature to
work on the hosted version.

## License

Internal tool for Locksecure. Add a license here if you intend to open this
repository up more broadly.
