// The living city (city.ts embeds LIFE_JS after the walkers): people and vehicles that exist in proportion to the live
// numbers, built to mockups/LIVING-CITY-DESIGN.md (b) and its sprite grids. One data fact per visual element: a walker is a
// person on a site now, a stroller is yesterday's traffic, a car is views (plus a trickle from commits this week), a van is a
// sale today, a scooter is a signup today, a bus is a district with real daily traffic; steam on a roof is a repo with
// commits this week, a crew at the crane is commits today. Mike 2026-11-11: "more activity and microactivity on the map so
// they look like living cities of people walking through, et cetera, that are reflective of the actual traffic."
// lifeTargets() is pure (tested). Counts ease toward their target a few per second; caps by device; the legend carries
// the undrawn remainder ("+n"). Reduced motion keeps the figures but freezes them (stand pose, parked at the kerb).
export const LIFE_JS = String.raw`
// ---- life (citylife.ts): the standing population and the traffic from the live numbers
var LIFE={peds:[],target:{p:0,s:0,by:{},sby:{},cars:{},vans:{},scoots:{},bus:{},raw:{walk:0,stroll:0,cars:0,vans:0,scoots:0,bus:0}},caps:{p:160,v:60,van:12,sc:16},lastT:0,hl:null,hlAt:0},LIFE_LVL=[0,2,8,14,20],LIFE_WEEK=0,LIFE_DBY={},STEAM=[],CREWS=[];
D.districts.forEach(function(d){var k=D.world?(d.nb||d.name):d.name,o=LIFE_DBY[k]=LIFE_DBY[k]||{week:0,commits:0,col:null,best:0};(d.repos||[]).forEach(function(r){LIFE_WEEK+=+r.week||0;o.week+=+r.week||0;o.commits+=+r.commits||0;if(!r.kind&&(+r.commits||0)>=o.best){o.best=+r.commits||0;o.col=LANG[r.language]||null}})});
function lifeCaps(){var ph=MINI||(vw&&vw<600);return {p:ph?60:160,v:ph?24:60,van:ph?6:12,sc:ph?8:16}}
/** what the city should show. d = live districts ({now,visitors,views,buys,signups} private, {level} public), dby = {district:{week,commits}},
 *  caps = {p,v,van,sc}. Returns per district: by (walkers), sby (strollers), cars, vans, scoots, bus; totals p, s, v, vn, sn, bn; raw = the data before caps */
function lifeTargets(d,dby,caps,mode){var by={},sby={},cars={},vans={},scoots={},bus={},raw={walk:0,stroll:0,cars:0,vans:0,scoots:0,bus:0},k,x,n;d=d||{};dby=dby||{};
  for(k in d){x=d[k]||{};
    if(mode==='private'){n=+x.now||0;var s=Math.min(10,Math.floor((+x.visitors||0)/200)),vc=Math.round((+x.views||0)/400),b=+x.buys||0,sg=+x.signups||0,vi=+x.visitors||0;
      if(n>0){by[k]=Math.min(n,Math.floor(caps.p*.7));raw.walk+=n}if(s>0){sby[k]=s;raw.stroll+=s}if(vc>0){cars[k]=vc;raw.cars+=vc}if(b>0){vans[k]=b;raw.vans+=b}if(sg>0){scoots[k]=sg;raw.scoots+=sg}
      var bn=vi>=5000?2:vi>=500?1:0;if(bn){bus[k]=bn;raw.bus+=bn}}
    else{n=LIFE_LVL[Math.max(0,Math.min(4,Math.round(+x.level||0)))]||0;if(n>0){by[k]=n;raw.walk+=n;cars[k]=Math.round(n/4);raw.cars+=cars[k]}}}
  for(k in dby){var o=dby[k]||{};if((+o.commits||0)>0||(+o.week||0)>0){var amb=Math.max(1,Math.round((+o.week||0)/5));cars[k]=(cars[k]||0)+amb;raw.cars+=amb}}   // ambient: commits this week keep the roads alive
  function cap(m,lim){var t=0;for(var q in m)t+=m[q];if(t>lim){var f=lim/t,t2=0;for(q in m){m[q]=Math.max(1,Math.round(m[q]*f))}for(q in m)t2+=m[q];while(t2>lim){for(q in m){if(t2<=lim)break;if(m[q]>1){m[q]--;t2--}}if(!Object.keys(m).some(function(z){return m[z]>1}))break}return t2}return t}
  var P=cap(by,caps.p),S=cap(sby,Math.max(0,caps.p-P)),V=cap(cars,caps.v),VN=cap(vans,caps.van),SN=cap(scoots,caps.sc),BN=0;for(k in bus)BN+=bus[k];
  return {p:P,s:S,v:V,vn:VN,sn:SN,bn:BN,by:by,sby:sby,cars:cars,vans:vans,scoots:scoots,bus:bus,raw:raw}}
function lifeRetarget(){LIFE.caps=lifeCaps();LIFE.target=lifeTargets(LV.d,LIFE_DBY,LIFE.caps,LV.mode||'private')}
/** the counts the legend states: drawn + undrawn per element, the drones by state, roofs steaming */
function lifeCounts(){var t=LIFE.target,r=t.raw,ag={working:0,thinking:0,waiting:0,idle:0,done:0};if(typeof AG==='object')for(var id in AG)if(!AG[id].gone)ag[AG[id].a.state]=(ag[AG[id].a.state]||0)+1;
  return {walk:{n:t.p,raw:r.walk},stroll:{n:t.s,raw:r.stroll},cars:{n:t.v,raw:r.cars},vans:{n:t.vn,raw:r.vans},scoots:{n:t.sn,raw:r.scoots},bus:{n:t.bn,raw:r.bus},agents:ag,steam:STEAM.length,crews:CREWS.length,mode:LV.mode||''}}
function lifeHl(cls){if(!LIFE.hl)return 1;if(performance.now()-LIFE.hlAt>3000){LIFE.hl=null;return 1}return LIFE.hl===cls?1:.6}   // a tapped legend row: its element class stays at 1, the rest drop to .6 for 3 s
// ---- sprites (design grids): pedestrians 4x8 (A stride, B stand), car 12x6, van 14x7, scooter 6x4, bus 20x8, steam puffs, crew
var LS=2;   // street sprites: 1 texel = 1 world px (a person is one floor tall, a car 12 px); drones keep the half-px texel
var LIFE_TOP=['#D9483B','#3F7FD9','#F2C14E'],LIFE_SKIN=['#F2C9A0','#C98B5B'],LIFE_HAIR=['#2A1D14','#141414','#D8A850'],LIFE_PANTS=['#2E3A52','#4A4A4A'],LIFE_SHOE='#15181F';
var LIFE_PED={a:['.hh.','.ff.','.tt.','tttt','.tt.','.pp.','p..p','k..k'],b:['.hh.','.ff.','.tt.','.tt.','tttt','.pp.','.pp.','.kk.'],crew:['.hh.','hffh','.tt.','tttt','.tt.','.pp.','p..p','k..k'],crewb:['.hh.','hffh','.tt.','.tt.','tttt','.pp.','.pp.','.kk.']};
function pedMap(o){return {h:LIFE_HAIR[o%3],f:LIFE_SKIN[o%2],t:LIFE_TOP[o%3],p:LIFE_PANTS[(o>>1)%2],k:LIFE_SHOE}}
function lifeSpr(o,f){return pxGlyph('ped|'+o+'|'+f,LIFE_PED[f?'b':'a'],pedMap(o))}
function crewSpr(f){return pxGlyph('crew|'+f,LIFE_PED[f?'crewb':'crew'],{h:'#FFD24A',f:'#F2C9A0',t:'#FF8A3D',p:'#2E3A52',k:LIFE_SHOE})}
var CAR_COLS=['#D9483B','#3F7FD9','#ECEFF3','#F2C14E','#2B2B2B'];
var VEH={car:['.....KKKK...','...KKwwwwK..','.KKcccwwwwK.','KcccccccccK.','KcccccccccYK','.kkKKccKKkk.'],
  van:['....KKKKKKKKK.','...KwwKvvvvvvK','.KKvvvKvvvvvvK','KvvvvvKddddddK','KvvvvvvvvvvvvK','KYkKKKvvvKKkKK','.kk......kk...'],
  vanopen:['....KKKKKKKKK.','...KwwKvvvvvvK','.KKvvvKvvvvvvK','KvvvvvKddddddK','KvvvvvvvKKvvvK','KYkKKKvvvKKkKK','.kk......kk...'],
  scooter:['..hh..','.Ktt..','KooooK','k....k'],
  bus:['..KKKKKKKKKKKKKKKK..','.KwwKwwKwwKwwKwwKwK.','.KwwKwwKwwKwwKwwKwK.','.KooooooooooooooooK.','.KooooooooooooooooK.','.KoooooooooooooooYK.','.KKkkKKKKKKKKKkkKKK.','...kk.........kk....'],
  carmicro:['cc'],busmicro:['ooo']};
function vehMap(kind,col,nightOn){var n=!!nightOn,glass=n?'#223044':'#9FD4FF';return {K:'#0E1420',k:'#15181F',w:glass,c:n?hmul(col,.55):col,Y:n?'#FFF2B0':'#E6ECF5',v:n?'#8A8E96':'#ECEFF3',d:col,o:n?'#8A5C1C':'#F2A33A',h:'#2A1D14',t:'#3F7FD9'}}
function vehSpr(kind,col,nightOn,open){var k=kind==='van'&&open?'vanopen':kind,key='veh|'+k+'|'+col+'|'+(nightOn?1:0);return pxGlyph(key,VEH[k]||VEH.car,vehMap(kind,col,nightOn))}
var STEAM_FR=[['w'],['ww','ww'],['.w.','www','.w.'],['w.w','...','w.w']],STEAM_A=[.85,.7,.5,.3];
function steamSpr(f){return pxGlyph('steam|'+f,STEAM_FR[f],{w:'#E6ECF5'})}
function vehSpeed(kind){return kind==='scooter'?.028:kind==='bus'?.016:kind==='van'?.018:.02}   // t per tick along a tile
function dCol(k){var o=LIFE_DBY[k];return (o&&o.col)||'#8B6CF6'}
// ---- pedestrians: walk the district's streets from exit to door to exit; standers pause at a door in pose B (talking); strollers loop slowly
function lifePath(b){var ex=exits(b);if(!ex.length)return null;var df=doorFor(b),a=ex[Math.floor(Math.random()*ex.length)],tl;
  if(df&&Math.random()<.6){tl=roadPath(a,df.E,1);if(!tl)return null;var pts=wpts(tl),door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]);pts.push(lerpPt(Ec,door,1-.45/df.d));return pts}
  var z=ex[Math.floor(Math.random()*ex.length)];tl=roadPath(a,z,1);return tl&&tl.length>1?wpts(tl):null}
function lifeSpawn(k,stroll){var b=byName[k]||byName.Private;if(!b)return;var pts=lifePath(b);if(!pts)return;var len=0,seg=[];for(var i=1;i<pts.length;i++){var l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);len+=l}
  LIFE.peds.push({k:k,b:b,pts:pts,seg:seg,len:Math.max(1,len),d:Math.random()*len*.5,sp:stroll?6+Math.random()*3:12+Math.random()*9,o:Math.floor(Math.random()*6),stroll:!!stroll,stand:!stroll&&Math.random()<.3,born:performance.now(),seed:Math.floor(Math.random()*1000),wait:0,gone:0})}
function stepPeds(tn,dt){var by=LIFE.target.by,sby=LIFE.target.sby,have={},shave={},k;
  LIFE.peds.forEach(function(p){if(p.gone)return;if(p.stroll)shave[p.k]=(shave[p.k]||0)+1;else have[p.k]=(have[p.k]||0)+1});
  for(k in by)if((have[k]||0)<by[k]&&LIFE.peds.length<LIFE.caps.p&&Math.random()<.35)lifeSpawn(k,false);   // ease up to the target, a few per second
  for(k in sby)if((shave[k]||0)<sby[k]&&LIFE.peds.length<LIFE.caps.p&&Math.random()<.2)lifeSpawn(k,true);
  LIFE.peds.forEach(function(p){var want=p.stroll?(sby[p.k]||0):(by[p.k]||0),h=p.stroll?shave:have;if(!p.gone&&(h[p.k]||0)>want&&Math.random()<.02&&p.d>p.len*.8){p.gone=tn;h[p.k]--}   // retire at the block edge or door, never mid-pavement
    if(p.wait>0){p.wait-=dt;return}if(reduce)return;p.d+=p.sp*dt/1000;
    if(p.d>=p.len){var pts=lifePath(p.b);if(!pts){p.gone=p.gone||tn;return}var len=0,seg=[];for(var i=1;i<pts.length;i++){var l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);len+=l}
      p.pts=pts;p.seg=seg;p.len=Math.max(1,len);p.d=0;p.wait=p.stand?5000+Math.random()*7000:600+Math.random()*2400}});
  LIFE.peds=LIFE.peds.filter(function(p){return !p.gone||tn-p.gone<1200})}
function drawLife(){if(INTRO||!LIFE.peds.length)return;var c=cx,tn=performance.now(),v=hView(TH),micro=LODN===0,hl=lifeHl('walk'),hs=lifeHl('stroll');c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var shade=sky==='day'?'rgba(0,0,0,.22)':'rgba(0,0,0,.35)',dots=0;c.save();c.imageSmoothingEnabled=false;
  LIFE.peds.slice().sort(function(a,b){return walkAt(a).y-walkAt(b).y}).forEach(function(p){var q=walkAt(p);if(q.x<v[0]||q.x>v[1]||q.y<v[2]||q.y>v[3])return;
    var a=(p.gone?Math.max(0,1-(tn-p.gone)/1200):Math.min(1,(tn-p.born)/700))*(p.stroll?hs:hl);if(a<=0)return;c.globalAlpha=a;
    if(micro){if(dots++>=20)return;c.fillStyle=LIFE_TOP[p.o%3];c.fillRect(q.x-.25,q.y-.5,.5,.5);return}
    var standing=p.wait>0||reduce,f=standing?1:Math.floor((tn+p.seed*37)/180)%2;
    if(LODN===2){c.fillStyle=shade;c.fillRect(q.x-2,q.y-.5,4,1)}   // a 1-texel drop shadow
    if(!pxBlit(c,lifeSpr(p.o,f),q.x,q.y,q.ux<0,LS))walkerFig(c,q.x,q.y,LIFE_TOP[p.o%3],PS,f,q.ux,q.uy);
    if(standing&&p.stand&&LODN===2&&!reduce&&((tn+p.seed*91)%3000)<300){c.fillStyle='#E6ECF5';c.fillRect(q.x+2.5,q.y-9.5,1,1)}});   // talking: a speech dot every 3 s
  c.restore();c.globalAlpha=1}
// ---- vehicles: one list (cars) of {kind,k,b,i,j,ti,tj,t,col,path,pi,st,wait}; cars roam, vans and scooters drive to the district lobby and leave, a bus loops the district's ring road
function vehHave(){var h={car:{},van:{},scooter:{},bus:{}};cars.forEach(function(c){if(c.gone)return;var kd=c.kind||'car';h[kd][c.k||'']=(h[kd][c.k||'']||0)+1});return h}
function vehNew(kind,k,b,s,col){var c={kind:kind,k:k,b:b,i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,born:performance.now(),col:col,st:'go',wait:0,seed:Math.floor(Math.random()*1000)};vehStep(c);return c}
function lobbyOf(b){if(b._lob!==undefined)return b._lob;var df=doorFor(b);b._lob=df?df.E:null;return b._lob}
function farExit(b,from){var ex=exits(b),best=null,bd=-1;ex.forEach(function(t){var d=Math.abs(t[0]-from[0])+Math.abs(t[1]-from[1]);if(d>bd){bd=d;best=t}});return best}
function lifeCars(){var tn=performance.now(),T=LIFE.target,h=vehHave(),k,n;
  var amb=cars.filter(function(c){return !c.gone&&(c.kind||'car')==='car'&&!c.k});   // cars without a district (the ambient start set) count toward the total
  var wantCars=0;for(k in T.cars)wantCars+=T.cars[k];
  for(k in T.cars){var b=byName[k]||byName.Private,ex=b?exits(b):roads;for(n=h.car[k]||0;n<T.cars[k]&&ex.length&&cars.length<LIFE.caps.v+LIFE.caps.van+LIFE.caps.sc+8;n++){var s=ex[Math.floor(Math.random()*ex.length)];cars.push(vehNew('car',k,b,s,CAR_COLS[Math.floor(Math.random()*5)]))}}
  cars.forEach(function(c){if(c.gone||(c.kind||'car')!=='car')return;var want=c.k?(T.cars[c.k]||0):0;if(c.k&&(h.car[c.k]||0)>want){c.gone=tn;h.car[c.k]--}});
  var tot=cars.filter(function(c){return !c.gone&&(c.kind||'car')==='car'}).length;amb.forEach(function(c){if(tot>T.v&&!c.gone){c.gone=tn;tot--}});   // the start set gives way to the counted cars
  for(k in T.vans){b=byName[k]||byName.Private;if(!b)continue;var lob=lobbyOf(b);for(n=h.van[k]||0;n<T.vans[k];n++){var s0=farExit(b,lob||[b.x,b.y]);if(!s0)break;var v=vehNew('van',k,b,s0,dCol(k));if(lob){v.path=roadPath(s0,lob,1);v.pi=0}cars.push(v)}}
  for(k in T.scoots){b=byName[k]||byName.Private;if(!b)continue;lob=lobbyOf(b);for(n=h.scooter[k]||0;n<T.scoots[k];n++){s0=farExit(b,lob||[b.x,b.y]);if(!s0)break;v=vehNew('scooter',k,b,s0,'#FF8A3D');if(lob){v.path=roadPath(s0,lob,1);v.pi=0}cars.push(v)}}
  for(k in T.bus){b=byName[k]||byName.Private;if(!b||!exits(b).length)continue;for(n=h.bus[k]||0;n<T.bus[k];n++){ex=exits(b);v=vehNew('bus',k,b,ex[Math.floor(Math.random()*ex.length)],'#F2A33A');v.ring=ex;v.shelter=ex[0];cars.push(v)}}
  cars.forEach(function(c){if(c.gone)return;var kd=c.kind||'car',m=kd==='van'?T.vans:kd==='scooter'?T.scoots:kd==='bus'?T.bus:null;if(!m)return;var w=m[c.k]||0,hv=kd==='van'?h.van:kd==='scooter'?h.scooter:h.bus;if((hv[c.k]||0)>w&&c.st!=='leave'){vehLeave(c);hv[c.k]--}})}
function vehLeave(c){if(c.st==='leave')return;c.st='leave';var out=c.b?farExit(c.b,[c.ti,c.tj]):null;c.path=out?roadPath([c.ti,c.tj],out,1):null;c.pi=0;if(!c.path)c.gone=performance.now()}
function vehStep(c){if(c.path&&c.pi<c.path.length-1){var nx=c.path[++c.pi];c.i=c.ti;c.j=c.tj;c.ti=nx[0];c.tj=nx[1];c.t=0;return}
  if(c.path){c.path=null;if(c.st==='go'&&(c.kind==='van'||c.kind==='scooter')){c.st='wait';c.wait=c.kind==='van'?20000:4000;c.spark=performance.now();c.t=1;return}if(c.st==='leave'){c.gone=performance.now();c.t=1;return}}
  var set=c.ring,o=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [c.ti+d[0],c.tj+d[1]]}).filter(function(n){var t=tiles[n[0]+','+n[1]];if(!t||t.t!=='r'||(n[0]===c.i&&n[1]===c.j))return false;if(!set)return true;for(var q=0;q<set.length;q++)if(set[q][0]===n[0]&&set[q][1]===n[1])return true;return false});
  if(!o.length)o=[[c.i,c.j]];var n=o[Math.floor(Math.random()*o.length)];c.i=c.ti;c.j=c.tj;c.ti=n[0];c.tj=n[1];c.t=0;
  if(c.ring&&c.shelter&&c.ti===c.shelter[0]&&c.tj===c.shelter[1]&&!c.stopped){c.stopped=1;c.wait=6000}else if(c.ring&&!(c.ti===c.shelter[0]&&c.tj===c.shelter[1]))c.stopped=0}
function stepVehicles(tn,dt){var grid=sky==='grid';cars.forEach(function(c){if(c.gone)return;if(c.wait>0){c.wait-=dt;if(c.wait<=0&&c.st==='wait')vehLeave(c);return}if(reduce&&!grid)return;
    c.t+=grid?0.035:vehSpeed(c.kind||'car')*dt/33;if(c.t>=1)vehStep(c);if(grid){var p=carPos(c);(c.trail=c.trail||[]).push([p.x,p.y-1]);if(c.trail.length>34)c.trail.shift()}})}
function drawVehicles(){if(INTRO)return;if(sky==='grid')return drawCycles();var c=cx,tn=performance.now(),v=hView(TH),micro=LODN===0,nightOn=sky!=='day';c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.imageSmoothingEnabled=false;
  cars.slice().sort(function(a,b){return carPos(a).y-carPos(b).y}).forEach(function(car){var kd=car.kind||'car',p=carPos(car);if(p.x<v[0]||p.x>v[1]||p.y<v[2]||p.y>v[3])return;
    var a=fa(car,tn)*lifeHl(kd==='car'?'cars':kd==='van'?'vans':kd==='scooter'?'scoots':'bus');if(a<=0)return;c.globalAlpha=a;var flip=p.ux<0,px=p.x,py=p.y+1;
    if(micro){if(kd==='scooter'||kd==='van')return;pxBlit(c,pxGlyph('vm|'+kd+'|'+car.col,VEH[kd==='bus'?'busmicro':'carmicro'],{c:car.col,o:'#F2A33A'}),px,py,false,LS);return}
    var w=(VEH[kd]||VEH.car)[0].length*LS/PXS;c.fillStyle=sky==='day'?'rgba(0,0,0,.25)':'rgba(0,0,0,.35)';c.fillRect(px-w/2,py-.5,w,1);   // a 1-texel shadow under the wheels
    if(nightOn&&car.wait<=0&&!reduce){var nose=flip?px-w/2:px+w/2,dir=flip?-1:1;c.fillStyle='#FFF2B0';c.globalAlpha=a*.5;c.fillRect(nose,py-3,dir*2,1);c.globalAlpha=a*.35;c.fillRect(nose+dir*2,py-3.5,dir*1,2);c.globalAlpha=a;c.fillStyle='#FF3B30';c.fillRect(flip?px+w/2-1:px-w/2,py-3,1,1)}   // headlight cone and tail light
    pxBlit(c,vehSpr(kd,car.col,nightOn,car.st==='wait'),px,py,flip,LS);
    if(car.spark&&tn-car.spark<600&&kd==='van'&&LODN===2){c.fillStyle='#FFD24A';c.fillRect(px+(flip?-1:1)*4,py-10-(tn-car.spark)/150,1,1)}});   // a coin sparkle as the van arrives
  c.restore();c.globalAlpha=1}
// ---- roofs: steam from the vents of repos with commits this week (two vents when there are commits today), crews at the cranes of repos with commits today
function drawSteam(c,tn){if(!STEAM.length||LODN===0||sky==='grid')return;var wind=wxWind(),wx=wind.vx/12,hl=lifeHl('steam');c.save();c.imageSmoothingEnabled=false;
  STEAM.forEach(function(s){var hw=TW/2*s.w,hh=TH/2*s.w;for(var vi=0;vi<s.n;vi++){var q=tpt(s.x,s.y,hw,hh,vi?.45:-.4,vi?-.35:.4),per=3000+rnd(s.seed+vi)*2000,ph=rnd(s.seed*3+vi)*per;
      if(reduce){c.globalAlpha=.5*hl;pxBlit(c,steamSpr(1),q[0],q[1]-6,false,LS*2);c.globalAlpha=.3*hl;pxBlit(c,steamSpr(2),q[0],q[1]-12,false,LS*2);continue}
      var age=(tn+ph)%per;if(age>1400)continue;var f=Math.min(3,Math.floor(age/350));if(LODN===1&&f<1)f=1;var rise=age/1000*3,dx=wx*age/500;c.globalAlpha=STEAM_A[f]*hl;pxBlit(c,steamSpr(f),q[0]+dx,q[1]-3-rise,false,LS*2)}});
  c.restore();c.globalAlpha=1}
function drawCrews(c,tn){if(!CREWS.length||LODN===0||sky==='grid')return;var hl=lifeHl('steam');c.save();c.imageSmoothingEnabled=false;
  CREWS.forEach(function(k){var swing=reduce?1:Math.floor((tn+k.seed*7)/600)%2;c.globalAlpha=hl;pxBlit(c,crewSpr(swing),k.x-7,k.y+1,false,LS);pxBlit(c,crewSpr(1),k.x+7,k.y+2,true,LS);
    if(LODN===2&&!reduce&&swing===0&&((tn+k.seed*7)%600)<150){c.fillStyle='#E6ECF5';c.fillRect(k.x-9,k.y-3,1,1)}});   // the hammer's spark on the hit
  c.restore();c.globalAlpha=1}
function stepLife(tn){var dt=LIFE.lastT?Math.min(100,tn-LIFE.lastT):0;LIFE.lastT=tn;stepPeds(tn,dt);stepVehicles(tn,dt)}
`;
