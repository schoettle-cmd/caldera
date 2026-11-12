// The standing population (city.ts embeds LIFE_JS after the walkers): pedestrians and vehicles that exist in proportion to
// the live numbers, so a city with people on its sites has people on its streets between arrivals, and a city with
// commits this week never has empty roads. Mike 2026-11-11: "more activity and microactivity on the map so they look like
// living cities of people walking through, et cetera, that are reflective of the actual traffic."
// lifeTargets() is pure (tested): one figure per person on the sites right now (private feed), a floor from the day's
// visitors; the public feed only has activity levels, so it maps levels to a small crowd. Vehicles: a base from commits
// this week plus a term for views, so traffic reads as code activity + site traffic. Caps by device; reduced motion keeps
// the figures but freezes them at doors and lets the legend carry the counts.
export const LIFE_JS = String.raw`
// ---- life (citylife.ts): the standing population from the live numbers
var LIFE={peds:[],target:{p:0,v:0,by:{}},caps:{p:MINI?60:160,v:MINI?24:60},week:0,lastT:0,spr:{},steam:[]},LIFE_LVL=[0,2,5,10,16],LIFE_WEEK=0;
D.districts.forEach(function(d){(d.repos||[]).forEach(function(r){LIFE_WEEK+=+r.week||0})});
/** how many people and vehicles the city should show: d = the live districts ({now,visitors,views} private, {level} public), week = commits this week, caps = {p,v}.
 *  Returns {p: pedestrians, v: vehicles, by: {district: pedestrians}} */
function lifeTargets(d,week,caps,mode){var by={},P=0,views=0,k,x,n;d=d||{};
  for(k in d){x=d[k]||{};if(mode==='private'){n=(+x.now||0)+Math.min(6,Math.round(Math.log(1+(+x.visitors||0))/Math.LN2*.5));views+=+x.views||0}
    else{n=LIFE_LVL[Math.max(0,Math.min(4,Math.round(+x.level||0)))]||0;views+=n*20}
    if(n>0){by[k]=n;P+=n}}
  if(P>caps.p){var f=caps.p/P;for(k in by)by[k]=Math.max(1,Math.round(by[k]*f));P=0;for(k in by)P+=by[k]}
  var v=Math.min(caps.v,Math.round(Math.min(24,2+week/8))+Math.round(Math.min(20,Math.log(1+views)*1.6)));
  return {p:P,v:v,by:by}}
function lifeRetarget(){LIFE.target=lifeTargets(LV.d,LIFE_WEEK,LIFE.caps,LV.mode)}
// ambient vehicles (no visitor behind them) ease toward the target; the live visitor cars (reconcile) ride on top
function lifeCars(){var tn=performance.now(),amb=cars.filter(function(c){return !c.b&&!c.gone}),want=LIFE.target.v,COLS=['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'];
  for(var n=amb.length;n<want&&roads.length;n++){var s=roads[Math.floor(Math.random()*roads.length)],c={i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,born:tn,col:COLS[n%5]};step(c);cars.push(c)}
  amb.slice(want).forEach(function(c){c.gone=tn})}
// the sprites: 3 outfits x 2 walk frames (rows of palette indices, 4 texels wide, 9 tall); swapped for the design's grids in cityhifi when it lands
var LIFE_PAL=['#1B1F2A','#F2D3B3','#3B6FD6','#E85D75','#4FB89A','#F5F0E6','#8A5A3C','#FFD23F','#2B2F3A'];
var LIFE_PED=[[['.00.','.11.','.222','.22.','.22.','.88.','.8.8','.8.8','0..0'],['.00.','.11.','222.','.22.','.22.','.88.','.88.','.8.8','.0.0']],
  [['.66.','.11.','.333','.33.','.33.','.88.','.8.8','.8.8','0..0'],['.66.','.11.','333.','.33.','.33.','.88.','.88.','.8.8','.0.0']],
  [['.00.','.11.','.444','.44.','.44.','.55.','.5.5','.5.5','0..0'],['.00.','.11.','444.','.44.','.44.','.55.','.55.','.5.5','.0.0']]];
function lifeSpr(o,f){var k='ped'+o+f;return LIFE.spr[k]||(LIFE.spr[k]=pxSprite(k,LIFE_PED[o][f],LIFE_PAL))}
// a pedestrian: walks the district's streets from exit to door to exit, pauses at doors, then goes again
function lifePath(b){var ex=exits(b);if(!ex.length)return null;var df=doorFor(b),a=ex[Math.floor(Math.random()*ex.length)],tl;
  if(df&&Math.random()<.6){tl=roadPath(a,df.E,1);if(!tl)return null;var pts=wpts(tl),door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]);pts.push(lerpPt(Ec,door,1-.45/df.d));return pts}
  var z=ex[Math.floor(Math.random()*ex.length)];tl=roadPath(a,z,1);return tl&&tl.length>1?wpts(tl):null}
function lifeSpawn(k){var b=byName[k]||byName.Private;if(!b)return;var pts=lifePath(b);if(!pts)return;var len=0,seg=[];for(var i=1;i<pts.length;i++){var l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);len+=l}
  LIFE.peds.push({k:k,b:b,pts:pts,seg:seg,len:Math.max(1,len),d:Math.random()*len*.5,sp:12+Math.random()*9,o:Math.floor(Math.random()*3),born:performance.now(),wait:0,gone:0})}
function stepLife(tn){var dt=LIFE.lastT?Math.min(100,tn-LIFE.lastT):0;LIFE.lastT=tn;var by=LIFE.target.by,have={},k;
  LIFE.peds.forEach(function(p){if(!p.gone)have[p.k]=(have[p.k]||0)+1});
  for(k in by)if((have[k]||0)<by[k]&&LIFE.peds.length<LIFE.caps.p&&Math.random()<.35)lifeSpawn(k);   // ease up to the target, a few per second
  LIFE.peds.forEach(function(p){if(!p.gone&&(have[p.k]||0)>(by[p.k]||0)&&Math.random()<.02){p.gone=tn;have[p.k]--}
    if(p.wait>0){p.wait-=dt;return}if(reduce)return;p.d+=p.sp*dt/1000;
    if(p.d>=p.len){var pts=lifePath(p.b);if(!pts){p.gone=p.gone||tn;return}var len=0,seg=[];for(var i=1;i<pts.length;i++){var l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);seg.push(l);len+=l}
      p.pts=pts;p.seg=seg;p.len=Math.max(1,len);p.d=0;p.wait=600+Math.random()*2400}});
  LIFE.peds=LIFE.peds.filter(function(p){return !p.gone||tn-p.gone<1200})}
function drawLife(){if(INTRO||!LIFE.peds.length)return;var c=cx,tn=performance.now(),v=hView(TH);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var shade=sky==='day'?'rgba(0,0,0,.22)':'rgba(0,0,0,.35)';
  LIFE.peds.slice().sort(function(a,b){return walkAt(a).y-walkAt(b).y}).forEach(function(p){var q=walkAt(p);if(q.x<v[0]||q.x>v[1]||q.y<v[2]||q.y>v[3])return;
    var a=p.gone?Math.max(0,1-(tn-p.gone)/1200):Math.min(1,(tn-p.born)/700),f=p.wait>0||reduce?0:Math.floor(p.d/3)%2;if(a<=0)return;
    c.save();c.globalAlpha=a;c.fillStyle=shade;c.beginPath();c.ellipse(q.x+1,q.y+.6,2.4*PS,1*PS,0,0,7);c.fill();
    if(!pxBlit(c,lifeSpr(p.o,f),q.x,q.y,q.ux<0,PS*1.25))walkerFig(c,q.x,q.y,LIFE_PAL[2+p.o],PS,f,q.ux,q.uy);c.restore()})}
`;
