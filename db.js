/* ════════════════════════════════════════════════
   BAVLY CMS — db.js v5  (Supabase Backend)
   All data reads/writes go to Supabase REST API.
   Works identically on every device & browser.
════════════════════════════════════════════════ */

const DB = (() => {
  'use strict';

  // ── CONFIG ──────────────────────────────────────
  const SUPABASE_URL = 'https://bdqntkshtdqwoektxhhb.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcW50a3NodGRxd29la3R4aGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDE0NzMsImV4cCI6MjA4Nzc3NzQ3M30.-COvtEDw2eUSGvjioexZ_vVEfgazY1Xsia7ZgFpWK6g';

  const HEADERS = {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  // ── LOW-LEVEL SUPABASE REST HELPERS ─────────────

  async function sbRequest(method, table, opts = {}) {
    const { filter, body, single } = opts;
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    if (filter) url += `?${filter}`;

    const res = await fetch(url, {
      method,
      headers: {
        ...HEADERS,
        ...(single ? { Accept: 'application/vnd.pgrst.object+json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase ${method} ${table}: ${res.status} — ${err}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // ── IN-MEMORY CACHE (30-second TTL) ────────────
  const _cache = {};
  function cacheGet(table) {
    const entry = _cache[table];
    if (entry && (Date.now() - entry.ts) < 30000) return entry.data;
    return null;
  }
  function cacheSet(table, data) { _cache[table] = { data, ts: Date.now() }; }
  function cacheClear(table) { delete _cache[table]; }

  // SELECT all rows, ordered by sort_order then created_at
  async function sbGetAll(table) {
    const cached = cacheGet(table);
    if (cached) return cached;
    const data = await sbRequest('GET', table, {
      filter: 'order=sort_order.asc,created_at.desc',
    }) || [];
    cacheSet(table, data);
    return data;
  }

  // SELECT one row by id
  async function sbGetOne(table, id) {
    const rows = await sbRequest('GET', table, {
      filter: `id=eq.${encodeURIComponent(id)}`,
    });
    return (rows && rows[0]) || null;
  }

  // INSERT a row
  async function sbInsert(table, row) {
    cacheClear(table);
    const rows = await sbRequest('POST', table, { body: row });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  // UPDATE a row by id
  async function sbUpdate(table, id, updates) {
    cacheClear(table);
    const rows = await sbRequest('PATCH', table, {
      filter: `id=eq.${encodeURIComponent(id)}`,
      body: updates,
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  // DELETE a row by id
  async function sbDelete(table, id) {
    cacheClear(table);
    return sbRequest('DELETE', table, {
      filter: `id=eq.${encodeURIComponent(id)}`,
    });
  }

  // ── FIELD NAME MAPPING ──────────────────────────
  // Supabase uses snake_case columns; JS objects use camelCase.
  // Each collection defines toRow() (JS → DB) and fromRow() (DB → JS).

  const MAPS = {

    design: {
      toRow: (o) => ({
        id:          o.id,
        title:       o.title,
        category:    o.category    || null,
        description: o.description || null,
        image:       o.image       || null,
        date:        o.date        || null,
        featured:    o.featured    || false,
        tags:        o.tags        || [],
        sort_order:  o.sort_order  || 0,
      }),
      fromRow: (r) => ({
        id:          r.id,
        title:       r.title,
        category:    r.category,
        description: r.description,
        image:       r.image,
        date:        r.date,
        featured:    r.featured,
        tags:        r.tags || [],
        sort_order:  r.sort_order,
      }),
    },

    video: {
      toRow: (o) => ({
        id:          o.id,
        title:       o.title,
        category:    o.category    || null,
        description: o.description || null,
        embed_url:   o.embedUrl    || null,
        thumbnail:   o.thumbnail   || null,
        duration:    o.duration    || null,
        date:        o.date        || null,
        featured:    o.featured    || false,
        tags:        o.tags        || [],
        links:       o.links       || [],
        sort_order:  o.sort_order  || 0,
      }),
      fromRow: (r) => ({
        id:          r.id,
        title:       r.title,
        category:    r.category,
        description: r.description,
        embedUrl:    r.embed_url,
        thumbnail:   r.thumbnail,
        duration:    r.duration,
        date:        r.date,
        featured:    r.featured,
        tags:        r.tags  || [],
        links:       r.links || [],
        sort_order:  r.sort_order,
      }),
    },

    violin: {
      toRow: (o) => ({
        id:          o.id,
        title:       o.title,
        composer:    o.composer    || null,
        type:        o.type        || null,
        description: o.description || null,
        media_url:   o.mediaUrl    || null,
        date:        o.date        || null,
        featured:    o.featured    || false,
        sort_order:  o.sort_order  || 0,
      }),
      fromRow: (r) => ({
        id:          r.id,
        title:       r.title,
        composer:    r.composer,
        type:        r.type,
        description: r.description,
        mediaUrl:    r.media_url,
        date:        r.date,
        featured:    r.featured,
        sort_order:  r.sort_order,
      }),
    },

    projects: {
      toRow: (o) => ({
        id:           o.id,
        title:        o.title,
        subtitle:     o.subtitle     || null,
        icon:         o.icon         || '⚙️',
        status:       o.status       || 'complete',
        status_label: o.statusLabel  || null,
        description:  o.description  || null,
        tech_stack:   o.techStack    || [],
        features:     o.features     || [],
        links:        o.links        || {},
        images:       o.images       || [],
        pdfs:         o.pdfs         || [],
        extra_links:  o.extraLinks   || [],
        date:         o.date         || null,
        featured:     o.featured     || false,
        sort_order:   o.sort_order   || 0,
      }),
      fromRow: (r) => ({
        id:          r.id,
        title:       r.title,
        subtitle:    r.subtitle,
        icon:        r.icon,
        status:      r.status,
        statusLabel: r.status_label,
        description: r.description,
        techStack:   r.tech_stack  || [],
        features:    r.features    || [],
        links:       r.links       || {},
        images:      r.images      || [],
        pdfs:        r.pdfs        || [],
        extraLinks:  r.extra_links || [],
        date:        r.date,
        featured:    r.featured,
        sort_order:  r.sort_order,
      }),
    },

    competitions: {
      toRow: (o) => ({
        id:          o.id,
        title:       o.title,
        scope:       o.scope       || null,
        icon:        o.icon        || '🏆',
        year:        o.year        || null,
        outcome:     o.outcome     || null,
        description: o.description || null,
        learned:     o.learned     || null,
        featured:    o.featured    || false,
        sort_order:  o.sort_order  || 0,
      }),
      fromRow: (r) => ({
        id:          r.id,
        title:       r.title,
        scope:       r.scope,
        icon:        r.icon,
        year:        r.year,
        outcome:     r.outcome,
        description: r.description,
        learned:     r.learned,
        featured:    r.featured,
        sort_order:  r.sort_order,
      }),
    },

    blog: {
      toRow: (o) => ({
        id:       o.id,
        title:    o.title,
        category: o.category || null,
        date:     o.date     || null,
        excerpt:  o.excerpt  || null,
        content:  o.content  || null,
        featured: o.featured || false,
        tags:     o.tags     || [],
        sort_order: o.sort_order || 0,
      }),
      fromRow: (r) => ({
        id:        r.id,
        title:     r.title,
        category:  r.category,
        date:      r.date,
        excerpt:   r.excerpt,
        content:   r.content,
        featured:  r.featured,
        tags:      r.tags || [],
        sort_order: r.sort_order,
      }),
    },
  };

  // ── ID GENERATOR ────────────────────────────────
  function newId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  // ── COLLECTION API FACTORY ───────────────────────
  function makeAPI(table) {
    const map = MAPS[table];

    return {
      // Get all items (returns JS camelCase objects)
      async getAll() {
        const rows = await sbGetAll(table);
        return rows.map(map.fromRow);
      },

      // Get one item by id
      async get(id) {
        const row = await sbGetOne(table, id);
        return row ? map.fromRow(row) : null;
      },

      // Add new item
      async add(item) {
        if (!item.id) item.id = newId(table.slice(0, 2));
        if (!item.date) item.date = new Date().toISOString().slice(0, 10);
        const row = map.toRow(item);
        const saved = await sbInsert(table, row);
        return saved ? map.fromRow(saved) : item;
      },

      // Update existing item by id
      async update(id, updates) {
        // Merge with existing to build a complete row for mapping
        const existing = await sbGetOne(table, id);
        if (!existing) throw new Error(`Item ${id} not found in ${table}`);
        const merged = { ...map.fromRow(existing), ...updates, id };
        const row = map.toRow(merged);
        delete row.id; // don't send id in the PATCH body
        const saved = await sbUpdate(table, id, row);
        return saved ? map.fromRow(saved) : merged;
      },

      // Delete item by id
      async delete(id) {
        return sbDelete(table, id);
      },
    };
  }

  // ── SECURITY: Input sanitization ────────────────
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
      .trim().slice(0, 5000);
  }

  function sanitizeUrl(url) {
    if (!url) return '';
    const t = url.trim();
    // Allow data URIs for images and audio, plus http/https/relative
    if (t.startsWith('data:image/') || t.startsWith('data:audio/') ||
        t.startsWith('https://')    || t.startsWith('http://')     ||
        t.startsWith('/')           || t.startsWith('./')) {
      return t.slice(0, 20000000); // 20MB char limit for audio base64
    }
    return '';
  }

  function sanitizeTags(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 20).map(t => sanitizeString(String(t)).slice(0, 50)).filter(Boolean);
  }

  // ── IMAGE COMPRESSION ───────────────────────────
  async function processImageUpload(file, maxWidth = 900, maxHeight = 900, quality = 0.78) {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) throw new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.');
    if (file.size > 10 * 1024 * 1024) throw new Error('File too large. Maximum size is 10MB.');

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/webp';
        resolve(canvas.toDataURL(type, quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image.')); };
      img.src = url;
    });
  }

  // ── SUPABASE STORAGE — AUDIO UPLOAD ─────────────
  // Uploads an audio file to the "audio" storage bucket and returns the public URL.
  // The bucket must be created in Supabase first (see supabase-setup.sql).
  async function uploadAudioFile(file, onProgress) {
    const AUDIO_TYPES = ['audio/mpeg','audio/mp3','audio/wav','audio/wave','audio/x-wav',
                         'audio/mp4','audio/m4a','audio/x-m4a','audio/aac',
                         'audio/ogg','audio/flac','audio/x-flac','audio/webm'];
    if (!AUDIO_TYPES.includes(file.type) && !file.type.startsWith('audio/')) {
      throw new Error('Invalid file type. Please upload an audio file (MP3, WAV, M4A, OGG, FLAC).');
    }
    const MAX = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX) throw new Error('File too large. Maximum audio size is 50MB.');

    // Build a unique path:  audio/timestamp-filename.ext
    const ext  = file.name.split('.').pop().toLowerCase() || 'mp3';
    const path = `audio/${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;

    // Upload via Supabase Storage REST API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/audio/${path}`;

    // Use XMLHttpRequest so we can track progress
    const publicUrl = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('apikey',        SUPABASE_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
      xhr.setRequestHeader('Content-Type',  file.type);
      xhr.setRequestHeader('x-upsert',      'true');

      if (onProgress) {
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 95));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          // Return the public URL
          const pub = `${SUPABASE_URL}/storage/v1/object/public/audio/${path}`;
          resolve(pub);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} — ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(file);
    });

    if (onProgress) onProgress(100);
    return publicUrl;
  }

  // ── PUBLIC API ───────────────────────────────────
  return {
    design:       makeAPI('design'),
    video:        makeAPI('video'),
    violin:       makeAPI('violin'),
    competitions: makeAPI('competitions'),
    blog:         makeAPI('blog'),
    projects:     makeAPI('projects'),

    sanitize: { string: sanitizeString, url: sanitizeUrl, tags: sanitizeTags },
    upload:   { processImage: processImageUpload, audioFile: uploadAudioFile },

    // Export everything as JSON (for backup)
    async exportAll() {
      const out = {};
      for (const key of ['design','video','violin','competitions','blog','projects']) {
        out[key] = await makeAPI(key).getAll();
      }
      return out;
    },
  };
})();

window.DB = DB;
