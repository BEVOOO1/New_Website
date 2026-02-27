/* ════════════════════════════════════════════════════════════
   BAVLY CMS — db.js v4
   Supabase backend + localStorage fallback for local dev
   Google Drive URL auto-conversion built in

   SETUP STEPS:
   1. Go to https://supabase.com → create free account → new project
   2. In your Supabase project: SQL Editor → run the contents of setup.sql
   3. Go to Project Settings → API → copy Project URL and anon/public key
   4. Replace the two values below
   5. Push to GitHub → Netlify auto-deploys → done!
════════════════════════════════════════════════════════════ */

// ── ⚙️  YOUR CONFIG — fill these in ──────────────────────────
const SUPABASE_URL      = 'https://bdqntkshtdqwoektxhhb.supabase.co';       // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcW50a3NodGRxd29la3R4aGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDE0NzMsImV4cCI6MjA4Nzc3NzQ3M30.-COvtEDw2eUSGvjioexZ_vVEfgazY1Xsia7ZgFpWK6g';  // long eyJ... string
// ─────────────────────────────────────────────────────────────

/* ══════════════════════════════════════════
   GOOGLE DRIVE URL CONVERTER
   Paste any Drive share link — auto-converted
══════════════════════════════════════════ */
const GDrive = {
  // Extract the file ID from any Google Drive URL format
  extractId(url) {
    if (!url || typeof url !== 'string') return null;
    // /file/d/ID/  or  /d/ID/
    const m = url.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]{25,})/);
    if (m) return m[1];
    // ?id=ID
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
    if (m2) return m2[1];
    return null;
  },

  isDrive(url) {
    return !!(url && url.includes('drive.google.com'));
  },

  // Direct viewable image URL
  toImage(url) {
    const id = this.extractId(url);
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url;
  },

  // Embeddable iframe URL (videos, PDFs)
  toEmbed(url) {
    const id = this.extractId(url);
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  },

  // Convert based on expected type
  convertImage(url)  { return this.isDrive(url) ? this.toImage(url)  : url; },
  convertEmbed(url)  { return this.isDrive(url) ? this.toEmbed(url)  : url; },

  // Show a friendly hint in the admin for what gets converted
  hint(url) {
    if (!url) return null;
    const id = this.extractId(url);
    if (!id) return null;
    return `✓ Google Drive detected — will auto-convert (ID: ${id.slice(0,8)}...)`;
  }
};
window.GDrive = GDrive;

/* ══════════════════════════════════════════
   SUPABASE FETCH CLIENT
   No npm needed — pure fetch calls
══════════════════════════════════════════ */
const _sb = (() => {
  const ok = SUPABASE_URL !== 'YOUR_SUPABASE_URL';

  async function req(path, method, body, prefer) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { 'Prefer': prefer } : {}),
        ...(method === 'GET' ? { 'Accept': 'application/json' } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }

  return {
    get ok() { return ok; },
    all:    (t)         => req(`/rest/v1/${t}?select=*&order=sort_order.asc,created_at.desc`, 'GET'),
    insert: (t, d)      => req(`/rest/v1/${t}`, 'POST', d, 'return=representation'),
    update: (t, id, d)  => req(`/rest/v1/${t}?id=eq.${id}`, 'PATCH', d, 'return=representation'),
    delete: (t, id)     => req(`/rest/v1/${t}?id=eq.${id}`, 'DELETE'),
    byId:   (t, cid)    => req(`/rest/v1/${t}?custom_id=eq.${cid}&select=*`, 'GET'),
  };
})();

/* ══════════════════════════════════════════
   LOCALSTORAGE FALLBACK
   Used when Supabase is not yet configured,
   or for local development
══════════════════════════════════════════ */
const _ls = {
  get(k)    { try { const v = localStorage.getItem('bavly_'+k); return v ? JSON.parse(v) : null; } catch(e) { return null; } },
  set(k, v) { try { localStorage.setItem('bavly_'+k, JSON.stringify(v)); } catch(e) {} },
  del(k)    { try { localStorage.removeItem('bavly_'+k); } catch(e) {} },
};

/* ══════════════════════════════════════════
   SEED DATA
   Shown on first load / localStorage fallback
══════════════════════════════════════════ */
const SEEDS = {
  design: [
    { id:'d1', title:'Sunday Service Post',      category:'Social Posts',   tags:['Church','Instagram'], image:'', date:'2025-01-10', featured:true,  description:'Weekly Sunday service announcement post.' },
    { id:'d2', title:'Easter Event Banner',       category:'Event Graphics', tags:['Church','Holiday'],   image:'', date:'2025-03-28', featured:false, description:'Banner for Easter celebration event.' },
    { id:'d3', title:'Weekly Verse Graphic',      category:'Typography',     tags:['Typography','Faith'], image:'', date:'2025-02-14', featured:false, description:'Scripture typography post.' },
    { id:'d4', title:'Youth Group Announcement',  category:'Announcements',  tags:['Church','Youth'],     image:'', date:'2025-04-05', featured:false, description:'Youth group weekly announcement.' },
    { id:'d5', title:'Christmas Celebration Post',category:'Event Graphics', tags:['Holiday','Church'],   image:'', date:'2024-12-20', featured:true,  description:'Christmas celebration social media post.' },
    { id:'d6', title:'Baptism Ceremony Graphic',  category:'Social Posts',   tags:['Church','Ceremony'],  image:'', date:'2025-05-01', featured:false, description:'Baptism ceremony announcement.' },
  ],
  video: [
    { id:'v1', title:'Easter Sunday Recap',    category:'Church Event', embedUrl:'', thumbnail:'', description:'A cinematic recap of the Easter celebration.', tags:['Church','Cinematic'], duration:'3:24', date:'2025-03-30', featured:true,  links:[] },
    { id:'v2', title:'Youth Camp Highlights',  category:'Event Recap',  embedUrl:'', thumbnail:'', description:'Fast-paced highlights from the annual youth camp.', tags:['Church','Youth'],   duration:'2:10', date:'2025-07-15', featured:false, links:[] },
    { id:'v3', title:'Christmas Service Film', category:'Short Film',   embedUrl:'', thumbnail:'', description:'A short cinematic film covering the church Christmas service.', tags:['Cinematic','Church'], duration:'5:40', date:'2024-12-25', featured:false, links:[] },
  ],
  violin: [
    { id:'vn1', title:'Canon in D — Pachelbel', composer:'Johann Pachelbel', type:'Performance',  mediaUrl:'', description:'Performed at a church ceremony.', date:'2025-02-14', featured:true  },
    { id:'vn2', title:'Czardas',                composer:'Vittorio Monti',   type:'Recital',      mediaUrl:'', description:'High-energy performance featuring dramatic tempo shifts.', date:'2025-05-10', featured:false },
    { id:'vn3', title:'Ave Maria',              composer:'Franz Schubert',   type:'Church Music', mediaUrl:'', description:'Played during a church ceremony.', date:'2025-01-01', featured:false },
  ],
  competitions: [
    { id:'c1', title:'ICEF — International Competition', scope:'International · Innovation', icon:'🏆', year:'2024', outcome:'Participant', description:'Submitted and presented the Alzheimer Support Mobile Application.', learned:'Presenting a technical project to judges sharpened my ability to communicate engineering decisions clearly.' },
    { id:'c2', title:'NASA Space Apps Challenge',         scope:'Global · Hackathon',         icon:'🚀', year:'2024', outcome:'Participant', description:"Participated in one of the world's largest annual hackathons organized by NASA.", learned:'High-pressure engineering builds a different instinct — prioritization, scoping, and delivering something functional.' },
  ],
  blog: [
    { id:'b1', title:'How I built the Church Points System', category:'Engineering', date:'2025-04-10', excerpt:'A walkthrough of architecture decisions, database design, and deployment challenges.', content:'<p>When I started building the Church Points System, I had one goal: make it actually work in a real environment...</p>', tags:['Engineering','Web Dev'], featured:true  },
    { id:'b2', title:'What NASA Space Apps taught me',        category:'Competitions', date:'2025-03-05', excerpt:'Competing in a global hackathon with a hard deadline forces you to make decisions differently.', content:'<p>The hardest part of Space Apps is not the technical problem — it is deciding what to cut...</p>', tags:['Hackathon','Mindset'],   featured:false },
  ],
  projects: [
    { id:'p1', title:'Church Points & Card Management System', subtitle:'Full-Stack Web Platform', icon:'⚙️', status:'live',     statusLabel:'Live & Deployed', description:'A complete points management system for a church community. Physical card identification integrated with digital tracking.', techStack:['HTML/CSS/JS','Database','Backend','Deployment'], features:['System architecture design','Physical card ID with digital tracking','Multi-user tracking with admin controls'], links:{github:'',live:'',demo:''}, images:[], pdfs:[], extraLinks:[], date:'2024-12-01', featured:true  },
    { id:'p2', title:'Alzheimer Support Application',          subtitle:'MIT App Inventor · Mobile',  icon:'🧠', status:'complete', statusLabel:'ICEF Submission',  description:'A multi-feature mobile application for Alzheimer patients and caregivers.', techStack:['MIT App Inventor','Algorithm Design','Mobile UI'], features:['Reminder and scheduling functionality','Memory assistance tools','Multi-screen structured interface'], links:{github:'',live:'',demo:''}, images:[], pdfs:[], extraLinks:[], date:'2024-10-15', featured:true  },
  ],
};

/* ══════════════════════════════════════════
   AUTO-CONVERT GOOGLE DRIVE URLS IN DATA
══════════════════════════════════════════ */
function _convertDrive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const o = Array.isArray(obj) ? [...obj] : { ...obj };

  // Single URL fields
  if (o.image      && GDrive.isDrive(o.image))      o.image      = GDrive.convertImage(o.image);
  if (o.thumbnail  && GDrive.isDrive(o.thumbnail))  o.thumbnail  = GDrive.convertImage(o.thumbnail);
  if (o.embedUrl   && GDrive.isDrive(o.embedUrl))   o.embedUrl   = GDrive.convertEmbed(o.embedUrl);
  if (o.mediaUrl   && GDrive.isDrive(o.mediaUrl))   o.mediaUrl   = GDrive.convertEmbed(o.mediaUrl);

  // images array
  if (Array.isArray(o.images)) {
    o.images = o.images.map(img => {
      if (!img) return img;
      if (typeof img === 'string') return GDrive.isDrive(img) ? GDrive.convertImage(img) : img;
      if (img.url) return { ...img, url: GDrive.convertImage(img.url) };
      return img;
    });
  }

  // pdfs array — convert to embed for viewing in iframe
  if (Array.isArray(o.pdfs)) {
    o.pdfs = o.pdfs.map(pdf => {
      if (!pdf || !pdf.url) return pdf;
      const converted = GDrive.isDrive(pdf.url) ? GDrive.convertEmbed(pdf.url) : pdf.url;
      return { ...pdf, url: converted };
    });
  }

  // extra/video links — convert drive links to embeds
  if (Array.isArray(o.extraLinks)) {
    o.extraLinks = o.extraLinks.map(l => {
      if (!l || !l.url) return l;
      return { ...l, url: GDrive.isDrive(l.url) ? GDrive.convertEmbed(l.url) : l.url };
    });
  }

  return o;
}

/* ══════════════════════════════════════════
   LOCALSTORAGE COLLECTION OPS
══════════════════════════════════════════ */
function _lsAll(col) {
  const d = _ls.get('col_'+col);
  if (d !== null) return d;
  _ls.set('col_'+col, SEEDS[col]||[]);
  return SEEDS[col]||[];
}
function _lsAdd(col, item) {
  const list = _lsAll(col);
  item.id = col[0]+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  item.date = item.date || new Date().toISOString().slice(0,10);
  list.unshift(item);
  _ls.set('col_'+col, list);
  return item;
}
function _lsUpdate(col, id, updates) {
  const list = _lsAll(col);
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...updates };
  _ls.set('col_'+col, list);
  return list[i];
}
function _lsDel(col, id) {
  _ls.set('col_'+col, _lsAll(col).filter(x => x.id !== id));
}
function _lsGet(col, id) {
  return _lsAll(col).find(x => x.id === id) || null;
}

/* ══════════════════════════════════════════
   SUPABASE COLLECTION OPS
   Schema: { id uuid PK, custom_id text, data jsonb, sort_order int, created_at timestamptz }
══════════════════════════════════════════ */
const SB_TABLES = {
  design:'design_posts', video:'video_works', violin:'violin_performances',
  competitions:'competitions', blog:'blog_posts', projects:'projects',
};

async function _sbAll(col) {
  const rows = await _sb.all(SB_TABLES[col]);
  return (rows||[]).map(r => ({ ...r.data, id: r.custom_id, _sbId: r.id }));
}
async function _sbAdd(col, item) {
  item.id = item.id || (col[0]+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6));
  item.date = item.date || new Date().toISOString().slice(0,10);
  const r = await _sb.insert(SB_TABLES[col], { custom_id: item.id, data: item });
  return r ? { ...item, _sbId: r[0]?.id } : item;
}
async function _sbUpdate(col, id, updates) {
  const rows = await _sb.all(SB_TABLES[col]);
  const row = (rows||[]).find(r => r.custom_id === id);
  if (!row) return null;
  const merged = { ...row.data, ...updates, id };
  await _sb.update(SB_TABLES[col], row.id, { data: merged });
  return merged;
}
async function _sbDel(col, id) {
  const rows = await _sb.all(SB_TABLES[col]);
  const row = (rows||[]).find(r => r.custom_id === id);
  if (row) await _sb.delete(SB_TABLES[col], row.id);
}
async function _sbGet(col, id) {
  const rows = await _sb.byId(SB_TABLES[col], id);
  const row = rows?.[0];
  return row ? { ...row.data, _sbId: row.id } : null;
}

/* ══════════════════════════════════════════
   PUBLIC DB API
══════════════════════════════════════════ */
const DB = (() => {
  const use = _sb.ok;

  function make(col) {
    return {
      async getAll() {
        try   { if (use) return await _sbAll(col); }
        catch (e) { console.warn('[DB] Supabase getAll failed, using localStorage:', e.message); }
        return _lsAll(col);
      },
      async add(item) {
        item = _convertDrive(item);
        try   { if (use) return await _sbAdd(col, item); }
        catch (e) { console.warn('[DB] Supabase add failed, using localStorage:', e.message); }
        return _lsAdd(col, item);
      },
      async update(id, updates) {
        updates = _convertDrive(updates);
        try   { if (use) return await _sbUpdate(col, id, updates); }
        catch (e) { console.warn('[DB] Supabase update failed, using localStorage:', e.message); }
        return _lsUpdate(col, id, updates);
      },
      async delete(id) {
        try   { if (use) return await _sbDel(col, id); }
        catch (e) { console.warn('[DB] Supabase delete failed, using localStorage:', e.message); }
        return _lsDel(col, id);
      },
      async get(id) {
        try   { if (use) return await _sbGet(col, id); }
        catch (e) { console.warn('[DB] Supabase get failed, using localStorage:', e.message); }
        return _lsGet(col, id);
      },
    };
  }

  const api = {
    design:       make('design'),
    video:        make('video'),
    violin:       make('violin'),
    competitions: make('competitions'),
    blog:         make('blog'),
    projects:     make('projects'),

    isUsingSupabase: use,

    async exportAll() {
      const out = {};
      for (const k of ['design','video','violin','competitions','blog','projects'])
        out[k] = await api[k].getAll();
      return out;
    },
    async resetAll() {
      for (const k of ['design','video','violin','competitions','blog','projects'])
        _ls.set('col_'+k, SEEDS[k]||[]);
    },
  };

  return api;
})();

window.DB = DB;
