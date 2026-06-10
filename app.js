/* ── Constants ──────────────────────────────────────────── */
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_SH = ['L','M','M','J','V','S','D'];
const CAT_LABELS = { 'para-ti':'Para Ti','para-mi':'Para Mí','futuro':'Para el Futuro','pasado':'Para el Pasado' };

const EMOTIONS = [
  { id:'alegre',     label:'Alegre',      sym:'☀', color:'#F9A825' },
  { id:'enamorado',  label:'Enamorado',   sym:'♡', color:'#EC407A' },
  { id:'nostalgico', label:'Nostálgico',  sym:'◐', color:'#7E57C2' },
  { id:'reflexivo',  label:'Reflexivo',   sym:'✿', color:'#66BB6A' },
  { id:'triste',     label:'Triste',      sym:'☁', color:'#42A5F5' },
  { id:'agradecido', label:'Agradecido',  sym:'✦', color:'#FFCA28' },
  { id:'ansioso',    label:'Ansioso',     sym:'⚡', color:'#FF7043' },
  { id:'sereno',     label:'Sereno',      sym:'∿', color:'#26C6DA' },
];

const QUOTES = [
  'Los recuerdos son el único paraíso del que no pueden expulsarnos.',
  'Escribe. No para que te recuerden, sino para recordar quién eres.',
  'El amor no se mide en días, sino en momentos.',
  'Cada día es una página en blanco que tú decides escribir.',
  'La vida se vive hacia adelante, pero solo se comprende mirando atrás.',
  'Tus emociones son válidas. Todas ellas.',
  'Los momentos más pequeños guardan las emociones más grandes.',
  'Escribir es la forma más honesta de hablar con uno mismo.',
  'Guarda los recuerdos bonitos. Son el equipaje que no pesa.',
  'En cada año hay 365 oportunidades de comenzar de nuevo.',
  'Quizás la vida que buscamos ya está ocurriendo.',
  'Lo que sientes también te pertenece.',
];

/* ── Storage ────────────────────────────────────────────── */
const DB = {
  notes:       () => JSON.parse(localStorage.getItem('kv_notes')       || '{}'),
  setNotes:    v  => localStorage.setItem('kv_notes', JSON.stringify(v)),
  poems:       () => JSON.parse(localStorage.getItem('kv_poems')       || '[]'),
  setPoems:    v  => localStorage.setItem('kv_poems', JSON.stringify(v)),
  deds:        () => JSON.parse(localStorage.getItem('kv_deds')        || '[]'),
  setDeds:     v  => localStorage.setItem('kv_deds', JSON.stringify(v)),
  gallery:     () => JSON.parse(localStorage.getItem('kv_gallery')     || '[]'),
  setGallery:  v  => localStorage.setItem('kv_gallery', JSON.stringify(v)),
  feelings:    () => JSON.parse(localStorage.getItem('kv_feelings')    || '[]'),
  setFeelings: v  => localStorage.setItem('kv_feelings', JSON.stringify(v)),
  settings:    () => JSON.parse(localStorage.getItem('kv_settings')    || '{"year":2026}'),
  setSettings: v  => localStorage.setItem('kv_settings', JSON.stringify(v)),
};

/* ── State ──────────────────────────────────────────────── */
const st = {
  calYear: 2026,
  dayKey: null,
  dayFav: false,
  dayEmotion: null,
  dayImages: [],
  editPoemId: null,
  editDedId: null,
  viewType: null,
  viewId: null,
  dedCat: 'all',
  autosaveTimer: null,
};

/* ── Utilities ──────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const dateKey = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const daysInMonth = (y,m) => new Date(y,m,0).getDate();
const firstDay = (y,m) => { const d = new Date(y,m-1,1).getDay(); return d===0?6:d-1; };
const formatDate = k => { const [y,m,d] = k.split('-'); return `${parseInt(d)} de ${MONTHS[parseInt(m)-1]} de ${y}`; };
const today = () => { const n=new Date(); return dateKey(n.getFullYear(),n.getMonth()+1,n.getDate()); };
const todayFmt = () => { const n=new Date(); return `${n.getDate()} de ${MONTHS[n.getMonth()]} de ${n.getFullYear()}`; };
const strip = html => html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function resizeImage(file, maxPx, cb) {
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxPx/img.width, maxPx/img.height, 1);
      const c = document.createElement('canvas');
      c.width = img.width * ratio; c.height = img.height * ratio;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      cb(c.toDataURL('image/jpeg',0.82));
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}

/* ── Navigation ─────────────────────────────────────────── */
function navigate(id) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = $('sec-' + id); if(sec) sec.classList.add('active');
  const btn = document.querySelector(`[data-section="${id}"]`); if(btn) btn.classList.add('active');
  const fn = { dashboard: renderDashboard, calendar: () => renderCalendar(st.calYear),
    feelings: renderFeelings, poems: renderPoems, dedications: renderDeds,
    gallery: renderGallery, search: () => {} };
  fn[id]?.();
}

/* ── Dashboard ──────────────────────────────────────────── */
function renderDashboard() {
  const notes = DB.notes(), poems = DB.poems(), gallery = DB.gallery(), deds = DB.deds();
  const noteKeys = Object.keys(notes);
  const favKeys = noteKeys.filter(k => notes[k].favorite);

  $('s-notes').textContent = noteKeys.length;
  $('s-poems').textContent = poems.length;
  $('s-favs').textContent = favKeys.length;
  $('s-photos').textContent = gallery.length;
  $('today-label').textContent = todayFmt();

  // Random quote
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $('quote-pill').textContent = `❝ ${q} ❞`;

  // Recent notes
  const rn = $('d-notes');
  const sorted = noteKeys.sort((a,b) => (notes[b].updated||b).localeCompare(notes[a].updated||a)).slice(0,5);
  rn.innerHTML = sorted.length ? sorted.map(k => `
    <div class="recent-item" data-day="${k}" style="cursor:pointer">
      <span class="ri-title">${notes[k].title || formatDate(k)}</span>
      <span class="ri-date">${formatDate(k).split(' de ')[0]} ${MONTHS[parseInt(k.split('-')[1])-1].slice(0,3)}</span>
    </div>`).join('') : '<div class="empty-hint">Sin notas aún</div>';
  rn.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => {
    const [y,m,d] = el.dataset.day.split('-');
    openDayModal(+y,+m,+d);
  }));

  // Recent poems
  const rp = $('d-poems');
  const sp = [...poems].sort((a,b) => b.date.localeCompare(a.date)).slice(0,4);
  rp.innerHTML = sp.length ? sp.map(p => `
    <div class="recent-item" data-pid="${p.id}" style="cursor:pointer">
      <span class="ri-title">${p.title || 'Sin título'}</span>
      <span class="ri-date">${p.date.slice(5).replace('-','/')}</span>
    </div>`).join('') : '<div class="empty-hint">Sin poemas aún</div>';
  rp.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => openView('poem', el.dataset.pid)));

  // Timeline
  const tl = $('timeline'); tl.innerHTML = '';
  const all = [
    ...noteKeys.map(k => ({ type:'note', date:k, label:'Nota', sym:'✎', key:k })),
    ...poems.map(p => ({ type:'poem', date:p.date, label:'Poema', sym:'♪', id:p.id })),
    ...deds.map(d => ({ type:'ded', date:d.date, label:'Carta', sym:'✉', id:d.id })),
  ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,20);
  all.forEach(it => {
    const el = document.createElement('div');
    el.className = 'tl-dot';
    const d = it.date ? it.date.split('-') : ['','',''];
    el.innerHTML = `<div class="tl-circle">${it.sym}</div><div class="tl-lbl">${d[2]||''}<br>${d[1]?MONTHS[parseInt(d[1])-1].slice(0,3):''}</div>`;
    el.addEventListener('click', () => {
      if(it.type==='note') { const [y,m,d2]=it.key.split('-'); openDayModal(+y,+m,+d2); }
      else openView(it.type, it.id);
    });
    tl.appendChild(el);
  });

  // Emotion summary
  const emo = $('d-emotions');
  const allFeelings = DB.feelings();
  const counts = {};
  [...noteKeys.filter(k=>notes[k].emotion).map(k=>notes[k].emotion),
   ...allFeelings.map(f=>f.emotion)].forEach(e => counts[e]=(counts[e]||0)+1);
  const total = Object.values(counts).reduce((s,v)=>s+v,0)||1;
  emo.innerHTML = EMOTIONS.filter(e=>counts[e.id]).map(e => `
    <div class="emo-bar-row">
      <span class="emo-bar-label">${e.sym} ${e.label}</span>
      <div class="emo-bar-track"><div class="emo-bar-fill" style="width:${(counts[e.id]||0)/total*100}%;background:${e.color}"></div></div>
      <span style="font-size:.65rem;color:var(--text3);width:20px;text-align:right">${counts[e.id]||0}</span>
    </div>`).join('') || '<div class="empty-hint">Sin registros</div>';

  // Special days
  const sp2 = $('d-specials');
  sp2.innerHTML = favKeys.slice(0,6).map(k => `
    <div class="spec-item"><span class="spec-star">★</span><span class="spec-text">${formatDate(k)}</span></div>
  `).join('') || '<div class="empty-hint">Sin días favoritos</div>';
}

/* ── Calendar ───────────────────────────────────────────── */
function renderCalendar(year) {
  st.calYear = year;
  $('cal-yr').textContent = year;
  $('year-chip').textContent = year;
  const notes = DB.notes();
  const grid = $('cal-grid'); grid.innerHTML = '';
  const [ty,tm,td] = today().split('-').map(Number);

  MONTHS.forEach((mName, mi) => {
    const mNum = mi + 1;
    const total = daysInMonth(year, mNum);
    const offset = firstDay(year, mNum);
    const noteCount = Object.keys(notes).filter(k => k.startsWith(`${year}-${String(mNum).padStart(2,'0')}`)).length;

    const card = document.createElement('div');
    card.className = 'month-card';

    let html = `<div class="month-head"><span class="month-name-lbl">${mName}</span><span class="month-count">${noteCount}/${total}</span></div>`;
    html += `<div class="day-headers">${DAYS_SH.map(d=>`<div class="dh">${d}</div>`).join('')}</div>`;
    html += '<div class="days-inner">';
    for(let i=0;i<offset;i++) html += '<div class="dc dc-empty"></div>';
    for(let d=1;d<=total;d++) {
      const k = dateKey(year, mNum, d);
      const note = notes[k];
      const isToday = year===ty && mNum===tm && d===td;
      let cls = 'dc';
      if(isToday) cls += ' dc-today';
      if(note) cls += ' dc-has-note';
      if(note?.favorite) cls += ' dc-fav';
      html += `<div class="${cls}" data-y="${year}" data-m="${mNum}" data-d="${d}">${d}</div>`;
    }
    html += '</div>';
    card.innerHTML = html;
    card.querySelectorAll('.dc:not(.dc-empty)').forEach(el => {
      el.addEventListener('click', () => openDayModal(+el.dataset.y, +el.dataset.m, +el.dataset.d));
    });
    grid.appendChild(card);
  });
}

/* ── Day Modal ──────────────────────────────────────────── */
function openDayModal(y, m, d) {
  const k = dateKey(y, m, d);
  st.dayKey = k;
  const note = DB.notes()[k] || {};
  st.dayFav = !!note.favorite;
  st.dayEmotion = note.emotion || null;
  st.dayImages = note.images ? [...note.images] : [];

  $('day-meta').textContent = formatDate(k).toUpperCase();
  $('day-title').value = note.title || '';
  $('day-editor').innerHTML = note.content || '';
  $('day-fav').textContent = st.dayFav ? '★' : '☆';
  $('day-fav').classList.toggle('on', st.dayFav);
  $('save-hint').textContent = note.content ? 'Guardado anteriormente' : 'Nueva nota';

  // Emotion chips
  const row = $('day-emo-row');
  row.innerHTML = EMOTIONS.map(e => `
    <span class="emo-chip ${st.dayEmotion===e.id?'active':''}" data-emo="${e.id}" style="--emo-color:${e.color}">
      ${e.sym} ${e.label}
    </span>`).join('');
  row.querySelectorAll('.emo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      st.dayEmotion = st.dayEmotion === chip.dataset.emo ? null : chip.dataset.emo;
      row.querySelectorAll('.emo-chip').forEach(c => c.classList.toggle('active', c.dataset.emo===st.dayEmotion));
    });
  });

  renderDayThumbs();
  openModal('modal-day');
}

function renderDayThumbs() {
  const row = $('day-thumbs');
  row.innerHTML = st.dayImages.map((img, i) => `
    <div class="thumb" data-i="${i}">
      <img src="${img.src}" alt="" />
      <div class="thumb-del" data-i="${i}">✕</div>
    </div>`).join('');
  row.querySelectorAll('.thumb-del').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      st.dayImages.splice(+el.dataset.i, 1);
      renderDayThumbs();
    });
  });
}

function saveNote() {
  const notes = DB.notes();
  const content = $('day-editor').innerHTML;
  notes[st.dayKey] = {
    title: $('day-title').value.trim(),
    content,
    emotion: st.dayEmotion,
    favorite: st.dayFav,
    images: st.dayImages,
    updated: new Date().toISOString(),
  };
  DB.setNotes(notes);
  $('save-hint').textContent = '✓ Guardado';
  toast('Nota guardada');
  updateCalDot(st.dayKey);
}

function updateCalDot(k) {
  const notes = DB.notes();
  const el = document.querySelector(`.dc[data-y="${k.split('-')[0]}"][data-m="${parseInt(k.split('-')[1])}"][data-d="${parseInt(k.split('-')[2])}"]`);
  if(!el) return;
  const note = notes[k];
  el.classList.toggle('dc-has-note', !!note?.content);
  el.classList.toggle('dc-fav', !!note?.favorite);
}

/* Autosave */
function setupAutosave() {
  $('day-editor').addEventListener('input', () => {
    clearTimeout(st.autosaveTimer);
    $('save-hint').textContent = 'Escribiendo...';
    st.autosaveTimer = setTimeout(saveNote, 1500);
  });
  $('day-title').addEventListener('input', () => {
    clearTimeout(st.autosaveTimer);
    st.autosaveTimer = setTimeout(saveNote, 1500);
  });
}

/* Editor toolbar */
function setupEditorBar() {
  document.querySelectorAll('.editor-bar button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      $('day-editor').focus();
      if(cmd === 'h2') {
        document.execCommand('formatBlock', false, '<h2>');
      } else if(cmd === 'blockquote') {
        document.execCommand('formatBlock', false, '<blockquote>');
      } else {
        document.execCommand(cmd, false, null);
      }
    });
  });
}

/* ── Feelings ───────────────────────────────────────────── */
function renderFeelings() {
  const all = DB.feelings().sort((a,b) => b.date.localeCompare(a.date));
  const notes = DB.notes();

  // Chart
  const counts = {};
  [...all.map(f=>f.emotion),
   ...Object.values(notes).filter(n=>n.emotion).map(n=>n.emotion)
  ].forEach(e => counts[e]=(counts[e]||0)+1);
  const max = Math.max(...Object.values(counts), 1);
  $('feel-chart').innerHTML = EMOTIONS.map(e => `
    <div class="emo-bar-row">
      <span class="emo-bar-label">${e.sym} ${e.label}</span>
      <div class="emo-bar-track"><div class="emo-bar-fill" style="width:${(counts[e.id]||0)/max*100}%;background:${e.color}"></div></div>
      <span style="font-size:.65rem;color:var(--text3);width:24px;text-align:right">${counts[e.id]||0}</span>
    </div>`).join('');

  // History list
  $('feel-list').innerHTML = all.slice(0,20).map(f => {
    const emo = EMOTIONS.find(e=>e.id===f.emotion)||EMOTIONS[0];
    return `<div class="feel-entry">
      <span class="fe-sym" style="color:${emo.color}">${emo.sym}</span>
      <div class="fe-body">
        <div class="fe-label">${emo.label}</div>
        ${f.note ? `<div class="fe-note">${f.note}</div>` : ''}
        <div class="fe-date">${formatDate(f.date.slice(0,10))}</div>
      </div>
    </div>`;
  }).join('') || '<div class="empty-hint">Sin registros emocionales</div>';
}

function openFeelingForm() {
  const form = $('feel-form');
  form.classList.remove('hidden');
  let sel = null;
  $('feel-picker').innerHTML = EMOTIONS.map(e => `
    <div class="emo-btn" data-emo="${e.id}" style="--emo-color:${e.color}">
      <span class="emo-sym">${e.sym}</span>
      <span class="emo-lbl">${e.label}</span>
    </div>`).join('');
  $('feel-picker').querySelectorAll('.emo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $('feel-picker').querySelectorAll('.emo-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      sel = btn.dataset.emo;
    });
  });
  $('cancel-feel').onclick = () => form.classList.add('hidden');
  $('save-feel').onclick = () => {
    if(!sel) return toast('Selecciona una emoción');
    const all = DB.feelings();
    all.unshift({ id:uid(), emotion:sel, note:$('feel-text').value.trim(), date:new Date().toISOString() });
    DB.setFeelings(all);
    $('feel-text').value = '';
    form.classList.add('hidden');
    toast('Sentimiento guardado');
    renderFeelings();
  };
}

/* ── Poems ──────────────────────────────────────────────── */
function renderPoems() {
  const poems = DB.poems().sort((a,b) => b.date.localeCompare(a.date));
  const grid = $('poems-grid');
  grid.innerHTML = poems.map(p => `
    <div class="item-card" data-pid="${p.id}">
      ${p.favorite ? '<span class="item-fav-mark">★</span>' : ''}
      <div class="item-date">${formatDate(p.date)}</div>
      <div class="item-title">${p.title || 'Sin título'}</div>
      <div class="item-preview">${p.content.slice(0,120)}${p.content.length>120?'…':''}</div>
      ${p.tags?.length ? `<div class="item-tags">${p.tags.map(t=>`<span class="itag">${t}</span>`).join('')}</div>` : ''}
    </div>`).join('') || '<div class="empty-hint" style="padding:40px;text-align:center;grid-column:1/-1">Sin poemas aún — escribe el primero</div>';
  grid.querySelectorAll('[data-pid]').forEach(el => el.addEventListener('click', () => openView('poem', el.dataset.pid)));
}

function openPoemModal(id) {
  st.editPoemId = id || null;
  const poem = id ? DB.poems().find(p=>p.id===id) : null;
  $('poem-title').value = poem?.title || '';
  $('poem-date').value = poem?.date || today();
  $('poem-tags').value = poem?.tags?.join(', ') || '';
  $('poem-body').value = poem?.content || '';
  openModal('modal-poem');
}

function savePoem() {
  const title = $('poem-title').value.trim();
  const body = $('poem-body').value.trim();
  if(!body) return toast('Escribe algo primero');
  const poems = DB.poems();
  const tags = $('poem-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  if(st.editPoemId) {
    const i = poems.findIndex(p=>p.id===st.editPoemId);
    if(i>-1) poems[i] = { ...poems[i], title, content:body, date:$('poem-date').value, tags, updated:new Date().toISOString() };
  } else {
    poems.unshift({ id:uid(), title, content:body, date:$('poem-date').value||today(), tags, favorite:false, created:new Date().toISOString() });
  }
  DB.setPoems(poems);
  closeModal('modal-poem');
  toast('Poema guardado');
  renderPoems();
}

/* ── Dedications ────────────────────────────────────────── */
function renderDeds() {
  const all = DB.deds();
  const filtered = st.dedCat === 'all' ? all : all.filter(d=>d.cat===st.dedCat);
  const sorted = filtered.sort((a,b)=>b.date.localeCompare(a.date));
  const grid = $('deds-grid');
  grid.innerHTML = sorted.map(d => `
    <div class="item-card" data-did="${d.id}">
      ${d.favorite ? '<span class="item-fav-mark">★</span>' : ''}
      <div class="cat-badge">${CAT_LABELS[d.cat]||d.cat}</div>
      <div class="item-title">${d.title || 'Sin título'}</div>
      <div class="item-preview">${d.content.slice(0,120)}${d.content.length>120?'…':''}</div>
      <div class="item-date" style="margin-top:8px">${formatDate(d.date)}</div>
    </div>`).join('') || '<div class="empty-hint" style="padding:40px;text-align:center">Sin dedicatorias aún</div>';
  grid.querySelectorAll('[data-did]').forEach(el => el.addEventListener('click', () => openView('ded', el.dataset.did)));
}

function openDedModal(id) {
  st.editDedId = id || null;
  const ded = id ? DB.deds().find(d=>d.id===id) : null;
  $('ded-title').value = ded?.title || '';
  $('ded-cat').value = ded?.cat || 'para-ti';
  $('ded-to').value = ded?.to || '';
  $('ded-body').value = ded?.content || '';
  openModal('modal-ded');
}

function saveDed() {
  const title = $('ded-title').value.trim();
  const body = $('ded-body').value.trim();
  if(!body) return toast('Escribe algo primero');
  const deds = DB.deds();
  if(st.editDedId) {
    const i = deds.findIndex(d=>d.id===st.editDedId);
    if(i>-1) deds[i] = { ...deds[i], title, cat:$('ded-cat').value, to:$('ded-to').value.trim(), content:body, updated:new Date().toISOString() };
  } else {
    deds.unshift({ id:uid(), title, cat:$('ded-cat').value, to:$('ded-to').value.trim(), content:body, favorite:false, date:today(), created:new Date().toISOString() });
  }
  DB.setDeds(deds);
  closeModal('modal-ded');
  toast('Dedicatoria guardada');
  renderDeds();
}

/* ── View Modal ─────────────────────────────────────────── */
function openView(type, id) {
  st.viewType = type; st.viewId = id;
  const item = type==='poem' ? DB.poems().find(p=>p.id===id) : DB.deds().find(d=>d.id===id);
  if(!item) return;
  $('vm-meta').textContent = (type==='poem'?'Poema':'Dedicatoria') + ' · ' + formatDate(item.date||item.created?.slice(0,10)||today());
  $('vm-title').textContent = item.title || 'Sin título';
  $('vm-body').textContent = item.content;
  $('vm-fav').textContent = item.favorite ? '★' : '☆';
  $('vm-fav').classList.toggle('on', !!item.favorite);
  openModal('modal-view');
}

function toggleViewFav() {
  const { viewType: type, viewId: id } = st;
  if(type==='poem') {
    const poems = DB.poems(); const i = poems.findIndex(p=>p.id===id);
    if(i>-1) { poems[i].favorite = !poems[i].favorite; DB.setPoems(poems); $('vm-fav').textContent = poems[i].favorite?'★':'☆'; $('vm-fav').classList.toggle('on',poems[i].favorite); }
  } else {
    const deds = DB.deds(); const i = deds.findIndex(d=>d.id===id);
    if(i>-1) { deds[i].favorite = !deds[i].favorite; DB.setDeds(deds); $('vm-fav').textContent = deds[i].favorite?'★':'☆'; $('vm-fav').classList.toggle('on',deds[i].favorite); }
  }
}

function deleteViewItem() {
  const { viewType: type, viewId: id } = st;
  if(!confirm('¿Eliminar este elemento?')) return;
  if(type==='poem') { DB.setPoems(DB.poems().filter(p=>p.id!==id)); renderPoems(); }
  else { DB.setDeds(DB.deds().filter(d=>d.id!==id)); renderDeds(); }
  closeModal('modal-view');
  toast('Eliminado');
}

/* ── Gallery ────────────────────────────────────────────── */
function renderGallery() {
  const items = DB.gallery();
  const grid = $('gal-grid');
  grid.innerHTML = items.map(img => `
    <div class="gal-item" data-gid="${img.id}">
      <img src="${img.src}" alt="${img.caption||''}" loading="lazy" />
      ${img.caption ? `<div class="gal-cap">${img.caption}</div>` : ''}
    </div>`).join('') || '<div class="empty-hint" style="padding:60px;text-align:center">Sin fotos aún — agrega tu primer recuerdo</div>';
  grid.querySelectorAll('[data-gid]').forEach(el => {
    el.addEventListener('click', () => {
      const img = items.find(i=>i.id===el.dataset.gid);
      if(img) openLightbox(img.src, img.caption);
    });
  });
}

function openLightbox(src, cap) {
  $('lb-img').src = src;
  $('lb-cap').textContent = cap || '';
  openModal('lightbox');
}

function handleGalleryUpload(files) {
  [...files].forEach(file => {
    resizeImage(file, 1200, src => {
      const gallery = DB.gallery();
      const cap = prompt('Descripción de la foto (opcional):') || '';
      gallery.unshift({ id:uid(), src, caption:cap, date:today(), created:new Date().toISOString() });
      DB.setGallery(gallery);
      renderGallery();
      toast('Foto agregada');
    });
  });
}

/* Day modal images */
function handleDayImgUpload(files) {
  [...files].forEach(file => {
    resizeImage(file, 800, src => {
      st.dayImages.push({ id:uid(), src });
      renderDayThumbs();
    });
  });
}

/* ── Search ─────────────────────────────────────────────── */
function doSearch(q) {
  const out = $('search-out');
  if(!q.trim()) { out.innerHTML = ''; return; }
  const ql = q.toLowerCase();
  const notes = DB.notes();
  const poems = DB.poems();
  const deds = DB.deds();

  const noteRes = Object.entries(notes).filter(([k,n]) => k.includes(q)||n.title?.toLowerCase().includes(ql)||strip(n.content||'').toLowerCase().includes(ql));
  const poemRes = poems.filter(p => p.title?.toLowerCase().includes(ql)||p.content?.toLowerCase().includes(ql));
  const dedRes = deds.filter(d => d.title?.toLowerCase().includes(ql)||d.content?.toLowerCase().includes(ql));

  let html = '';
  if(noteRes.length) {
    html += '<div class="sr-group-title">Notas</div>';
    html += noteRes.slice(0,5).map(([k,n]) => `
      <div class="sr-item" data-type="note" data-key="${k}">
        <div class="sr-title">${n.title||formatDate(k)}</div>
        <div class="sr-preview">${strip(n.content||'').slice(0,100)}</div>
      </div>`).join('');
  }
  if(poemRes.length) {
    html += '<div class="sr-group-title">Poemas</div>';
    html += poemRes.slice(0,5).map(p => `
      <div class="sr-item" data-type="poem" data-id="${p.id}">
        <div class="sr-title">${p.title||'Sin título'}</div>
        <div class="sr-preview">${p.content.slice(0,100)}</div>
      </div>`).join('');
  }
  if(dedRes.length) {
    html += '<div class="sr-group-title">Dedicatorias</div>';
    html += dedRes.slice(0,5).map(d => `
      <div class="sr-item" data-type="ded" data-id="${d.id}">
        <div class="sr-title">${d.title||'Sin título'}</div>
        <div class="sr-preview">${d.content.slice(0,100)}</div>
      </div>`).join('');
  }
  out.innerHTML = html || '<div class="empty-hint" style="padding:30px">Sin resultados para "' + q + '"</div>';

  out.querySelectorAll('[data-type="note"]').forEach(el => {
    el.addEventListener('click', () => { const [y,m,d]=el.dataset.key.split('-'); openDayModal(+y,+m,+d); });
  });
  out.querySelectorAll('[data-type="poem"]').forEach(el => el.addEventListener('click', () => openView('poem', el.dataset.id)));
  out.querySelectorAll('[data-type="ded"]').forEach(el => el.addEventListener('click', () => openView('ded', el.dataset.id)));
}

/* ── Modal helpers ──────────────────────────────────────── */
function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

function setupModalClose() {
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => closeModal(el.dataset.close));
  });
}

/* ── Event Listeners ────────────────────────────────────── */
function bindEvents() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.section));
  });

  // Calendar year nav
  $('prev-yr').addEventListener('click', () => renderCalendar(st.calYear - 1));
  $('next-yr').addEventListener('click', () => renderCalendar(st.calYear + 1));

  // Day modal
  $('day-fav').addEventListener('click', () => {
    st.dayFav = !st.dayFav;
    $('day-fav').textContent = st.dayFav ? '★' : '☆';
    $('day-fav').classList.toggle('on', st.dayFav);
  });
  $('save-note').addEventListener('click', () => { saveNote(); closeModal('modal-day'); });
  $('day-img').addEventListener('change', e => handleDayImgUpload(e.target.files));

  // Feelings
  $('btn-log').addEventListener('click', openFeelingForm);

  // Poems
  $('btn-poem').addEventListener('click', () => openPoemModal(null));
  $('save-poem').addEventListener('click', savePoem);

  // Dedications
  $('btn-ded').addEventListener('click', () => openDedModal(null));
  $('save-ded').addEventListener('click', saveDed);
  $('ded-filters').addEventListener('click', e => {
    const chip = e.target.closest('.fchip'); if(!chip) return;
    $('ded-filters').querySelectorAll('.fchip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    st.dedCat = chip.dataset.cat;
    renderDeds();
  });

  // Gallery
  $('gal-input').addEventListener('change', e => handleGalleryUpload(e.target.files));

  // View modal
  $('vm-fav').addEventListener('click', toggleViewFav);
  $('vm-edit').addEventListener('click', () => {
    closeModal('modal-view');
    if(st.viewType==='poem') openPoemModal(st.viewId);
    else openDedModal(st.viewId);
  });
  $('vm-del').addEventListener('click', deleteViewItem);

  // Search
  let searchTimer;
  $('search-in').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(e.target.value), 300);
  });

  setupModalClose();
  setupEditorBar();
  setupAutosave();
}

/* ── Init ───────────────────────────────────────────────── */
function init() {
  const settings = DB.settings();
  st.calYear = settings.year || 2026;

  bindEvents();

  // Hide loading, show app
  const loading = $('loading-screen');
  setTimeout(() => {
    loading.style.opacity = '0';
    setTimeout(() => {
      loading.style.display = 'none';
      $('app').classList.remove('hidden');
      navigate('dashboard');
    }, 800);
  }, 1400);
}

document.addEventListener('DOMContentLoaded', init);
