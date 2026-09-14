// Cloudflare Pages Function: POST /api/save-contacts
//
// Receives the full contacts array from the app and commits it to
// contacts.json in this repo via the GitHub Contents API. The GitHub
// token never reaches the browser — it only exists here, as a Cloudflare
// Pages secret.
//
// Required environment variables/secrets (set in the Cloudflare dashboard
// under Workers & Pages -> this project -> Settings -> Environment variables):
//
//   GITHUB_TOKEN     (secret, required) - fine-grained PAT scoped to this
//                     repo only, with Contents: Read and write permission.
//   ADMIN_PASSCODE   (secret, required) - shared passcode the app's Publish
//                     button sends as the X-Admin-Passcode header. Anyone
//                     who can reach this endpoint but doesn't know this
//                     value gets rejected.
//   GITHUB_OWNER     (plain text, optional) - defaults to "Bdrap"
//   GITHUB_REPO      (plain text, optional) - defaults to
//                     "Locksecure-QR-Business-Card"
//   GITHUB_BRANCH    (plain text, optional) - defaults to "main"
//
// This is a lightweight gate, not a full auth system — anyone who learns
// the passcode can publish. That's an intentional trade-off appropriate
// for a small internal tool maintained by 1-2 admins; it is NOT designed
// to withstand a determined attacker. Rotate the passcode if it leaks.

export async function onRequestPost(context) {
  const { request, env } = context;

  const jsonResponse = (body, status) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // --- auth check ---
  const suppliedPasscode = request.headers.get('X-Admin-Passcode') || '';
  if (!env.ADMIN_PASSCODE) {
    return jsonResponse({ error: 'Server not configured (missing ADMIN_PASSCODE secret)' }, 500);
  }
  if (suppliedPasscode !== env.ADMIN_PASSCODE) {
    return jsonResponse({ error: 'Incorrect admin passcode' }, 401);
  }

  if (!env.GITHUB_TOKEN) {
    return jsonResponse({ error: 'Server not configured (missing GITHUB_TOKEN secret)' }, 500);
  }

  // --- parse + validate body ---
  let entries;
  try {
    entries = await request.json();
    if (!Array.isArray(entries)) throw new Error('Body must be a JSON array');
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON body: ' + e.message }, 400);
  }

  const owner = env.GITHUB_OWNER || 'Bdrap';
  const repo = env.GITHUB_REPO || 'Locksecure-QR-Business-Card';
  const branch = env.GITHUB_BRANCH || 'main';
  const path = 'contacts.json';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'locksecure-qr-card-app',
  };

  try {
    // 1. Look up the current file's sha (required by GitHub to update an
    //    existing file; omitted entirely if the file doesn't exist yet).
    let sha;
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders });
    if (getRes.status === 200) {
      const current = await getRes.json();
      sha = current.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      throw new Error(`GitHub lookup failed (${getRes.status}): ${errText}`);
    }

    // 2. Build the new file content, base64-encoded (UTF-8 safe).
    const jsonText = JSON.stringify(entries, null, 2) + '\n';
    const content = btoa(unescape(encodeURIComponent(jsonText)));

    const putBody = {
      message: `Update contacts.json via app (${entries.length} contact${entries.length === 1 ? '' : 's'})`,
      content,
      branch,
    };
    if (sha) putBody.sha = sha;

    // 3. Commit it.
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`GitHub commit failed (${putRes.status}): ${errText}`);
    }

    const putData = await putRes.json();
    return jsonResponse({ ok: true, commit: putData.commit && putData.commit.sha }, 200);
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) }, 502);
  }
}

// Any method other than POST is not supported.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
}
