/* ─────────────────────────────────────────────────
   Discord Profile Viewer · app.js
   Uses /api/user/:id  (Vercel serverless proxy)
   ───────────────────────────────────────────────── */

const $ = id => document.getElementById(id);

// ── Discord flag bits → badge labels ────────────
const FLAGS = {
  1 << 0:   'Staff',
  1 << 1:   'Partner',
  1 << 2:   'HypeSquad Events',
  1 << 6:   'HypeSquad Bravery',
  1 << 7:   'HypeSquad Brilliance',
  1 << 8:   'HypeSquad Balance',
  1 << 3:   'Bug Hunter',
  1 << 14:  'Bug Hunter Lv.2',
  1 << 17:  'Early Supporter',
  1 << 19:  'Verified Bot Dev',
  1 << 22:  'Active Developer',
};

function getBadges(flags) {
  return Object.entries(FLAGS)
    .filter(([bit]) => (flags & parseInt(bit)) !== 0)
    .map(([, label]) => label);
}

// ── Snowflake → timestamp ────────────────────────
function snowflakeToDate(id) {
  try {
    const ms = BigInt(id) >> 22n;
    return new Date(Number(ms) + 1420070400000);
  } catch { return null; }
}

function formatDate(date) {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Avatar URL builder ───────────────────────────
function avatarUrl(id, hash, size = 256) {
  if (!hash) {
    const idx = (BigInt(id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png?size=${size}`;
  }
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=${size}`;
}

// ── Banner URL builder ───────────────────────────
function bannerUrl(id, hash, size = 600) {
  if (!hash) return null;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${id}/${hash}.${ext}?size=${size}`;
}

// ── Main lookup ──────────────────────────────────
async function lookupUser() {
  const rawId = $('userId').value.trim().replace(/\D/g, '');
  if (!rawId || rawId.length < 17 || rawId.length > 20) {
    showError('Please enter a valid Discord User ID (17–20 digits).');
    return;
  }

  showLoading(true);
  hideError();
  hideProfile();

  try {
    const res = await fetch(`/api/user/${rawId}`);

    let data;
    try {
      data = await res.json();
    } catch {
      showError(`Error ${res.status}: Response was not valid JSON. Check your DISCORD_TOKEN env variable is set in Vercel.`);
      showLoading(false);
      return;
    }

    if (!res.ok) {
      const msg = data?.message || data?.error || 'User not found.';
      showError(`Error ${res.status}: ${msg}`);
      showLoading(false);
      return;
    }

    renderProfile(data);
  } catch (err) {
    showError(`Request failed: ${err.message}. Check the browser console (F12) for details.`);
  }

  showLoading(false);
}

// ── Render ───────────────────────────────────────
function renderProfile(u) {
  const id = u.id;

  // Sizes
  const sizes = [16, 64, 128, 256, 1024];
  const urls = {};
  sizes.forEach(s => { urls[s] = avatarUrl(id, u.avatar, s); });

  // Avatar previews
  $('avatarImg').src = urls[256];
  $('avatarSm').src  = urls[16];
  $('avatarMd').src  = urls[64];
  $('avatarLg').src  = urls[128];
  $('avatarXl').src  = urls[256];

  // Download links
  $('dlLink16').href   = urls[16];   $('dlLink16').download   = `${id}_16.png`;
  $('dlLink64').href   = urls[64];   $('dlLink64').download   = `${id}_64.png`;
  $('dlLink128').href  = urls[128];  $('dlLink128').download  = `${id}_128.png`;
  $('dlLink256').href  = urls[256];  $('dlLink256').download  = `${id}_256.png`;
  $('dlLink1024').href = urls[1024]; $('dlLink1024').download = `${id}_1024.png`;

  // Download PFP button
  $('downloadPfpBtn').onclick = () => downloadImage(urls[1024], `${id}_avatar.png`);

  // Banner
  const banner = $('profileBanner');
  const bUrl = bannerUrl(id, u.banner);
  if (bUrl) {
    banner.style.backgroundImage = `url(${bUrl})`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
  } else if (u.banner_color) {
    banner.style.background = u.banner_color;
  } else {
    banner.style.background = '';
  }

  // Names
  const globalName = u.global_name || u.username || '—';
  $('displayName').textContent = globalName;
  $('username').textContent = `@${u.username || '—'}`;
  $('userId-display').textContent = id;
  $('createdAt').textContent = formatDate(snowflakeToDate(id));

  // Badges
  const badgeRow = $('badgeRow');
  badgeRow.innerHTML = '';
  const badges = getBadges(u.public_flags || 0);
  if (u.bot) badges.unshift('Bot');
  badges.forEach(b => {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = b;
    badgeRow.appendChild(span);
  });

  // Bio
  if (u.bio && u.bio.trim()) {
    $('bioText').textContent = u.bio;
    $('bioBlock').style.display = '';
  } else {
    $('bioBlock').style.display = 'none';
  }

  // Accent color
  if (u.accent_color) {
    const hex = '#' + u.accent_color.toString(16).padStart(6, '0');
    $('accentSwatch').style.background = hex;
    $('accentSwatch').title = hex;
    $('decorationRow').hidden = false;
  } else {
    $('decorationRow').hidden = true;
  }

  // Copy buttons
  $('copyNameBtn').onclick = () => {
    copyText(u.username || globalName);
    $('copyNameBtn').classList.add('copied');
    setTimeout(() => $('copyNameBtn').classList.remove('copied'), 1800);
  };
  $('copyIdBtn').onclick = () => copyText(id);

  showProfile();
}

// ── Download helper ──────────────────────────────
function downloadImage(url, filename) {
  // Fetch as blob to force download (avoids tab open)
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      // Fallback: open in new tab
      window.open(url, '_blank');
    });
}

// ── Copy helper ──────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
}

// ── Toast ────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ── State helpers ────────────────────────────────
function showLoading(v) {
  $('loadingState').hidden = !v;
  $('searchBtn').disabled = v;
}
function hideError() { $('errorState').hidden = true; }
function showError(msg) {
  $('errorMsg').textContent = msg;
  $('errorState').hidden = false;
}
function hideProfile() { $('profileSection').hidden = true; }
function showProfile() { $('profileSection').hidden = false; }

// ── Enter key support ────────────────────────────
$('userId').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupUser();
});
