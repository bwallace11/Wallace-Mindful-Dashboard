import { initClock }         from './clock.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { initRain }          from './rain.js';

/* ════════════════════════════════════
   LOCALSTORAGE
════════════════════════════════════ */
const LS = {
  get: (k, fb=null) => { try { const v=localStorage.getItem(k); return v!==null ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v)       => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn('LS:', e); } }
};
const $ = id => document.getElementById(id);

/* ════════════════════════════════════
   THEME
════════════════════════════════════ */
const html = document.documentElement;
let theme = LS.get('pom_theme','dark');
html.setAttribute('data-theme', theme);

function rainLight() {
  window._rainColorLight = theme==='light' || (theme==='system' && matchMedia('(prefers-color-scheme:light)').matches);
}
rainLight();
matchMedia('(prefers-color-scheme:light)').addEventListener('change', rainLight);

document.querySelectorAll('.theme-btn').forEach(btn => {
  if (btn.dataset.themeSet === theme) btn.classList.add('active');
  btn.addEventListener('click', () => {
    theme = btn.dataset.themeSet;
    html.setAttribute('data-theme', theme); LS.set('pom_theme', theme); rainLight();
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ════════════════════════════════════
   LIQUID GLASS INTERACTIVITY
════════════════════════════════════ */
function initGlassInteractivity() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const dispMap = document.querySelector('#glassDispMap');
      if (dispMap) dispMap.setAttribute('scale', Math.min(40 + (x/rect.width)*60, 90));
      const spec = this.querySelector('.glass-specular');
      if (spec) spec.style.background = `radial-gradient(circle at ${x}px ${y}px, oklch(100% 0 0 / 0.18) 0%, oklch(100% 0 0 / 0.06) 35%, oklch(100% 0 0 / 0) 65%)`;
    });
    card.addEventListener('mouseleave', function() {
      const dispMap = document.querySelector('#glassDispMap');
      if (dispMap) dispMap.setAttribute('scale', '70');
      const spec = this.querySelector('.glass-specular');
      if (spec) spec.style.background = '';
    });
  });
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
initRain();
initClock();
initGlassInteractivity();

/* ════════════════════════════════════
   CALENDAR
════════════════════════════════════ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DOTS = new Set([1,2,4,5,6]);
const STRK = new Set([0,3]);

const NOW=new Date(), TD=NOW.getDate(), TM=NOW.getMonth(), TY=NOW.getFullYear();

document.querySelector('.month').textContent      = MONTHS[TM];
document.querySelector('.dayOfMonth').textContent = TD;
document.querySelector('.year').textContent       = TY;
document.querySelector('.dayOfWeek').textContent  = DL[NOW.getDay()];
$('calMonthYear').textContent = `${MONTHS[TM].slice(0,3)} ${TY}`;

let calData = LS.get('pom_cal', {});
function dk(y,m,d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

function buildCal() {
  const g=$('calGrid'); g.innerHTML='';
  DS.forEach(d=>{ const e=document.createElement('div'); e.className='cal-day-name'; e.textContent=d; g.appendChild(e); });
  const fd=new Date(TY,TM,1).getDay(), dim=new Date(TY,TM+1,0).getDate();
  for(let i=0;i<fd;i++){ const e=document.createElement('div'); e.className='cal-day empty'; g.appendChild(e); }
  for(let d=1;d<=dim;d++){
    const dow=(fd+d-1)%7, key=dk(TY,TM,d);
    const e=document.createElement('div'); e.className='cal-day'; e.textContent=d;
    if(d===TD) e.classList.add('today');
    else if(DOTS.has(dow)) e.classList.add('dot-day');
    else if(STRK.has(dow)) e.classList.add('stroke-day');
    const sv=calData[key];
    if(sv&&(sv.note||sv.reminders?.length)) e.classList.add('has-note');
    e.addEventListener('click',()=>openCalModal(key));
    g.appendChild(e);
  }
}
buildCal();

let _ckey=null;
function openCalModal(key) {
  _ckey=key;
  const [y,m,dn]=key.split('-').map(Number);
  $('calModalDate').textContent = new Date(y,m-1,dn).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const sv=calData[key]||{note:'',reminders:[]};
  $('calNotesInput').value=sv.note||'';
  renderRem(sv.reminders||[]);
  $('calModal').classList.add('open');
  setTimeout(()=>$('calNotesInput').focus(),60);
}
function renderRem(list) {
  const el=$('calRemindersList'); el.innerHTML='';
  list.forEach((t,i)=>{
    const d=document.createElement('div'); d.className='reminder-item';
    d.innerHTML=`<span class="rdot"></span><span>${t}</span>`;
    const x=document.createElement('button'); x.className='rdel'; x.textContent='×';
    x.onclick=()=>{ calData[_ckey].reminders.splice(i,1); LS.set('pom_cal',calData); renderRem(calData[_ckey].reminders); buildCal(); };
    d.appendChild(x); el.appendChild(d);
  });
}
$('calNotesInput').addEventListener('input',()=>{
  if(!_ckey) return;
  if(!calData[_ckey]) calData[_ckey]={note:'',reminders:[]};
  calData[_ckey].note=$('calNotesInput').value; LS.set('pom_cal',calData); buildCal();
});
$('calAddReminder').addEventListener('click',()=>{
  const v=$('calReminderInput').value.trim(); if(!v||!_ckey) return;
  if(!calData[_ckey]) calData[_ckey]={note:'',reminders:[]};
  calData[_ckey].reminders.push(v); LS.set('pom_cal',calData);
  $('calReminderInput').value=''; renderRem(calData[_ckey].reminders); buildCal();
});
$('calReminderInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('calAddReminder').click(); });
$('calModalClose').addEventListener('click',()=>$('calModal').classList.remove('open'));
$('calModal').addEventListener('click',e=>{ if(e.target===$('calModal')) $('calModal').classList.remove('open'); });

/* ════════════════════════════════════
   GRADUATION COUNTDOWN
════════════════════════════════════ */
const graduationEl = document.querySelector('.daysUntilEvent');
if (graduationEl) graduationEl.textContent = getDaysUntilEvent('2026-06-15');

/* ════════════════════════════════════
   ANNIVERSARY SLIDESHOW
════════════════════════════════════ */
let annivPhotos = LS.get('pom_anniv_photos', []);
let annivIdx = 0, annivTimer = null;

const START_DATE = new Date('2022-04-20');
$('annivYears').textContent = ((new Date()-START_DATE)/(1000*60*60*24*365.25)).toFixed(1);

function updateAnnivCounter() {
  const ctr = $('annivCounter'); if (!ctr) return;
  if (annivPhotos.length > 1) { ctr.textContent = `${annivIdx+1} / ${annivPhotos.length}`; ctr.classList.add('visible'); }
  else { ctr.classList.remove('visible'); }
}
function showSlide(idx) {
  const img=$('annivImg'), ph=$('annivPlaceholder'), dots=$('annivDots');
  if (!annivPhotos.length) { img.classList.add('hidden'); ph.style.display=''; dots.innerHTML=''; updateAnnivCounter(); return; }
  annivIdx=((idx%annivPhotos.length)+annivPhotos.length)%annivPhotos.length;
  img.classList.remove('hidden'); ph.style.display='none'; img.style.opacity='0';
  img.src=annivPhotos[annivIdx].dataURL; img.onload=()=>{ img.style.opacity='1'; };
  dots.innerHTML='';
  annivPhotos.forEach((_,i)=>{ const d=document.createElement('span'); d.className='anniv-dot'+(i===annivIdx?' on':''); d.addEventListener('click',()=>{showSlide(i);startSlide();}); dots.appendChild(d); });
  updateAnnivCounter();
}
function startSlide() {
  clearInterval(annivTimer);
  if (annivPhotos.length > 1) annivTimer = setInterval(()=>showSlide(annivIdx+1), 4000);
}
showSlide(0); startSlide();

$('annivPrev').addEventListener('click',e=>{ e.stopPropagation(); showSlide(annivIdx-1); startSlide(); });
$('annivNext').addEventListener('click',e=>{ e.stopPropagation(); showSlide(annivIdx+1); startSlide(); });
$('annivAddBtn').addEventListener('click',e=>{ e.stopPropagation(); $('annivUpload').click(); });
$('annivRemoveBtn').addEventListener('click',e=>{
  e.stopPropagation(); if(!annivPhotos.length) return;
  annivPhotos.splice(annivIdx,1); LS.set('pom_anniv_photos',annivPhotos);
  showSlide(Math.max(0,annivIdx-1)); startSlide();
});
$('annivUpload').addEventListener('change',e=>{
  const files=Array.from(e.target.files); if(!files.length) return;
  let loaded=0;
  files.forEach(f=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      annivPhotos.push({dataURL:ev.target.result}); loaded++;
      if(loaded===files.length){ LS.set('pom_anniv_photos',annivPhotos); showSlide(annivPhotos.length-1); startSlide(); }
    };
    reader.readAsDataURL(f);
  });
  e.target.value='';
});

/* ════════════════════════════════════
   GYM LOG
════════════════════════════════════ */
const GYM_DAYS  = new Set([1,2,4,5,6]);
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getWeekKey(date=new Date()) {
  const d=new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10);
}
let gymData = LS.get('pom_gym',{});
function pruneGym() { const keys=Object.keys(gymData).sort(); if(keys.length>8) keys.slice(0,keys.length-8).forEach(k=>delete gymData[k]); LS.set('pom_gym',gymData); }
pruneGym();
function getThisWeek() { const k=getWeekKey(); if(!gymData[k]){gymData[k]={};LS.set('pom_gym',gymData);} return gymData[k]; }

function buildGymWidget() {
  const week=getThisWeek(), todayDow=new Date().getDay(), el=$('gymWeek');
  el.innerHTML='';
  for(let d=0;d<7;d++){
    const isGym=GYM_DAYS.has(d), isToday=d===todayDow, logged=week[d];
    const cell=document.createElement('div'); cell.className='gym-cell';
    if(isToday) cell.classList.add('gym-today');
    if(!isGym)  cell.classList.add('gym-rest');
    const lbl=document.createElement('span'); lbl.className='gym-day-label'; lbl.textContent=DAY_SHORT[d].slice(0,2);
    const dot=document.createElement('span'); dot.className='gym-dot';
    if(!isGym)              { dot.textContent='—'; dot.classList.add('gym-dot-rest'); }
    else if(logged===true)  { dot.textContent='✓'; dot.classList.add('gym-dot-yes'); }
    else if(logged===false) { dot.textContent='✗'; dot.classList.add('gym-dot-no'); }
    else                    { dot.textContent='·'; dot.classList.add('gym-dot-pending'); }
    cell.appendChild(lbl); cell.appendChild(dot); el.appendChild(cell);
  }
}
function buildGymModal() {
  const week=getThisWeek(), todayDow=new Date().getDay(), el=$('gymWeekFull');
  el.innerHTML='';
  for(let d=0;d<7;d++){
    const isGym=GYM_DAYS.has(d), isToday=d===todayDow, logged=week[d];
    if(isGym && logged===undefined && d<todayDow){ week[d]=false; LS.set('pom_gym',gymData); }
    const row=document.createElement('div'); row.className='gym-row'+(isToday?' gym-row-today':'')+((!isGym)?' gym-row-rest':'');
    const name=document.createElement('span'); name.className='gym-row-name'; name.textContent=DAY_SHORT[d];
    const status=document.createElement('span'); status.className='gym-row-status';
    if(!isGym)              { status.textContent='Rest day 😴'; status.classList.add('gym-status-rest'); }
    else if(logged===true)  { status.textContent='✓ Went!'; status.classList.add('gym-status-yes'); }
    else if(logged===false) { status.textContent='✗ Missed'; status.classList.add('gym-status-no'); }
    else if(isToday)        { status.textContent='Did you go today?'; status.classList.add('gym-status-pending'); }
    else if(d<todayDow)     { status.textContent='— Missed'; status.classList.add('gym-status-no'); }
    else                    { status.textContent='Upcoming'; status.classList.add('gym-status-pending'); }
    row.appendChild(name); row.appendChild(status); el.appendChild(row);
  }
  const hist=$('gymHistory'); hist.innerHTML='';
  const pastKeys=Object.keys(gymData).sort().reverse().filter(k=>k!==getWeekKey()).slice(0,8);
  if(!pastKeys.length){ const p=document.createElement('p'); p.style.cssText='font-size:.55rem;color:var(--txt-d);text-align:center;padding:10px 0'; p.textContent='No past weeks yet.'; hist.appendChild(p); }
  pastKeys.forEach(k=>{ const w=gymData[k]; const went=[1,2,4,5,6].filter(d=>w[d]===true).length; const date=new Date(k); const lbl=date.toLocaleDateString('en-US',{month:'short',day:'numeric'}); const item=document.createElement('div'); item.className='gym-hist-item'; item.innerHTML=`<span>Week of ${lbl}</span><span class="gym-hist-count">${went}/5 days</span>`; hist.appendChild(item); });
}
$('gymLogBtn').addEventListener('click',e=>{
  e.stopPropagation();
  const todayDow=new Date().getDay(), week=getThisWeek();
  if(!GYM_DAYS.has(todayDow)){ buildGymModal(); $('gymModal').classList.add('open'); return; }
  week[todayDow]=true; gymData[getWeekKey()]=week; LS.set('pom_gym',gymData);
  buildGymWidget(); buildGymModal();
  const cells=$('gymWeek').querySelectorAll('.gym-cell');
  if(cells[todayDow]){ cells[todayDow].style.background='oklch(88% 0.14 155 / 0.22)'; setTimeout(()=>cells[todayDow].style.background='',800); }
});
$('gymCard').addEventListener('click',()=>{ buildGymModal(); $('gymModal').classList.add('open'); });
$('gymModalClose').addEventListener('click',()=>$('gymModal').classList.remove('open'));
$('gymModal').addEventListener('click',e=>{ if(e.target===$('gymModal')) $('gymModal').classList.remove('open'); });
buildGymWidget();

/* ════════════════════════════════════
   WATER WIDGET
════════════════════════════════════ */
const todayStr=()=>{ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
let waterData=LS.get('pom_water',{}), waterGoal=waterData.goal||64;
function getTodayWater(){ const k=todayStr(); if(!waterData[k]) waterData[k]={oz:0,log:[]}; return waterData[k]; }
function saveWater(){ LS.set('pom_water',waterData); }
function updateWaterUI(){
  const e=getTodayWater(), pct=Math.min(100,(e.oz/waterGoal)*100);
  $('waterOzDisplay').textContent=e.oz; $('waterGoalDisplay').textContent=waterGoal;
  $('waterMiniFill').style.width=pct+'%'; $('waterFill').style.height=pct+'%';
  $('wToday').textContent=e.oz; $('wGoal').textContent=waterGoal;
  const hist=$('waterHistory'); if(!hist) return; hist.innerHTML='';
  Object.keys(waterData).filter(k=>k!=='goal').sort().reverse().slice(0,14).forEach(k=>{
    const en=waterData[k]; if(!en||!en.oz) return;
    const row=document.createElement('div'); row.className='whist-item';
    row.innerHTML=`<strong>${k===todayStr()?'Today':k}</strong><span>${en.oz} oz <span style="color:var(--lav)">${Math.min(100,Math.round(en.oz/waterGoal*100))}%</span></span>`;
    hist.appendChild(row);
  });
}
function triggerDrip(){ const d=$('waterDrip'); d.classList.remove('dripping'); void d.offsetWidth; d.classList.add('dripping'); setTimeout(()=>d.classList.remove('dripping'),800); }
$('waterCard').addEventListener('click',()=>{ updateWaterUI(); $('waterModal').classList.add('open'); });
$('waterLogBtn').addEventListener('click',()=>{ const r=parseFloat($('waterOzInput').value); if(!r||r<=0) return; const e=getTodayWater(); e.oz+=r; e.log.push({time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),oz:r}); saveWater(); $('waterOzInput').value=''; triggerDrip(); updateWaterUI(); });
$('waterOzInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('waterLogBtn').click(); });
$('waterGoalSave').addEventListener('click',()=>{ const v=parseInt($('waterGoalInput').value); if(v>=16){waterGoal=v;waterData.goal=v;saveWater();updateWaterUI();} });
$('waterModalClose').addEventListener('click',()=>$('waterModal').classList.remove('open'));
$('waterModal').addEventListener('click',e=>{ if(e.target===$('waterModal')) $('waterModal').classList.remove('open'); });
updateWaterUI();

/* ════════════════════════════════════
   FOX
════════════════════════════════════ */
async function loadFox(){
  const wrap=$('foxImgWrap');
  try{ const r=await fetch('https://randomfox.ca/floof/'); const d=await r.json(); const img=document.createElement('img'); img.src=d.image; img.alt='A cute fox'; img.style.cssText='opacity:0;transition:opacity .4s ease'; img.onload=()=>img.style.opacity='1'; wrap.innerHTML=''; wrap.appendChild(img); }
  catch{ wrap.innerHTML='<span class="fox-emoji">🦊</span>'; }
}
loadFox(); $('foxCard').addEventListener('click',loadFox);

/* ════════════════════════════════════
   LIBRARY
════════════════════════════════════ */
$('openLibrary').addEventListener('click',()=>$('libraryModal').classList.add('open'));
$('libraryClose').addEventListener('click',()=>$('libraryModal').classList.remove('open'));
$('libraryModal').addEventListener('click',e=>{if(e.target===$('libraryModal'))$('libraryModal').classList.remove('open');});

const BOOKS={
  'night-circus':    {title:'The Night Circus',    author:'Erin Morgenstern', cover:'https://covers.openlibrary.org/b/id/8236055-L.jpg',   s:'Two young magicians are pitted against each other in a mysterious competition set within a magical black-and-white circus. As their rivalry deepens into romance, the stakes grow ever more dangerous.'},
  'atomic-habits':   {title:'Atomic Habits',        author:'James Clear',      cover:'https://covers.openlibrary.org/b/id/10521270-L.jpg',  s:'Clear explains how tiny changes compound into remarkable results and gives a practical framework for making good habits automatic and bad ones unattractive.'},
  'dune':            {title:'Dune',                 author:'Frank Herbert',    cover:'https://covers.openlibrary.org/b/id/8370614-L.jpg',   s:'Paul Atreides navigates political intrigue and desert survival on Arrakis, the only source of the most valuable substance in the universe.'},
  'hobbit':          {title:'The Hobbit',           author:'J.R.R. Tolkien',  cover:'https://covers.openlibrary.org/b/id/6979861-L.jpg',   s:'Bilbo Baggins is swept into an epic quest to reclaim a lost kingdom from the dragon Smaug. A timeless adventure of courage and unexpected heroism.'},
  'silent-patient':  {title:'The Silent Patient',   author:'Alex Michaelides',cover:'https://covers.openlibrary.org/b/id/9272648-L.jpg',   s:'Alicia Berenson shoots her husband and never speaks again. A psychotherapist becomes obsessed with uncovering her motive.'},
  'midnight-library':{title:'The Midnight Library', author:'Matt Haig',       cover:'https://covers.openlibrary.org/b/id/10410782-L.jpg',  s:'Between life and death exists a library of infinite books, each a different life. Nora must decide which life is truly worth living.'},
  'gone-girl':       {title:'Gone Girl',            author:'Gillian Flynn',   cover:'https://covers.openlibrary.org/b/id/8371112-L.jpg',   s:'Amy Dunne disappears on her anniversary. Unreliable narrators dissect marriage, media, and the psychology of deception.'},
  'martian':         {title:'The Martian',          author:'Andy Weir',       cover:'https://covers.openlibrary.org/b/id/8391800-L.jpg',   s:'Mark Watney is stranded alone on Mars. Armed with botany, ingenuity, and dark humor, he must survive and signal NASA.'}
};
let bkState=LS.get('pom_books',{}); Object.keys(BOOKS).forEach(k=>{if(!bkState[k])bkState[k]={rating:0,link:''};});
let curBook=null;
function openBook(key){
  const bk=BOOKS[key],st=bkState[key]; if(!bk) return; curBook=key;
  $('bookDetailTitle').textContent=bk.title; $('bookDetailAuthor').textContent=bk.author; $('bookSummaryText').textContent=bk.s;
  const cov=$('bookCover'); cov.innerHTML=''; const img=new Image(); img.src=bk.cover; img.alt=bk.title; img.onerror=()=>{cov.innerHTML='📖';}; cov.appendChild(img);
  document.querySelectorAll('.star').forEach(s=>s.classList.toggle('on',+s.dataset.star<=st.rating));
  $('bookLinkInput').value=st.link; $('bookDetailModal').classList.add('open');
}
document.querySelectorAll('.book-card').forEach(c=>c.addEventListener('click',()=>openBook(c.dataset.book)));
document.querySelectorAll('.star').forEach(star=>{
  star.addEventListener('click',()=>{ const n=+star.dataset.star; if(!curBook) return; bkState[curBook].rating=n; LS.set('pom_books',bkState); document.querySelectorAll('.star').forEach(s=>s.classList.toggle('on',+s.dataset.star<=n)); });
  star.addEventListener('mouseenter',()=>{ const n=+star.dataset.star; document.querySelectorAll('.star').forEach(s=>s.style.color=+s.dataset.star<=n?'var(--lav)':''); });
  star.addEventListener('mouseleave',()=>document.querySelectorAll('.star').forEach(s=>s.style.color=''));
});
$('bookLinkInput').addEventListener('input',()=>{if(curBook){bkState[curBook].link=$('bookLinkInput').value;LS.set('pom_books',bkState);}});
$('bookLinkOpen').addEventListener('click',()=>{const u=$('bookLinkInput').value.trim();if(u)window.open(u.startsWith('http')?u:'https://'+u,'_blank');});
$('bookDetailClose').addEventListener('click',()=>$('bookDetailModal').classList.remove('open'));
$('bookDetailModal').addEventListener('click',e=>{if(e.target===$('bookDetailModal'))$('bookDetailModal').classList.remove('open');});

/* ════════════════════════════════════
   MUSIC
════════════════════════════════════ */
const aud=$('audioPlayer'),pBtn=$('musicPlay'),prvBtn=$('musicPrev'),nxtBtn=$('musicNext');
const volEl=$('musicVolume'),upEl=$('musicUpload'),trkEl=$('musicTrack'),artEl=$('musicArtist');
const fillEl=$('musicFill'),timeEl=$('musicTimeDisplay'),barEl=$('musicProgressBar');
let plist=[],tidx=0;
const fmt=s=>isNaN(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
aud.volume=LS.get('pom_vol',0.8); volEl.value=aud.volume;
volEl.addEventListener('input',()=>{aud.volume=+volEl.value;LS.set('pom_vol',+volEl.value);});
function loadTrack(i){if(!plist.length)return;tidx=(i+plist.length)%plist.length;const t=plist[tidx];aud.src=t.url;trkEl.textContent=t.name;artEl.textContent=t.size?`${(t.size/1048576).toFixed(1)} MB`:'—';fillEl.style.width='0%';timeEl.textContent='0:00 / 0:00';}
function togPlay(){if(!plist.length)return;aud.paused?(aud.play(),pBtn.textContent='⏸'):(aud.pause(),pBtn.textContent='▶');}
aud.addEventListener('timeupdate',()=>{if(!aud.duration)return;fillEl.style.width=(aud.currentTime/aud.duration*100)+'%';timeEl.textContent=`${fmt(aud.currentTime)} / ${fmt(aud.duration)}`;});
aud.addEventListener('ended',()=>{loadTrack(tidx+1);aud.play();pBtn.textContent='⏸';});
barEl.addEventListener('click',e=>{if(!aud.duration)return;const r=barEl.getBoundingClientRect();aud.currentTime=(e.clientX-r.left)/r.width*aud.duration;});
pBtn.addEventListener('click',togPlay);
prvBtn.addEventListener('click',()=>{loadTrack(tidx-1);if(!aud.paused)aud.play();});
nxtBtn.addEventListener('click',()=>{loadTrack(tidx+1);if(!aud.paused)aud.play();});
upEl.addEventListener('change',e=>{const was=!plist.length;Array.from(e.target.files).forEach(f=>plist.push({name:f.name.replace(/\.[^.]+$/,''),size:f.size,url:URL.createObjectURL(f)}));if(was&&plist.length)loadTrack(0);e.target.value='';});

/* ════════════════════════════════════
   MEDICATION TRACKER
   Storage keys:
     pom_med_list     — [{id,name,mg,freq,notes}]
     pom_med_taken    — {YYYY-M-D: true}
     pom_med_refill   — ISO date string of last pill container refill
════════════════════════════════════ */
const FREQ_LABELS = { once:'Once daily', twice:'Twice daily', three:'3× daily', asneeded:'As needed', weekly:'Weekly' };
const REFILL_DAYS = 14; // remind every 14 days
const MED_CYAN = 'oklch(78% 0.14 200)';

let medList   = LS.get('pom_med_list',  []);
let medTaken  = LS.get('pom_med_taken', {});
let medRefill = LS.get('pom_med_refill', null); // ISO date of last refill

/* ── helpers ── */
const medTodayKey = () => {
  const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
};
const isTakenToday = () => !!medTaken[medTodayKey()];

/* ── refill reminder logic ── */
function daysSinceRefill() {
  if (!medRefill) return Infinity;
  const diff = Date.now() - new Date(medRefill).getTime();
  return Math.floor(diff / (1000*60*60*24));
}
function shouldShowRefill() {
  // Show if: never refilled, OR >= REFILL_DAYS since last refill
  // Snooze: user dismissed within last 7 days → stored in pom_med_snooze
  const snoozedUntil = LS.get('pom_med_snooze_until', null);
  if (snoozedUntil && Date.now() < new Date(snoozedUntil).getTime()) return false;
  return daysSinceRefill() >= REFILL_DAYS;
}
function updateRefillBanner() {
  const banner = $('medRefillBanner');
  banner.classList.toggle('visible', shouldShowRefill());
}
function setRefillNow() {
  medRefill = new Date().toISOString();
  LS.set('pom_med_refill', medRefill);
  // Clear snooze
  LS.set('pom_med_snooze_until', null);
  updateRefillBanner();
  updateRefillDisplay();
}
function snoozeRefill() {
  // Snooze for 7 days
  const snoozeUntil = new Date(Date.now() + 7*24*60*60*1000).toISOString();
  LS.set('pom_med_snooze_until', snoozeUntil);
  updateRefillBanner();
}
function updateRefillDisplay() {
  const el = $('medLastRefillDisplay');
  if (!el) return;
  if (!medRefill) { el.textContent = 'Never'; return; }
  const d = new Date(medRefill);
  el.textContent = d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const days = daysSinceRefill();
  el.textContent += ` (${days}d ago)`;
}

/* ── week strip (Sun-Sat) ── */
function buildMedWidget() {
  const el=$('medWeek'); el.innerHTML='';
  const todayDow=new Date().getDay();
  const weekStart=new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-todayDow);
  for(let d=0;d<7;d++){
    const date=new Date(weekStart); date.setDate(weekStart.getDate()+d);
    const key=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const isToday=d===todayDow, taken=!!medTaken[key], isPast=d<todayDow;
    const cell=document.createElement('div'); cell.className='med-cell';
    if(isToday) cell.classList.add('med-today');
    const lbl=document.createElement('span'); lbl.className='med-day-label'; lbl.textContent=DAY_SHORT[d].slice(0,2);
    const dot=document.createElement('span'); dot.className='med-dot';
    if(taken)          { dot.textContent='✓'; dot.classList.add('med-dot-taken'); }
    else if(isPast)    { dot.textContent='✗'; dot.classList.add('med-dot-missed'); }
    else               { dot.textContent='·'; dot.classList.add('med-dot-pending'); }
    cell.appendChild(lbl); cell.appendChild(dot); el.appendChild(cell);
  }
  // Button text
  $('medTakenBtn').textContent = isTakenToday() ? '✓ Taken today' : 'Taken today! 💊';
  $('medTakenBtn').style.opacity = isTakenToday() ? '0.55' : '1';
}

/* ── modal med list ── */
function renderMedList() {
  const el=$('medList'); el.innerHTML='';
  if (!medList.length) {
    el.innerHTML='<p style="font-size:.54rem;color:var(--txt-d);text-align:center;padding:14px 0;font-family:\'DM Mono\',monospace">No medications added yet.</p>';
    return;
  }
  medList.forEach((med,i)=>{
    const item=document.createElement('div'); item.className='med-item';
    const freqLabel=FREQ_LABELS[med.freq]||med.freq;
    item.innerHTML=`
      <span class="med-item-icon">💊</span>
      <div class="med-item-info">
        <div class="med-item-name">${med.name}</div>
        <div class="med-item-detail">${med.mg} · ${freqLabel}</div>
        ${med.notes?`<div class="med-item-notes">${med.notes}</div>`:''}
      </div>
      <button class="med-item-delete" data-idx="${i}" title="Remove">✕</button>
    `;
    el.appendChild(item);
  });
  el.querySelectorAll('.med-item-delete').forEach(btn=>{
    btn.addEventListener('click',()=>{
      medList.splice(+btn.dataset.idx,1);
      LS.set('pom_med_list',medList);
      renderMedList();
    });
  });
}

/* ── mark taken today ── */
$('medTakenBtn').addEventListener('click', e=>{
  e.stopPropagation();
  if (isTakenToday()) return; // already logged
  medTaken[medTodayKey()] = true;
  LS.set('pom_med_taken', medTaken);
  buildMedWidget();
  // flash
  const cells=$('medWeek').querySelectorAll('.med-cell');
  const todayDow=new Date().getDay();
  if(cells[todayDow]){ cells[todayDow].style.background='oklch(78% 0.14 200 / 0.28)'; setTimeout(()=>cells[todayDow].style.background='',900); }
});

/* ── card opens modal ── */
$('medCard').addEventListener('click', ()=>{
  renderMedList();
  updateRefillDisplay();
  $('medModal').classList.add('open');
});
$('medModalClose').addEventListener('click',()=>$('medModal').classList.remove('open'));
$('medModal').addEventListener('click',e=>{ if(e.target===$('medModal')) $('medModal').classList.remove('open'); });

/* ── add medication ── */
$('medAddBtn').addEventListener('click',()=>{
  const name=$('medNameInput').value.trim();
  const mg=$('medMgInput').value.trim();
  if(!name) return;
  medList.push({ id:Date.now(), name, mg:mg||'—', freq:$('medFreqSelect').value, notes:$('medNotesInput').value.trim() });
  LS.set('pom_med_list',medList);
  $('medNameInput').value=''; $('medMgInput').value=''; $('medNotesInput').value='';
  $('medFreqSelect').value='once';
  renderMedList();
});
$('medNameInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('medAddBtn').click(); });

/* ── refill actions ── */
$('medRefillResetBtn').addEventListener('click',()=>{ setRefillNow(); });
$('medRefillSnooze').addEventListener('click',e=>{ e.stopPropagation(); snoozeRefill(); });

/* ── init ── */
buildMedWidget();
updateRefillBanner();

// Re-check refill reminder every hour in case dashboard stays open
setInterval(()=>{ updateRefillBanner(); }, 60*60*1000);
