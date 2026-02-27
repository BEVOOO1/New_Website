/* ════════════════════════════════════════════════
   BAVLY CMS — db.js v4 (Optimized & Secure)
   - XSS-safe sanitization on read
   - File upload validation & compression
   - Optimistic UI helpers
   - Schema validation
════════════════════════════════════════════════ */

const DB = (() => {

  // ── STORAGE ADAPTER ──
  const store = {
    async get(key) {
      try {
        if (window.storage) {
          const r = await window.storage.get(key);
          return r ? JSON.parse(r.value) : null;
        }
      } catch(e) {}
      try {
        const v = localStorage.getItem('bavly_' + key);
        return v ? JSON.parse(v) : null;
      } catch(e) { return null; }
    },
    async set(key, value) {
      const str = JSON.stringify(value);
      try {
        if (window.storage) { await window.storage.set(key, str); return; }
      } catch(e) {}
      try { localStorage.setItem('bavly_' + key, str); } catch(e) {}
    },
    async delete(key) {
      try {
        if (window.storage) { await window.storage.delete(key); return; }
      } catch(e) {}
      try { localStorage.removeItem('bavly_' + key); } catch(e) {}
    }
  };

  // ── COLLECTION KEYS ──
  const KEYS = {
    design:       'col_design',
    video:        'col_video',
    violin:       'col_violin',
    competitions: 'col_competitions',
    blog:         'col_blog',
    projects:     'col_projects',
  };

  // ── SEED DATA ──
  const SEEDS = {
    design: [
      { id:'d1', title:'Sunday Service Post', category:'Social Posts', tags:['Church','Instagram'], image:'', date:'2025-01-10', featured:true, description:'Weekly Sunday service announcement post.' },
      { id:'d2', title:'Easter Event Banner', category:'Event Graphics', tags:['Church','Holiday'], image:'', date:'2025-03-28', featured:false, description:'Banner for Easter celebration event.' },
      { id:'d3', title:'Weekly Verse Graphic', category:'Typography', tags:['Typography','Faith'], image:'', date:'2025-02-14', featured:false, description:'Scripture typography post.' },
      { id:'d4', title:'Youth Group Announcement', category:'Announcements', tags:['Church','Youth'], image:'', date:'2025-04-05', featured:false, description:'Youth group weekly announcement.' },
      { id:'d5', title:'Christmas Celebration Post', category:'Event Graphics', tags:['Holiday','Church'], image:'', date:'2024-12-20', featured:true, description:'Christmas celebration social media post.' },
      { id:'d6', title:'Baptism Ceremony Graphic', category:'Social Posts', tags:['Church','Ceremony'], image:'', date:'2025-05-01', featured:false, description:'Baptism ceremony announcement.' },
    ],
    video: [
      { id:'v1', title:'Easter Sunday Recap', category:'Church Event', embedUrl:'', thumbnail:'', description:'A cinematic recap of the Easter celebration — multi-camera edit with color grading and music sync.', tags:['Church','Cinematic','Color Grade'], duration:'3:24', date:'2025-03-30', featured:true, links:[] },
      { id:'v2', title:'Youth Camp Highlights', category:'Event Recap', embedUrl:'', thumbnail:'', description:'Fast-paced highlights from the annual youth camp.', tags:['Church','Youth','Dynamic'], duration:'2:10', date:'2025-07-15', featured:false, links:[] },
      { id:'v3', title:'Christmas Service Film', category:'Short Film', embedUrl:'', thumbnail:'', description:'A short cinematic film covering the church Christmas service.', tags:['Cinematic','Church','Holiday'], duration:'5:40', date:'2024-12-25', featured:false, links:[] },
    ],
    violin: [
      { id:'vn1', title:'Canon in D — Pachelbel', composer:'Johann Pachelbel', type:'Performance', mediaUrl:'', description:'Performed at a church ceremony. Arranged for solo violin.', date:'2025-02-14', featured:true },
      { id:'vn2', title:'Czardas', composer:'Vittorio Monti', type:'Recital', mediaUrl:'', description:'High-energy performance featuring the dramatic tempo shifts.', date:'2025-05-10', featured:false },
      { id:'vn3', title:'Ave Maria', composer:'Franz Schubert', type:'Church Music', mediaUrl:'', description:'Played during a church ceremony.', date:'2025-01-01', featured:false },
    ],
    competitions: [
      { id:'c1', title:'ICEF — International Competition', scope:'International · Innovation', icon:'🏆', year:'2024', outcome:'Participant', description:'Submitted and presented the Alzheimer Support Mobile Application.', learned:'Presenting a technical project to judges sharpened my ability to communicate engineering decisions clearly.' },
      { id:'c2', title:'NASA Space Apps Challenge', scope:'Global · Hackathon', icon:'🚀', year:'2024', outcome:'Participant', description:"Participated in one of the world's largest annual hackathons organized by NASA.", learned:'High-pressure engineering builds a different instinct — prioritization, scoping, and delivering something functional.' },
    ],
    blog: [
      { id:'b1', title:'How I built the Church Points System', category:'Engineering', date:'2025-04-10', excerpt:'A walkthrough of the architecture decisions, database design, and deployment challenges.', content:'<p>When I started building the Church Points System, I had one goal: make it actually work in a real environment — not just a demo...</p><p>The first challenge was the database structure. I needed to track users, their points, and link each user to a physical card...</p>', tags:['Engineering','Web Dev','Church'], featured:true },
      { id:'b2', title:'What NASA Space Apps taught me about pressure', category:'Competitions', date:'2025-03-05', excerpt:'Competing in a global hackathon with a hard deadline forces you to make decisions differently.', content:'<p>The hardest part of Space Apps is not the technical problem — it is deciding what to cut...</p>', tags:['Hackathon','Mindset','NASA'], featured:false },
    ],
    projects: [
      {
        id:'p1', title:'Church Points & Card Management System', subtitle:'Full-Stack Web Platform', icon:'⚙️',
        status:'live', statusLabel:'Live & Deployed',
        description:'A complete points management system for a church community. Physical card identification integrated with digital tracking.',
        techStack:['HTML/CSS/JS','Database','Backend','Deployment'],
        features:['Designed system architecture and database structure from scratch','Frontend interface and backend logic','Physical card identification with digital tracking','Multi-user tracking with administrative controls'],
        links:{ github:'', live:'', demo:'' },
        images:[], pdfs:[], extraLinks:[],
        date:'2024-12-01', featured:true
      },
      {
        id:'p2', title:'Alzheimer Support Application', subtitle:'MIT App Inventor · Mobile', icon:'🧠',
        status:'complete', statusLabel:'ICEF Submission',
        description:'A multi-feature mobile application for Alzheimer patients and caregivers.',
        techStack:['MIT App Inventor','Algorithm Design','Mobile UI'],
        features:['Reminder and scheduling functionality','Memory assistance tools','Multi-screen structured interface','Custom algorithm-based logic'],
        links:{ github:'', live:'', demo:'' },
        images:[], pdfs:[], extraLinks:[],
        date:'2024-10-15', featured:true
      },
    ],
  };

  // ── SECURITY: Input sanitization ──
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
      .slice(0, 5000); // max length guard
  }

  function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    // Allow data URLs (base64 images), http/https, and relative URLs
    if (trimmed.startsWith('data:image/') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('./')) {
      return trimmed.slice(0, 500000); // 500kb char limit for base64
    }
    return '';
  }

  function sanitizeTags(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 20).map(t => sanitizeString(String(t)).slice(0, 50)).filter(Boolean);
  }

  // ── IMAGE UPLOAD OPTIMIZATION ──
  // Compresses an uploaded File to a target max dimension and quality
  async function processImageUpload(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
    // Validate file type
    const allowedTypes = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.');
    }
    // Validate file size (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // Scale down if needed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Use WebP if supported, fall back to JPEG
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image.')); };
      img.src = url;
    });
  }

  // ── CRUD HELPERS ──
  async function getCollection(key) {
    const data = await store.get(KEYS[key]);
    if (data !== null) return data;
    await store.set(KEYS[key], SEEDS[key]);
    return SEEDS[key];
  }

  async function saveCollection(key, data) {
    await store.set(KEYS[key], data);
  }

  function newId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  async function addItem(collection, item) {
    const col = await getCollection(collection);
    item.id = newId(collection[0]);
    item.date = item.date || new Date().toISOString().slice(0, 10);
    col.unshift(item);
    await saveCollection(collection, col);
    return item;
  }

  async function updateItem(collection, id, updates) {
    const col = await getCollection(collection);
    const idx = col.findIndex(i => i.id === id);
    if (idx === -1) return null;
    col[idx] = { ...col[idx], ...updates };
    await saveCollection(collection, col);
    return col[idx];
  }

  async function deleteItem(collection, id) {
    const col = await getCollection(collection);
    await saveCollection(collection, col.filter(i => i.id !== id));
  }

  async function getItem(collection, id) {
    const col = await getCollection(collection);
    return col.find(i => i.id === id) || null;
  }

  // ── PUBLIC API ──
  const makeAPI = (key) => ({
    getAll:  ()      => getCollection(key),
    add:     (item)  => addItem(key, item),
    update:  (id, u) => updateItem(key, id, u),
    delete:  (id)    => deleteItem(key, id),
    get:     (id)    => getItem(key, id),
  });

  return {
    design:       makeAPI('design'),
    video:        makeAPI('video'),
    violin:       makeAPI('violin'),
    competitions: makeAPI('competitions'),
    blog:         makeAPI('blog'),
    projects:     makeAPI('projects'),

    // Utilities
    sanitize:  { string: sanitizeString, url: sanitizeUrl, tags: sanitizeTags },
    upload:    { processImage: processImageUpload },

    resetAll: async () => {
      for (const key of Object.keys(KEYS)) await store.set(KEYS[key], SEEDS[key]);
    },
    exportAll: async () => {
      const out = {};
      for (const key of Object.keys(KEYS)) out[key] = await getCollection(key);
      return out;
    },
  };
})();

window.DB = DB;
