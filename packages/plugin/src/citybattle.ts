/**
 * The World's Battle view (caldera.social/world?view=battle), inside the city renderer (city.ts CITY_JS), on top of the growth
 * plots (citygrowth.ts). Mike 2026-11-07 (design r-caldera-battle-248d7d19): "Each plot of land has a missile launcher. The
 * number of missiles shows up next to the launcher and they launch against other cities and show the actual destruction of
 * the city. They launch throughout the day, so between midnight and noon the city rebuilds with workers that animate and
 * come and repair damage, then noon until midnight the cities fire, spreading the battle out over 12 hours."
 *
 * Timing, on the viewer's local clock: the night the hub resolved (02:00 Pacific) inside (noon - 24h, noon] fires that day
 * from 12:00 to 24:00, each city's shots spread evenly with a little jitter; from 00:00 to 12:00 the next morning its damage
 * shrinks linearly in six steps while crews work the lots, whole by noon. State is derived from the clock and the shot list,
 * so a page opened at 16:00 shows the right counts and damage and then fires live; a throttled tab catches up with quick
 * flights (at most 14); nothing ever replays twelve hours. Missiles, particles, launchers, badges and crews are the moving
 * layer; buildings in the cache redraw only when a lot's damage step changes (bDmg, in sixths).
 * Data: window.CALDERA_BATTLE (the hub's /v1/world/battle: shots of the last night, prev = the night before). The page drives
 * it through window.CALDERA_BATTLE_API. Runs inside the CITY_JS closure after GROWTH_DRAW_JS: GM, gState, gXY, gLang, iso,
 * poly, rnd, hash, cam, dpr, cx, vw, vh, T, reduce, sky, mix, e, draw, dirty and the cityhifi set are in scope.
 */
/** the battle art, as drawn on the design page (battle-art.js there, verbatim) */
export const BATTLE_ART_JS = String.raw`
// ---- battle art (citybattle.ts BATTLE_ART_JS). Mike 2026-11-07: "each plot of land has a missile launcher ... pixel-level
// detail, realistic movements". World units (TW=64, TH=32), drawn with the camera transform set, so every stroke lands at the
// canvas DPR. Needs from cityhifi: hn, hmul, hRgba, hline, poly, mix, rnd, prismHi, pdia, tpt, fpt, NL, NR, LODN, smokeHi.
var BK=function(){return dpr*cam.z};                       // world px -> device px
function bsn(v){var k=BK();return Math.round(v*k)/k}        // snap a world coordinate to a whole device pixel
function bLerp(a,b,f){return a+(b-a)*f}
/** the launch pad and the launcher: a concrete pad with a hazard ring, a tracked chassis with a hatch, the turntable, a rail
 *  elevated along the aim with a hydraulic ram, the next missile on the rail, a beacon mast. o:{col, seed, n (missiles left),
 *  aim (screen angle of the rail, radians, up is negative), recoil 0..1, t (ms), lod} */
function launcherHi(c,x,y,o){var n=hn(),col=o.col||'#8B6CF6',seed=o.seed||0,t=o.t||0,rc=o.recoil||0,aim=o.aim==null?-.95:o.aim,lod=o.lod==null?LODN:o.lod;
  var padC=n?'#3E424C':'#9DA3AD',padD=n?'#2E323A':'#7E848E',steel=n?'#6B7280':'#9AA1AD',dark=n?'#1A1D24':'#2A2D35',body=n?'#3A4438':'#5E6A5A';
  // shadow and pad
  c.fillStyle='rgba(0,0,0,'+(n?.32:.22)+')';c.beginPath();c.ellipse(x+5,y+3,22,9,0,0,7);c.fill();
  var q=pdia(x,y,.56);poly(c,q,padD);poly(c,[q[0],q[1],[q[1][0],q[1][1]+2.2],[q[0][0],q[0][1]+2.2]],hmul(padD,.78));poly(c,[q[3],q[2],[q[2][0],q[2][1]+2.2],[q[3][0],q[3][1]+2.2]],hmul(padD,.62));
  poly(c,pdia(x,y-.6,.5),padC);
  if(lod>0){ // hazard ring on the front edges, bolts, drain
    for(var k=0;k<5;k++){var f0=k/5,f1=f0+.1,a=[q[3][0]+(q[2][0]-q[3][0])*f0,q[3][1]+(q[2][1]-q[3][1])*f0],b=[q[3][0]+(q[2][0]-q[3][0])*f1,q[3][1]+(q[2][1]-q[3][1])*f1];poly(c,[a,b,[b[0]+2.6,b[1]-1.3],[a[0]+2.6,a[1]-1.3]],k%2?'#14161C':'#F2C230');
      var a2=[q[2][0]+(q[1][0]-q[2][0])*f0,q[2][1]+(q[1][1]-q[2][1])*f0],b2=[q[2][0]+(q[1][0]-q[2][0])*f1,q[2][1]+(q[1][1]-q[2][1])*f1];poly(c,[a2,b2,[b2[0]-2.6,b2[1]-1.3],[a2[0]-2.6,a2[1]-1.3]],k%2?'#14161C':'#F2C230')}
    c.fillStyle=dark;[[-10,-1],[10,-1],[0,-6],[0,4]].forEach(function(p){c.beginPath();c.ellipse(x+p[0],y+p[1]-.6,.9,.5,0,0,7);c.fill()});
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.5;hline(c,x-6,y-3.6,x+6,y+2.4)}
  // tracked chassis: two track prisms, the hull between them, a hatch on the right face, intake grille on the left
  var hx=x+1,hy=y-1.2;
  [-1,1].forEach(function(sd){var tx=hx+sd*7.5,ty=hy+sd*3.75;poly(c,[[tx-6,ty],[tx,ty+3],[tx+6,ty],[tx,ty-3]],dark);poly(c,[[tx-6,ty],[tx,ty+3],[tx,ty+3-2.4],[tx-6,ty-2.4]],hmul(dark,.6));poly(c,[[tx,ty+3],[tx+6,ty],[tx+6,ty-2.4],[tx,ty+3-2.4]],hmul(dark,.8));
    if(lod>0){c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=.5;c.beginPath();for(var g=0;g<6;g++){var u=(g+.5)/6;c.moveTo(tx-6+6*u,ty+3*u-2.4);c.lineTo(tx-6+6*u,ty+3*u)}c.stroke()}});
  prismHi(c,hx,hy-2.4,.26,5.5,body,{parapet:false});
  if(lod>0){var hw=TW/2*.26,hh=TH/2*.26,by=hy-2.4,d0=fpt(hx,by,hw,hh,1,.2,1),d1=fpt(hx,by,hw,hh,1,.55,1),d2=fpt(hx,by,hw,hh,1,.55,4.6),d3=fpt(hx,by,hw,hh,1,.2,4.6);
    poly(c,[d0,d1,d2,d3],hmul(body,.72));c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=.5;hline(c,d0[0],d0[1],d3[0],d3[1]);c.fillStyle='#E8C547';var hd=fpt(hx,by,hw,hh,1,.48,2.6);c.fillRect(hd[0]-.4,hd[1]-.4,.8,.8);
    c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=.45;c.beginPath();for(var gr=0;gr<4;gr++){var g0=fpt(hx,by,hw,hh,0,.15,1.6+gr*.8),g1=fpt(hx,by,hw,hh,0,.5,1.6+gr*.8);c.moveTo(g0[0],g0[1]);c.lineTo(g1[0],g1[1])}c.stroke();
    var st=fpt(hx,by,hw,hh,0,.78,2.6);c.fillStyle=Math.floor(t/900+seed)%2&&o.n>0?'#5AD07A':'#2E5A3A';c.beginPath();c.arc(st[0],st[1],.7,0,7);c.fill()}
  // turntable and pivot
  var ty0=hy-2.4-5.5,tx0=hx;c.fillStyle=hmul(steel,.85);c.beginPath();c.ellipse(tx0,ty0+.8,6.2,3.1,0,0,7);c.fill();c.fillStyle=steel;c.beginPath();c.ellipse(tx0,ty0,6.2,3.1,0,0,7);c.fill();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;c.beginPath();c.ellipse(tx0,ty0,4.6,2.3,0,0,7);c.stroke();
  var nx=Math.cos(aim),ny=Math.sin(aim);c.fillStyle=dark;c.beginPath();c.arc(tx0+nx*4.2,ty0+ny*2.1,.7,0,7);c.fill();
  // the rail: a box beam from the pivot along the aim, with the hydraulic ram under it; recoil slides it back along the axis
  var L=17,W=2.6,px=tx0-nx*rc*1.8,py=ty0-2.2-ny*rc*1.8,ex=px+nx*L,ey=py+ny*L,ox=-ny*W/2,oy=nx*W/2;
  c.strokeStyle=dark;c.lineWidth=1.4;c.lineCap='round';hline(c,tx0+2,ty0-.5,px+nx*L*.45-1.5,py+ny*L*.45+1.2);c.strokeStyle=steel;c.lineWidth=.8;hline(c,tx0+2,ty0-.5,px+nx*L*.3,py+ny*L*.3+1);c.lineCap='butt';
  poly(c,[[px+ox,py+oy],[ex+ox,ey+oy],[ex-ox,ey-oy],[px-ox,py-oy]],n?'#4A5160':'#6B7280');poly(c,[[px+ox,py+oy],[ex+ox,ey+oy],[ex+ox,ey+oy+1.6],[px+ox,py+oy+1.6]],n?'#2E333D':'#4A5160');
  if(lod>0){c.strokeStyle='rgba(255,255,255,'+(n?.1:.35)+')';c.lineWidth=.5;hline(c,px-ox,py-oy,ex-ox,ey-oy);c.strokeStyle='rgba(0,0,0,.35)';c.beginPath();for(var r=2;r<L-1;r+=3){c.moveTo(px+nx*r+ox,py+ny*r+oy);c.lineTo(px+nx*r-ox,py+ny*r-oy)}c.stroke();
    c.fillStyle=dark;c.fillRect(px-1.4,py-1.4,2.8,2.8)}
  // the next missile on the rail
  if(o.n>0)missileHi(c,px+nx*9.5-ox*.9,py+ny*9.5-oy*.9,aim,o.size||1,col,0);
  // beacon mast at the back, blinking amber while armed
  var mx=hx-9,my=hy-5;c.strokeStyle=steel;c.lineWidth=.8;hline(c,mx,my,mx,my-9);c.fillStyle=dark;c.fillRect(mx-1,my-10.2,2,1.6);
  var on=o.n>0&&Math.floor(t/450+seed)%4===0;if(on){c.save();c.shadowColor='#FFB347';c.shadowBlur=6;c.fillStyle='#FFC46B';c.beginPath();c.arc(mx,my-9.6,1.1,0,7);c.fill();c.restore()}else{c.fillStyle='#7A5A2A';c.beginPath();c.arc(mx,my-9.6,.9,0,7);c.fill()}
  return {x:ex,y:ey,px:tx0,py:ty0-2.2}}
/** a missile heading along angle a (screen radians): body with a lit top edge, nose cone, fins, a band in the city's colour,
 *  the nozzle, and when boost>0 the exhaust plume (additive). sz 1 = 10 px long */
function missileHi(c,x,y,a,sz,col,boost){var n=hn(),L=10*sz,R=1.5*sz;c.save();c.translate(x,y);c.rotate(a);
  if(boost>0){c.save();c.globalCompositeOperation='lighter';var pl=(6+8*boost)*sz,g=c.createLinearGradient(-L/2,0,-L/2-pl,0);g.addColorStop(0,'rgba(255,250,230,.95)');g.addColorStop(.25,'rgba(255,190,80,.8)');g.addColorStop(.6,'rgba(255,110,40,.35)');g.addColorStop(1,'rgba(255,80,20,0)');c.fillStyle=g;
    c.beginPath();c.moveTo(-L/2,-R*.7);c.lineTo(-L/2-pl,-R*1.6-(rnd(x)*.6));c.lineTo(-L/2-pl*1.15,0);c.lineTo(-L/2-pl,R*1.6+(rnd(y)*.6));c.lineTo(-L/2,R*.7);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(-L/2-1.2*sz,0,2*sz,R*.8,0,0,7);c.fill();c.restore()}
  var bg=c.createLinearGradient(0,-R,0,R);bg.addColorStop(0,n?'#C9CDD4':'#F4F5F7');bg.addColorStop(.5,n?'#9AA1AD':'#D5D9DF');bg.addColorStop(1,n?'#555B68':'#8A9099');
  c.fillStyle='#2A2D35';c.beginPath();c.moveTo(-L/2,-R*1.9);c.lineTo(-L/2+3*sz,-R);c.lineTo(-L/2+3*sz,R);c.lineTo(-L/2,R*1.9);c.closePath();c.fill();   // fins
  c.fillStyle=bg;c.fillRect(-L/2,-R,L,R*2);
  c.fillStyle=n?'#B9BEC8':'#E6E8EC';c.beginPath();c.moveTo(L/2,-R);c.lineTo(L/2+3.2*sz,0);c.lineTo(L/2,R);c.closePath();c.fill();
  c.fillStyle=col;c.fillRect(L/2-3*sz,-R,1.6*sz,R*2);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-L/2-.6*sz,-R*.8,1.4*sz,R*1.6);
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.4;hline(c,-L/2+1,-R*.55,L/2,-R*.55);c.restore()}
/** the missile-count badge, in screen space (css px) so it stays readable at every zoom; hot = flashed on a launch (0..1) */
function badgeHi(c,sx,sy,nLeft,col,hot){var n=hn(),s=String(nLeft),w=22+s.length*6.5,h=15,x=Math.round(sx*dpr)/dpr,y=Math.round(sy*dpr)/dpr;c.save();c.font='600 10px IBM Plex Mono,Menlo,monospace';c.textBaseline='middle';c.textAlign='left';
  c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=4;c.shadowOffsetY=1;c.fillStyle=nLeft>0?'rgba(15,16,22,.94)':'rgba(15,16,22,.7)';c.beginPath();c.roundRect?c.roundRect(x-w/2,y-h/2,w,h,7.5):c.rect(x-w/2,y-h/2,w,h);c.fill();c.shadowColor='transparent';
  c.strokeStyle=hot>0?'rgba(255,255,255,'+(.5+.5*hot)+')':nLeft>0?col:'rgba(255,255,255,.22)';c.lineWidth=1;c.stroke();
  c.save();c.translate(x-w/2+8,y);c.rotate(-.7);c.fillStyle=nLeft>0?'#E6E8EC':'#6B7280';c.fillRect(-3,-1,5,2);c.beginPath();c.moveTo(2,-1.3);c.lineTo(4.2,0);c.lineTo(2,1.3);c.fill();c.fillStyle=col;c.fillRect(.6,-1,1.2,2);c.restore();
  c.fillStyle=nLeft>0?'#F2F2F5':'#8A8E96';if(hot>0){c.save();c.translate(x+2,y);c.scale(1+.25*hot,1+.25*hot);c.fillText(s,-w/2+13,.5);c.restore()}else c.fillText(s,x-w/2+15,y+.5);c.restore()}
/** a trajectory from the launcher tip to the target in screen space: constant ground speed after a short boost, gravity for
 *  the height, so the nose pitches up on the way out and down into the target. f 0..1; returns {x,y,a (heading), boost} */
function bTraj(ax,ay,bx,by,f,hs){var d=Math.hypot(bx-ax,by-ay),H=Math.min(260,70+d*.3)*(hs||1),s=Math.pow(f,1.3),e=1e-3,s2=Math.pow(Math.min(1,f+e),1.3);
  var p=function(u){return [ax+(bx-ax)*u,ay+(by-ay)*u-H*4*u*(1-u)]},P=p(s),Q=p(s2);return {x:P[0],y:P[1],a:Math.atan2(Q[1]-P[1],Q[0]-P[0]),boost:f<.35?1:Math.max(0,1-(f-.35)/.25)}}
// ---- particles (one pool, capped: smoke, debris, sparks, dust, flashes, rings)
var BP=[],BPMAX=260;
function bEmit(p){if(!isFinite(p.x)||!isFinite(p.y))return;if(BP.length>=BPMAX)BP.shift();p.age=0;BP.push(p)}
function bStep(dt){for(var i=BP.length-1;i>=0;i--){var p=BP[i];p.age+=dt;if(p.age>=p.life){BP.splice(i,1);continue}
  if(p.k==='debris'||p.k==='spark'){p.vy+=(p.k==='spark'?90:240)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>p.g){p.y=p.g;p.vy=-p.vy*.35;p.vx*=.6;if(Math.abs(p.vy)<8)p.vy=0}p.rot+=p.vr*dt}
  else{p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.k==='smoke'){p.vx*=(1-.8*dt);p.vy-=14*dt}}}}
function bDrawParticles(c){var n=hn();BP.forEach(function(p){var f=p.age/p.life;
  if(p.k==='smoke'||p.k==='dust'){var r=p.r0+(p.r1-p.r0)*f,al=p.al*(1-f)*(f<.15?f/.15:1),g=c.createRadialGradient(p.x,p.y,r*.15,p.x,p.y,r);g.addColorStop(0,'rgba('+p.col+','+al.toFixed(3)+')');g.addColorStop(1,'rgba('+p.col+',0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r,0,7);c.fill()}
  else if(p.k==='debris'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.col;c.globalAlpha=f>.8?(1-f)/.2:1;c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*.35);c.restore()}
  else if(p.k==='spark'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,'+Math.round(200-120*f)+',80,'+(1-f).toFixed(3)+')';c.lineWidth=.8;hline(c,p.x,p.y,p.x-p.vx*.03,p.y-p.vy*.03);c.restore()}
  else if(p.k==='flash'){c.save();c.globalCompositeOperation='lighter';var rr=p.r0+(p.r1-p.r0)*Math.sqrt(f),g2=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);g2.addColorStop(0,'rgba(255,255,240,'+(.95*(1-f)).toFixed(3)+')');g2.addColorStop(.4,'rgba(255,190,90,'+(.7*(1-f)).toFixed(3)+')');g2.addColorStop(1,'rgba(255,120,40,0)');c.fillStyle=g2;c.beginPath();c.arc(p.x,p.y,rr,0,7);c.fill();c.restore()}
  else if(p.k==='ring'){c.save();c.strokeStyle='rgba(255,230,190,'+(.7*(1-f)).toFixed(3)+')';c.lineWidth=1.2*(1-f)+.3;c.beginPath();c.ellipse(p.x,p.y,p.r1*f+1,(p.r1*f+1)*.5,0,0,7);c.stroke();c.restore()}})}
/** what a hit does to the air: flash, shock ring, debris in the building's colour and grey, sparks, a dust cloud, then smoke */
function bImpactFx(x,y,col,strength){var st=Math.min(1.6,.6+strength);bEmit({k:'flash',x:x,y:y-4,r0:4,r1:26*st,life:.32});bEmit({k:'ring',x:x,y:y,r1:30*st,life:.55});
  var nd=Math.round(8+8*st);for(var k=0;k<nd;k++){var an=rnd(k*3.7+x)*6.283,sp=40+rnd(k+y)*90*st;bEmit({k:'debris',x:x+(rnd(k)-.5)*6,y:y-6,vx:Math.cos(an)*sp,vy:-60-rnd(k*5+.2)*120*st,g:y+2+rnd(k*7)*8,rot:rnd(k)*6,vr:(rnd(k+.3)-.5)*14,s:.9+rnd(k*11)*1.6,col:rnd(k*2+.5)<.45?'#8A8A93':hmul(col,.9),life:1.2+rnd(k)*.8})}
  for(var s=0;s<6;s++){var a2=rnd(s*5+x)*6.283,v=90+rnd(s)*120;bEmit({k:'spark',x:x,y:y-5,vx:Math.cos(a2)*v,vy:-40-rnd(s+.7)*110,g:y+6,rot:0,vr:0,life:.5+rnd(s)*.3})}
  for(var d=0;d<5;d++)bEmit({k:'dust',x:x+(rnd(d*9+x)-.5)*16,y:y-2,vx:(rnd(d+.1)-.5)*14,vy:-4-rnd(d)*6,r0:3,r1:14+rnd(d*3)*10,al:.4,col:hn()?'120,110,100':'170,160,145',life:2.4+rnd(d)*1.2});
  for(var m=0;m<4;m++)bEmit({k:'smoke',x:x+(rnd(m*2+y)-.5)*8,y:y-8-m*3,vx:(rnd(m)-.5)*6,vy:-10-rnd(m*4)*8,r0:2.5,r1:12,al:.45,col:hn()?'80,82,92':'110,110,120',life:2.8+rnd(m)*1.5})}
/** the launch: a puff and sparks at the rail tip, a small flash */
function bLaunchFx(x,y,a){bEmit({k:'flash',x:x,y:y,r0:2,r1:9,life:.2});for(var k=0;k<5;k++)bEmit({k:'smoke',x:x-Math.cos(a)*3,y:y-Math.sin(a)*3,vx:-Math.cos(a)*(18+rnd(k)*18)+(rnd(k*3)-.5)*10,vy:-Math.sin(a)*(10+rnd(k)*10)+(rnd(k*5)-.5)*8,r0:1.5,r1:9,al:.5,col:hn()?'120,122,130':'200,200,205',life:1.4+rnd(k)*.8})}
/** smoke behind a missile in flight (one puff every few frames; the caller rations) */
function bTrailFx(x,y,a,sz){bEmit({k:'smoke',x:x-Math.cos(a)*6*sz,y:y-Math.sin(a)*6*sz,vx:(rnd(x)-.5)*6,vy:(rnd(y)-.5)*4-3,r0:.9*sz,r1:5*sz,al:.42,col:hn()?'130,132,140':'225,225,230',life:1.1+rnd(x+y)*.5})}
/** a shield taking a shot: the dome lights, sparks run off it, no damage */
function bShieldFx(x,y,col){bEmit({k:'flash',x:x,y:y,r0:3,r1:18,life:.3});for(var k=0;k<8;k++){var an=rnd(k*4+x)*6.283;bEmit({k:'spark',x:x,y:y,vx:Math.cos(an)*120,vy:Math.sin(an)*60-30,g:y+40,rot:0,vr:0,life:.45})}}
// ---- the repair crews: a worker with a leg and arm cycle, a hard hat, hi-vis, boots, and a tool for the job
/** o:{t (ms), mode:'walk'|'carry'|'hammer'|'climb'|'drill'|'stand', dir (1 faces right, -1 left), col (material), seed} */
function workerHi(c,x,y,o){var s=1.15,t=(o.t||0)/1000,seed=o.seed||0,dir=o.dir||1,m=o.mode||'stand',n=hn(),ph=t*5.2+seed,walk=m==='walk'||m==='carry';
  var bob=walk?Math.abs(Math.sin(ph))*.55:0,hip=y-4.3*s-bob,sh=y-8.6*s-bob,skin='#E8C9A8',vest='#FF7A30',band='rgba(240,240,200,.95)',pants='#2A2D35',boot='#3A2E22';
  c.fillStyle='rgba(0,0,0,'+(n?.3:.22)+')';c.beginPath();c.ellipse(x+1,y+.6,3.2*s,1.3*s,0,0,7);c.fill();
  function leg(phase,front){var a=walk?Math.sin(phase)*.42:m==='climb'?-.5+.5*Math.max(0,Math.sin(phase)):0,kb=walk?Math.max(0,-Math.sin(phase))*.8:m==='climb'?.9*Math.max(0,Math.sin(phase)):.05,th=2.4*s,sn=2.2*s;
    var kx=x+Math.sin(a)*th*dir,ky=hip+Math.cos(a)*th,fx=kx+Math.sin(a-kb)*sn*dir,fy=ky+Math.cos(a-kb)*sn;if(m==='climb'){fy=Math.min(fy,y);}else fy=Math.min(fy,y+.2);
    c.strokeStyle=front?pants:hmul(pants,.7);c.lineCap='round';c.lineWidth=1.35*s;c.beginPath();c.moveTo(x,hip);c.lineTo(kx,ky);c.lineTo(fx,fy);c.stroke();c.fillStyle=boot;c.fillRect(fx-1.1*s,fy-.8,2.4*s,1.1);c.lineCap='butt'}
  function arm(phase,front,tool){var a0=walk&&m==='walk'?-Math.sin(phase)*.55:0,up=2.2*s,fo=2*s,ex,ey,wx,wy;
    if(m==='carry'){ex=x+dir*1.4*s;ey=sh-1.2*s;wx=x+dir*2.6*s;wy=sh-3.4*s}
    else if(m==='hammer'){var cyc=(t*1.3+seed)%1,sw=cyc<.45?cyc/.45:cyc<.6?1-(cyc-.45)/.15:0,ang=-.3-1.9*sw;ex=x+dir*Math.cos(ang)*up;ey=sh+Math.sin(ang)*up;wx=ex+dir*Math.cos(ang-.4)*fo;wy=ey+Math.sin(ang-.4)*fo}
    else if(m==='climb'){var r=Math.max(0,Math.sin(phase));ex=x+dir*.6*s;ey=sh-1.6*s-r*1.2;wx=x+dir*1.1*s;wy=ey-2*s}
    else if(m==='drill'){var pu=Math.sin(t*14+seed)*.4;ex=x+dir*1.2*s;ey=sh+1.4*s;wx=x+dir*(2.6+pu)*s;wy=sh+2.6*s}
    else{ex=x+Math.sin(a0)*up*dir*.3+dir*.5;ey=sh+Math.cos(a0)*up;wx=ex+Math.sin(a0)*fo*dir*.5;wy=ey+Math.cos(a0)*fo*.9}
    c.strokeStyle=front?vest:hmul(vest,.7);c.lineCap='round';c.lineWidth=1.2*s;c.beginPath();c.moveTo(x+dir*(front?.9:-.9)*s,sh+.4);c.lineTo(ex,ey);c.lineTo(wx,wy);c.stroke();c.strokeStyle='#E8C547';c.lineWidth=1.3*s;hline(c,wx,wy,wx+dir*.01,wy);c.lineCap='butt';return [wx,wy]}
  var back=!(dir>0);leg(ph+Math.PI,false);if(m!=='climb')arm(ph+Math.PI,false,false);
  c.fillStyle=vest;c.fillRect(x-2*s,sh,4*s,4.6*s);c.fillStyle=band;c.fillRect(x-2*s,sh+1.4*s,4*s,.7*s);c.fillRect(x-2*s,sh+3*s,4*s,.7*s);
  if(m==='climb'){c.strokeStyle=band;c.lineWidth=.6;hline(c,x-1.6*s,sh+.3,x+1.6*s,sh+4.2*s);hline(c,x+1.6*s,sh+.3,x-1.6*s,sh+4.2*s)}
  leg(ph,true);
  c.fillStyle=skin;c.beginPath();c.arc(x,sh-2.1*s,1.7*s,0,7);c.fill();c.fillStyle='#F2D24A';c.beginPath();c.arc(x,sh-2.6*s,1.95*s,Math.PI,0);c.fill();c.fillRect(x-2.5*s,sh-2.7*s,5*s,.8*s);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x-.6*s,sh-4.2*s,1.1*s,.5*s);
  var w=arm(ph,true,true);
  if(m==='hammer'){c.strokeStyle='#8B6A48';c.lineWidth=.7;var hx2=w[0]+dir*2.2,hy2=w[1]-2.4;hline(c,w[0],w[1],hx2,hy2);c.fillStyle='#9AA1AD';c.save();c.translate(hx2,hy2);c.rotate(dir*.6);c.fillRect(-1.6,-.9,3.2,1.8);c.restore();
    var cyc2=(t*1.3+seed)%1;if(cyc2>=.58&&cyc2<.64&&!reduce){c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,230,160,.9)';for(var k=0;k<3;k++){c.beginPath();c.arc(hx2+(rnd(k+t)-.5)*4,hy2+(rnd(k*2+t)-.5)*3,.5,0,7);c.fill()}c.restore()}}
  if(m==='carry'){var pc=o.col&&o.col.charAt(0)==='#'?o.col:'#C9A96E';c.save();c.translate(w[0],w[1]-.6);c.rotate(-dir*.22);c.fillStyle=hmul(pc,.85);c.fillRect(-5*s,-1.1*s,10*s,2*s);c.fillStyle=mix(pc,1.15);c.fillRect(-5*s,-1.1*s,10*s,.6*s);c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.3;c.strokeRect(-5*s,-1.1*s,10*s,2*s);c.restore()}
  if(m==='drill'){c.fillStyle='#E8C547';c.fillRect(w[0]-1.2,w[1]-1.6,3.2,2.2);c.fillStyle='#2A2D35';c.fillRect(w[0]+2,w[1]-.9,2.6,.8);c.fillRect(w[0]-.4,w[1]+.6,1.2,1.8)}
  if(m==='stand'){c.fillStyle='#F4F1EA';c.fillRect(w[0]-.6,w[1]-2.6,2.2*s,2.8*s);c.strokeStyle='#3A3D47';c.lineWidth=.35;hline(c,w[0]-.2,w[1]-1.8,w[0]+1.4,w[1]-1.8);hline(c,w[0]-.2,w[1]-1,w[0]+1.4,w[1]-1)}}
/** a work van at the kerb (never on a roof), on the iso grid: a white box body, a lower cab with a windscreen, a stripe in the
 *  city's colour, a roof rack with a ladder, an amber light, four wheels */
function vanHi(c,x,y,col){var n=hn(),body=n?'#8A8E96':'#F2F2F5',w=.24,hw=TW/2*w,hh=TH/2*w,H=8;
  c.fillStyle='rgba(0,0,0,'+(n?.35:.28)+')';c.beginPath();c.ellipse(x+2,y+2,hw*1.5,hh*1.5,0,0,7);c.fill();
  c.fillStyle='#14161C';[[-hw*.75,hh*.1],[-hw*.2,hh*.62],[hw*.75,hh*.1],[hw*.2,hh*.62]].forEach(function(p){c.beginPath();c.ellipse(x+p[0],y+p[1]+.6,1.5,.9,0,0,7);c.fill()});
  prismHi(c,x,y-1.6,w,H,body,{parapet:false});
  var s0=fpt(x,y-1.6,hw,hh,0,.05,3.2),s1=fpt(x,y-1.6,hw,hh,0,.95,3.2),s2=fpt(x,y-1.6,hw,hh,0,.95,4.6),s3=fpt(x,y-1.6,hw,hh,0,.05,4.6);poly(c,[s0,s1,s2,s3],col);
  var r0=fpt(x,y-1.6,hw,hh,1,.05,3.2),r1=fpt(x,y-1.6,hw,hh,1,.95,3.2),r2=fpt(x,y-1.6,hw,hh,1,.95,4.6),r3=fpt(x,y-1.6,hw,hh,1,.05,4.6);poly(c,[r0,r1,r2,r3],hmul(col,.8));
  var d0=fpt(x,y-1.6,hw,hh,1,.55,1),d1=fpt(x,y-1.6,hw,hh,1,.95,1),d2=fpt(x,y-1.6,hw,hh,1,.95,H-1.2),d3=fpt(x,y-1.6,hw,hh,1,.55,H-1.2);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;poly(c,[d0,d1,d2,d3]);c.stroke();
  var w0=fpt(x,y-1.6,hw,hh,0,.08,H-1.2),w1=fpt(x,y-1.6,hw,hh,0,.42,H-1.2),w2=fpt(x,y-1.6,hw,hh,0,.42,H-4.4),w3=fpt(x,y-1.6,hw,hh,0,.08,H-4.4);poly(c,[w0,w1,w2,w3],n?'#1A2338':'#6F93C0');
  c.fillStyle='rgba(255,255,255,.45)';var g0=fpt(x,y-1.6,hw,hh,0,.12,H-1.6);c.fillRect(g0[0],g0[1],1.6,.6);
  var ty=y-1.6-H,a=tpt(x,ty,hw,hh,-.8,-.4),b=tpt(x,ty,hw,hh,.8,-.4),a2=tpt(x,ty,hw,hh,-.8,.4),b2=tpt(x,ty,hw,hh,.8,.4);c.strokeStyle=n?'#6B7280':'#8A9099';c.lineWidth=.7;hline(c,a[0],a[1]-1.2,b[0],b[1]-1.2);hline(c,a2[0],a2[1]-1.2,b2[0],b2[1]-1.2);
  c.strokeStyle='#C9A96E';c.lineWidth=.9;hline(c,a[0]+2,a[1]-1.9,b[0]-2,b[1]-1.9);hline(c,a2[0]+2,a2[1]-1.9,b2[0]-2,b2[1]-1.9);c.strokeStyle='#A8875A';c.lineWidth=.5;c.beginPath();for(var k=0;k<5;k++){var f=.15+k*.175,px=a[0]+(b[0]-a[0])*f,py=a[1]+(b[1]-a[1])*f,qx=a2[0]+(b2[0]-a2[0])*f,qy=a2[1]+(b2[1]-a2[1])*f;c.moveTo(px,py-1.9);c.lineTo(qx,qy-1.9)}c.stroke();
  var lt=tpt(x,ty,hw,hh,0,-.85);c.fillStyle=Math.floor((reduce?0:T)/500)%2?'#FFC46B':'#8A6A2A';c.fillRect(lt[0]-.9,lt[1]-1.6,1.8,1.2)}
/** a lumber stack by the site */
function lumberHi(c,x,y,col){var n=hn();for(var r=0;r<3;r++)for(var k=0;k<3-r;k++){var bx=x-6+k*4.2+r*2.1,by=y-r*2;c.fillStyle=n?'#6B5137':'#C9A96E';c.fillRect(bx,by-1.8,4,1.8);c.fillStyle=n?'#8A6A48':'#E0C48A';c.fillRect(bx,by-2.4,4,.7);c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.3;c.strokeRect(bx,by-2.4,4,2.4)}
  c.fillStyle=col;c.fillRect(x-7,y-7.2,9,1.2)}
`;

/** the clock-driven battle and the API */
export const BATTLE_LOGIC_JS = String.raw`
// ---- battle day (citybattle.ts BATTLE_DRAW_JS): the clock-driven battle. Mike 2026-11-07: "each plot of land has a missile
// launcher ... they launch throughout the day ... between midnight and noon the city rebuilds with workers ... noon until
// midnight the cities fire". State is a pure function of the viewer's local clock and the night's shot list.
var BON=false,BDATA=window.CALDERA_BATTLE||null,BL={damage:true,attacks:true,shields:true},BHITS={},BPLAN=null,BFL=[],BLAST=0,BQ=-1,BLAUNCH={},BREPLAYING=false;
var BDAY=864e5,BHALF=432e5,BSZ={orbital:1.3,beam:1.1,cannon:.95,catapult:.8};
function bNow(){return Date.now()}
function bRedraw(){if(reduce)setTimeout(draw,0);else draw()}
function bNoonOf(t){var d=new Date(t);d.setHours(12,0,0,0);return d.getTime()}
/** the night the hub resolved inside (noon - 24h, noon]: it fires that afternoon and is repaired the next morning */
function bPick(noon){var c=[];if(BDATA&&BDATA.t0!=null)c.push({t0:BDATA.t0,shots:BDATA.shots||[],key:BDATA.night||''});if(BDATA&&BDATA.prev&&BDATA.prev.t0!=null)c.push({t0:BDATA.prev.t0,shots:BDATA.prev.shots||[],key:BDATA.prev.night||'p'});
  for(var i=0;i<c.length;i++)if(c[i].t0>noon-BDAY&&c[i].t0<=noon)return c[i];return null}
/** today's plan: phase, the window, and every shot of the day with its launch time (spread evenly per city, with a few
 *  minutes of jitter per city so the map never fires in lockstep). Rebuilt when the window or the data changes. */
function bPlan(now){var noon=bNoonOf(now),fire=now>=noon,dayNoon=fire?noon:noon-BDAY,src=bPick(dayNoon),sig=dayNoon+'|'+(src?src.key+':'+src.shots.length:'-');
  if(BPLAN&&BPLAN.sig===sig){BPLAN.fire=fire;return BPLAN}
  var byA={},shots=[];(src?src.shots:[]).forEach(function(s,ix){var a=s[0];if(!byA[a])byA[a]=[];byA[a].push({ix:ix,a:a,d:s[1],w:s[2],f:s[3],lot:s[5],blocked:s[6],land:null,seen:false})});
  for(var a in byA){var L=byA[a],n=L.length;L.forEach(function(s,i){s.t=dayNoon+BHALF*(i+.5)/n+(rnd(hash(a)+i*7.3)-.5)*72e4;s.t=Math.max(dayNoon+9e4,Math.min(dayNoon+BHALF-18e4,s.t));shots.push(s)})}
  shots.sort(function(p,q){return p.t-q.t});
  BHITS={};shots.forEach(function(s){if(s.f<=0||s.lot<0)return;if(!BHITS[s.d])BHITS[s.d]={};if(!BHITS[s.d][s.lot])BHITS[s.d][s.lot]=[];BHITS[s.d][s.lot].push(s)});
  var up=null;if(!fire){var nx=bPick(noon);if(nx&&(!src||nx.key!==src.key)){up={};nx.shots.forEach(function(s){up[s[0]]=(up[s[0]]||0)+1})}}
  BPLAN={sig:sig,fire:fire,dayNoon:dayNoon,start:fire?dayNoon:dayNoon+BHALF,end:fire?dayNoon+BHALF:dayNoon+BDAY,shots:shots,byA:byA,up:up,night:src?src.key:''};BFL=[];BQ=-1;BLAST=0;return BPLAN}
function bIndex(){BPLAN=null;if(BON)bPlan(bNow())}
bIndex();
/** damage showing on one lot, in sixths: by day each landed hit adds its facades; by night they shrink linearly to zero by noon */
function bDmg(key,li){if(!BON||!BL.damage||!BPLAN)return 0;var o=BHITS[key];if(!o||!o[li])return 0;var s=0,now=bNow();
  if(BPLAN.fire)o[li].forEach(function(h){if(h.land!=null&&h.land<=now)s+=h.f});else{var rp=Math.max(0,Math.min(1,(now-BPLAN.start)/BHALF));o[li].forEach(function(h){s+=h.f*(1-rp)})}
  return Math.round(s*6)/6}
function bCenter(key){var g=GM[key];if(!g||!g.b)return null;var S=(g.cs||gState(g)).side;return iso(g.b.x+S/2-.5,g.b.y+S/2-.5)}
function bLotXY(key,li){var g=GM[key];if(!g||!g.b)return null;var ab=gXY(li);return iso(g.b.x+ab[0],g.b.y+ab[1])}
/** the launcher stands on the plot's front corner: the surveyed row beyond the road ring, in front of every lot */
function bPad(key){var g=GM[key];if(!g||!g.b)return null;var S=(g.cs||gState(g)).side,k=Math.min(S+1,g.b.k-1);return iso(g.b.x+k,g.b.y+k)}
function bSea(key){var c=bCenter(key);return c?{x:c.x-260,y:c.y-150}:null}
function bTarget(s){if(s.d.charAt(0)!=='@')return bSea(s.a);var p=s.lot>=0?bLotXY(s.d,s.lot):null;if(!p)p=bCenter(s.d);return p?{x:p.x+2,y:p.y-4}:null}
function bRgba(hx,a){var n=parseInt(hx.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function bShieldDome(c,x,y,rx,col,a){c.save();c.globalCompositeOperation='lighter';var gr=c.createRadialGradient(x,y-rx*.3,rx*.2,x,y-rx*.3,rx);gr.addColorStop(0,bRgba(col,0));gr.addColorStop(.85,bRgba(col,a*.5));gr.addColorStop(1,bRgba(col,a));c.fillStyle=gr;c.beginPath();c.ellipse(x,y-rx*.3,rx,rx*.75,0,0,7);c.fill();
  c.strokeStyle=bRgba(col,Math.min(1,a+.2));c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx,rx*.5,0,Math.PI,0);c.stroke();c.restore()}
function bCol(key){var g=GM[key];return g?gLang(g):'#8B6CF6'}
/** start a missile: from the launcher's rail tip to the target; quick = a catch-up or replay flight (0.6 to 0.9 s) */
function bFly(s,quick,delay){var from=bPad(s.a.charAt(0)==='@'?s.a:'')||(s.a.charAt(0)!=='@'?bSea(s.d):null),to=bTarget(s);if(!from||!to){s.land=bNow();return}
  var tip={x:from.x+10,y:from.y-26},d=Math.hypot(to.x-tip.x,to.y-tip.y),dur=quick?quick:2500+Math.min(1500,d*3.5);
  BFL.push({s:s,t0:performance.now()+(delay||0),dur:dur,from:tip,to:to,A:s.a,quick:!!quick,lit:false});BLAUNCH[s.a]=performance.now()+(delay||0)}
function bLand(fl){var s=fl.s;s.land=bNow();if(s.d.charAt(0)!=='@'){bEmit({k:'ring',x:fl.to.x,y:fl.to.y,r1:22,life:.6});for(var k=0;k<5;k++)bEmit({k:'dust',x:fl.to.x,y:fl.to.y,vx:(rnd(k)-.5)*20,vy:-10,r0:2,r1:10,al:.5,col:'200,220,240',life:1.2});return}
  if(s.f>0&&s.lot>=0&&!reduce)bImpactFx(fl.to.x,fl.to.y+4,bCol(s.d),s.f);else if(!reduce){var ctr=bCenter(s.d);bShieldFx(ctr?ctr.x:fl.to.x,(ctr?ctr.y:fl.to.y)-30,'#3DF2FF')}
  if(s.f>0&&s.lot>=0)bRedraw()}
/** the clock: launches due now, the catch-up after a throttled tab, the repair steps that redraw the cache */
function bClock(now){var P=bPlan(now);if(P.fire&&!reduce){var gap=BLAST?now-BLAST:0,catchUp=gap>9e4,nq=0;
    P.shots.forEach(function(s){if(s.t>now||s.land!=null||s.seen)return;s.seen=true;var inFlight=BFL.some(function(f){return f.s===s});if(inFlight)return;
      if(!BLAST)s.land=s.t+3500;else if(now-s.t<6e3)bFly(s);else if(catchUp&&nq<14)bFly(s,600,nq++*120);else s.land=s.t+3500})}
  else if(P.fire)P.shots.forEach(function(s){if(s.t<=now&&s.land==null){s.land=s.t;s.seen=true;bRedraw()}});
  BLAST=now;
  var q=P.fire?-1:Math.floor(Math.max(0,Math.min(1,(now-P.start)/BHALF))*6);if(q!==BQ){var first=BQ<0;BQ=q;if(!first)bRedraw()}}
/** over the map, every frame: shields, launchers with their counts, missiles in flight, particles, the crews by night */
function battleOver(){if(!BON||!BDATA||typeof GM==='undefined')return;var c=cx,tn=performance.now(),now=bNow(),P=bPlan(now);bClock(now);var dt=0;if(battleOver.tp)dt=Math.min(.05,(tn-battleOver.tp)/1000);battleOver.tp=tn;
  c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var M=BDATA.members||{},vb=hView(TH*3),inView=function(p){return p&&p.x>vb[0]-40&&p.x<vb[1]+40&&p.y>vb[2]-40&&p.y<vb[3]+80};
  if(BL.shields)for(var k in M){var ctr=bCenter(k),g=GM[k];if(!ctr||!g||!inView(ctr))continue;var S=(g.cs||gState(g)).side,sh=M[k].sh||0;if(sh<=0)continue;bShieldDome(c,ctr.x,ctr.y+8,S*TW*.42+20,M[k].beg?'#FFFFFF':'#3DF2FF',M[k].beg?.12:.08+.22*sh)}
  // launchers: one per city in the battles, aimed at its next (or last) target, recoiling for 900 ms after a launch
  var badges=[];if(BL.attacks)for(var h in M){var pad=bPad(h);if(!pad||!inView(pad))continue;var L=P.byA[h]||[],left=0,nxt=null,lastS=null;L.forEach(function(s){if(s.t>now)left++;if(s.t>now&&!nxt)nxt=s;if(s.t<=now)lastS=s});
    var count=P.fire?left:(P.up?P.up[h]||0:(M[h].shots||0)),tg=(nxt||lastS)?bTarget(nxt||lastS):null,aim=-.95;if(tg)aim=bTraj(pad.x+10,pad.y-26,tg.x,tg.y,0).a;
    var la=BLAUNCH[h]||0,rc=la?Math.max(0,Math.min(1,1-(tn-la)/900)):0,col=bCol(h),w=(nxt||lastS)?(nxt||lastS).w:M[h].best;
    launcherHi(c,pad.x,pad.y,{col:col,seed:hash(h),n:count,aim:aim,recoil:rc,t:reduce?0:tn,lod:LODN,size:BSZ[w]||1});badges.push([pad.x+30,pad.y-38,count,col,rc])}
  // missiles in flight (the launch puff on the first frame, a smoke puff every other frame, the hit when they land)
  for(var i=BFL.length-1;i>=0;i--){var fl=BFL[i];if(tn<fl.t0)continue;var fr=(tn-fl.t0)/fl.dur;if(!fl.lit){fl.lit=true;BLAUNCH[fl.A]=tn;if(!fl.quick||BFL.length<6)bLaunchFx(fl.from.x,fl.from.y,bTraj(fl.from.x,fl.from.y,fl.to.x,fl.to.y,0).a)}
    if(fr>=1){BFL.splice(i,1);bLand(fl);continue}if(!BL.attacks)continue;var tr=bTraj(fl.from.x,fl.from.y,fl.to.x,fl.to.y,fr),sz=BSZ[fl.s.w]||1;missileHi(c,tr.x,tr.y,tr.a,sz,bCol(fl.A),tr.boost);if(Math.floor(tn/50)%2===0&&BP.length<BPMAX-30&&!fl.quick)bTrailFx(tr.x,tr.y,tr.a,sz)}
  if(dt>0)bStep(dt);bDrawParticles(c);
  // damage: smoke columns by day on badly hit lots (at most 6 in view); crews by night on the damaged lots nearest the centre (at most 8)
  if(BL.damage){var nSm=0,sites=[],cxw=(vw/2-cam.x)/cam.z,cyw=(vh/2-cam.y)/cam.z;for(var hk in BHITS){var lots=BHITS[hk];for(var li in lots){var d=bDmg(hk,+li);if(d<=0)continue;var q=bLotXY(hk,+li);if(!q||!inView(q))continue;
      if(P.fire){if(d>=.5&&nSm<6){nSm++;smokeHi(c,q.x+4,q.y-26,d>=1)}}else sites.push({q:q,d:d,key:hk,li:+li,dist:Math.hypot(q.x-cxw,q.y-cyw)})}}
    if(sites.length&&LODN>0){sites.sort(function(a,b){return a.dist-b.dist});sites.slice(0,8).forEach(function(st){bCrew(c,st,tn)})}}
  // the counts, in screen space so they read at every zoom
  c.setTransform(dpr,0,0,dpr,0,0);badges.forEach(function(b){badgeHi(c,cam.x+b[0]*cam.z,cam.y+b[1]*cam.z,b[2],b[3],b[4])})}
/** one crew: the van and lumber at the lot's front, a carrier walking between the stack and the wall, a hammer at the hit
 *  face, a climber on the scaffold while the tier is down, a driller once it is back */
function bCrew(c,st,tn){var q=st.q,col=bCol(st.key),seed=hash(st.key)+st.li*7,t=reduce?seed*1000:tn,g=GM[st.key],cd=g&&g.cs?g.cs.codes[st.li]||0:4;
  lumberHi(c,q.x-30,q.y+14,col);vanHi(c,q.x+16,q.y+34,col);
  var cyc=((t/1000)*.5+seed)%2,wx=cyc<1?-28+40*cyc:12-40*(cyc-1);workerHi(c,q.x+wx,q.y+12,{t:t,mode:'carry',dir:cyc<1?1:-1,col:'#C9A96E',seed:seed});
  workerHi(c,q.x+18,q.y+2,{t:t,mode:'hammer',dir:-1,seed:seed+1});
  if(st.d>=.5&&cd>=5){var hgt=cd===6?60:cd===5?30:12,cl=((t/1000)*.25+seed*.1)%1;workerHi(c,q.x+12,q.y+13-(hgt-8)*cl,{t:t,mode:'climb',dir:1,seed:seed+2})}
  else workerHi(c,q.x-10,q.y-4,{t:t,mode:'drill',dir:1,seed:seed+3})}
/** the world card's battle lines */
function battleCard(key){if(!BON||!BDATA)return '';var m=(BDATA.members||{})[key];
  if(!m)return '<div class="c-grow"><div class="row"><span>Battles</span><b>Peaceful zone</b></div></div>';
  var P=bPlan(bNow()),now=bNow(),mine=P.byA[key]||[],fired=mine.filter(function(s){return s.t<=now}).length,took=0,open=0;for(var li in (BHITS[key]||{})){(BHITS[key][li]||[]).forEach(function(h){took+=h.f});open+=bDmg(key,+li)}
  var wn={orbital:'orbital',beam:'beam',cannon:'cannon',catapult:'catapult'}[m.best]||'catapult';
  return '<div class="c-grow"><div class="row"><span>Shield</span><b>'+Math.round((m.sh||0)*100)+'%'+(m.beg?' (beginner)':'')+'</b></div>'
    +(P.fire?'<div class="row"><span>Today</span><b>'+fired+' of '+mine.length+' missile'+(mine.length===1?'':'s')+' fired</b></div>':'<div class="row"><span>At noon</span><b>'+(P.up?P.up[key]||0:m.shots)+' missile'+((P.up?P.up[key]||0:m.shots)===1?'':'s')+' ('+e(wn)+')</b></div>')
    +(took>0?'<div class="row"><span>'+(P.fire?'Hits taken':'Rebuilding')+'</span><b>'+(P.fire?Math.round(took*10)/10+' facade'+(took===1?'':'s'):Math.round(100*(1-open/Math.max(took,.01)))+'% done, whole by noon')+'</b></div>':'')+'</div>'}
window.CALDERA_BATTLE_API={
  view:function(on,data){BON=!!on;if(data)BDATA=data;bIndex();if(!on){BFL=[];BP.length=0}draw()},
  layers:function(o){for(var k in o)if(k in BL)BL[k]=!!o[k];draw()},
  /** play today's launches so far again, quickly (8 s for all of them); nothing to replay by night */
  replay:function(){var P=bPlan(bNow()),now=bNow();if(!P.fire)return 0;var due=P.shots.filter(function(s){return s.t<=now});BFL=[];due.forEach(function(s,i){s.land=null;s.seen=true;bFly(s,900,i*Math.min(400,8000/Math.max(1,due.length)))});draw();return due.length},
  fly:function(h){return window.CALDERA_GROWTH_API&&window.CALDERA_GROWTH_API.plot?window.CALDERA_GROWTH_API.plot(h,1.3):false},
  phase:function(){var now=bNow(),P=bPlan(now),fired=0,landed=0;P.shots.forEach(function(s){if(s.t<=now)fired++;if(s.land!=null&&s.land<=now)landed++});return {fire:P.fire,until:P.end,start:P.start,total:P.shots.length,fired:fired,landed:landed,night:P.night,flights:BFL.length}},
  state:function(){return {on:BON,layers:BL,phase:this.phase(),cities:BDATA&&BDATA.members?Object.keys(BDATA.members).length:0}},
  dmg:function(h,li){return bDmg(h,li)}};
`;

export const BATTLE_DRAW_JS = BATTLE_ART_JS + BATTLE_LOGIC_JS;
