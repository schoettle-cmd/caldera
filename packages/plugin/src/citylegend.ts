// The legend panel ("What am I looking at", LIVING-CITY-DESIGN.md (d)): a Legend chip in the toolbar (keyboard L, state in
// localStorage), a 300 px panel bottom left with one row per element class: the real sprite at 1x on a tiny canvas, the
// live count with "= fact" and how it is computed, "+n" when caps truncate so the number is always the data. Tap a row to
// highlight that class on the map for 3 s. On a phone it is a bottom sheet with the descriptions hidden. The chip, the
// panel and its CSS are created by this script, so hosted pages whose HTML the hub only script-upgrades get it too.
// legendRows() is pure (tested).
export const LEGEND_JS = String.raw`
// ---- legend (citylegend.ts)
var LEG={on:false,el:null,chip:null,rows:[]};try{LEG.on=localStorage.getItem('caldera.legend')==='1'}catch(err){}
var LEG_CSS='.c-lgd{position:absolute;left:10px;bottom:10px;width:300px;max-height:70%;overflow-y:auto;overscroll-behavior:contain;z-index:6;background:rgba(11,16,32,.94);border:1px solid #2B3752;color:#CFEFFF;font:12px/1.35 var(--font-mono,"IBM Plex Mono"),ui-monospace,monospace;padding:8px 10px;box-sizing:border-box}'
 +'.c-lgd .h{display:flex;justify-content:space-between;align-items:center;font-weight:600;letter-spacing:.06em;color:#fff;margin-bottom:4px}.c-lgd .h button{font:inherit;background:none;border:0;color:inherit;cursor:pointer;padding:0 2px}'
 +'.c-lgd .row{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-top:1px solid rgba(255,255,255,.07);cursor:pointer;min-height:36px;box-sizing:border-box}.c-lgd .row:hover{background:rgba(255,255,255,.04)}'
 +'.c-lgd canvas{width:34px;height:12px;flex:none;margin-top:2px;background:#1B2233;image-rendering:pixelated;image-rendering:crisp-edges}.c-lgd .t{flex:1;min-width:0}.c-lgd .f{display:inline-block;padding:0 4px;border-radius:2px;max-width:100%}.c-lgd .w{font-size:10.5px;color:#7FA6B8;margin-top:1px}'
 +'.c-lgd .ft{margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,.07);font-size:10.5px;color:#7FA6B8}'
 +'html[data-theme=light] .c-lgd{background:rgba(255,255,255,.96);border-color:#C9D2E2;color:#1B2233}html[data-theme=light] .c-lgd .h{color:#1B2233}html[data-theme=light] .c-lgd canvas{background:#DDE4EF}html[data-theme=light] .c-lgd .w,html[data-theme=light] .c-lgd .ft{color:#4A5568}html[data-theme=light] .c-lgd .row{border-top-color:rgba(0,0,0,.08)}'
 +'.c-lgd.sheet{left:0;right:0;bottom:0;width:auto;max-height:60%;border-radius:12px 12px 0 0;font-size:11px;padding:6px 10px 10px}.c-lgd.sheet .w{display:none}.c-lgd.sheet .row{min-height:36px;align-items:center}.c-lgd.sheet .grip{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.25);margin:0 auto 6px}'
 +'.c-live .lgd-open{color:#9FC3FF;text-decoration:underline;cursor:pointer}html.c-mini .c-lgd,html.c-mini #t-legend{display:none}';
var LEG_COL={walk:'#3F7FD9',stroll:'#F2C14E',cars:'#9FD4FF',vans:'#FFD24A',scoots:'#FF8A3D',bus:'#F2A33A',drones:'#3DF2FF',steam:'#6F7C8F'};
function legTint(h){var n=parseInt(h.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+',.13)'}
function legPlus(o){return o&&o.raw>o.n?' +'+(o.raw-o.n):''}
/** the rows the panel states, from lifeCounts(): [{cls,label,fact,how}]; the owner's page carries the numbers, the public page the facts only */
function legendRows(cnt,mode){var pv=mode==='private',ag=cnt.agents||{},rows=[],n=function(o){return o?o.n:0};
  function row(cls,label,fact,how){rows.push({cls:cls,label:label,fact:fact,how:how,col:LEG_COL[cls]})}
  row('walk',pv?n(cnt.walk)+' walking'+legPlus(cnt.walk):'walking',pv?(cnt.walk?cnt.walk.raw:0)+' people on your sites now':'people on these sites now','one figure per person counted on a site right now; they walk the district between its doors');
  if(pv)row('stroll',n(cnt.stroll)+' strolling'+legPlus(cnt.stroll),'visitors in 24 h ÷ 200','one slow walker per 200 visitors to a district in the last day, at most 10, so yesterday’s traffic still shows at night');
  row('cars',pv?n(cnt.cars)+' cars'+legPlus(cnt.cars):'cars',pv?'views ÷ 400 + commits this week ÷ 5':'page views and commits this week','one car per 400 page views in 24 h, plus a trickle for every district with commits (at least one)');
  if(pv){row('vans',n(cnt.vans)+' vans'+legPlus(cnt.vans),(cnt.vans?cnt.vans.raw:0)+' sales today','one van per sale, white with the district’s colour; it drives to the lobby, waits 20 s and leaves');
    row('scoots',n(cnt.scoots)+' scooters'+legPlus(cnt.scoots),(cnt.scoots?cnt.scoots.raw:0)+' signups today','one courier per signup, 1.4× car speed, to the district lobby');
    row('bus',n(cnt.bus)+(n(cnt.bus)===1?' bus':' buses'),'districts with 500+ visitors in 24 h','one bus per district with real daily traffic (two at 5 000); it loops the ring road and stops at the shelter')}
  row('drones',(ag.working||0)+' working · '+(ag.thinking||0)+' thinking · '+(ag.waiting||0)+' waiting on you','AI sessions','one drone per AI session the hub reports: a beam into the roof while it works, purple orbit while it thinks, amber strobe when it waits on you; the sky base holds the rest');
  row('steam',cnt.steam+' roofs steaming','repos with commits this week','one vent per repo with commits this week, two when there are commits today; crews at the cranes mean commits today');
  return rows}
function legendSwatch(cls){var cv=document.createElement('canvas');cv.width=68;cv.height=24;var c=cv.getContext('2d');if(!c)return cv;c.imageSmoothingEnabled=false;c.scale(2,2);
  try{if(cls==='walk'){pxBlit(c,lifeSpr(1,0),11,11,false,PXS);pxBlit(c,lifeSpr(0,1),20,11,true,PXS)}
    else if(cls==='stroll')pxBlit(c,lifeSpr(2,0),17,11,false,PXS);
    else if(cls==='cars')pxBlit(c,vehSpr('car','#D9483B',false),17,10,false,PXS);
    else if(cls==='vans')pxBlit(c,vehSpr('van','#8B6CF6',false),17,10,false,PXS);
    else if(cls==='scoots')pxBlit(c,vehSpr('scooter','#FF8A3D',false),17,9,false,PXS);
    else if(cls==='bus')pxBlit(c,vehSpr('bus','#F2A33A',false),17,10,false,PXS);
    else if(cls==='drones')pxBlit(c,drSprite('working','a',false),17,12,false,PXS);
    else if(cls==='steam'){pxBlit(c,steamSpr(1),13,9,false,PXS);pxBlit(c,steamSpr(2),20,6,false,PXS);c.fillStyle='#9AA1AD';c.fillRect(11,9,4,3)}}catch(err){}
  return cv}
function legendPanel(){if(LEG.el)return LEG.el;var el=document.createElement('div');el.className='c-lgd'+(st.clientWidth<600?' sheet':'');el.setAttribute('role','region');el.setAttribute('aria-label','What am I looking at');el.hidden=true;st.appendChild(el);LEG.el=el;
  el.addEventListener('click',function(ev){var r=ev.target.closest&&ev.target.closest('.row');if(ev.target.closest&&ev.target.closest('.x')){legendToggle(false);return}if(!r)return;LIFE.hl=r.getAttribute('data-cls');LIFE.hlAt=performance.now();draw()});
  var ty=null;el.addEventListener('touchstart',function(ev){ty=ev.touches[0].clientY},{passive:true});el.addEventListener('touchend',function(ev){if(ty!=null&&ev.changedTouches[0].clientY-ty>40)legendToggle(false);ty=null});   // swipe down closes the sheet
  return el}
function legendUpdate(){if(!LEG.el||LEG.el.hidden)return;var cnt=lifeCounts(),rows=legendRows(cnt,LV.mode||'private'),el=LEG.el,sheet=el.classList.contains('sheet');
  if(!LEG.rows.length||LEG.rows.length!==rows.length){el.innerHTML=(sheet?'<div class="grip"></div>':'')+'<div class="h"><span>What am I looking at</span><button class="x" aria-label="Close legend">×</button></div>'+rows.map(function(r){return '<div class="row" data-cls="'+r.cls+'"><span class="sw"></span><div class="t"><span class="f" style="color:'+r.col+';background:'+legTint(r.col)+'"></span><div class="w"></div></div></div>'}).join('')+'<div class="ft"></div>';
    el.querySelectorAll('.row').forEach(function(d){var sw=d.querySelector('.sw');sw.replaceWith(legendSwatch(d.getAttribute('data-cls')))});LEG.rows=rows}
  el.querySelectorAll('.row').forEach(function(d,i){var r=rows[i];if(!r)return;d.querySelector('.f').textContent=r.label+' = '+r.fact;d.querySelector('.w').textContent=r.how});
  var wx=typeof wxKind==='function'?wxKind():'',ph=typeof MN==='object'&&MN[sky]?MN[sky]:sky;el.querySelector('.ft').textContent=ph+(wx&&wx!=='clear'?' · '+wx:'')+' · '+(cnt.mode==='private'?'your numbers, only you see them':'public: activity levels, no numbers')+' · counts include what is not drawn'}
function legendToggle(on){LEG.on=on==null?!LEG.on:!!on;var el=legendPanel();el.hidden=!LEG.on;if(LEG.chip)LEG.chip.setAttribute('aria-pressed',String(LEG.on));if(LEG.on){LEG.rows=[];legendUpdate()}try{localStorage.setItem('caldera.legend',LEG.on?'1':'0')}catch(err){}}
function legendInit(){if(MINI||!st)return;if(!document.getElementById('c-lgd-css')){var s=document.createElement('style');s.id='c-lgd-css';s.textContent=LEG_CSS;document.head.appendChild(s)}
  var tools=st.querySelector('.c-tools'),chip=document.getElementById('t-legend');if(!chip&&tools){chip=document.createElement('button');chip.id='t-legend';chip.title='What am I looking at (L)';chip.innerHTML='&#x25A3;<span class="t-txt"> Legend</span>';var after=document.getElementById('t-labels');if(after&&after.parentNode===tools)after.insertAdjacentElement('afterend',chip);else tools.insertBefore(chip,tools.firstChild)}
  if(chip){LEG.chip=chip;chip.setAttribute('aria-pressed',String(LEG.on));chip.onclick=function(){legendToggle()}}
  document.addEventListener('keydown',function(ev){if(ev.key!=='l'&&ev.key!=='L')return;var t=ev.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;if(ev.metaKey||ev.ctrlKey||ev.altKey)return;legendToggle()});
  if(LEG.on)legendToggle(true);setInterval(function(){if(LEG.on&&!document.hidden)legendUpdate()},2500)}
`;
