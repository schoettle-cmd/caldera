/**
 * Caldera City (the Obsidian Visualizer): your GitHub as a little isometric city, your Obsidian notes as the
 * houses around it. Districts = projects, towers = repos (height = commits this year), lit windows = this week's
 * commits, cranes = being built right now, cars = commit traffic, houses = notes that link to the project.
 *
 * Pure: repos + notes -> data -> one self-contained page (inline canvas renderer, no network).
 * Privacy: publicCity() keeps public repos by name and folds private repos of a public project into one
 * unnamed tower per district; projects that aren't on the public profile are left out entirely.
 */

export interface CityRepo {
  name: string; project: string; public: boolean; language: string;
  commits: number; weeks: number[]; week: number; today: number;
  pushed?: string; created?: string; size?: number; url?: string; description?: string;
}
export interface CityDistrict { name: string; notes: number; notePaths?: string[]; repos: CityRepo[] }
export interface CityData { generated?: string; districts: CityDistrict[]; private: boolean }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const num = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));

/** Validate city.json rows (written by the owner's tools) into clean repos. */
export function parseCityRepos(raw: unknown): CityRepo[] {
  const rows = Array.isArray((raw as any)?.repos) ? (raw as any).repos : [];
  return rows.filter((r: any) => r && typeof r.name === "string" && r.name.trim()).slice(0, 300).map((r: any): CityRepo => ({
    name: String(r.name).slice(0, 80), project: String(r.project || "Other").slice(0, 60), public: r.public === true,
    language: String(r.language || "Other").slice(0, 30), commits: num(r.commits), week: num(r.week), today: num(r.today),
    weeks: (Array.isArray(r.weeks) ? r.weeks : []).slice(-12).map(num),
    pushed: typeof r.pushed === "string" ? r.pushed.slice(0, 40) : undefined, created: typeof r.created === "string" ? r.created.slice(0, 40) : undefined,
    size: num(r.size), url: r.public === true && /^https:\/\//.test(String(r.url || "")) ? String(r.url) : undefined,
    description: r.public === true && r.description ? String(r.description).slice(0, 200) : undefined,
  }));
}

/** Group repos into districts; notes(name) = how many vault notes link to the project's note. */
export function cityData(repos: CityRepo[], notes: (project: string) => { n: number; paths: string[] }, generated?: string): CityData {
  const by = new Map<string, CityRepo[]>();
  for (const r of repos) by.set(r.project, [...(by.get(r.project) || []), r]);
  const districts = [...by.entries()].map(([name, rs]) => { const nn = notes(name); return { name, notes: nn.n, notePaths: nn.paths.slice(0, 6), repos: rs.sort((a, b) => b.commits - a.commits) }; })
    .sort((a, b) => b.repos.reduce((s, r) => s + r.commits, 0) - a.repos.reduce((s, r) => s + r.commits, 0));
  return { generated, districts, private: true };
}

/** What visitors may see: public repos by name; a public project's private repos fold into one tower named after the project. */
export function publicCity(c: CityData, publicProjects: string[]): CityData {
  const pub = new Set(publicProjects.map(p => p.toLowerCase()));
  const districts: CityDistrict[] = [];
  for (const d of c.districts) {
    const open = d.repos.filter(r => r.public), closed = d.repos.filter(r => !r.public);
    const listed = pub.has(d.name.toLowerCase());
    const repos: CityRepo[] = [...open];
    if (listed && closed.length) {
      const langs = new Map<string, number>(); for (const r of closed) langs.set(r.language, (langs.get(r.language) || 0) + r.commits);
      const weeks = Array.from({ length: 12 }, (_, i) => closed.reduce((s, r) => s + (r.weeks[r.weeks.length - 12 + i] || 0), 0));
      repos.push({ name: d.name, project: d.name, public: false, language: [...langs].sort((a, b) => b[1] - a[1])[0]?.[0] || "Other",
        commits: closed.reduce((s, r) => s + r.commits, 0), week: closed.reduce((s, r) => s + r.week, 0), today: closed.reduce((s, r) => s + r.today, 0),
        weeks, pushed: closed.map(r => r.pushed || "").sort().pop() || undefined });
    }
    if (repos.length && (listed || open.length)) districts.push({ name: d.name, notes: listed ? d.notes : 0, repos: repos.sort((a, b) => b.commits - a.commits) });
  }
  return { generated: c.generated, districts, private: false };
}

export interface CitySite { name: string; handle?: string; theme?: "dark" | "light"; icon?: string; nav?: (depth: number, current: string) => string; openBase?: string }

export function renderCity(site: CitySite, city: CityData): string {
  const repos = city.districts.flatMap(d => d.repos);
  const total = repos.reduce((s, r) => s + r.commits, 0), active = repos.filter(r => r.week > 0).length, notes = city.districts.reduce((s, d) => s + d.notes, 0);
  const json = JSON.stringify({ ...city, openBase: site.openBase || "" }).replace(/</g, "\\u003c");
  const icon = site.icon ? `<link rel="icon" href="${esc(site.icon)}" type="image/png">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`;
  const rows = city.districts.map(d => `<tr><td>${esc(d.name)}</td><td>${d.repos.length}</td><td>${d.repos.reduce((s, r) => s + r.commits, 0).toLocaleString("en-US")}</td><td>${d.repos.reduce((s, r) => s + r.week, 0)}</td><td>${d.notes}</td></tr>`).join("");
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(site.name)}'s city</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css"><style>${CITY_CSS}</style></head><body>
<div class="tabs"><a class="tab" href="index.html">${esc(site.name)}.md</a><span class="tab is-active">City</span><span class="spacer"></span></div>
<div class="shell">${site.nav ? site.nav(0, "city.html") : ""}<main class="note"><div class="c-main">
<div class="g-crumbs c-crumbs"><a href="index.html">${esc(site.handle ? "@" + site.handle : site.name)}</a> / City</div>
<h1 class="c-title">${esc(site.name)}'s city</h1>
<p class="c-lede">Every project is a district and every GitHub repo a building: taller means more commits this year, lit windows mean commits this week, a crane means it's being built right now. The houses around each district are the Obsidian notes about that project.${city.private ? " <b>Private view:</b> every repo, including private ones." : ""}</p>
<div class="c-stats"><div><b>${repos.length}</b><span>buildings</span></div><div><b>${total.toLocaleString("en-US")}</b><span>commits this year</span></div><div><b>${active}</b><span>busy this week</span></div><div><b>${notes.toLocaleString("en-US")}</b><span>notes in town</span></div></div>
<div class="c-stage" id="stage"><canvas id="city" aria-label="Isometric city of ${repos.length} projects"></canvas>
<div class="c-tools"><button id="t-labels" aria-pressed="true">Labels</button><button id="t-sky">Night</button><button id="t-reset">Reset</button></div>
<div class="c-card" id="card" hidden></div><div class="c-hint">Drag to move &middot; scroll or pinch to zoom &middot; tap a building</div></div>
<div class="c-legend"><span><i style="background:#3178C6"></i>TypeScript</span><span><i style="background:#E8C547"></i>JavaScript</span><span><i style="background:#4FB89A"></i>Python</span><span><i style="background:#E07A4F"></i>HTML</span><span><i style="background:#F05138"></i>Swift</span><span><i style="background:#8A8A93"></i>Other</span><span>&#127959; built this week</span><span>&#127968; notes about the project</span></div>
<div class="c-table-wrap"><table class="c-table"><thead><tr><th>District</th><th>Buildings</th><th>Commits this year</th><th>This week</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
${city.generated ? `<p class="c-foot">GitHub counts from ${esc(new Date(city.generated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}.</p>` : ""}
</div></main></div>
<script type="application/json" id="city-data">${json}</script>
<script>${CITY_JS}</script></body></html>`;
}

const CITY_CSS = `
.c-main{max-width:1100px;margin:0 auto;padding:28px 20px 64px}
.c-crumbs{font-size:var(--text-sm);color:var(--text-muted);margin-bottom:6px}.c-crumbs a{color:var(--text-muted)}
.c-title{font-family:var(--font-serif,'Source Serif 4',Georgia,serif);font-size:2.1rem;margin:0 0 8px;color:var(--text-strong)}
.c-lede{color:var(--text-muted);max-width:70ch;margin:0 0 16px}
.c-stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.c-stats div{flex:1 1 120px;background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:10px 14px;display:flex;flex-direction:column}
.c-stats b{font-size:1.5rem;font-variant-numeric:tabular-nums;color:var(--text-strong)}.c-stats span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.c-stage{position:relative;height:min(72vh,720px);min-height:420px;border-radius:var(--radius-md,10px);overflow:hidden;border:1px solid var(--line);background:#0E1320;touch-action:none}
.c-stage canvas{width:100%;height:100%;display:block;cursor:grab}.c-stage canvas.drag{cursor:grabbing}
.c-tools{position:absolute;top:10px;right:10px;display:flex;gap:6px}
.c-tools button{font:500 12px var(--font-sans,'IBM Plex Sans',sans-serif);padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(14,19,32,.72);color:#E8E8EE;cursor:pointer}
.c-tools button[aria-pressed="false"]{opacity:.6}
.c-hint{position:absolute;left:10px;bottom:10px;font:12px var(--font-sans,sans-serif);color:rgba(232,232,238,.75);background:rgba(14,19,32,.6);padding:4px 8px;border-radius:6px;pointer-events:none}
.c-card{position:absolute;left:10px;top:10px;width:min(300px,calc(100% - 20px));max-height:calc(100% - 60px);overflow:auto;background:rgba(18,22,34,.94);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;color:#E8E8EE;font:13px/1.45 var(--font-sans,'IBM Plex Sans',sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.c-card h3{margin:0 0 2px;font-size:15px;color:#fff}.c-card .k{color:#9A9AA6;font-size:12px}.c-card a{color:#B9A6FF}
.c-card .row{display:flex;justify-content:space-between;gap:8px;margin-top:4px}.c-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#9A9AA6;font-size:16px;cursor:pointer}
.c-card .sp{display:flex;align-items:flex-end;gap:2px;height:28px;margin:8px 0 2px}.c-card .sp i{flex:1;background:#8B6CF6;border-radius:2px 2px 0 0;min-height:2px}
.c-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 18px;font-size:var(--text-sm);color:var(--text-muted)}
.c-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.c-table-wrap{overflow-x:auto}.c-table{width:100%;border-collapse:collapse;font-size:var(--text-sm);font-variant-numeric:tabular-nums}
.c-table th,.c-table td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line)}.c-table th{color:var(--text-muted);font-weight:500}
.c-foot{font-size:var(--text-xs,12px);color:var(--text-muted);margin-top:12px}
@media (max-width:600px){.c-main{padding:20px 16px 48px}.c-title{font-size:1.7rem}.c-stage{height:62vh;min-height:360px}}
`;

// The renderer (plain ES5-ish so it runs everywhere, including inside Obsidian's sandboxed tab).
const CITY_JS = String.raw`(function(){
var D=JSON.parse(document.getElementById('city-data').textContent);
var cv=document.getElementById('city'),st=document.getElementById('stage'),cx=cv.getContext('2d'),card=document.getElementById('card');
var TW=64,TH=32,LANG={TypeScript:'#3178C6',JavaScript:'#E8C547',Python:'#4FB89A',HTML:'#E07A4F',Swift:'#F05138',CSS:'#6E5BD0',Shell:'#7FB24A',Go:'#2FB5D6',Rust:'#C9744A'};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var hr=new Date().getHours(),night=hr<6||hr>=19,labels=true;
function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
function hash(t){var h=0;for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;r=Math.round(Math.min(255,r*f));g=Math.round(Math.min(255,g*f));b=Math.round(Math.min(255,b*f));return 'rgb('+r+','+g+','+b+')'}
var now=Date.now(),DAY=864e5;
// ---- layout: districts are square blocks packed in rows with 1-tile roads between them
var blocks=[],tiles={},W=0,H=0,x=1,y=1,rowH=0;
var area=D.districts.reduce(function(s,d){var n=d.repos.length+Math.ceil(Math.min(d.notes,40)/4);var k=Math.max(2,Math.ceil(Math.sqrt(n)));return s+(k+1)*(k+1)},0);
var maxW=Math.max(8,Math.ceil(Math.sqrt(area)*1.25));
D.districts.forEach(function(d){
  var houses=Math.min(d.notes,40),need=d.repos.length+Math.ceil(houses/4),k=Math.max(2,Math.ceil(Math.sqrt(need)));
  if(x+k>maxW&&x>1){x=1;y+=rowH+1;rowH=0}
  var b={d:d,x:x,y:y,k:k};blocks.push(b);
  var cells=[];for(var j=0;j<k;j++)for(var i=0;i<k;i++)cells.push([x+i,y+j]);
  cells.sort(function(a,c){return (a[0]+a[1])-(c[0]+c[1])});   // biggest towers at the back
  d.repos.forEach(function(r,i){var c=cells[i];tiles[c[0]+','+c[1]]={t:'b',r:r,d:d}});
  var hi=d.repos.length,left=houses;
  while(left>0&&hi<cells.length){var c=cells[hi++];var n=Math.min(4,left);left-=n;tiles[c[0]+','+c[1]]={t:'h',n:n,d:d}}
  for(;hi<cells.length;hi++){var c2=cells[hi];tiles[c2[0]+','+c2[1]]={t:'p',d:d}}
  x+=k+1;rowH=Math.max(rowH,k);W=Math.max(W,x);H=Math.max(H,y+rowH+1);
});
W=Math.max(W,maxW)+1;H+=1;
for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var key=i+','+j;if(!tiles[key])tiles[key]={t:(i===0||j===0||i===W||j===H)?'g':'r'}}
// ---- buildings
var maxC=1;D.districts.forEach(function(d){d.repos.forEach(function(r){maxC=Math.max(maxC,r.commits)})});
function bh(r){return 16+Math.min(230,Math.round(34*Math.log2(1+r.commits/8)))}
var maxH=0,ranked=[];D.districts.forEach(function(d){d.repos.forEach(function(r){maxH=Math.max(maxH,bh(r));ranked.push(r)})});
ranked.sort(function(a,b){return (b.week*20+b.commits)-(a.week*20+a.commits)});var topSet=ranked.slice(0,12);
function dormant(r){return r.pushed&&now-Date.parse(r.pushed)>60*DAY&&!r.week}
// ---- view
var dpr=1,vw=0,vh=0,cam={x:0,y:0,z:1};
function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}
function fit(){var r=st.getBoundingClientRect();dpr=window.devicePixelRatio||1;vw=r.width;vh=r.height;cv.width=vw*dpr;cv.height=vh*dpr;
  var spanX=(W+H)*TW/2+TW,spanY=(W+H)*TH/2+maxH+40;cam.z=Math.min(1.6,Math.max(.3,Math.min(vw/spanX,vh/spanY)*.98));
  var c=iso(W/2,H/2);cam.x=vw/2-c.x*cam.z;cam.y=vh/2-c.y*cam.z+(maxH/2)*cam.z}
// ---- cars wander the roads
var roads=[];for(var k in tiles)if(tiles[k].t==='r'){var p=k.split(',');roads.push([+p[0],+p[1]])}
var traffic=D.districts.reduce(function(s,d){return s+d.repos.reduce(function(a,r){return a+r.week},0)},0);
var cars=[];for(var c=0;c<Math.min(70,4+Math.round(traffic/6))&&roads.length;c++){var s=roads[Math.floor(rnd(c+1)*roads.length)];cars.push({i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][c%5]})}
function step(car){var o=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [car.ti+d[0],car.tj+d[1]]}).filter(function(n){var t=tiles[n[0]+','+n[1]];return t&&t.t==='r'&&!(n[0]===car.i&&n[1]===car.j)});
  if(!o.length)o=[[car.i,car.j]];var n=o[Math.floor(Math.random()*o.length)];car.i=car.ti;car.j=car.tj;car.ti=n[0];car.tj=n[1];car.t=0}
// ---- drawing
function diamond(px,py,fill,stroke){cx.beginPath();cx.moveTo(px,py-TH/2);cx.lineTo(px+TW/2,py);cx.lineTo(px,py+TH/2);cx.lineTo(px-TW/2,py);cx.closePath();cx.fillStyle=fill;cx.fill();if(stroke){cx.strokeStyle=stroke;cx.lineWidth=1;cx.stroke()}}
function box(px,py,w,h,col,lit,seed,win){var hw=TW/2*w,hh=TH/2*w;
  cx.beginPath();cx.moveTo(px-hw,py);cx.lineTo(px,py+hh);cx.lineTo(px,py+hh-h);cx.lineTo(px-hw,py-h);cx.closePath();cx.fillStyle=shade(col,night?.42:.62);cx.fill();
  cx.beginPath();cx.moveTo(px,py+hh);cx.lineTo(px+hw,py);cx.lineTo(px+hw,py-h);cx.lineTo(px,py+hh-h);cx.closePath();cx.fillStyle=shade(col,night?.55:.82);cx.fill();
  cx.beginPath();cx.moveTo(px,py-hh-h);cx.lineTo(px+hw,py-h);cx.lineTo(px,py+hh-h);cx.lineTo(px-hw,py-h);cx.closePath();cx.fillStyle=shade(col,night?.75:1.08);cx.fill();
  if(!win)return;var rows=Math.floor((h-8)/9);for(var rr=0;rr<rows;rr++)for(var cc=0;cc<3;cc++)for(var side=0;side<2;side++){
    var on=rnd(seed+rr*7+cc*13+side*31)<lit;var fx=(cc+.6)/3.4,ox=side?px+hw*fx:px-hw*(1-fx)-0,oy=(side?py+hh*(1-fx):py+hh*fx)-12-rr*9;
    if(side===0){ox=px-hw+hw*fx;oy=py+hh*fx-12-rr*9}
    cx.fillStyle=on?(night?'rgba(255,214,120,.95)':'rgba(255,240,190,.9)'):(night?'rgba(20,24,40,.65)':'rgba(40,60,90,.35)');cx.fillRect(ox-2,oy-3,4,4)}}
function crane(px,py,h,t){cx.strokeStyle='#F2B33D';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(px+6,py-h);cx.lineTo(px+6,py-h-34);cx.lineTo(px-22,py-h-34);cx.moveTo(px+6,py-h-34);cx.lineTo(px+16,py-h-34);cx.stroke();
  var sw=Math.sin(t/600)*4;cx.beginPath();cx.moveTo(px-14+sw,py-h-34);cx.lineTo(px-14+sw,py-h-18);cx.stroke();cx.fillStyle='#F2B33D';cx.fillRect(px-17+sw,py-h-18,6,4)}
function house(px,py,n,seed){var spots=[[-12,-2],[12,-2],[0,-8],[0,5]];for(var q=0;q<n;q++){var s=spots[q],hx=px+s[0],hy=py+s[1],col=['#C9A27A','#B9C4D6','#D9B38C','#A7C4A0'][(seed+q)%4];
  box(hx,hy,.28,8,col,0,0,false);cx.beginPath();cx.moveTo(hx-9,hy-8);cx.lineTo(hx,hy-17);cx.lineTo(hx+9,hy-8);cx.lineTo(hx,hy-4+0);cx.closePath();cx.fillStyle=night?'#6B3B3B':'#B4554F';cx.fill();
  if(night){cx.fillStyle='rgba(255,214,120,.9)';cx.fillRect(hx-1,hy-5,2,2)}}}
function tree(px,py,s){cx.fillStyle=night?'#1E3B2C':'#3E8E5A';cx.beginPath();cx.arc(px,py-10*s,7*s,0,7);cx.fill();cx.fillStyle=night?'#163024':'#2F7247';cx.beginPath();cx.arc(px+3*s,py-7*s,5*s,0,7);cx.fill()}
var hits=[],sel=null,T=0;
function draw(){T=performance.now();cx.setTransform(dpr,0,0,dpr,0,0);
  var g=cx.createLinearGradient(0,0,0,vh);if(night){g.addColorStop(0,'#070A14');g.addColorStop(1,'#141B2E')}else{g.addColorStop(0,'#8EC5F2');g.addColorStop(1,'#DCEFFB')}cx.fillStyle=g;cx.fillRect(0,0,vw,vh);
  if(night){for(var s=0;s<70;s++){cx.fillStyle='rgba(255,255,255,'+(.3+rnd(s)*.6)+')';cx.fillRect(rnd(s*3)*vw,rnd(s*7)*vh*.45,1.2,1.2)}}
  cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if(t.t==='r'){diamond(p.x,p.y,night?'#252A36':'#5B6270');if((i+j)%2===0){cx.fillStyle=night?'rgba(242,200,90,.35)':'rgba(255,255,255,.55)';cx.fillRect(p.x-1.5,p.y-1,3,2)}}
    else if(t.t==='g'){diamond(p.x,p.y,night?'#14261C':'#6FB36F')}
    else{diamond(p.x,p.y,night?'#1B2E22':'#86C27E',night?'rgba(0,0,0,.25)':'rgba(0,0,0,.08)')}
    if(t.t==='p'){tree(p.x-8,p.y+2,1);tree(p.x+10,p.y-3,.8)}
    if(t.t==='h')house(p.x,p.y,t.n,hash(t.d.name));
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),col=dm?'#7C7F88':(LANG[r.language]||'#8A8A93');
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,lit=dm?0:Math.min(.95,.12+(r.week/(Math.max(wk,1)))*.8);
      box(p.x,p.y+4,.82,h,col,lit,hash(r.name),true);if(r.week>0&&!dm)crane(p.x,p.y+4,h,T+hash(r.name));
      if(sel===r){cx.strokeStyle='#B9A6FF';cx.lineWidth=2/cam.z;cx.strokeRect(p.x-TW*.45,p.y-h-TH*.5,TW*.9,h+TH)}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:p.y-h-TH*.45,y1:p.y+TH*.45});
      if(labels&&(cam.z>1.05||sel===r||topSet.indexOf(r)>=0)){var lb=r.name.length>18?r.name.slice(0,17)+'…':r.name;cx.font='600 11px IBM Plex Sans,Arial,sans-serif';var tw=cx.measureText(lb).width;
        cx.fillStyle='rgba(14,19,32,.78)';cx.fillRect(p.x-tw/2-5,p.y-h-30,tw+10,16);cx.fillStyle='#F2F2F5';cx.textAlign='center';cx.fillText(lb,p.x,p.y-h-18)}}}
  // district signs
  if(labels)blocks.forEach(function(b){var p=iso(b.x+b.k,b.y+b.k);cx.font='700 12px IBM Plex Sans,Arial,sans-serif';var lb=b.d.name,tw=cx.measureText(lb).width;cx.fillStyle='rgba(139,108,246,.92)';cx.fillRect(p.x-tw/2-7,p.y+4,tw+14,18);cx.fillStyle='#fff';cx.textAlign='center';cx.fillText(lb,p.x,p.y+17)});
  // cars
  cars.forEach(function(c){var a=iso(c.i,c.j),b=iso(c.ti,c.tj),px=a.x+(b.x-a.x)*c.t,py=a.y+(b.y-a.y)*c.t;cx.fillStyle=c.col;cx.fillRect(px-3,py-2,6,4);if(night){cx.fillStyle='rgba(255,240,180,.7)';cx.fillRect(px+2,py-1,2,2)}});
}
function tick(){cars.forEach(function(c){c.t+=0.012;if(c.t>=1)step(c)});draw();if(!reduce)requestAnimationFrame(tick)}
// ---- interaction
function ago(iso){if(!iso)return '';var d=Math.round((now-Date.parse(iso))/DAY);return d<=0?'today':d===1?'yesterday':d+' days ago'}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function show(h){sel=h?h.r:null;if(!h){card.hidden=true;draw();return}var r=h.r,d=h.d,mx=Math.max.apply(null,(r.weeks||[0]).concat([1]));
  var notes=(d.notePaths||[]).map(function(p){var n=p.split('/').pop().replace(/\.md$/,'');return D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(p))+'" target="_blank" rel="noopener">'+e(n)+'</a>':'<a href="#" data-open="'+e(p)+'">'+e(n)+'</a>'}).join(', ');
  card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+e(r.name)+'</h3><div class="k">'+e(d.name)+' district &middot; '+e(r.language)+(r.public?' &middot; public':'')+'</div>'
   +(r.description?'<p style="margin:6px 0 0">'+e(r.description)+'</p>':'')
   +'<div class="sp" title="Commits, last 12 weeks">'+(r.weeks||[]).map(function(w){return '<i style="height:'+Math.max(4,Math.round(w/mx*100))+'%"></i>'}).join('')+'</div><div class="k">Commits, last 12 weeks</div>'
   +'<div class="row"><span>Commits this year</span><b>'+r.commits.toLocaleString('en-US')+'</b></div><div class="row"><span>This week</span><b>'+r.week+'</b></div>'
   +(r.pushed?'<div class="row"><span>Last push</span><b>'+ago(r.pushed)+'</b></div>':'')
   +'<div class="row"><span>Notes about '+e(d.name)+'</span><b>'+d.notes+'</b></div>'+(notes?'<div class="k" style="margin-top:6px">'+notes+'</div>':'')
   +(r.url?'<p style="margin:8px 0 0"><a href="'+e(r.url)+'" target="_blank" rel="noopener">Open on GitHub &#8599;</a></p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function at(px,py){var wx=(px-cam.x)/cam.z,wy=(py-cam.y)/cam.z;for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(wx>=h.x0&&wx<=h.x1&&wy>=h.y0&&wy<=h.y1)return h}return null}
var ptr={},moved=false,pinch=0;
cv.addEventListener('pointerdown',function(ev){cv.setPointerCapture(ev.pointerId);ptr[ev.pointerId]={x:ev.clientX,y:ev.clientY};moved=false;cv.classList.add('drag');var ks=Object.keys(ptr);if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
cv.addEventListener('pointermove',function(ev){var p=ptr[ev.pointerId];if(!p)return;var ks=Object.keys(ptr);
  if(ks.length===2){var o=ptr[ks[0]===String(ev.pointerId)?ks[1]:ks[0]];var dist=Math.hypot(ev.clientX-o.x,ev.clientY-o.y);if(pinch){var r=st.getBoundingClientRect();zoom(dist/pinch,(ev.clientX+o.x)/2-r.left,(ev.clientY+o.y)/2-r.top)}pinch=dist;moved=true}
  else{var dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;cam.x+=dx;cam.y+=dy}
  p.x=ev.clientX;p.y=ev.clientY;if(reduce)draw()});
function up(ev){var was=ptr[ev.pointerId];delete ptr[ev.pointerId];cv.classList.remove('drag');pinch=0;if(was&&!moved){var r=st.getBoundingClientRect();show(at(ev.clientX-r.left,ev.clientY-r.top))}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
function zoom(f,ox,oy){var z=Math.min(3,Math.max(.25,cam.z*f));f=z/cam.z;cam.x=ox-(ox-cam.x)*f;cam.y=oy-(oy-cam.y)*f;cam.z=z;if(reduce)draw()}
cv.addEventListener('wheel',function(ev){ev.preventDefault();var r=st.getBoundingClientRect();zoom(Math.exp(-ev.deltaY*0.0015),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
var bl=document.getElementById('t-labels'),bs=document.getElementById('t-sky');
bl.onclick=function(){labels=!labels;bl.setAttribute('aria-pressed',String(labels));draw()};
function skyLabel(){bs.textContent=night?'Day':'Night'}skyLabel();bs.onclick=function(){night=!night;skyLabel();draw()};
document.getElementById('t-reset').onclick=function(){fit();show(null)};
window.addEventListener('resize',function(){fit();draw()});
fit();if(reduce)draw();else requestAnimationFrame(tick);
})();`;
