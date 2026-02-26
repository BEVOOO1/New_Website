/* ════════════════════════════════════════════════
   BAVLY CMS — db.js
   Unified storage layer. All pages import this.
   Uses window.storage (persistent) with localStorage
   fallback for local development.
════════════════════════════════════════════════ */

const DB = (() => {

  // ── Storage adapter: tries window.storage first, falls back to localStorage ──
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
        if (window.storage) {
          await window.storage.set(key, str);
          return;
        }
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

  // ── Collection keys ──
  const KEYS = {
    design:       'col_design',
    video:        'col_video',
    violin:       'col_violin',
    competitions: 'col_competitions',
    blog:         'col_blog',
    projects:     'col_projects',
  };

  // ── Seed data (shown until user adds real content) ──
  const SEEDS = {
    design: [
      { id:'d1', title:'Sunday Service Post', category:'Social Posts', tags:['Church','Instagram'], image:'', date:'2025-01-10', featured:true },
      { id:'d2', title:'Easter Event Banner', category:'Event Graphics', tags:['Church','Holiday'], image:'', date:'2025-03-28', featured:false },
      { id:'d3', title:'Weekly Verse Graphic', category:'Typography', tags:['Typography','Faith'], image:'', date:'2025-02-14', featured:false },
      { id:'d4', title:'Youth Group Announcement', category:'Announcements', tags:['Church','Youth'], image:'', date:'2025-04-05', featured:false },
      { id:'d5', title:'Christmas Celebration Post', category:'Event Graphics', tags:['Holiday','Church'], image:'', date:'2024-12-20', featured:true },
      { id:'d6', title:'Baptism Ceremony Graphic', category:'Social Posts', tags:['Church','Ceremony'], image:'', date:'2025-05-01', featured:false },
    ],
    video: [
      { id:'v1', title:'Easter Sunday Recap', category:'Church Event', embedUrl:'', thumbnail:'', description:'A cinematic recap of the Easter celebration — multi-camera edit with color grading and music sync.', tags:['Church','Cinematic','Color Grade'], duration:'3:24', date:'2025-03-30', featured:true },
      { id:'v2', title:'Youth Camp Highlights', category:'Event Recap', embedUrl:'', thumbnail:'', description:'Fast-paced highlights from the annual youth camp. Dynamic cuts timed to music.', tags:['Church','Youth','Dynamic'], duration:'2:10', date:'2025-07-15', featured:false },
      { id:'v3', title:'Christmas Service Film', category:'Short Film', embedUrl:'', thumbnail:'', description:'A short cinematic film covering the church Christmas service from multiple perspectives.', tags:['Cinematic','Church','Holiday'], duration:'5:40', date:'2024-12-25', featured:false },
    ],
    violin: [
      { id:'vn1', title:'Canon in D — Pachelbel', composer:'Johann Pachelbel', type:'Performance', mediaUrl:'', description:'Performed at a church ceremony. Arranged for solo violin.', date:'2025-02-14', featured:true },
      { id:'vn2', title:'Czardas', composer:'Vittorio Monti', type:'Recital', mediaUrl:'', description:'High-energy performance featuring the dramatic tempo shifts characteristic of this piece.', date:'2025-05-10', featured:false },
      { id:'vn3', title:'Ave Maria', composer:'Franz Schubert', type:'Church Music', mediaUrl:'', description:'Played during a church ceremony. A deeply moving arrangement.', date:'2025-01-01', featured:false },
    ],
    competitions: [
      { id:'c1', title:'ICEF — International Competition', scope:'International · Innovation', icon:'🏆', year:'2024', outcome:'Participant', description:'Submitted and presented the Alzheimer Support Mobile Application. Demonstrated end-to-end application development — from healthcare concept to functional prototype.', learned:'Presenting a technical project to judges sharpened my ability to communicate engineering decisions clearly — not just build, but explain the why behind every choice.' },
      { id:'c2', title:'NASA Space Apps Challenge', scope:'Global · Hackathon', icon:'🚀', year:'2024', outcome:'Participant', description:'Participated in one of the world\'s largest annual hackathons organized by NASA. Built a project addressing a real space exploration challenge within the hackathon timeframe.', learned:'High-pressure engineering builds a different instinct — prioritization, scoping, and delivering something functional when time is strictly limited.' },
    ],
    blog: [
      { id:'b1', title:'How I built the Church Points System', category:'Engineering', date:'2025-04-10', excerpt:'A walkthrough of the architecture decisions, database design, and deployment challenges of building a real-world web system from scratch.', content:'<p>When I started building the Church Points System, I had one goal: make it actually work in a real environment — not just a demo...</p><p>The first challenge was the database structure. I needed to track users, their points, and link each user to a physical card...</p>', tags:['Engineering','Web Dev','Church'], featured:true },
      { id:'b2', title:'What NASA Space Apps taught me about pressure', category:'Competitions', date:'2025-03-05', excerpt:'Competing in a global hackathon with a hard deadline forces you to make decisions differently. Here is what I learned.', content:'<p>The hardest part of Space Apps is not the technical problem — it is deciding what to cut...</p>', tags:['Hackathon','Mindset','NASA'], featured:false },
    ],
    projects: [
      { id:'p1', title:'Church Points & Card Management System', subtitle:'Full-Stack Web Platform', icon:'⚙️', status:'live', statusLabel:'Live & Deployed', description:'A complete points management system for a church community. Physical card identification integrated with digital tracking, built with full system ownership from architecture to deployment.', techStack:['HTML/CSS/JS','Database','Backend','Deployment'], features:['Designed system architecture and database structure from scratch','Frontend interface and backend logic','Physical card identification with digital tracking','Multi-user tracking with administrative controls'], links:{ github:'', live:'' }, date:'2024-12-01', featured:true },
      { id:'p2', title:'Alzheimer Support Application', subtitle:'MIT App Inventor · Mobile', icon:'🧠', status:'complete', statusLabel:'ICEF Submission', description:'A multi-feature mobile application for Alzheimer patients and caregivers. Focused on usability and healthcare-oriented problem solving. Submitted to ICEF.', techStack:['MIT App Inventor','Algorithm Design','Mobile UI'], features:['Reminder and scheduling functionality','Memory assistance tools','Multi-screen structured interface','Custom algorithm-based logic'], links:{ github:'', live:'' }, date:'2024-10-15', featured:true },
    ],
  };

  // ── Init: load collection or seed it ──
  async function getCollection(key) {
    const data = await store.get(KEYS[key]);
    if (data !== null) return data;
    // First visit — seed defaults
    await store.set(KEYS[key], SEEDS[key]);
    return SEEDS[key];
  }

  async function saveCollection(key, data) {
    await store.set(KEYS[key], data);
  }

  // ── CRUD helpers ──
  function newId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  }

  async function addItem(collection, item) {
    const col = await getCollection(collection);
    item.id = newId(collection[0]);
    item.date = item.date || new Date().toISOString().slice(0,10);
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
    const filtered = col.filter(i => i.id !== id);
    await saveCollection(collection, filtered);
  }

  async function getItem(collection, id) {
    const col = await getCollection(collection);
    return col.find(i => i.id === id) || null;
  }

  // ── Public API ──
  return {
    // Collections
    design:       { getAll: () => getCollection('design'),       add: (i) => addItem('design',i),       update: (id,u) => updateItem('design',id,u),       delete: (id) => deleteItem('design',id),       get: (id) => getItem('design',id) },
    video:        { getAll: () => getCollection('video'),        add: (i) => addItem('video',i),        update: (id,u) => updateItem('video',id,u),        delete: (id) => deleteItem('video',id),        get: (id) => getItem('video',id) },
    violin:       { getAll: () => getCollection('violin'),       add: (i) => addItem('violin',i),       update: (id,u) => updateItem('violin',id,u),       delete: (id) => deleteItem('violin',id),       get: (id) => getItem('violin',id) },
    competitions: { getAll: () => getCollection('competitions'), add: (i) => addItem('competitions',i), update: (id,u) => updateItem('competitions',id,u), delete: (id) => deleteItem('competitions',id), get: (id) => getItem('competitions',id) },
    blog:         { getAll: () => getCollection('blog'),         add: (i) => addItem('blog',i),         update: (id,u) => updateItem('blog',id,u),         delete: (id) => deleteItem('blog',id),         get: (id) => getItem('blog',id) },
    projects:     { getAll: () => getCollection('projects'),     add: (i) => addItem('projects',i),     update: (id,u) => updateItem('projects',id,u),     delete: (id) => deleteItem('projects',id),     get: (id) => getItem('projects',id) },

    // Utilities
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

// Make globally available
window.DB = DB;
