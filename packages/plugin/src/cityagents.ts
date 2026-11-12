// Agent drones (city.ts embeds AGENTS_JS where the agent block used to be). One drone per AI agent the hub reports, placed by
// agentLayout(): a working or thinking agent flies over the building of the repo it is in (the hub's full feed) or, on the
// public page, over a building of its district; agents on the same building fan out in a ring; an active agent whose repo is
// not a building in this city holds in the air over the sky base, full size, counted, never parked as a dot. Quiet agents
// (idle) hover low and dim over their building when it is known; the rest (waiting, idle elsewhere, done) park on the sky
// base, and past the deck's capacity a "+n" badge is always drawn, so no agent is ever dropped without a trace.
// Mike 2026-11-11: "I definitely have more than three or four drones active at the moment, and I'm only seeing three or four."
export const AGENTS_JS = String.raw`
// ---- agents: a drone over the building each AI agent is working in. Working = beam into the roof, thinking = circling,
// waiting for you = parked on the sky base, blinking amber. The sky base is a small deck hovering over the city's front
// corner (in the world: each neighborhood's front corner, where nothing stands in front of it), tethered to the ground by
// a thread of light; idle agents park on it as small drones and working ones lift off it to fly to their building. Public pages only get district + state, never what it's doing.
var AG={},AGC={working:'#3DF2FF',thinking:'#B58CFF',waiting:'#FFB020',idle:'#6F7C8F',done:'#6F7C8F'},BREPO={},BDIST={},AGSUM={n:0,fly:0,hold:0,dock:0,hidden:0};
for(var bk in tiles){var tb=tiles[bk];if(tb.t!=='b')continue;var bij=bk.split(','),bo={i:+bij[0],j:+bij[1],r:tb.r};if(tb.r.name)BREPO[tb.r.name.toLowerCase()]=bo;(BDIST[tb.d.name]=BDIST[tb.d.name]||[]).push(bo)}
if(D.world)NBS.forEach(function(n){BDIST[n.key]=[];n.ds.forEach(function(d){BDIST[n.key]=BDIST[n.key].concat(BDIST[d.name]||[])})});   // a member's drones only ever fly to their own buildings
var HQI=1.3,HQJ=H-1.3,HQP=iso(HQI,HQJ),HQS=.36;   // Agent HQ: a parking grid on the island's west corner, laid out along the streets
function hqAt(a){var n=D.world&&a&&NBM[a.d];return n?{i:n.ox+n.w+.15,j:n.oy+n.h+.15}:{i:W-.55,j:H-.55}}
var LIFT=46,DOCKMAX=48,AGMAX=200;   // how high the sky base hovers (px), how many drones the deck shows parked before it reads "+n", how many agents the page keeps
function dockAt(a){var hq=hqAt(a);return iso(hq.i,hq.j)}   // the ground point under the sky base
function deckOf(n){return Math.min(44,13+Math.sqrt(Math.min(n,DOCKMAX))*4.6)}   // deck radius grows with the drones parked on it
function bob(tn){return Math.sin(tn/1600)*1.6}
function hqDims(n){var cols=Math.max(1,Math.ceil(Math.sqrt(n)));return {cols:cols,rows:Math.max(1,Math.ceil(n/cols))}}
function agentsIn(list){var tn=performance.now(),seen={};list.slice(0,AGMAX).forEach(function(a){if(!a||!a.id)return;seen[a.id]=1;var g=AG[a.id];
    if(!g){var h0=dockAt(a);g=AG[a.id]={x:h0.x,y:h0.y-40,born:tn,seed:hash(String(a.id))}}g.a=a;g.gone=0});
  for(var id in AG)if(!seen[id]&&!AG[id].gone)AG[id].gone=tn;if(D.world)dirty=true}
function agentActive(a){return a.state==='working'||a.state==='thinking'}
function agentGroup(a){return D.world?(a.d||''):''}   // which sky base an agent belongs to (one per city; in the world one per neighborhood)
// where every drone should be this frame. Returns {spots:{id:{x,y,mode,roof,dim,hidden,col}}, groups:{key:{dock,hold,hidden,ids}}}; AGSUM keeps the totals for the HUD.
// mode: 'fly' (over its building), 'hold' (active, repo not on this map: in the air over the sky base), 'dock' (parked on the deck)
function agentLayout(tn){var ids=Object.keys(AG),spots={},groups={},perBld={},dOnly={};
  ids.forEach(function(id){var g=AG[id],a=g.a,gk=agentGroup(a),gr=groups[gk]=groups[gk]||{ids:[],dock:[],hold:[],hidden:0};gr.ids.push(id);
    var b=(a.repo&&BREPO[String(a.repo).toLowerCase()])||null;
    if(!b&&a.d&&BDIST[a.d]&&BDIST[a.d].length&&(agentActive(a)||a.state==='idle')){var l=BDIST[a.d],q=dOnly[a.d]=dOnly[a.d]||{n:0};b=l[(hash(a.d)+q.n)%l.length];q.n++}   // district only: spread siblings over its buildings first
    if(b&&(agentActive(a)||a.state==='idle')){g.b=b;var pk=b.i+','+b.j;(perBld[pk]=perBld[pk]||[]).push(id)}
    else if(agentActive(a)){g.b=null;gr.hold.push(id)}else{g.b=null;gr.dock.push(id)}});
  var fly=0;Object.keys(perBld).forEach(function(pk){var l=perBld[pk];l.sort();l.forEach(function(id,k){var g=AG[id],a=g.a,b=g.b,p=iso(b.i,b.j),h=bh(b.r),idle=!agentActive(a),y=p.y-h-(idle?12:24),x=p.x;
      if(l.length>1){var ang=k/l.length*6.283+g.seed%7*.3,rad=9+Math.min(27,3*l.length);x+=Math.cos(ang)*rad;y+=Math.sin(ang)*rad*.5}   // several on one roof: a ring, every drone its own spot
      if(idle)spots[id]={x:x+Math.sin(tn/2100+g.seed)*1.5,y:y+Math.sin(tn/900+g.seed),mode:'fly',roof:null,dim:true,n:l.length};
      else if(a.state==='thinking'){var cr=l.length>1?6:14;spots[id]={x:x+Math.cos(tn/900+g.seed)*cr,y:y+Math.sin(tn/900+g.seed)*cr*.5,mode:'fly',roof:null,n:l.length}}
      else spots[id]={x:x+Math.sin(tn/1300+g.seed)*3,y:y+Math.sin(tn/500+g.seed)*2,mode:'fly',roof:p.y-h,n:l.length};fly++})});
  var hold=0,dock=0,hidden=0;Object.keys(groups).forEach(function(gk){var gr=groups[gk],g0=AG[gr.ids[0]],dk=dockAt(g0.a),n=gr.dock.length,r=deckOf(n);
    gr.hold.sort();gr.hold.forEach(function(id,k){var g=AG[id],m=gr.hold.length,rad=16+Math.sqrt(m)*7,ang=k/m*6.283+tn/7000+g.seed%5*.2;   // holding pattern: a slow carousel above the deck
      spots[id]={x:dk.x+Math.cos(ang)*rad,y:dk.y-LIFT-30+bob(tn)+Math.sin(ang)*rad*.45,mode:'hold',roof:null,n:m};hold++});
    gr.dock.sort(function(a,b){var sa=AG[a].a.state==='waiting'?0:1,sb=AG[b].a.state==='waiting'?0:1;return sa-sb||(a<b?-1:1)});   // the ones waiting on you park first, so they are never the hidden ones
    gr.dock.forEach(function(id,k){var g=AG[id],hid=k>=DOCKMAX,nn=Math.min(n,DOCKMAX),ang=k*2.39996,rad=r*.82*Math.sqrt((Math.min(k,DOCKMAX-1)+.5)/nn);
      spots[id]={x:dk.x+Math.cos(ang)*rad,y:dk.y-LIFT+bob(tn)+Math.sin(ang)*rad*.5-3,mode:'dock',roof:null,hidden:hid};if(hid){hidden++;gr.hidden++}else dock++})});
  AGSUM={n:ids.length,fly:fly,hold:hold,dock:dock,hidden:hidden};return {spots:spots,groups:groups}}
function drawAgents(c,tn){var ids=Object.keys(AG);if(!ids.length)return;var lay=agentLayout(tn),groups=lay.groups;
  // the sky base: one per city (in the world, per neighborhood); its label goes through the world label pass
  Object.keys(groups).forEach(function(key){var gr=groups[key],gp=gr.dock;if(!gp.length&&!gr.hold.length&&D.world)return;
    var g0=dockAt(AG[gr.ids[0]].a),r=deckOf(gp.length),cx0=g0.x,cy0=g0.y-LIFT+bob(tn);
    c.save();c.lineCap='round';
    c.fillStyle='rgba(61,242,255,.10)';c.beginPath();c.ellipse(g0.x,g0.y,r*.55,r*.27,0,0,7);c.fill();   // its light on the ground
    c.setLineDash([2,4]);c.strokeStyle='rgba(143,180,232,.45)';c.lineWidth=1;c.beginPath();c.moveTo(g0.x,g0.y);c.lineTo(cx0,cy0+7);c.stroke();c.setLineDash([]);   // tether
    var ug=c.createRadialGradient(cx0,cy0+8,0,cx0,cy0+8,r*1.1);ug.addColorStop(0,'rgba(61,242,255,.28)');ug.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=ug;c.beginPath();c.ellipse(cx0,cy0+8,r*1.1,r*.6,0,0,7);c.fill();   // underglow
    c.fillStyle='#1B2233';c.beginPath();c.ellipse(cx0,cy0+4,r,r*.5,0,0,7);c.fill();c.fillRect(cx0-r,cy0,r*2,4);   // deck edge (the slab's thickness)
    var dg=c.createLinearGradient(cx0,cy0-r*.5,cx0,cy0+r*.5);dg.addColorStop(0,'#3A4560');dg.addColorStop(1,'#283147');c.fillStyle=dg;c.strokeStyle='rgba(143,180,232,.85)';c.lineWidth=1.2;c.beginPath();c.ellipse(cx0,cy0,r,r*.5,0,0,7);c.fill();c.stroke();   // deck
    c.strokeStyle='rgba(143,180,232,.25)';c.beginPath();c.ellipse(cx0,cy0,r*.62,r*.31,0,0,7);c.stroke();   // landing ring
    c.globalCompositeOperation='lighter';for(var li=0;li<10;li++){var la=li/10*6.283,on=(Math.floor(tn/400)+li)%2===0,lx=cx0+Math.cos(la)*r,ly=cy0+Math.sin(la)*r*.5;c.fillStyle=on?'rgba(61,242,255,.95)':'rgba(61,242,255,.25)';c.beginPath();c.arc(lx,ly,1.3,0,7);c.fill()}   // rim lights
    c.restore();
    if(gr.hidden>0)tronPill(c,cx0+r+4,cy0+2,'+'+gr.hidden,'#9FC3FF','600 9px ui-monospace,monospace');   // more parked than the deck shows: always say so, labels or not
    if(D.world||!labels)return;
    var nw=gp.filter(function(id){return AG[id].a.state==='waiting'}).length,ni=gp.length-nw;tronPill(c,g0.x,g0.y+16,'SKY BASE'+(ni?' · '+ni+' parked':'')+(nw?' · '+nw+' waiting on you':'')+(gr.hold.length?' · '+gr.hold.length+' in the air (repo not on this map)':''),'#9FC3FF','600 9px ui-monospace,monospace')});
  ids.forEach(function(id){var g=AG[id],a=g.a,sp=lay.spots[id];if(!sp)return;
    g.x+=(sp.x-g.x)*.05;g.y+=(sp.y-g.y)*.05;var f=g.gone?Math.max(0,1-(tn-g.gone)/1500):Math.min(1,(tn-g.born)/600);if(f<=0){delete AG[id];return}
    var col=AGC[a.state]||AGC.working,blink=a.state==='waiting'?(.55+.45*Math.abs(Math.sin(tn/380))):(a.state==='idle'||a.state==='done')?.45:1;
    c.save();c.globalAlpha=f;c.globalCompositeOperation='lighter';
    if(sp.roof!=null&&Math.abs(g.x-sp.x)<6){var gb=c.createLinearGradient(0,g.y,0,sp.roof);gb.addColorStop(0,col);gb.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=gb;c.globalAlpha=f*(.55+.25*Math.sin(tn/160));c.beginPath();c.moveTo(g.x-2,g.y);c.lineTo(g.x+2,g.y);c.lineTo(g.x+9,sp.roof);c.lineTo(g.x-9,sp.roof);c.closePath();c.fill();c.globalAlpha=f}
    if(sp.mode==='dock'){if(!sp.hidden){var pc=a.state==='waiting'?'#FFB020':'#8FB4E8';c.globalAlpha=f*(a.state==='waiting'?blink:.95);c.strokeStyle=pc;c.lineWidth=1.1;c.shadowColor=pc;c.shadowBlur=a.state==='waiting'?10:3;
      c.beginPath();c.ellipse(g.x,g.y,5,2.2,0,0,7);c.stroke();c.shadowBlur=0;c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-3.2);c.lineTo(g.x+2.6,g.y);c.lineTo(g.x,g.y+1.8);c.lineTo(g.x-2.6,g.y);c.closePath();c.fill()}
      c.restore();g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;return}
    var sc=sp.dim?.7:1,gl=c.createRadialGradient(g.x,g.y,0,g.x,g.y,22*sc);gl.addColorStop(0,col);gl.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=f*.6*blink;c.fillStyle=gl;c.beginPath();c.arc(g.x,g.y,22*sc,0,7);c.fill();c.globalAlpha=f*blink;
    c.strokeStyle=col;c.lineWidth=1.4;c.shadowColor=col;c.shadowBlur=8;c.setLineDash([4,3]);c.lineDashOffset=-tn/40;c.beginPath();c.ellipse(g.x,g.y,11*sc,5.5*sc,0,0,7);c.stroke();c.setLineDash([]);
    c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-6*sc);c.lineTo(g.x+5*sc,g.y);c.lineTo(g.x,g.y+3.5*sc);c.lineTo(g.x-5*sc,g.y);c.closePath();c.fill();c.restore();
    g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;
    if(labels&&a.label&&sp.mode==='fly'&&(cam.z>.55||ids.length<=8))tronPill(c,g.x,g.y-15,a.label+(sp.n>1?' ×'+sp.n:''),col,'600 9px ui-monospace,monospace')})}
`;
