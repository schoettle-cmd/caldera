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
var LIFT=46,DOCKMAX=MINI?12:24,AGMAX=200;   // how high the sky base hovers (px), how many drones the deck shows parked before it reads "+n", how many agents the page keeps
function dockAt(a){var hq=hqAt(a);return iso(hq.i,hq.j)}   // the ground point under the sky base
function deckOf(n){return 14+4*Math.ceil(Math.min(Math.max(n,1),DOCKMAX)/4)}   // deck half-width (world px): one row of four parked drones per 4
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
    if(b&&(agentActive(a)||a.state==='idle'||a.state==='done')){g.b=b;var pk=b.i+','+b.j;(perBld[pk]=perBld[pk]||[]).push(id)}
    else if(agentActive(a)){g.b=null;gr.hold.push(id)}else{g.b=null;gr.dock.push(id)}});
  var fly=0;Object.keys(perBld).forEach(function(pk){var all=perBld[pk],landed=all.filter(function(id){return AG[id].a.state==='done'}).sort(),l=all.filter(function(id){return AG[id].a.state!=='done'}).sort();
    var lead=l.filter(function(id){return AG[id].a.state==='working'}).sort(function(p,q){return (AG[q].a.ago||0)-(AG[p].a.ago||0)})[0]||null;   // the oldest working session owns the beam
    landed.forEach(function(id,k){var g=AG[id],b=g.b,p=iso(b.i,b.j),h=bh(b.r);spots[id]={x:p.x+5+(k%3)*4.5,y:p.y-h-1+Math.floor(k/3)*3,mode:'land',roof:null,n:all.length};fly++});   // done: landed by the bulkhead
    l.forEach(function(id,k){var g=AG[id],a=g.a,b=g.b,p=iso(b.i,b.j),h=bh(b.r),idle=!agentActive(a),y=p.y-h-(idle?12:24),x=p.x;
      if(l.length>1){var ang=k/l.length*6.283+g.seed%7*.3,rad=9+Math.min(27,3*l.length);x+=Math.cos(ang)*rad;y+=Math.sin(ang)*rad*.5}   // several on one roof: a ring, every airborne drone its own spot
      if(idle)spots[id]={x:x+Math.sin(tn/2100+g.seed)*1.5,y:y+Math.sin(tn/900+g.seed),mode:'fly',roof:null,dim:true,n:l.length};
      else if(a.state==='thinking'){var cr=l.length>1?6:14;spots[id]={x:x+Math.cos(tn/900+g.seed)*cr,y:y+Math.sin(tn/900+g.seed)*cr*.5,mode:'fly',roof:null,n:l.length}}
      else spots[id]={x:x+Math.sin(tn/1300+g.seed)*3,y:y+Math.sin(tn/500+g.seed)*2,mode:'fly',roof:p.y-h,n:all.length,lead:id===lead||!lead,pill:k===0};fly++})});
  var hold=0,dock=0,hidden=0;Object.keys(groups).forEach(function(gk){var gr=groups[gk],g0=AG[gr.ids[0]],dk=dockAt(g0.a),n=gr.dock.length,r=deckOf(n);
    gr.hold.sort();gr.hold.forEach(function(id,k){var g=AG[id],m=gr.hold.length,rad=16+Math.sqrt(m)*7,ang=k/m*6.283+tn/7000+g.seed%5*.2;   // holding pattern: a slow carousel above the deck
      spots[id]={x:dk.x+Math.cos(ang)*rad,y:dk.y-LIFT-30+bob(tn)+Math.sin(ang)*rad*.45,mode:'hold',roof:null,n:m};hold++});
    gr.dock.sort(function(a,b){var sa=AG[a].a.state==='waiting'?0:1,sb=AG[b].a.state==='waiting'?0:1;return sa-sb||(a<b?-1:1)});   // the ones waiting on you park first, so they are never the hidden ones
    gr.dock.forEach(function(id,k){var g=AG[id],hid=k>=DOCKMAX,nn=Math.min(n,DOCKMAX),ang=k*2.39996,rad=r*.82*Math.sqrt((Math.min(k,DOCKMAX-1)+.5)/nn);
      spots[id]={x:dk.x+Math.cos(ang)*rad,y:dk.y-LIFT+bob(tn)+Math.sin(ang)*rad*.5-3,mode:'dock',roof:null,hidden:hid};if(hid){hidden++;gr.hidden++}else dock++})});
  AGSUM={n:ids.length,fly:fly,hold:hold,dock:dock,hidden:hidden};return {spots:spots,groups:groups}}
// ---- the drone family (LIVING-CITY-DESIGN.md (c)): one 16x12 body, five liveries, two rotor frames; an 8x6 micro at LOD0
var DR_HULL={K:'#0E1420',L:'#8F9BB0',H:'#5A6578',D:'#2E3646',W:'#E6ECF5',c:'#112233',r:'#9AA4B4',R:'#FF3B30',G:'#49D17D'};
var DR_LIV={working:{S:'#3DF2FF',s:'#1796A6',M:'#3DF2FF'},thinking:{S:'#B58CFF',s:'#6E4FB3',M:'#B58CFF'},waiting:{S:'#FFB020',s:'#A66A00',M:'#FFB020'},waitoff:{S:'#A66A00',s:'#2E3646',M:'#2E3646',R:'#2E3646',G:'#2E3646'},
  idle:{S:'#434C5A',s:'#2E3646',M:'#2E3646',R:'#2E3646',G:'#2E3646'},done:{S:'#6F7C8F',s:'#434C5A',M:'#49D17D',R:'#2E3646',G:'#2E3646'}};
var DR_BODY=['...KK..KK..KK...','..KKKKKKKKKKKK..','.KLLLWWLLLLLLLK.','.KLHSSSSSSSSHLK.','.KHHSssssssSHHK.','..KDDDDccDDDDK..','..RK.KDDDDK.KG..','...K..KKKK..K...','...KK......KK...','................'];
var DR_ROT={a:['.......MM.......','.rrrrr.KK.rrrrr.'],b:['.r...r.MM.r...r.','..r.r..KK..r.r..'],still:['.......MM.......','.KKKKK.KK.KKKKK.']};
var DR_MICRO={a:['rrr..rrr','.KKKKKK.','.KSSSSK.','.KDDDDK.','R......G','........'],still:['KKK..KKK','.KKKKKK.','.KSSSSK.','.KDDDDK.','R......G','........']};
var DR_PARK=['LLL..LLL','.KLLLLK.','.KSSSSK.','..KDDK..','........'],DR_SPOT=['..SSS..','.SsWsS.','..SSS..'];
function drMap(liv){var m={},k;for(k in DR_HULL)m[k]=DR_HULL[k];var L=DR_LIV[liv]||DR_LIV.working;for(k in L)m[k]=L[k];return m}
function drSprite(liv,rot,micro){var key='dr|'+liv+'|'+rot+(micro?'|m':'');if(micro)return pxGlyph(key,DR_MICRO[rot==='still'?'still':'a'],drMap(liv));return pxGlyph(key,DR_ROT[rot].concat(DR_BODY),drMap(liv))}
/** the floors an agent lights at night (LIVING-CITY-DESIGN.md (b) lit windows): working = top 3 cool white, thinking = two patterns alternating every 2 s, waiting = the top floor amber in step with the strobe; null by day or for quiet agents */
function agentFloors(state,tn,strobe){if(state==='working')return {rows:[0,1,2],col:'#D6E8FF',a:.95};if(state==='thinking')return {rows:Math.floor(tn/2000)%2?[1]:[0,2],col:'#D6E8FF',a:.85};if(state==='waiting')return strobe?{rows:[0],col:'#FFB020',a:.9}:null;return null}
function drawFloors(c,b,fl,f){var p=iso(b.i,b.j),h=bh(b.r),tiers=towerTiers(h),w=tiers[tiers.length-1][0],hw=TW/2*w,hh=TH/2*w,top=p.y+4-h,px=p.x;if(h<20)return;c.save();c.fillStyle=fl.col;c.globalAlpha=f*fl.a*.6;
  fl.rows.forEach(function(r){var y0=top+2+r*7,y1=y0+4;if(y1>p.y)return;c.beginPath();c.moveTo(px-hw,y0);c.lineTo(px,y0+hh);c.lineTo(px,y1+hh);c.lineTo(px-hw,y1);c.closePath();c.fill();c.beginPath();c.moveTo(px,y0+hh);c.lineTo(px+hw,y0);c.lineTo(px+hw,y1);c.lineTo(px,y1+hh);c.closePath();c.fill()});c.restore()}
function drStrobe(tn){var t=tn%500;return t<150||(t>=200&&t<300)}   // waiting: on 150, off 50, on 100, off 200 (a double flash at 2 Hz)
/** a pixel pill: 9 px mono, 1 px border in the element colour, a 4x4 colour square, no radius (used for drones and the sky base) */
function pxPill(c,x,y,text,col){c.font='600 9px ui-monospace,monospace';var tw=c.measureText(text).width,w=Math.ceil(tw)+18,h=13,x0=Math.round(x-w/2),y0=Math.round(y-h);
  c.fillStyle=col;c.fillRect(x0,y0,w,h);c.fillStyle='rgba(14,20,32,.92)';c.fillRect(x0+1,y0+1,w-2,h-2);c.fillStyle=col;c.fillRect(x0+5,y0+4,4,4);c.fillStyle='#E6ECF5';c.textAlign='left';c.textBaseline='middle';c.fillText(text,x0+13,y0+h/2+.5);c.textAlign='start';c.textBaseline='alphabetic'}
function agentAge(a){var s=+a.ago;if(!(s>=0))return '';return s<60?Math.round(s)+'s':s<3600?Math.round(s/60)+'m':Math.round(s/3600)+'h'}
function agentPillText(ids){var ORD={working:0,thinking:1,waiting:2,idle:3,done:4},best=ids.slice().sort(function(p,q){return (ORD[AG[p].a.state]||0)-(ORD[AG[q].a.state]||0)})[0],a=AG[best].a,st=a.state==='waiting'?'waiting on you':a.state;
  var t=(a.label||'agent')+' · '+st+(a.repo?' · '+a.repo:a.d?' · '+a.d:'');if(ids.length>1)return t+' ×'+ids.length;return t+(agentAge(a)?' '+agentAge(a):'')}
// the sky base: a pixel helipad on a lattice mast; the deck is one cached texel image per size, the lights are drawn over it
function deckTex(hw){var W=Math.round(hw*PXS)*2,Hh=W/2,key='deck|'+W;return pxTex(key,W,Hh+8,function(buf,w,h){var slab=rgb('#4F5A70'),lite=rgb('#5E6A82'),edge=rgb('#1B2233'),out=rgb('#0E1420'),hy=rgb('#FFD24A');
    function put(x,y,c){if(x<0||y<0||x>=w||y>=h)return;var o=(y*w+x)*4;buf[o]=c[0];buf[o+1]=c[1];buf[o+2]=c[2];buf[o+3]=255}
    for(var y=0;y<Hh;y++){var half=Math.min(y,Hh-1-y)*2+1,x0=w/2-half,x1=w/2+half;for(var x=x0;x<x1;x++){var c=(((x>>2)+(y>>1))&1)?lite:slab;if(x===x0||x===x1-1||y===0||y===Hh-1)c=out;put(x,y,c)}
      if(y>=Hh-1){for(var yy=1;yy<=4;yy++)for(var xx=x0;xx<x1;xx++)put(xx,y+yy,yy===4?out:edge)}}   // the slab's thickness below the front edge
    for(var ey=0;ey<Hh;ey++){var hh=Math.min(ey,Hh-1-ey)*2+1,ex0=w/2-hh,ex1=w/2+hh;for(var t=1;t<=4;t++){put(ex0,ey+t,t===4?out:edge);put(ex1-1,ey+t,t===4?out:edge)}}
    var Hx=Math.round(w*.28),Hy=Math.round(Hh*.5)-2;for(var k=0;k<5;k++){put(Hx,Hy+k,hy);put(Hx+4,Hy+k,hy);if(k===2){put(Hx+1,Hy+k,hy);put(Hx+2,Hy+k,hy);put(Hx+3,Hy+k,hy)}}})}
function drawDeck(c,cx0,cy0,hw,tn,blinkOn){var t=deckTex(hw);if(!t.ok)return;c.save();c.imageSmoothingEnabled=false;var w=t.w/PXS,h=t.h/PXS;c.drawImage(t.cv,cx0-w/2,cy0-hw/2,w,h);
  var n=Math.max(8,Math.round(hw/2)),i;for(i=0;i<n;i++){var f=i/n,px,py;if(f<.25){px=cx0-hw+f*4*2*hw*.5;py=cy0-hw/2+f*4*hw/2}else if(f<.5){px=cx0+(f-.25)*4*hw;py=cy0+(f-.25)*4*hw/2}else if(f<.75){px=cx0+hw-(f-.5)*4*hw;py=cy0+hw/2-(f-.5)*4*hw/2}else{px=cx0-(f-.75)*4*hw;py=cy0-(f-.75)*4*hw/2}
    var red=i%2===0;c.fillStyle=red?(blinkOn?'#FF3B30':'#7A1E18'):'#E6ECF5';c.fillRect(Math.round(px*2)/2-.25,Math.round(py*2)/2-.25,.5,.5)}c.restore()}
function drawMast(c,gx,gy,cy0){c.save();c.strokeStyle='#2B3447';c.lineWidth=.5;c.beginPath();c.moveTo(gx-3,gy);c.lineTo(gx-3,cy0+2);c.moveTo(gx+3,gy);c.lineTo(gx+3,cy0+2);
  for(var y=cy0+2;y<gy-3;y+=3){c.moveTo(gx-3,y);c.lineTo(gx+3,y+3);c.moveTo(gx+3,y);c.lineTo(gx-3,y+3)}c.stroke();c.restore()}
function drawAgents(c,tn){var ids=Object.keys(AG);if(!ids.length)return;var lay=agentLayout(tn),groups=lay.groups,micro=LODN===0,rotF=reduce?'a':(Math.floor(tn/90)%2?'b':'a'),blink=Math.floor(tn/900)%2===0&&!reduce,strobe=reduce||drStrobe(tn);
  c.save();c.imageSmoothingEnabled=false;
  Object.keys(groups).forEach(function(key){var gr=groups[key],gp=gr.dock;if(!gp.length&&!gr.hold.length&&D.world)return;
    var g0=dockAt(AG[gr.ids[0]].a),hw=deckOf(gp.length),cx0=g0.x,cy0=g0.y-LIFT+(reduce?0:bob(tn));
    c.fillStyle='rgba(61,242,255,.08)';c.fillRect(g0.x-hw*.5,g0.y-hw*.25,hw,hw*.5);   // its light on the ground
    drawMast(c,g0.x,g0.y,cy0);drawDeck(c,cx0,cy0,hw,tn,blink);
    if(gr.hold.length){c.save();c.strokeStyle='#8F9BB0';c.globalAlpha=.5;c.lineWidth=.5;c.setLineDash([2,2]);var hr=16+Math.sqrt(gr.hold.length)*7;c.beginPath();c.ellipse(cx0,cy0-30,hr,hr*.45,0,0,7);c.stroke();c.restore()}   // the holding orbit, so the viewer sees why those drones circle
    if(gr.hidden>0)pxPill(c,cx0+hw+14,cy0+2,'+'+gr.hidden,'#9FC3FF');   // more parked than the deck shows: always say so, labels or not
    if(D.world||!labels)return;
    var nw=gp.filter(function(id){return AG[id].a.state==='waiting'}).length,ni=gp.length-nw;pxPill(c,g0.x,g0.y+16,'SKY BASE'+(ni?' · '+ni+' parked':'')+(nw?' · '+nw+' waiting on you':'')+(gr.hidden?' · +'+gr.hidden:''),'#9FC3FF');
    if(gr.hold.length)pxPill(c,cx0,cy0-30-hr*.45-8,gr.hold.length+' in the air · repo not on this map','#8F9BB0')});
  var pills=[];ids.slice().sort(function(p,q){return (AG[p].y||0)-(AG[q].y||0)}).forEach(function(id){var g=AG[id],a=g.a,sp=lay.spots[id];if(!sp)return;
    var px0=g.x,py0=g.y;g.x+=(sp.x-g.x)*.05;g.y+=(sp.y-g.y)*.05;var f=g.gone?Math.max(0,1-(tn-g.gone)/1500):Math.min(1,(tn-g.born)/600);if(f<=0){delete AG[id];return}
    var st=a.state,col=AGC[st]||AGC.working,liv=st==='waiting'&&!strobe?'waitoff':(DR_LIV[st]?st:'working'),air=st==='working'||st==='thinking'||st==='waiting',sx=g.x,sy=g.y;
    c.globalAlpha=f*(st==='idle'?.75:1)*(typeof lifeHl==='function'?lifeHl('drones'):1);
    if(sp.mode==='fly'&&g.b&&!micro&&typeof P==='object'&&P.lamp>0){var fl=agentFloors(st,tn,strobe);if(fl)drawFloors(c,g.b,fl,f)}   // night: the agent lights its building's top floors
    if(sp.mode==='dock'){if(!sp.hidden){var pl=st==='waiting'?(strobe?'#FFB020':'#A66A00'):'#434C5A';pxBlit(c,pxGlyph('park|'+pl,DR_PARK,{L:'#8F9BB0',K:'#0E1420',S:pl,D:'#2E3646'}),sx,sy+1.5)}
      g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;return}
    // the work beam: a 2-texel core and dithered edges from the camera down to the roof, with a work spot and sparks
    if(sp.roof!=null&&st==='working'&&Math.abs(g.x-sp.x)<6){var y0=sy+1,ph=Math.floor(tn/120)%2;c.fillStyle=col;c.globalAlpha=f*(sp.lead?.55:.4);c.fillRect(sx-(sp.lead?.5:.25),y0,sp.lead?1:.5,sp.roof-y0);
      if(sp.lead&&!micro){c.globalAlpha=f*.22;c.strokeStyle=col;c.lineWidth=.5;c.setLineDash([.5,.5]);c.lineDashOffset=ph*.5;c.beginPath();c.moveTo(sx-1.25,y0);c.lineTo(sx-1.25,sp.roof);c.stroke();c.lineDashOffset=ph*.5+.5;c.beginPath();c.moveTo(sx+1.25,y0);c.lineTo(sx+1.25,sp.roof);c.stroke();c.setLineDash([])}
      c.globalAlpha=f*.9;pxBlit(c,pxGlyph('spot|'+col,DR_SPOT,{S:col,s:DR_LIV[liv].s||col,W:'#E6ECF5'}),sx,sp.roof+1.5);
      if(!reduce&&!micro){var k0=Math.floor(tn/150);c.fillStyle='#E6ECF5';for(var q=0;q<2;q++){var rx=(rnd(g.seed+k0*3+q)-.5)*3,ry=(rnd(g.seed+k0*7+q)-.5)*1.5;c.fillRect(sx+rx,sp.roof+ry,.5,.5)}}c.globalAlpha=f}
    if(!micro&&!reduce&&air){var vx=g.x-px0,vy=g.y-py0,v=Math.hypot(vx,vy);if(v>1){c.fillStyle=col;for(var ti=1;ti<=4;ti++){c.globalAlpha=f*(1-ti*.2);c.fillRect(sx-vx/v*ti*1.5-.25,sy-vy/v*ti*1.5-.25,.5,.5)}c.globalAlpha=f}}   // trail
    var rot=air&&!reduce?rotF:air?'a':'still';pxBlit(c,drSprite(liv,rot,micro),sx,sy+(micro?1.5:3));
    if(!micro&&air&&blink!==undefined){var on=(tn%1000)<100,on2=(tn%1000)>=500&&(tn%1000)<600;if(on&&!reduce){c.fillStyle='#FF6B5E';c.fillRect(sx-7,sy+.5,.5,.5)}if(on2&&!reduce){c.fillStyle='#7CFFA8';c.fillRect(sx+6.5,sy+.5,.5,.5)}}   // nav lights: red 100 ms every second, green at +500
    if(st==='thinking'&&!reduce&&!micro){var ta=tn/143;c.fillStyle=col;for(var di=0;di<3;di++){var an=ta+di*.55,dsz=di===2?1:.5;c.globalAlpha=f*(.9-di*.2);c.fillRect(sx+Math.cos(an)*5.5-dsz/2,sy+Math.sin(an)*2.5-dsz/2,dsz,dsz)}c.globalAlpha=f}   // thought dots on an 11x5 texel orbit
    g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;
    if(labels&&sp.mode!=='dock'&&(cam.z>.55||ids.length<=8)&&(sp.pill||sp.mode==='hold'&&false)){var pk=g.b?g.b.i+','+g.b.j:id;pills.push({x:sx,y:sy-9,ids:g.b?lay.groups&&Object.keys(AG).filter(function(o){return AG[o].b===g.b&&!AG[o].gone}):[id],col:col})}});
  c.globalAlpha=1;pills.forEach(function(p){pxPill(c,p.x,p.y,agentPillText(p.ids),p.col)});c.restore()}
`;
