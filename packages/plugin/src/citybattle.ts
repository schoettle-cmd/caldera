/**
 * The World's Battle view (caldera.social/world?view=battle), inside the city renderer (city.ts CITY_JS), on top of the growth
 * plots (citygrowth.ts). Mike 2026-11-07 (design r-caldera-battle-248d7d19): "Put a plot of land in front of each of the
 * building sites. When we hit replay, show from the sky missiles dropping down and stacking as ammunition for each of those
 * plots of land. Then one by one, the missiles move to their launch centers. In three, two, one, the missiles launch all at
 * the same time across the entire battle plane. And then they actually destroy ... certain buildings that have already been
 * created that represent the people's GitHub. And then cranes appear, and they rebuild up the buildings ... the buildings
 * return to their original state."
 *
 * One daily salvo on the viewer's local clock: the night the hub resolved (02:00 Pacific) inside (noon - 24h, noon] drops
 * from the sky at 12:00 and stacks on each city's ammo pad (one missile per shot), loads one by one into the launch center
 * through the afternoon, counts down and fires in one salvo at 20:00, the hits hold on the real repo towers until midnight,
 * and cranes with scaffolding rebuild them from 00:00 to 12:00, whole by noon. Replay (Mike 11-08: "zooms into the first
 * strike ... we follow the missiles tracing into the damage ... the camera resets to the next city ... trailing smoke behind
 * each one of the individual missiles") is cinematic on a virtual clock: one strike beat per launching city (most missiles
 * first, raiders from the sea last, each beat under 10 s: the camera eases to the pad, the pod fires, the camera follows the
 * lead missile into the hit and holds), then a wide shot with every smoke ribbon, the cranes in time-lapse, and the camera
 * flies home; 35 to 100 s in all at 1x, about 60 s for the demo (2.5x slower than the first cut, Mike 11-08: "moves too fast"; 0.5x / 1x / 2x, pause, prev / next, and the viewer's own camera with Fit and Follow). 'demo' replays a sample battle between the biggest cities. State is derived from the clock and the shot list: a page opened at 16:00 shows the stacks half loaded, at
 * 21:00 the damage, at 09:00 the cranes three quarters done. Effects (puffs, flashes, debris) fire only for moments that pass
 * while the page is watching. Moving layer: pads, stacks, drops, launchers, missiles, particles, smoke, badges, countdown.
 * Cache (drawObjects): a hit tower is drawn shorter with a ruined cap and scorch, redrawn only when its damage step changes.
 * Data: window.CALDERA_BATTLE (the hub's /v1/world/battle: shots of the last night, prev = the night before). The page drives
 * it through window.CALDERA_BATTLE_API. Runs inside the CITY_JS closure after GROWTH_DRAW_JS: GM, gState, gLang, tiles, W, H,
 * bh, iso, poly, rnd, hash, cam, dpr, cx, vw, vh, T, reduce, sky, mix, e, draw, cranes and the cityhifi set are in scope.
 */
/** the battle art, as drawn on the design page (battle-art.js there, verbatim) */
export const BATTLE_ART_JS = String.raw`
// ---- battle art (citybattle.ts BATTLE_ART_JS). Mike 2026-11-07: an ammo plot in front of each building site, missiles
// dropping from the sky and stacking, loading one by one into the launch center, "3, 2, 1", one salvo across the whole
// plane, hits on the real GitHub buildings, then cranes rebuilding floor by floor until everything is as it was. Pixel-level
// detail, realistic motion. World units (TW=64, TH=32), drawn with the camera transform set, so every stroke lands at the
// canvas DPR. Needs from cityhifi: hn, hmul, hRgba, hline, poly, mix, rnd, prismHi, pdia, tpt, fpt, NL, NR, LODN, smokeHi,
// scorchHi, rubbleHi, scaffoldHi.
var BIX=.894,BIY=.447;                                       // the iso left axis (unit vector on screen)
function bLerp(a,b,f){return a+(b-a)*f}
function bEase(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)}
// ---- the schedule of one battle day. live: D is the viewer's local noon in ms; replay: D is the virtual start (0)
var BHALF=432e5,BDAY=864e5;
function bSchedule(D,live){if(live)return {D:D,live:true,drop:D+1500,dropStep:350,fall:4000,load0:D+9e5,load1:D+288e5-9e5,loadDur:1400,count:D+288e5-3000,salvo:D+288e5,ripple:70,hold:D+BHALF,end:D+BDAY};
  return {D:D,live:false,drop:D+300,dropStep:230,fall:2600,load0:D+4300,load1:D+8600,loadDur:520,count:D+8900,salvo:D+11900,ripple:70,hold:D+17800,end:D+25800}}
/** per-missile moments (k of n): the drop starts and lands, loading starts, the tube fires */
function bDropAt(S,k){return S.drop+k*S.dropStep}
function bLandAt(S,k){return bDropAt(S,k)+S.fall}
function bLoadAt(S,k,n){return S.load0+(S.load1-S.load0)*(k+.5)/Math.max(1,n)}
function bFireAt(S,k){return S.salvo+(k%12)*S.ripple+Math.floor(k/12)*2200}
/** which segment the clock is in (for the chip): supply, loading, countdown, salvo, damage, rebuild, idle */
function bSegment(S,now){if(now<S.drop)return 'idle';if(now<S.load0)return 'supply';if(now<S.count)return 'loading';if(now<S.salvo)return 'countdown';if(now<S.salvo+4000)return 'salvo';if(now<S.hold)return 'damage';if(now<S.end)return 'rebuild';return 'idle'}
/** the damage one hit shows at now: full from its impact until the hold ends, then down to nothing by the end */
function bHitDmg(S,f,impact,now){if(now<impact)return 0;if(now<S.hold)return f;if(now>=S.end)return 0;return f*(1-(now-S.hold)/(S.end-S.hold))}
// ---- the ammo pad: a paved plot in front of the building site. Stack on the left half, launch center on the right
function padHi(c,x,y,o){var n=hn(),lod=o&&o.lod!=null?o.lod:LODN,col=o&&o.col||'#8B6CF6',s=1.35,hw=TW/2*s,hh=TH/2*s,q=[[x,y-hh],[x+hw,y],[x,y+hh],[x-hw,y]];
  c.fillStyle='rgba(0,0,0,'+(n?.3:.2)+')';c.beginPath();c.ellipse(x+6,y+4,hw*1.05,hh*1.1,0,0,7);c.fill();
  poly(c,[q[3],q[2],[q[2][0],q[2][1]+2.6],[q[3][0],q[3][1]+2.6]],n?'#262A33':'#6E747E');poly(c,[q[2],q[1],[q[1][0],q[1][1]+2.6],[q[2][0],q[2][1]+2.6]],n?'#1E2129':'#585E68');
  poly(c,q,n?'#3C414B':'#9CA2AC');poly(c,pdia(x,y-.5,s*.94),n?'#444953':'#A8AEB7');
  if(lod===0)return;
  c.strokeStyle='rgba(0,0,0,'+(n?.3:.14)+')';c.lineWidth=.5;c.beginPath();for(var k=1;k<4;k++){var f=k/4;c.moveTo(q[3][0]+(q[0][0]-q[3][0])*f,q[3][1]+(q[0][1]-q[3][1])*f);c.lineTo(q[2][0]+(q[1][0]-q[2][0])*f,q[2][1]+(q[1][1]-q[2][1])*f);c.moveTo(q[3][0]+(q[2][0]-q[3][0])*f,q[3][1]+(q[2][1]-q[3][1])*f);c.lineTo(q[0][0]+(q[1][0]-q[0][0])*f,q[0][1]+(q[1][1]-q[0][1])*f)}c.stroke();
  for(var e=0;e<2;e++){var a=e?q[2]:q[3],b=e?q[1]:q[2];for(var m=0;m<7;m++){var f0=m/7,f1=f0+.07,p0=[a[0]+(b[0]-a[0])*f0,a[1]+(b[1]-a[1])*f0],p1=[a[0]+(b[0]-a[0])*f1,a[1]+(b[1]-a[1])*f1],dx=e?-2.4:2.4;poly(c,[p0,p1,[p1[0]+dx,p1[1]-1.2],[p0[0]+dx,p0[1]-1.2]],m%2?'#14161C':'#F2C230')}}
  // the drop marker (a painted ring on the stack side) and the launch bay outline on the other
  var sx=x-hw*.42,sy=y-hh*.1;c.strokeStyle=hRgba(col,.75);c.lineWidth=1.1;c.beginPath();c.ellipse(sx,sy,13,6.5,0,0,7);c.stroke();c.lineWidth=.6;c.beginPath();c.ellipse(sx,sy,8,4,0,0,7);c.stroke();
  c.save();c.setLineDash([2.2,2]);c.strokeStyle='rgba(255,255,255,'+(n?.22:.55)+')';c.lineWidth=.8;poly(c,pdia(x+hw*.4,y+hh*.12,.5));c.stroke();c.restore();
  // floodlight masts at the back corners, bollards at the front
  [[q[0][0]-6,q[0][1]+4],[q[1][0]-10,q[1][1]-4]].forEach(function(p,i){c.strokeStyle=n?'#6B7280':'#4A4F58';c.lineWidth=1;hline(c,p[0],p[1],p[0],p[1]-22);c.fillStyle=n?'#2A2D35':'#4A4F58';c.fillRect(p[0]-2.6,p[1]-24,5.2,2.2);
    if(n){c.save();c.globalCompositeOperation='lighter';var g=c.createRadialGradient(p[0],p[1]-22,0,p[0],p[1]-22,16);g.addColorStop(0,'rgba(255,235,190,.45)');g.addColorStop(1,'rgba(255,235,190,0)');c.fillStyle=g;c.beginPath();c.arc(p[0],p[1]-22,16,0,7);c.fill();c.restore()}});
  c.fillStyle='#F2C230';[[-.55,.45],[-.2,.72],[.2,.72],[.55,.45]].forEach(function(b){var p=tpt(x,y,hw,hh,b[0],b[1]);c.fillRect(p[0]-.8,p[1]-3.2,1.6,3.2);c.fillStyle='#14161C';c.fillRect(p[0]-.8,p[1]-2,1.6,.6);c.fillStyle='#F2C230'})}
/** where things sit on a pad centred at (x,y): the stack origin, the launch center, slot k of the stack, tube k of the pod */
function bPadStack(x,y){return {x:x-TW*.3,y:y-TH*.02}}
function bPadLauncher(x,y){return {x:x+TW*.28,y:y+TH*.1}}
function bSlot(k){var row=k<5?0:k<9?1:k<12?2:2,i=k<5?k:k<9?k-5:k<12?k-9:2,nrow=row===0?5:row===1?4:3,o=(i-(nrow-1)/2)*7.4;return {x:o*BIX+row*.6,y:o*BIY-row*4.6,row:row,hidden:k>=12}}
function bTube(k){var r=Math.floor((k%12)/6),i=(k%12)%6;return {r:r,i:i}}
/** the stack: missiles lying along the iso axis in a pyramid of 5, 4, 3 on timber chocks (count shown, the badge has the rest) */
function stackHi(c,x,y,count,col,sz){var n=hn();if(count<=0)return;c.fillStyle='rgba(0,0,0,'+(n?.3:.2)+')';c.beginPath();c.ellipse(x+2,y+3,20,7,0,0,7);c.fill();
  c.fillStyle=n?'#4A3A28':'#8B6A48';for(var ch=-2;ch<=2;ch+=2){var cx0=x+ch*7*BIX,cy0=y+ch*7*BIY+2.2;c.fillRect(cx0-5,cy0-1.4,10,1.6)}
  var N=Math.min(12,count),a=Math.atan2(BIY,BIX);for(var k=0;k<N;k++){var s=bSlot(k);missileHi(c,x+s.x,y+s.y-1.6,a+Math.PI,sz||1,col,0)}}
/** a missile coming down under a parachute (u 0..1 of its fall), landing into its slot with a settle bounce after */
function chuteHi(c,x,y,u,col,sz,seed){var n=hn(),H=170,p=u<.2?1.75*u*u:.07+(u-.2)*1.1625,yy=y-H*(1-p),sway=Math.sin(u*9+seed)*(2.2*(u>.2?1:u/.2)),open=u<.2?u/.2:1,a=Math.atan2(BIY,BIX)+Math.PI+Math.sin(u*9+seed)*.08;
  c.fillStyle='rgba(0,0,0,'+(.18*p)+')';c.beginPath();c.ellipse(x+1,y+1.5,7*p+2,2.6*p+1,0,0,7);c.fill();
  missileHi(c,x+sway,yy,a,sz||1,col,0);
  if(open>0){var cx0=x+sway*.6,cy0=yy-22*open,rx=11*open,ry=5.5*open;c.strokeStyle='rgba(255,255,255,'+(n?.4:.7)+')';c.lineWidth=.45;c.beginPath();for(var l=-1;l<=1;l++){c.moveTo(cx0+l*rx*.6,cy0+ry*.3);c.lineTo(x+sway+l*3,yy-1.2)}c.stroke();
    var g=c.createLinearGradient(cx0-rx,cy0,cx0+rx,cy0);g.addColorStop(0,n?'#B9BEC8':'#F4F5F7');g.addColorStop(.5,col);g.addColorStop(1,n?'#B9BEC8':'#F4F5F7');c.fillStyle=g;c.beginPath();c.ellipse(cx0,cy0,rx,ry*1.6,0,Math.PI,0);c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(cx0,cy0,rx,ry*.5,0,0,Math.PI);c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;c.beginPath();c.moveTo(cx0-rx,cy0);c.quadraticCurveTo(cx0,cy0-ry*1.9,cx0+rx,cy0);c.stroke();
    c.strokeStyle='rgba(0,0,0,.2)';c.beginPath();for(var s2=-2;s2<=2;s2++){c.moveTo(cx0+s2*rx*.33,cy0);c.quadraticCurveTo(cx0+s2*rx*.33,cy0-ry*1.2,cx0+s2*rx*.2,cy0-ry*1.6)}c.stroke()}}
/** a collapsed canopy on the pad right after a landing (fades in 600 ms) */
function chuteDownHi(c,x,y,u,col){var al=1-u;if(al<=0)return;c.save();c.globalAlpha=al*.9;c.fillStyle=col;c.beginPath();c.ellipse(x-6,y+2,9,2.6,-.3,0,7);c.fill();c.fillStyle='#F4F5F7';c.beginPath();c.ellipse(x-3,y+1.4,4,1.4,-.3,0,7);c.fill();c.restore()}
/** the launch center: tracked chassis, turntable, a 2 x 6 tube pod elevated along the aim; tubes show their missile when
 *  loaded. o:{col, seed, loaded (count in the pod), fired (tubes already fired, from 0), aim, recoil 0..1, t, lod, size} */
function launcherHi(c,x,y,o){var n=hn(),col=o.col||'#8B6CF6',seed=o.seed||0,t=o.t||0,rc=o.recoil||0,aim=o.aim==null?-.95:o.aim,lod=o.lod==null?LODN:o.lod,loaded=o.loaded||0,fired=o.fired||0;
  var steel=n?'#6B7280':'#9AA1AD',dark=n?'#1A1D24':'#2A2D35',body=n?'#3A4438':'#5E6A5A',hx=x+1,hy=y-1.2;
  c.fillStyle='rgba(0,0,0,'+(n?.32:.22)+')';c.beginPath();c.ellipse(x+5,y+3,20,8,0,0,7);c.fill();
  [-1,1].forEach(function(sd){var tx=hx+sd*7.5,ty=hy+sd*3.75;poly(c,[[tx-6,ty],[tx,ty+3],[tx+6,ty],[tx,ty-3]],dark);poly(c,[[tx-6,ty],[tx,ty+3],[tx,ty+3-2.4],[tx-6,ty-2.4]],hmul(dark,.6));poly(c,[[tx,ty+3],[tx+6,ty],[tx+6,ty-2.4],[tx,ty+3-2.4]],hmul(dark,.8));
    if(lod>0){c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=.5;c.beginPath();for(var g=0;g<6;g++){var u=(g+.5)/6;c.moveTo(tx-6+6*u,ty+3*u-2.4);c.lineTo(tx-6+6*u,ty+3*u)}c.stroke()}});
  prismHi(c,hx,hy-2.4,.26,5.5,body,{parapet:false});
  if(lod>0){var hw=TW/2*.26,hh=TH/2*.26,by=hy-2.4,d0=fpt(hx,by,hw,hh,1,.2,1),d1=fpt(hx,by,hw,hh,1,.55,1),d2=fpt(hx,by,hw,hh,1,.55,4.6),d3=fpt(hx,by,hw,hh,1,.2,4.6);
    poly(c,[d0,d1,d2,d3],hmul(body,.72));c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=.5;hline(c,d0[0],d0[1],d3[0],d3[1]);c.fillStyle='#E8C547';var hd=fpt(hx,by,hw,hh,1,.48,2.6);c.fillRect(hd[0]-.4,hd[1]-.4,.8,.8);
    c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=.45;c.beginPath();for(var gr=0;gr<4;gr++){var g0=fpt(hx,by,hw,hh,0,.15,1.6+gr*.8),g1=fpt(hx,by,hw,hh,0,.5,1.6+gr*.8);c.moveTo(g0[0],g0[1]);c.lineTo(g1[0],g1[1])}c.stroke();
    var st=fpt(hx,by,hw,hh,0,.78,2.6);c.fillStyle=Math.floor(t/900+seed)%2&&loaded>fired?'#5AD07A':'#2E5A3A';c.beginPath();c.arc(st[0],st[1],.7,0,7);c.fill()}
  var ty0=hy-2.4-5.5,tx0=hx;c.fillStyle=hmul(steel,.85);c.beginPath();c.ellipse(tx0,ty0+.8,6.4,3.2,0,0,7);c.fill();c.fillStyle=steel;c.beginPath();c.ellipse(tx0,ty0,6.4,3.2,0,0,7);c.fill();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;c.beginPath();c.ellipse(tx0,ty0,4.8,2.4,0,0,7);c.stroke();
  // the pod: a box of 2 x 6 tubes along the aim (length L), width across the aim; recoil slides it back on its cradle
  var nx=Math.cos(aim),ny=Math.sin(aim),L=15,W=8.4,px=tx0-nx*rc*1.6,py=ty0-2.6-ny*rc*1.6,ox=-ny,oy=nx,ex=px+nx*L,ey=py+ny*L;
  c.strokeStyle=dark;c.lineWidth=1.5;c.lineCap='round';hline(c,tx0+2.5,ty0-.4,px+nx*L*.4-1,py+ny*L*.4+1.4);c.strokeStyle=steel;c.lineWidth=.8;hline(c,tx0+2.5,ty0-.4,px+nx*L*.25,py+ny*L*.25+1);c.lineCap='butt';
  var top=[[px+ox*W/2,py+oy*W/2],[ex+ox*W/2,ey+oy*W/2],[ex-ox*W/2,ey-oy*W/2],[px-ox*W/2,py-oy*W/2]];
  poly(c,[[top[0][0],top[0][1]+2.2],[top[1][0],top[1][1]+2.2],top[1],top[0]],n?'#2E333D':'#4A5160');poly(c,[[top[3][0],top[3][1]+2.2],[top[0][0],top[0][1]+2.2],top[0],top[3]],n?'#262A33':'#3E444F');
  poly(c,top,n?'#4A5160':'#6B7280');
  if(lod>0){c.strokeStyle='rgba(255,255,255,'+(n?.1:.3)+')';c.lineWidth=.5;hline(c,top[3][0],top[3][1],top[2][0],top[2][1]);c.strokeStyle='rgba(0,0,0,.3)';c.beginPath();for(var r=2.5;r<L-1;r+=3){c.moveTo(px+nx*r+ox*W/2,py+ny*r+oy*W/2);c.lineTo(px+nx*r-ox*W/2,py+ny*r-oy*W/2)}c.stroke();
    c.fillStyle=col;c.fillRect(px+nx*1.5-1.4,py+ny*1.5-1.4,2.8,2.8)}
  // the muzzle face: 2 rows x 6 tubes; a loaded tube shows the nose cone, an empty one is dark, a fired one is scorched
  var mz=[];for(var r2=0;r2<2;r2++)for(var i=0;i<6;i++){var k=r2*6+i,mxp=ex-nx*(1.2+r2*1.6)+ox*((i-2.5)*1.3)*1.0,myp=ey-ny*(1.2+r2*1.6)+oy*((i-2.5)*1.3)*1.0,yo=-r2*2.6;mz.push([mxp,myp+yo]);
    var state=k<fired?2:k<loaded?1:0;c.fillStyle=state===2?'#0E0F13':'#14161C';c.beginPath();c.ellipse(mxp,myp+yo,1.05,.75,0,0,7);c.fill();
    if(state===1){c.fillStyle=n?'#C9CDD4':'#F4F5F7';c.beginPath();c.ellipse(mxp,myp+yo,.75,.5,0,0,7);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(mxp,myp+yo,.35,.25,0,0,7);c.fill()}
    else if(state===2&&lod>0){c.strokeStyle='rgba(40,30,20,.6)';c.lineWidth=.4;c.beginPath();c.ellipse(mxp,myp+yo,1.4,1,0,0,7);c.stroke()}}
  var mx=hx-9,my=hy-5;c.strokeStyle=steel;c.lineWidth=.8;hline(c,mx,my,mx,my-9);c.fillStyle=dark;c.fillRect(mx-1,my-10.2,2,1.6);
  var on=loaded>fired&&Math.floor(t/450+seed)%4===0;if(on){c.save();c.shadowColor='#FFB347';c.shadowBlur=6;c.fillStyle='#FFC46B';c.beginPath();c.arc(mx,my-9.6,1.1,0,7);c.fill();c.restore()}else{c.fillStyle='#7A5A2A';c.beginPath();c.arc(mx,my-9.6,.9,0,7);c.fill()}
  return {x:ex,y:ey-1.3,mz:mz,px:px,py:py,nx:nx,ny:ny}}
/** a missile heading along angle a (screen radians): body with a lit top edge, nose cone, fins, a band in the city's colour,
 *  the nozzle, and when boost>0 the exhaust plume (additive). sz 1 = 10 px long */
function missileHi(c,x,y,a,sz,col,boost){var n=hn(),L=10*sz,R=1.5*sz;c.save();c.translate(x,y);c.rotate(a);
  if(boost>0){c.save();c.globalCompositeOperation='lighter';var pl=(6+8*boost)*sz,g=c.createLinearGradient(-L/2,0,-L/2-pl,0);g.addColorStop(0,'rgba(255,250,230,.95)');g.addColorStop(.25,'rgba(255,190,80,.8)');g.addColorStop(.6,'rgba(255,110,40,.35)');g.addColorStop(1,'rgba(255,80,20,0)');c.fillStyle=g;
    c.beginPath();c.moveTo(-L/2,-R*.7);c.lineTo(-L/2-pl,-R*1.6-(rnd(x)*.6));c.lineTo(-L/2-pl*1.15,0);c.lineTo(-L/2-pl,R*1.6+(rnd(y)*.6));c.lineTo(-L/2,R*.7);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(-L/2-1.2*sz,0,2*sz,R*.8,0,0,7);c.fill();c.restore()}
  var bg=c.createLinearGradient(0,-R,0,R);bg.addColorStop(0,n?'#C9CDD4':'#F4F5F7');bg.addColorStop(.5,n?'#9AA1AD':'#D5D9DF');bg.addColorStop(1,n?'#555B68':'#8A9099');
  c.fillStyle='#2A2D35';c.beginPath();c.moveTo(-L/2,-R*1.9);c.lineTo(-L/2+3*sz,-R);c.lineTo(-L/2+3*sz,R);c.lineTo(-L/2,R*1.9);c.closePath();c.fill();
  c.fillStyle=bg;c.fillRect(-L/2,-R,L,R*2);
  c.fillStyle=n?'#B9BEC8':'#E6E8EC';c.beginPath();c.moveTo(L/2,-R);c.lineTo(L/2+3.2*sz,0);c.lineTo(L/2,R);c.closePath();c.fill();
  c.fillStyle=col;c.fillRect(L/2-3*sz,-R,1.6*sz,R*2);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-L/2-.6*sz,-R*.8,1.4*sz,R*1.6);
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.4;hline(c,-L/2+1,-R*.55,L/2,-R*.55);c.restore()}
/** the missile-count badge, in screen space (css px) so it stays readable at every zoom; hot = flashed on a change (0..1) */
function badgeHi(c,sx,sy,nLeft,col,hot){var s=String(nLeft),w=22+s.length*6.5,h=15,x=Math.round(sx*dpr)/dpr,y=Math.round(sy*dpr)/dpr;c.save();c.font='600 10px IBM Plex Mono,Menlo,monospace';c.textBaseline='middle';c.textAlign='left';
  c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=4;c.shadowOffsetY=1;c.fillStyle=nLeft>0?'rgba(15,16,22,.94)':'rgba(15,16,22,.7)';c.beginPath();if(c.roundRect)c.roundRect(x-w/2,y-h/2,w,h,7.5);else c.rect(x-w/2,y-h/2,w,h);c.fill();c.shadowColor='transparent';
  c.strokeStyle=hot>0?'rgba(255,255,255,'+(.5+.5*hot)+')':nLeft>0?col:'rgba(255,255,255,.22)';c.lineWidth=1;c.stroke();
  c.save();c.translate(x-w/2+8,y);c.rotate(-.7);c.fillStyle=nLeft>0?'#E6E8EC':'#6B7280';c.fillRect(-3,-1,5,2);c.beginPath();c.moveTo(2,-1.3);c.lineTo(4.2,0);c.lineTo(2,1.3);c.fill();c.fillStyle=col;c.fillRect(.6,-1,1.2,2);c.restore();
  c.fillStyle=nLeft>0?'#F2F2F5':'#8A8E96';if(hot>0){c.save();c.translate(x+2,y);c.scale(1+.25*hot,1+.25*hot);c.fillText(s,-w/2+13,.5);c.restore()}else c.fillText(s,x-w/2+15,y+.5);c.restore()}
/** the countdown, in screen space: one big numeral a second with a thinning ring, then nothing */
function countdownHi(c,sx,sy,u){var k=Math.min(2,Math.floor(u*3)),f=u*3-k,num=3-k,sc=1+.12*(1-f),al=f<.15?f/.15:f>.85?(1-f)/.15:1;c.save();c.translate(Math.round(sx*dpr)/dpr,Math.round(sy*dpr)/dpr);c.globalAlpha=al;
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.arc(0,0,44*sc,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-f));c.stroke();
  c.fillStyle='rgba(15,16,22,.6)';c.beginPath();c.arc(0,0,38*sc,0,7);c.fill();c.fillStyle='#FFFFFF';c.font='600 '+Math.round(52*sc)+'px IBM Plex Mono,Menlo,monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(num),0,3);c.restore()}
/** a trajectory from a tube mouth to the target in screen space: constant ground speed after a short boost, gravity for
 *  the height, so the nose pitches up on the way out and down into the target. f 0..1; returns {x,y,a (heading), boost} */
function bTraj(ax,ay,bx,by,f,hs){var d=Math.hypot(bx-ax,by-ay),H=Math.min(260,70+d*.3)*(hs||1),s=Math.pow(f,1.3),e=1e-3,s2=Math.pow(Math.min(1,f+e),1.3);
  var p=function(u){return [ax+(bx-ax)*u,ay+(by-ay)*u-H*4*u*(1-u)]},P=p(s),Q=p(s2);return {x:P[0],y:P[1],gy:ay+(by-ay)*s,a:Math.atan2(Q[1]-P[1],Q[0]-P[0]),boost:f<.35?1:Math.max(0,1-(f-.35)/.25)}}
function bFlightDur(d){return 2500+Math.min(1500,d*3.5)}
// ---- particles (one pool, capped: smoke, debris, sparks, dust, flashes, rings)
// the particle pool: smoke, dust, debris, sparks, flashes, fire, rings, and the voxels a hit building breaks into ('vox', pixel
// squares in the building's colours with gravity and a bounce) and the ones that fly back in while the cranes work ('build').
// Caps: 2400 on a desktop, 800 on a phone; one hit adds at most 600 voxels walked in, 220 at street zoom, 80 on the world map
var BP=[],BPMAX=260;function bPoolMax(){return vw<700?800:2400}function bVoxMax(){return LODN>=2?600:LODN===1?220:80}
function bEmit(p){if(!isFinite(p.x)||!isFinite(p.y))return;if(BP.length>=BPMAX)BP.shift();p.age=0;BP.push(p)}
function bStep(dt){for(var i=BP.length-1;i>=0;i--){var p=BP[i];p.age+=dt;if(p.age>=p.life){BP.splice(i,1);continue}
  if(p.k==='vox'){p.vy+=260*dt;p.vx*=(1-.6*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>p.g){p.y=p.g;p.vy=-p.vy*.3;p.vx*=.5;if(Math.abs(p.vy)<10){p.vy=0;p.vx=0;p.down=true}}}
  else if(p.k==='build'){var u=Math.min(1,p.age/p.life),e=u*u*(3-2*u);p.x=p.x0+(p.x1-p.x0)*e;p.y=p.y0+(p.y1-p.y0)*e-Math.sin(u*Math.PI)*p.arc}
  else if(p.k==='debris'||p.k==='spark'){p.vy+=(p.k==='spark'?90:240)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>p.g){p.y=p.g;p.vy=-p.vy*.35;p.vx*=.6;if(Math.abs(p.vy)<8)p.vy=0}p.rot+=p.vr*dt}
  else{p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.k==='smoke'){p.vx*=(1-.8*dt);p.vy-=14*dt}}}}
function bDrawParticles(c){BP.forEach(function(p){var f=p.age/p.life;
  if(p.k==='smoke'||p.k==='dust'){var r=p.r0+(p.r1-p.r0)*f,al=p.al*(1-f)*(f<.15?f/.15:1),g=c.createRadialGradient(p.x,p.y,r*.15,p.x,p.y,r);g.addColorStop(0,'rgba('+p.col+','+al.toFixed(3)+')');g.addColorStop(1,'rgba('+p.col+',0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r,0,7);c.fill()}
  else if(p.k==='vox'){var av=f>.72?(1-f)/.28:1;if(av<1)c.globalAlpha=av;c.fillStyle=p.col;c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);if(p.s>1&&!p.down){c.fillStyle='rgba(255,255,255,.28)';c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s*.4)}if(av<1)c.globalAlpha=1}
  else if(p.k==='build'){c.fillStyle=p.col;c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);if(f>.85){c.fillStyle='rgba(255,255,255,'+((f-.85)/.15*.8).toFixed(2)+')';c.fillRect(p.x-p.s,p.y-p.s,p.s*2,p.s*2)}}
  else if(p.k==='debris'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.col;c.globalAlpha=f>.8?(1-f)/.2:1;c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*.35);c.restore()}
  else if(p.k==='spark'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,'+Math.round(200-120*f)+',80,'+(1-f).toFixed(3)+')';c.lineWidth=.8;hline(c,p.x,p.y,p.x-p.vx*.03,p.y-p.vy*.03);c.restore()}
  else if(p.k==='flash'){c.save();c.globalCompositeOperation='lighter';var rr=p.r0+(p.r1-p.r0)*Math.sqrt(f),g2=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);g2.addColorStop(0,'rgba(255,255,240,'+(.95*(1-f)).toFixed(3)+')');g2.addColorStop(.4,'rgba(255,190,90,'+(.7*(1-f)).toFixed(3)+')');g2.addColorStop(1,'rgba(255,120,40,0)');c.fillStyle=g2;c.beginPath();c.arc(p.x,p.y,rr,0,7);c.fill();c.restore()}
  else if(p.k==='fire'){c.save();c.globalCompositeOperation='lighter';var rf=p.r0+(p.r1-p.r0)*Math.min(1,f*2.2),af=Math.pow(1-f,1.4),g3=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rf);g3.addColorStop(0,'rgba(255,250,220,'+(.95*af).toFixed(3)+')');g3.addColorStop(.35,'rgba(255,170,60,'+(.8*af).toFixed(3)+')');g3.addColorStop(.7,'rgba(230,80,30,'+(.45*af).toFixed(3)+')');g3.addColorStop(1,'rgba(120,30,10,0)');c.fillStyle=g3;c.beginPath();c.arc(p.x,p.y,rf,0,7);c.fill();c.restore()}
  else if(p.k==='ring'){c.save();c.strokeStyle='rgba(255,230,190,'+(.7*(1-f)).toFixed(3)+')';c.lineWidth=1.2*(1-f)+.3;c.beginPath();c.ellipse(p.x,p.y,p.r1*f+1,(p.r1*f+1)*.5,0,0,7);c.stroke();c.restore()}})}
/** what a hit does to the air: flash and fireball, shock ring, chunks of the building in its own colours and window glass
 *  (bigger and more of them for a big hit), sparks, a dust cloud, then smoke. gy = the ground under the hit (chunks land there) */
function bImpactFx(x,y,col,strength,gy){var st=Math.min(1.6,.6+strength),g0=gy==null?y+2:gy;bEmit({k:'flash',x:x,y:y-4,r0:4,r1:26*st,life:.32});bEmit({k:'fire',x:x,y:y-6,vx:0,vy:-16,r0:3,r1:17*st,life:.6});bEmit({k:'ring',x:x,y:y,r1:30*st,life:.55});
  var nd=Math.round(12+14*st),cols=[hmul(col,.92),hmul(col,.7),'#8A8A93','#C9E3F6'];for(var k=0;k<nd;k++){var an=rnd(k*3.7+x)*6.283,sp=40+rnd(k+y)*100*st;bEmit({k:'debris',x:x+(rnd(k)-.5)*8,y:y-6,vx:Math.cos(an)*sp,vy:-70-rnd(k*5+.2)*130*st,g:g0+rnd(k*7)*10,rot:rnd(k)*6,vr:(rnd(k+.3)-.5)*14,s:.9+rnd(k*11)*2.4*st,col:cols[Math.floor(rnd(k*2+.5)*4)],life:1.4+rnd(k)*.9})}
  for(var s=0;s<6;s++){var a2=rnd(s*5+x)*6.283,v=90+rnd(s)*120;bEmit({k:'spark',x:x,y:y-5,vx:Math.cos(a2)*v,vy:-40-rnd(s+.7)*110,g:y+6,rot:0,vr:0,life:.5+rnd(s)*.3})}
  for(var d=0;d<5;d++)bEmit({k:'dust',x:x+(rnd(d*9+x)-.5)*16,y:y-2,vx:(rnd(d+.1)-.5)*14,vy:-4-rnd(d)*6,r0:3,r1:14+rnd(d*3)*10,al:.4,col:hn()?'120,110,100':'170,160,145',life:2.4+rnd(d)*1.2});
  for(var m=0;m<4;m++)bEmit({k:'smoke',x:x+(rnd(m*2+y)-.5)*8,y:y-8-m*3,vx:(rnd(m)-.5)*6,vy:-10-rnd(m*4)*8,r0:2.5,r1:12,al:.45,col:hn()?'80,82,92':'110,110,120',life:2.8+rnd(m)*1.5})}
/** the launch: a puff and sparks at the tube mouth, a small flash */
function bLaunchFx(x,y,a){bEmit({k:'flash',x:x,y:y,r0:2,r1:9,life:.2});for(var k=0;k<5;k++)bEmit({k:'smoke',x:x-Math.cos(a)*3,y:y-Math.sin(a)*3,vx:-Math.cos(a)*(18+rnd(k)*18)+(rnd(k*3)-.5)*10,vy:-Math.sin(a)*(10+rnd(k)*10)+(rnd(k*5)-.5)*8,r0:1.5,r1:9,al:.5,col:hn()?'120,122,130':'200,200,205',life:1.4+rnd(k)*.8})}
/** smoke behind a missile in flight (one puff every few frames; the caller rations) */
function bTrailFx(x,y,a,sz){bEmit({k:'smoke',x:x-Math.cos(a)*6*sz,y:y-Math.sin(a)*6*sz,vx:(rnd(x)-.5)*6,vy:(rnd(y)-.5)*4-3,r0:.9*sz,r1:5*sz,al:.42,col:hn()?'130,132,140':'225,225,230',life:1.1+rnd(x+y)*.5})}
/** a landing: a puff of dust under a settling missile */
function bLandFx(x,y){for(var k=0;k<3;k++)bEmit({k:'dust',x:x+(rnd(k+x)-.5)*8,y:y+1,vx:(rnd(k)-.5)*16,vy:-3,r0:1.5,r1:7,al:.35,col:hn()?'120,110,100':'190,185,170',life:.9})}
/** a shield taking a shot: the dome lights, sparks run off it, no damage */
function bShieldFx(x,y,col){bEmit({k:'flash',x:x,y:y,r0:3,r1:18,life:.3});for(var k=0;k<8;k++){var an=rnd(k*4+x)*6.283;bEmit({k:'spark',x:x,y:y,vx:Math.cos(an)*120,vy:Math.sin(an)*60-30,g:y+40,rot:0,vr:0,life:.45})}}
// ---- the collapse: the lost floors slide down into the stump and fade while dust rolls out at the base (about 650 ms, on
// the moving layer; the cached tower underneath is already drawn shorter). Rubble piles up around the footprint with damage.
var BCOL=[];
// the effects clock: wall-clock ms, scaled by the replay speed and stopped while paused (the collapse of a hit tower takes 650 ms live and 1.4 s in the replay, so the floors are seen going)
var BFXT=0,BCOLMS=650,BCOLREP=1400;
function bCollapseAdd(x,base,h0,h1,w,col,tn,dur){if(h0<=h1)return;BCOL.push({x:x,base:base,h0:h0,h1:h1,w:w,col:col,t0:tn,dur:dur||BCOLMS,dust:false})}
function bDrawCollapse(c,tn){for(var i=BCOL.length-1;i>=0;i--){var k=BCOL[i],u=(tn-k.t0)/k.dur;if(u>=1||u<0){if(u>=1)BCOL.splice(i,1);continue}var e=u*u,lost=k.h0-k.h1,top1=k.base-k.h1;
    if(!k.dust&&u>.4){k.dust=true;for(var d=0;d<7;d++)bEmit({k:'dust',x:k.x+(rnd(d*5+k.x)-.5)*TW*.8,y:k.base-2,vx:(rnd(d+.3)-.5)*44,vy:-6-rnd(d)*8,r0:3,r1:16+rnd(d*3)*10,al:.5,col:hn()?'110,104,96':'175,168,155',life:1.6+rnd(d)*.8})
      for(var s2=0;s2<5;s2++)bEmit({k:'debris',x:k.x+(rnd(s2*9+k.x)-.5)*TW*.5,y:top1,vx:(rnd(s2+.2)-.5)*80,vy:-20-rnd(s2)*40,g:k.base+rnd(s2*3)*8,rot:rnd(s2)*6,vr:(rnd(s2+.7)-.5)*10,s:1.2+rnd(s2*5)*2,col:hmul(k.col,.8),life:1.3})}
    c.save();c.globalAlpha=Math.max(0,1-Math.max(0,(u-.45)/.55));prismHi(c,k.x,top1+lost*.5*e,k.w,Math.max(.5,lost*(1-e*.85)),k.col,{parapet:false});c.restore()}}
function bRubblePiles(c,x,base,col,d){rubbleHi(c,x-TW*.3,base-TH*.12,col);if(d>=.34)rubbleHi(c,x+TW*.3,base-TH*.12,col);if(d>=.67)rubbleHi(c,x+2,base+TH*.24,col)}
// ---- a hit GitHub building: the top floors are gone (the caller draws the tower shorter), a ruined cap sits on the stump,
// scorch runs down the hit face, rubble at the foot; while the cranes rebuild, scaffolding wraps the new floors
/** w = tier width at the top, top = the stump's top y, d = damage 0..1, reb = rebuild progress 0..1 (0 while the damage holds) */
function ruinHi(c,px,top,w,col,d,reb){var n=hn(),hw=TW/2*w,hh=TH/2*w,dk=n?'#1A1D24':'#3A3D47';
  if(reb<=0){ // the broken edge: jagged slabs standing on the roof, exposed floors, bent rebar
    for(var k=0;k<5;k++){var u=-.8+k*.4,p=tpt(px,top,hw,hh,u,-.75+rnd(k+px)*.3),h=2.5+rnd(k*3+top)*5*d;prismHi(c,p[0],p[1],.06+rnd(k)*.05,h,hmul(col,.78),{parapet:false})}
    poly(c,[tpt(px,top,hw,hh,-.9,.3),tpt(px,top,hw,hh,.9,.3),tpt(px,top,hw,hh,.9,.9),tpt(px,top,hw,hh,-.9,.9)],n?'rgba(20,14,10,.55)':'rgba(30,22,16,.5)');
    c.strokeStyle=n?'#6B5137':'#8B6A48';c.lineWidth=.6;c.beginPath();for(var r=0;r<4;r++){var q=tpt(px,top,hw,hh,-.6+r*.4,.2);c.moveTo(q[0],q[1]);c.quadraticCurveTo(q[0]+2,q[1]-5,q[0]+4+r,q[1]-7)}c.stroke();
    rubbleHi(c,px+1,top+hh*.1,col)}
  // scorch down the right face from the break, and on the ground
  c.fillStyle='rgba(20,14,10,'+(.35*d*(1-reb))+')';var f0=fpt(px,top,hw,hh,1,.15,0),f1=fpt(px,top,hw,hh,1,.85,0);c.beginPath();c.moveTo(f0[0],f0[1]);c.lineTo(f1[0],f1[1]);c.lineTo(f1[0]-1,f1[1]+14*d);c.lineTo((f0[0]+f1[0])/2,f0[1]+22*d);c.lineTo(f0[0]+1,f0[1]+12*d);c.closePath();c.fill()}
// ---- the cinematic replay (Mike 2026-11-08: "zooms into the first strike, then I see the missile fire, then we follow the
// missiles tracing into the damage, then the camera resets to the next city ... a full replay with trailing smoke behind each
// one of the individual missiles"). One strike beat per launching city, the city with the most missiles first, raiders from
// the sea last. Per beat: the camera eases to the pad, the pod fires with a flash, recoil and a thick plume, the camera
// follows the lead missile down its arc into the hit and holds about a second. After the last beat: a wide shot with every
// smoke ribbon still hanging, the cranes in time-lapse, then the map is handed back. Pure functions here (the page and the
// renderer both use them); the renderer keeps the clock and the camera.
// Pace (Mike 11-08: "animation sequence moves too fast on battle"): every beat timing is 2.5x what it was (a shot's flight was 1.3 to 2.0 s,
// it is now 3.25 to 5.0 s), and the camera holds 450 ms on each hit (it was 900 ms on the last hit of a beat and nothing between). All
// of these are ms at 1x; the replay clock runs at 0.5x, 1x or 2x of them (bRealMs).
var BRT={pre:1250,approach:2375,first:875,ripple:700,step:175,hold:450,zoomIn:250,beatMax:9625,wide:3200,tail:1600,total:20000,rebMin:5500,flMin:3250,flCap:5000};
function bRepFlight(d){return BRT.flMin+Math.min(1750,(d||300)*1.375)}
// ---- replay speed: the clock runs at one of these times the 1x timings (pure helpers, tested)
var BSPEEDS=[.5,1,2];
function bSpeedOf(v){v=+v;return BSPEEDS.indexOf(v)>=0?v:1}
function bSpeedNext(v){return BSPEEDS[(BSPEEDS.indexOf(bSpeedOf(v))+1)%BSPEEDS.length]}
/** wall-clock ms that a 1x duration takes at a speed */
function bRealMs(ms,sp){return ms/bSpeedOf(sp)}
/** the replay's virtual clock: vt at the anchor (performance time pt), running at sp */
function bVirt(vt,pt,sp,perf){return vt+(perf-pt)*bSpeedOf(sp)}
// ---- the viewer's camera: zoom limits, pan limits, fit-all (pure helpers, tested). Never closer than BZMAX, never farther out than
// the zoom that fits the whole battlefield, and the map can never be dragged out of view (its edge stops at the middle of the screen)
var BZMAX=3,BCAMEASE=450;
function bClampZoom(z,fitZ,maxZ){var mx=maxZ>0?maxZ:BZMAX,mn=Math.min(fitZ>0?fitZ:.3,mx);z=+z;if(!(z>0))z=mn;return Math.max(mn,Math.min(mx,z))}
function bClampCam(c,vw,vh,bd){var z=c.z,wx=(vw/2-c.x)/z,wy=(vh/2-c.y)/z;wx=Math.max(bd.x0,Math.min(bd.x1,wx));wy=Math.max(bd.y0,Math.min(bd.y1,wy));return {x:vw/2-wx*z,y:vh/2-wy*z,z:z}}
function bMapBounds(){var mh=typeof maxH==='number'?maxH:60;return {x0:iso(0,H).x-TW,x1:iso(W,0).x+TW,y0:iso(0,0).y-mh-TH,y1:iso(W,H).y+TH*2}}
function bFitCam(){var z=typeof FITZ==='number'&&FITZ>0?FITZ:.3,c=iso(W/2,H/2),mh=typeof maxH==='number'?maxH:60;return {z:z,x:vw/2-c.x*z,y:vh/2-c.y*z+(mh/2)*z}}
function bCamLim(){return {min:Math.min(typeof FITZ==='number'&&FITZ>0?FITZ:.3,BZMAX),max:BZMAX}}
function bClampPan(){var c=bClampCam(cam,vw,vh,bMapBounds());cam.x=c.x;cam.y=c.y}
/** beats from a shot list (each shot has a, d, from, to, dist): sets s.rf (fire), s.fl (flight), s.ri (impact) and returns
 *  {beats, S (a schedule for bHitDmg and bRebuild), total ms}. now0 = the virtual start (0 on the renderer's replay clock) */
function bBeats(shots,now0,reduce){var by={},keys=[];shots.forEach(function(s){if(!by[s.a]){by[s.a]=[];keys.push(s.a)}by[s.a].push(s)});
  keys.sort(function(a,b){var ra=a.charAt(0)!=='@',rb=b.charAt(0)!=='@';if(ra!==rb)return ra?1:-1;var d=by[b].length-by[a].length;return d||(a<b?-1:a>b?1:0)});
  var t=now0+BRT.pre,beats=[];keys.forEach(function(k,i){var L=by[k],n=L.length,ap=reduce?400:BRT.approach+(i?0:BRT.first),step=n>1?Math.min(BRT.step,BRT.ripple/(n-1)):0,launch=t+ap,lastHit=launch;
    L.forEach(function(s,j){s.rf=launch+j*step;s.fl=Math.min(BRT.flCap,bRepFlight(s.dist));s.ri=s.rf+s.fl;if(s.ri>lastHit)lastHit=s.ri});
    var end=Math.min(t+BRT.beatMax+(i?0:BRT.first),lastHit+BRT.hold);var tg={};L.forEach(function(s){tg[s.d]=(tg[s.d]||0)+1});var d=Object.keys(tg).sort(function(p,q){return tg[q]-tg[p]});
    var lead=L[0];for(var q=0;q<L.length;q++)if(L[q].f>0&&L[q].b){lead=L[q];break}   // the camera follows a missile that lands, not one a shield holds
    beats.push({i:i,a:k,d:lead.d,targets:d,shots:L,n:n,t0:t,launch:launch,hit:lastHit,end:end,lead:lead,raid:k.charAt(0)!=='@'});t=end});
  var wide=t,hold=wide+BRT.wide,reb=Math.max(BRT.rebMin,BRT.total-(hold-now0)-BRT.tail),end=hold+reb;
  return {beats:beats,by:by,shots:shots,total:end+BRT.tail-now0,S:{D:now0,live:false,rep:true,drop:now0,dropStep:0,fall:0,load0:now0,load1:now0,loadDur:0,count:beats.length?beats[0].launch:now0,salvo:beats.length?beats[0].launch:now0,ripple:0,wide:wide,hold:hold,end:end}}}
/** the beat at now (or null before the first / after the last) */
function bBeatAt(R,now){for(var i=0;i<R.beats.length;i++){var b=R.beats[i];if(now<b.end)return now>=b.t0?b:null}return null}
/** the stage at now: pre, beat, wide, rebuild, done */
function bRepStage(R,now){if(now<R.S.D+BRT.pre)return 'pre';if(now<R.S.wide)return 'beat';if(now<R.S.hold)return 'wide';if(now<R.S.end)return 'rebuild';return 'done'}
/** the zoom that fills most of a viewport with one pad (phone 390 -> 1.56, Duo 382/466 -> 1.5/1.86, desktop -> 2.6) */
function bPadZoom(vw){return Math.min(2.6,Math.max(1.25,vw/250))}
/** the wide framing of a plan: every launch point and target in view, buildings included */
function bWideFrame(shots,vw,vh){var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,any=false;shots.forEach(function(s){[s.from,s.to].forEach(function(p){if(!p)return;any=true;x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)})});
  if(!any)return null;var z=Math.min(1.4,Math.max(.3,Math.min(vw*.84/(x1-x0+160),vh*.76/(y1-y0+200))));return {x:(x0+x1)/2,y:(y0+y1)/2-30,z:z}}
function bClampAbs(v,m){return v>m?m:v<-m?-m:v}
function bPadFrame(b,vw){var f=b.lead.pad||b.lead.from,t=b.lead.to;return {x:f.x+bClampAbs((t.x-f.x)*.1,12),y:f.y-18,z:bPadZoom(vw)}}
/** the zoom at mid-flight: out far enough that a long arc reads as a journey, never below .45 of the pad zoom */
function bFlightZoom(pz,dist,vw){return Math.max(pz*.45,Math.min(pz*.75,vw*1.2/Math.max(60,dist||300)))}
function bHitFrame(b,vw){return {x:b.lead.to.x,y:b.lead.to.y-10,z:bPadZoom(vw)*1.04}}
function bCamMix(a,b,u){u=bEase(u);return {x:bLerp(a.x,b.x,u),y:bLerp(a.y,b.y,u),z:bLerp(a.z,b.z,u)}}
/** where the camera looks at now: {x,y,z} (world centre, zoom). home = the framing to start from and come back to.
 *  reduce: cuts instead of moves (pad until mid-flight, then the hit). Returns null after the end (the renderer flies home). */
function bRepCam(R,now,home,vw,vh,reduce){var S=R.S,st=bRepStage(R,now);if(st==='done')return null;
  if(st==='pre')return home;
  if(st==='wide'||st==='rebuild'){var wide=bWideFrame(R.shots,vw,vh)||home,lb=R.beats[R.beats.length-1],fromC=lb?bHitFrame(lb,vw):home,u=(now-S.wide)/(BRT.wide*.7);return reduce?wide:u>=1?wide:bCamMix(fromC,wide,u)}
  var b=bBeatAt(R,now);if(!b){var nb=null;for(var i=0;i<R.beats.length;i++)if(now<R.beats[i].t0){nb=R.beats[i];break}return nb&&nb.i>0?bHitFrame(R.beats[nb.i-1],vw):home}
  var pad=bPadFrame(b,vw),prev=b.i>0?bHitFrame(R.beats[b.i-1],vw):home,lead=b.lead;
  if(now<b.launch){if(reduce)return pad;return bCamMix(prev,pad,(now-b.t0)/(b.launch-b.t0))}
  var f=Math.min(1,(now-lead.rf)/lead.fl),hit=bHitFrame(b,vw);
  if(reduce)return f<.5?pad:hit;
  if(f>=1){var u2=Math.min(1,(now-lead.ri)/BRT.zoomIn);return {x:hit.x,y:hit.y,z:bLerp(pad.z,hit.z,bEase(u2))}}
  var tr=bTraj(lead.from.x,lead.from.y,lead.to.x,lead.to.y,Math.min(1,f+Math.min(.07,40/Math.max(1,lead.dist||300)))),zm=bFlightZoom(pad.z,lead.dist,vw),zz=bLerp(pad.z,zm,Math.sin(Math.PI*f)),k=bEase(Math.min(1,f/.25));
  return {x:bLerp(pad.x,tr.x,k)+bClampAbs((lead.to.x-lead.from.x)*.06,40)*Math.sin(Math.PI*f),y:bLerp(pad.y,bLerp(tr.gy,tr.y,.55)-8,k),z:zz}}   // the camera rides between the missile and its ground track, so the map stays under it
// ---- smoke ribbons: one polyline per missile, kept for the whole replay. Points carry their time, so the ribbon widens,
// drifts with the wind and thins as it ages. Polylines, not particles: ten ribbons cost ten strokes a frame.
var BTR=[];
function bRibbon(s){if(!s.tr){s.tr={pts:[],sz:s.sz||1,col:s.a};BTR.push(s.tr)}return s.tr}
function bRibbonAdd(s,x,y,t,sz){var r=bRibbon(s),p=r.pts,q=p[p.length-1],gap=Math.max(5,(s.dist||300)/56);r.sz=sz||1;if(q&&Math.hypot(x-q[0],y-q[1])<gap)return;if(p.length>=64)p.shift();p.push([x,y,t])}
/** a ribbon for a flight the viewer skipped over (or a frozen frame): sampled along the whole arc up to until */
function bRibbonFill(s,until,sz){if(!s.from||!s.to||s.rf==null)return;var r=bRibbon(s);r.pts.length=0;var u1=Math.min(1,(until-s.rf)/s.fl);if(u1<=0)return;
  for(var k=0;k<=40;k++){var u=u1*k/40,tr=bTraj(s.from.x,s.from.y,s.to.x,s.to.y,u);bRibbonAdd(s,tr.x-Math.cos(tr.a)*6*(sz||1),tr.y-Math.sin(tr.a)*6*(sz||1),s.rf+s.fl*u,sz)}}
function bRibbonsClear(){BTR.forEach(function(r){r.pts.length=0});BTR.length=0}
var BRIB=[[0,1500,1.8,.55],[1500,4000,3.6,.4],[4000,8000,5.4,.28],[8000,1e12,7,.18]];
function bDrift(age){var a=Math.min(age,12000);return [a*.0022,-a*.0045]}
function bDrawRibbons(c,now){if(!BTR.length)return;var n=hn(),col=n?'150,152,162':'228,229,234';c.save();c.lineCap='round';c.lineJoin='round';
  for(var i=0;i<BTR.length;i++){var r=BTR[i],p=r.pts;if(p.length<2)continue;
    for(var bI=BRIB.length-1;bI>=0;bI--){var B=BRIB[bI],any=false;c.beginPath();
      for(var k=1;k<p.length;k++){var age=now-p[k][2];if(age<B[0]||age>=B[1])continue;var d0=bDrift(now-p[k-1][2]),d1=bDrift(age),w=Math.sin(k*1.7)*Math.min(1,age/1500)*1.5;
        c.moveTo(p[k-1][0]+d0[0],p[k-1][1]+d0[1]+w);c.lineTo(p[k][0]+d1[0],p[k][1]+d1[1]+w);any=true}
      if(any){c.lineWidth=B[2]*r.sz;c.strokeStyle='rgba('+col+','+B[3]+')';c.stroke()}}}
  c.restore()}
/** the big launch: the plume Mike asked for (flash, a ground ring, a dozen puffs rolling away from the tubes, dust) */
function bLaunchFxBig(x,y,a){bEmit({k:'flash',x:x,y:y,r0:3,r1:18,life:.28});bEmit({k:'ring',x:x,y:y+4,r1:22,life:.5});
  for(var k=0;k<12;k++)bEmit({k:'smoke',x:x-Math.cos(a)*(2+k*.6),y:y-Math.sin(a)*(2+k*.6),vx:-Math.cos(a)*(14+rnd(k)*26)+(rnd(k*3)-.5)*16,vy:-Math.sin(a)*(8+rnd(k)*12)+(rnd(k*5)-.5)*10-4,r0:2+rnd(k)*1.5,r1:12+rnd(k*7)*8,al:.55,col:hn()?'130,132,142':'215,215,222',life:1.8+rnd(k)*1.2});
  for(var d=0;d<4;d++)bEmit({k:'dust',x:x+(rnd(d*9+x)-.5)*14,y:y+5,vx:(rnd(d+.1)-.5)*22,vy:-2-rnd(d)*3,r0:2.5,r1:11+rnd(d*3)*6,al:.35,col:hn()?'110,100,90':'185,178,165',life:1.6+rnd(d)*.8})}
`;

/** the clock-driven battle and the API */
export const BATTLE_LOGIC_JS = String.raw`
// ---- battle day (citybattle.ts BATTLE_LOGIC_JS): the clock-driven battle. Mike 2026-11-07: "show from the sky missiles
// dropping down and stacking as ammunition for each of those plots of land. Then one by one, the missiles move to their launch
// centers. In three, two, one, the missiles launch all at the same time across the entire battle plane ... destroy certain
// buildings that represent the people's GitHub ... cranes appear, and they rebuild ... the buildings return to their original
// state." One daily salvo on the viewer's clock: supply drop at 12:00, loading through the afternoon, salvo at 20:00, the
// damage holds to midnight, cranes rebuild from 00:00 to 12:00. Replay (Mike 11-08) is cinematic: one strike beat per city
// (most missiles first, raiders last), the camera zooms to the pad, follows the missiles into the hit, resets to the next
// city; then a wide shot with every smoke ribbon, the cranes in time-lapse, and the map is handed back. 35 to 100 s at 1x.
var BON=false,BDATA=window.CALDERA_BATTLE||null,BL={damage:true,attacks:true,shields:true},BPLAN=null,BREP=null,BLAST=0,BQ=-1,BBLD={},BBAT={},BHITB={},BSZ={orbital:1.3,beam:1.1,cannon:.95,catapult:.8};
var BSPD=1;   // the speed the next replay starts at (the page remembers the viewer's choice and sets it)
function bNow(){return BREP?(BREP.pauseAt!=null?BREP.vt:bVirt(BREP.vt,BREP.pt,BREP.sp,performance.now())):Date.now()}
function bS(){return BREP?BREP.R.S:BPLAN?BPLAN.S:null}
function bRedraw(){if(reduce)setTimeout(draw,0);else draw()}
function bNoonOf(t){var d=new Date(t);d.setHours(12,0,0,0);return d.getTime()}
/** the night the hub resolved inside (noon - 24h, noon]: it drops at that noon, fires at 20:00 and is rebuilt the next morning */
function bPick(noon){var c=[];if(BDATA&&BDATA.t0!=null)c.push({t0:BDATA.t0,shots:BDATA.shots||[],key:BDATA.night||''});if(BDATA&&BDATA.prev&&BDATA.prev.t0!=null)c.push({t0:BDATA.prev.t0,shots:BDATA.prev.shots||[],key:BDATA.prev.night||'p'});
  for(var i=0;i<c.length;i++)if(c[i].t0>noon-BDAY&&c[i].t0<=noon)return c[i];return null}
/** each member's GitHub buildings (the repo towers in their neighborhood), tallest first (the hub's lot is a tower index), and which building a tile is */
function bBuildings(){BBLD={};BBAT={};if(typeof GM==='undefined'||typeof tiles==='undefined')return;var own={};for(var k in GM){var g=GM[k];(g.n&&g.n.ds||[]).forEach(function(d){if(!d.estate)own[d.name]=k});BBLD[k]=[]}
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var t=tiles[i+','+j];if(!t||t.t!=='b'||!t.d||!t.r||t.r.kind)continue;var key=own[t.d.name];if(!key)continue;BBLD[key].push({i:i,j:j,r:t.r,p:iso(i,j),h:typeof bh==='function'?bh(t.r):40})}
  for(var kk in BBLD){BBLD[kk].sort(function(a,b){return (b.h-a.h)||(a.j-b.j)||(a.i-b.i)});BBLD[kk].forEach(function(b,ix){b.idx=ix;BBAT[b.i+','+b.j]={key:kk,idx:ix}})}}
/** the shot objects of a shot list, numbered per attacker (k), each with its launch point, target tower and flight length.
 *  A shot at a city with no repo towers has nowhere to land (Mike 11-08: never green space): it is dropped, not counted */
function bShots(raw){var byA={},shots=[],hit={},dropped=0;raw.forEach(function(s,ix){var a=s[0],o={ix:ix,a:a,d:s[1],w:s[2],f:s[3],lot:s[5],blocked:s[6]};var pad=bPad(a),from=pad?bPadLauncher(pad.x,pad.y):a.charAt(0)!=='@'?bSea(o.d):null,tg=bTargetOf(o);if(!from||!tg){dropped++;return}   // only raiders fire from the sea; a member without a pad has no launch point
    if(!byA[a])byA[a]=[];o.k=byA[a].length;byA[a].push(o);shots.push(o);o.from={x:from.x+8,y:from.y-24};o.pad=pad?{x:pad.x,y:pad.y}:o.from;o.to=tg;o.dist=Math.hypot(tg.x-o.from.x,tg.y-o.from.y);o.sz=BSZ[o.w]||1;
    if(o.f>0&&o.b){if(!hit[o.d])hit[o.d]={};if(!hit[o.d][o.b.idx])hit[o.d][o.b.idx]=[];hit[o.d][o.b.idx].push(o)}});
  return {shots:shots,byA:byA,hit:hit,n:shots.length,dropped:dropped}}
/** today's plan: the shots of the day's night; during a replay, the replay's own plan (the live one is left as it was) */
function bPlan(now){if(BREP)return BREP.P;var wall=Date.now(),noon=bNoonOf(wall),fire=wall>=noon,dayNoon=fire?noon:noon-BDAY,src=bPick(dayNoon),sig=dayNoon+'|'+(src?src.key+':'+src.shots.length:'-');
  if(BPLAN&&BPLAN.sig===sig)return BPLAN;
  bBuildings();var P=bShots(src?src.shots:[]);P.sig=sig;P.dayNoon=dayNoon;P.S=bSchedule(dayNoon,true);P.night=src?src.key:'';P.live=true;BPLAN=P;BHITB=P.hit;BLAST=0;BQ=-1;return BPLAN}
function bIndex(){BPLAN=null;if(BON)bPlan(Date.now())}
bIndex();
/** per-shot moments: the live day runs on the schedule and the shot's number, the replay on the beats */
function bFireOf(S,s){return S.live?bFireAt(S,s.k):s.rf}
function bImpactOf(S,s){return S.live?bFireAt(S,s.k)+bFlightDur(s.dist):s.ri}
function bFlightOf(S,s){return S.live?bFlightDur(s.dist):s.fl}
function bLandOf(S,s){return S.live?bLandAt(S,s.k):S.D-1}
function bLoadOf(S,s,n){return S.live?bLoadAt(S,s.k,n):S.D-1}
function bImpactAt(S,s){return bImpactOf(S,s)}
/** damage on one GitHub building (0..1, in sixths): full from each hit's impact until the hold ends, then down to nothing */
function bBld(t,i,j){if(!BON||!BL.damage)return 0;var P=BREP?BREP.P:BPLAN;if(!P)return 0;var e=BBAT[i+','+j];if(!e)return 0;var o=P.hit[e.key];if(!o||!o[e.idx])return 0;var S=bS(),now=bNow(),s=0;o[e.idx].forEach(function(h){s+=bHitDmg(S,h.f,bImpactOf(S,h),now)});return Math.min(1,Math.round(s*6)/6)}
/** the damage a building took this night, in sixths, as it stood when the hold ended (the break line is drawn from this while the cranes work, the build line rises through it) */
function bBldHeld(i,j){if(!BON||!BL.damage)return 0;var P=BREP?BREP.P:BPLAN;if(!P)return 0;var e=BBAT[i+','+j];if(!e)return 0;var o=P.hit[e.key];if(!o||!o[e.idx])return 0;var S=bS(),now=bNow(),s=0;o[e.idx].forEach(function(h){if(now>=bImpactOf(S,h))s+=h.f});return Math.min(1,Math.round(s*6)/6)}
/** rebuild progress 0..1 (0 while the damage holds) */
function bRebuild(){var S=bS();if(!S)return 0;var now=bNow();return now<S.hold?0:Math.min(1,(now-S.hold)/(S.end-S.hold))}
function bCenter(key){var g=GM[key];if(!g||!g.b)return null;var S=(g.cs||gState(g)).side;return iso(g.b.x+S/2-.5,g.b.y+S/2-.5)}
/** the ammo pad: the plot's front corner (the surveyed row beyond the road ring), in front of every building */
function bPad(key){var g=GM[key];if(!g||!g.b)return null;var S=(g.cs||gState(g)).side,k=Math.min(S+1,g.b.k-1);var p=iso(g.b.x+k,g.b.y+k);return {x:p.x,y:p.y+2}}
function bSea(key){var c=bCenter(key);return c?{x:c.x-260,y:c.y-150}:null}
/** a shot's aim point: the roof of one of the defender's repo towers (the hub's lot is a tower index, tallest first), with a
 *  small deterministic spread inside the roof diamond; a shield-held shot aims at the same roof (the dome takes it there).
 *  No towers: no target. A shot at the raiders goes to their sea point. */
function bTargetOf(s){if(s.d.charAt(0)!=='@')return bSea(s.a);var L=BBLD[s.d]||[];if(!L.length)return null;var b=L[(s.lot>=0?s.lot:s.ix)%L.length];s.b=b;var h=b.h!=null?b.h:typeof bh==='function'?bh(b.r):40;
  return {x:b.p.x+(rnd(s.ix*7.3+1.7)-.5)*TW*.2,y:b.p.y+4-h+(rnd(s.ix*3.1+2.3)-.5)*TH*.2}}
function bRgba(hx,a){var n=parseInt(hx.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function bShieldDome(c,x,y,rx,col,a){c.save();c.globalCompositeOperation='lighter';var gr=c.createRadialGradient(x,y-rx*.3,rx*.2,x,y-rx*.3,rx);gr.addColorStop(0,bRgba(col,0));gr.addColorStop(.85,bRgba(col,a*.5));gr.addColorStop(1,bRgba(col,a));c.fillStyle=gr;c.beginPath();c.ellipse(x,y-rx*.3,rx,rx*.75,0,0,7);c.fill();
  c.strokeStyle=bRgba(col,Math.min(1,a+.2));c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx,rx*.5,0,Math.PI,0);c.stroke();c.restore()}
function bCol(key){var g=GM[key];return g?gLang(g):key.charAt(0)==='@'?'#8B6CF6':'#B8B8C2'}
// ---- the replay: its own plan (a copy of today's shots, or the demo), the beats, the camera and the clock
/** a sample battle on the real map: the members with the most repo towers attack each other (synthetic shots), raiders last */
function bDemoShots(){bBuildings();var keys=Object.keys(BBLD).filter(function(k){return k.charAt(0)==='@'&&BBLD[k].length>0&&bPad(k)}).sort(function(a,b){return (BBLD[b].length-BBLD[a].length)||(a<b?-1:1)}).slice(0,5);
  if(keys.length<2)return [];var raw=[],counts=[5,4,3,2,2],W=['orbital','beam','cannon','catapult','cannon'];
  // each city fires at its nearest rivals (the two closest, most shots at the closest), so the arcs read on a phone
  keys.forEach(function(a,i){var n=counts[i]||2,ca=bCenter(a),near=keys.filter(function(k){return k!==a}).sort(function(p,q){var cp=bCenter(p),cq=bCenter(q);return Math.hypot(cp.x-ca.x,cp.y-ca.y)-Math.hypot(cq.x-ca.x,cq.y-ca.y)});
    for(var k=0;k<n;k++){var d=near[k%n<n-1||near.length<2?0:1],held=k===n-1&&n>2;raw.push([a,d,W[i%W.length],held?0:k%3===1?.5:1,0,held?-1:(k+i)%Math.max(1,BBLD[d].length),held?1:0,0])}});
  raw.push(['~raiders',keys[0],'cannon',1,0,0,0,0]);raw.push(['~raiders',keys[0],'cannon',.5,0,1%Math.max(1,BBLD[keys[0]].length),0,0]);return raw}
/** start a replay: today's shots (or the demo), the beats on a virtual clock from 0, the camera saved to come back to */
function bReplayStart(mode,sp){if(BREP)bReplayEnd(false);var demo=mode==='demo',raw=demo?bDemoShots():(bPick(bPlan(Date.now()).dayNoon)||{shots:[]}).shots;
  if(!raw.length)return 0;bBuildings();var P=bShots(raw);if(!P.n)return 0;P.demo=demo;P.night=demo?'demo':BPLAN?BPLAN.night:'';P.live=false;
  var R=bBeats(P.shots,0,reduce),home={x:(vw/2-cam.x)/cam.z,y:(vh*.52-cam.y)/cam.z,z:cam.z};P.S=R.S;
  // on a phone the map takes the whole screen for the replay (Mike 11-08: "couldn't really see it"); back to the page at the end
  var full=vw<700&&typeof cssFull==='function'&&typeof st!=='undefined'&&!st.classList.contains('c-full');if(full)cssFull(true);
  if(typeof flyStop==='function')flyStop();if(typeof INTRO!=='undefined'&&INTRO&&typeof introFinish==='function')introFinish(true);if(typeof BUILDING!=='undefined'&&BUILDING&&typeof buildDone==='function')buildDone();
  if(sp!=null)BSPD=bSpeedOf(sp);BREP={vt:0,pt:performance.now(),sp:BSPD,pauseAt:null,P:P,R:R,home:home,demo:demo,full:full,follow:true,ease:null};BHITB=P.hit;BLAST=0;BQ=-1;BP.length=0;BCOL.length=0;BFXT=0;bRibbonsClear();
  if(reduce&&typeof frame==='function'){BREP.timer=setInterval(function(){if(!BREP){return}frame()},120)}
  draw();return P.n}
/** the replay is over (or stopped): the map goes back to the live clock and the camera flies home */
function bReplayEnd(fly){if(!BREP)return;var h=BREP.home,full=BREP.full;if(BREP.timer)clearInterval(BREP.timer);BREP=null;BLAST=0;BQ=-1;BP.length=0;BCOL.length=0;bRibbonsClear();if(BPLAN)BHITB=BPLAN.hit;
  var go=function(){if(fly&&h&&typeof flyTo==='function')flyTo(vw/2-h.x*h.z,vh*.52-h.y*h.z,h.z,reduce?1:BRT.tail);else bRedraw()};
  if(full&&typeof cssFull==='function'){cssFull(false);setTimeout(go,60)}else go()}
/** skip to the next beat (a tap on the map, the Skip button); past the last beat: to the wide shot, then straight to the end */
/** jump the virtual clock to a moment in ms: the flights jumped over leave their ribbons and hits, no burst of effects */
function bJump(to){if(!BREP)return false;var now=bNow();if(to===now)return true;BREP.vt=to;BREP.pt=performance.now();var n2=bNow();
  BREP.P.shots.forEach(function(s){if(s.rf<n2&&(!s.tr||s.tr.pts.length<8||s.ri>now||to<now))bRibbonFill(s,n2,s.sz);else if(s.rf>=n2&&s.tr)s.tr.pts.length=0});BLAST=n2;BP.length=0;BCOL.length=0;bRedraw();return true}
/** step back: to the start of this strike (or the one before it when this one began under 1.5 s ago), then the pre-roll */
function bPrev(){if(!BREP)return false;var R=BREP.R,now=bNow(),to=0;R.beats.forEach(function(b){if(b.t0<now-1500)to=Math.max(to,b.t0)});return bJump(to)}
function bSkip(){if(!BREP)return false;var R=BREP.R,now=bNow(),to=null,st=bRepStage(R,now);
  if(st==='pre'||st==='beat'){for(var i=0;i<R.beats.length;i++)if(now<R.beats[i].end){to=R.beats[i].end;break}if(to==null)to=R.S.wide}else if(st==='wide')to=R.S.hold;else to=R.S.end;
  if(to==null||to<=now)return false;return bJump(to)}
function bPause(on){if(!BREP)return false;var was=BREP.pauseAt!=null;on=on==null?!was:!!on;if(on&&!was){BREP.vt=bNow();BREP.pauseAt=performance.now()}else if(!on&&was){BREP.pt=performance.now();BREP.pauseAt=null}draw();return on}
/** 0.5x, 1x or 2x (anything else is 1x), from now on: the virtual clock is re-anchored so the replay does not jump */
function bSpeed(v){BSPD=bSpeedOf(v);if(BREP){var now=bNow();BREP.vt=now;BREP.pt=performance.now();BREP.sp=BSPD}return BSPD}
// ---- the viewer's camera. Any pan or zoom hands the camera to the viewer (follow off); Follow gives it back with a short ease
function bUserCam(){if(BREP&&BON&&BREP.follow){BREP.follow=false;BREP.ease=null}}
function bFollow(on){if(!BREP)return false;on=on==null?true:!!on;if(typeof flyStop==='function')flyStop();if(on&&!BREP.follow){BREP.follow=true;BREP.ease=reduce?null:{t0:performance.now(),x:cam.x,y:cam.y,z:cam.z}}else if(!on){BREP.follow=false;BREP.ease=null}bRedraw();return BREP.follow}
function bFitAll(){bUserCam();var f=bFitCam();if(typeof flyStop==='function')flyStop();if(reduce||typeof flyTo!=='function'){cam.x=f.x;cam.y=f.y;cam.z=f.z;dirty=true;bRedraw()}else flyTo(f.x,f.y,f.z,350)}
/** the camera, every frame before anything is drawn (frame() calls it): where the beats want it, in css px */
function bCam(){if(!BREP||!BON||!BREP.follow)return;var R=BREP.R,c=bRepCam(R,bNow(),BREP.home,vw,vh,reduce);if(!c)return;var x=vw/2-c.x*c.z,y=vh*.52-c.y*c.z,z=c.z,E=BREP.ease;
  if(E){var u=(performance.now()-E.t0)/BCAMEASE;if(reduce||u>=1)BREP.ease=null;else{u=bEase(u);x=bLerp(E.x,x,u);y=bLerp(E.y,y,u);z=bLerp(E.z,z,u)}}   // Follow was just pressed: ease back to where the auto camera is
  if(Math.abs(x-cam.x)>.05||Math.abs(y-cam.y)>.05||Math.abs(z-cam.z)>1e-4){cam.x=x;cam.y=y;cam.z=z;dirty=true}}
/** the clock: the replay ends, the rebuild steps redraw the cache, events between the last frame and this one make their effects */
function bClock(now){var S=bS();if(!S)return;if(BREP&&now>=S.end){bReplayEnd(true);return}
  var q=now<S.hold?-1:Math.floor(Math.min(1,(now-S.hold)/(S.end-S.hold))*6);if(q!==BQ){var first=BQ===-1&&q===-1;BQ=q;if(!first)bRedraw()}}
function bBetween(t,a,b){return t>a&&t<=b}
/** the floors a hit takes off its tower (the damage step before and after this impact), as a collapse on the moving layer */
/** the shatter (Mike 11-11: "buildings should break apart into masses of small pixels"): the floors this hit takes, between the
 *  break lines before and after it, burst into voxels in the building's own colours thrown outward from the impact and up,
 *  that fall, bounce on the ground around the footprint and settle (the cached heap then holds the rubble). Capped per LOD */
function bShatterFor(s,iA){var b=s.b,P=bPlan(Date.now()),S=bS(),L=(P.hit[s.d]||{})[b.idx]||[],d0=0,d1=0;L.forEach(function(q){var ia=bImpactOf(S,q);if(ia<=iA)d1+=q.f;if(ia<iA)d0+=q.f});d0=Math.min(1,Math.round(d0*6)/6);d1=Math.min(1,Math.round(d1*6)/6);if(d1<=d0)return 0;
  var h=b.h,tiers=typeof towerTiers==='function'?towerTiers(h):[[.78,h]],w=tiers[0][0],base=b.p.y+4,lo=pxBreak(h,d1),hi=pxBreak(h,d0),col=bCol(s.d),st=Math.min(1.6,.6+s.f),max=bVoxMax();
  var sh=pxShards(b.p.x,base,w,lo,hi,col,hash(s.d)+s.ix*7,max),cx0=s.to.x,cy0=s.to.y;
  sh.forEach(function(q,k){var dx=q.x-cx0,dy=q.y-cy0,dd=Math.max(4,Math.hypot(dx,dy)),sp=(50+rnd(k*3.1+q.x)*120)*st,up=-(60+rnd(k*1.7+q.y)*150)*st;
    bEmit({k:'vox',x:q.x,y:q.y,vx:dx/dd*sp+(rnd(k+.4)-.5)*30,vy:dy/dd*sp*.4+up,g:q.g,s:.9+rnd(k*5.3)*1.3,col:q.col,life:2.6+rnd(k*2.9)*1.6})});return sh.length}
function bCollapseFor(s,iA,tn){var b=s.b,P=bPlan(Date.now()),S=bS(),L=(P.hit[s.d]||{})[b.idx]||[],d0=0,d1=0;L.forEach(function(q){var ia=bImpactOf(S,q);if(ia<=iA)d1+=q.f;if(ia<iA)d0+=q.f});d0=Math.min(1,Math.round(d0*6)/6);d1=Math.min(1,Math.round(d1*6)/6);if(d1<=d0)return;
  var h=b.h,tiers=typeof towerTiers==='function'?towerTiers(h):[[.62,h]];bCollapseAdd(b.p.x,b.p.y+4,Math.max(10,Math.round(h*(1-.5*d0))),Math.max(10,Math.round(h*(1-.5*d1))),tiers[tiers.length-1][0],bCol(s.d),tn,BREP?BCOLREP:BCOLMS)}
// ---- the damage tier readout (Mike 11-08: show the tier dropping): for 2.6 s after each impact, a pill over the tower with six pips
// (the tower's six damage steps; the ones this hit takes go red and fade) and the numbers, or "Shield held"
var BHLMS=2600;
/** the damage steps (0..6) a tower had just before and just after this shot's impact */
function bTiers(S,s){var P=BREP?BREP.P:BPLAN,L=P&&s.b&&P.hit[s.d]?P.hit[s.d][s.b.idx]||[]:[],ia=bImpactOf(S,s),d0=0,d1=0;L.forEach(function(q){var t=bImpactOf(S,q);if(t<=ia)d1+=q.f;if(t<ia)d0+=q.f});return [Math.min(6,Math.round(d0*6)),Math.min(6,Math.round(d1*6))]}
/** the impacts that are still on show at now, one per tower (the latest), newest last: {s, age, hit, t0, t1} */
function bHitsNow(P,S,now){var best={},out=[];P.shots.forEach(function(s){if(!s.to)return;var ia=bImpactOf(S,s),age=now-ia;if(age<0||age>=BHLMS)return;var hit=s.f>0&&!!s.b,key=s.d+'|'+(hit?s.b.idx:'sh'+Math.round(s.to.x));if(!best[key]||ia>best[key].ia)best[key]={s:s,ia:ia,age:age,hit:hit}});
  for(var k in best){var o=best[k],t=o.hit?bTiers(S,o.s):[0,0];out.push({s:o.s,ia:o.ia,age:o.age,hit:o.hit,t0:t[0],t1:t[1]})}return out.sort(function(a,b){return a.ia-b.ia})}
function bHitLabels(c,P,S,now){var L=bHitsNow(P,S,now);if(!L.length)return;L=L.slice(-6);c.save();c.font='600 10px IBM Plex Mono,Menlo,monospace';c.textBaseline='middle';c.textAlign='left';
  L.forEach(function(o){var x=cam.x+o.s.to.x*cam.z,y=cam.y+(o.s.to.y-34)*cam.z;if(!isFinite(x)||!isFinite(y)||x<-80||x>vw+80||y<-30||y>vh+30)return;
    var txt=o.hit?(6-o.t0)+' \u2192 '+(6-o.t1)+' of 6':'Shield held',tw=c.measureText(txt).width,pw=o.hit?6*8+5:0,w=8+pw+(pw?6:0)+tw+8,h=18,x0=Math.round(x-w/2),y0=Math.round(y-h/2),al=reduce?1:Math.min(1,o.age/150)*Math.min(1,(BHLMS-o.age)/500);
    c.globalAlpha=al;c.fillStyle='rgba(15,16,22,.94)';c.strokeStyle=o.hit?'rgba(255,255,255,.28)':'rgba(61,242,255,.7)';c.lineWidth=1;c.beginPath();if(c.roundRect)c.roundRect(x0,y0,w,h,9);else c.rect(x0,y0,w,h);c.fill();c.stroke();
    if(o.hit){for(var i=0;i<6;i++){var px=x0+8+i*8,left=i<6-o.t0?(i<6-o.t1?2:1):0;   // 2 whole, 1 lost by this hit, 0 lost earlier
      c.fillStyle=left===2?'#4FD1C5':left===1?'rgba(255,90,70,'+(reduce?.9:Math.max(.15,1-o.age/1400)).toFixed(2)+')':'rgba(255,255,255,.16)';c.fillRect(px,y0+5,6,h-10)}}
    c.fillStyle='#F2F2F5';c.fillText(txt,x0+8+pw+(pw?6:0),y0+h/2+.5)});c.restore()}
/** over the map, every frame: shields, pads with their stacks and launch centers, drops, loading, the countdown, the salvo,
 *  impacts, smoke ribbons and columns, and the counts */
function battleOver(){if(!BON||!BDATA||typeof GM==='undefined')return;var c=cx,tn=performance.now(),P=bPlan(Date.now()),S=bS(),now=bNow();bClock(now);P=bPlan(Date.now());S=bS();now=bNow();var dt=battleOver.tp?Math.min(.05,(tn-battleOver.tp)/1000):0;battleOver.tp=tn;
  if(BREP){if(typeof INTRO!=='undefined'&&INTRO&&typeof introFinish==='function')introFinish(true);if(typeof BUILDING!=='undefined'&&BUILDING&&typeof buildDone==='function')buildDone()}   // the city intro and new-land builds never run over a replay
  var rep=!!BREP,paused=rep&&BREP.pauseAt!=null,fx=BLAST>0&&now-BLAST<5000,last=BLAST;BLAST=now;BPMAX=bPoolMax();
  c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var M=BDATA.members||{},vb=hView(TH*3),inView=function(p){return p&&p.x>vb[0]-60&&p.x<vb[1]+60&&p.y>vb[2]-200&&p.y<vb[3]+80};
  if(BL.shields)for(var k in M){var ctr=bCenter(k),g=GM[k];if(!ctr||!g||!inView(ctr))continue;var sd=(g.cs||gState(g)).side,sh=M[k].sh||0;if(sh<=0)continue;bShieldDome(c,ctr.x,ctr.y+8,sd*TW*.42+20,M[k].beg?'#FFFFFF':'#3DF2FF',M[k].beg?.12:.08+.22*sh)}
  var badges=[],aAng=Math.atan2(BIY,BIX),padKeys={};for(var mk in M)padKeys[mk]=1;for(var ak in P.byA)if(ak.charAt(0)==='@')padKeys[ak]=1;
  if(BL.attacks)for(var h in padKeys){var pad=bPad(h);if(!pad)continue;var L=P.byA[h]||[],n=L.length,col=bCol(h),vis=inView(pad),seed=hash(h);
    var landed=0,fired=0,inPod=0,aim=-.95;L.forEach(function(s){if(bLandOf(S,s)<=now)landed++;if(bFireOf(S,s)<=now)fired++;if(bLoadOf(S,s,n)+S.loadDur<=now)inPod++});
    if(L.length&&L[0].to&&L[0].from)aim=bTraj(L[0].from.x,L[0].from.y,L[0].to.x,L[0].to.y,0).a;
    var rc=0;L.forEach(function(s){var f=bFireOf(S,s);if(now>=f&&now<f+700)rc=Math.max(rc,1-(now-f)/700)});
    if(vis){padHi(c,pad.x,pad.y,{col:col,lod:LODN});var st=bPadStack(pad.x,pad.y),la=bPadLauncher(pad.x,pad.y);
      // the stack: what has landed and is not yet on its way to the pod
      var inStack=0;L.forEach(function(s){if(bLandOf(S,s)<=now&&bLoadOf(S,s,n)>now)inStack++});stackHi(c,st.x,st.y,inStack,col,BSZ[L.length?L[0].w:'']||1);
      var tip=launcherHi(c,la.x,la.y,{col:col,seed:seed,loaded:inPod,fired:fired,aim:aim,recoil:rc,t:reduce?0:tn,lod:LODN,size:1});
      if(LODN>0)L.forEach(function(s){var k=s.k,sz=BSZ[s.w]||1,slot=bSlot(k),fA=bFireOf(S,s);
        if(S.live&&k<12){var dA=bDropAt(S,k),lA=bLandAt(S,k),oA=bLoadAt(S,k,n);
          if(now>=dA&&now<lA)chuteHi(c,st.x+slot.x,st.y+slot.y-1.6,(now-dA)/S.fall,col,sz,seed+k);
          else if(now>=lA&&now<lA+600){chuteDownHi(c,st.x+slot.x,st.y+slot.y,(now-lA)/600,col);if(fx&&bBetween(lA,last,now))bLandFx(st.x+slot.x,st.y+slot.y)}
          if(now>=oA&&now<oA+S.loadDur){var u=bEase((now-oA)/S.loadDur),m=tip.mz[k%12],x0=st.x+slot.x,y0=st.y+slot.y-1.6,x1=m[0]-tip.nx*4,y1=m[1]-tip.ny*4,lift=Math.sin(u*Math.PI)*12;
            missileHi(c,bLerp(x0,x1,u),bLerp(y0,y1,u)-lift,bLerp(aAng+Math.PI,aim,u),sz,col,0)}}
        if(fx&&bBetween(fA,last,now)){var mm=tip.mz[k%12];if(rep)bLaunchFxBig(mm[0],mm[1],aim);else bLaunchFx(mm[0],mm[1],aim)}
        s.from={x:tip.mz[k%12][0],y:tip.mz[k%12][1]}})}
    badges.push([pad.x+30,pad.y-40,Math.max(0,landed-fired),col,rc,vis])}
  if(rep)bDrawRibbons(c,now);
  // missiles in flight and their hits (also for raiders, who fire from the sea with no pad)
  P.shots.forEach(function(s){if(!s.from||!s.to)return;var fA=bFireOf(S,s),dur=bFlightOf(S,s),iA=fA+dur,sz=BSZ[s.w]||1;
    if(bBetween(iA,last,now)){if(rep&&(!s.tr||s.tr.pts.length<8))bRibbonFill(s,iA,sz);if(fx&&s.f>0&&s.b&&!reduce){bImpactFx(s.to.x,s.to.y+4,bCol(s.d),s.f*(rep?1.3:1),s.b.p.y+4);bShatterFor(s,iA)}else if(fx&&!reduce)bShieldFx(s.to.x,s.to.y,'#3DF2FF');if(s.f>0&&s.b)bRedraw()}
    if(s.a.charAt(0)!=='@'&&fx&&bBetween(fA,last,now)){if(rep)bLaunchFxBig(s.from.x,s.from.y,-1);else bLaunchFx(s.from.x,s.from.y,-1)}
    if(now>=fA&&now<iA&&BL.attacks&&(inView(s.from)||inView(s.to)||rep)){var tr=bTraj(s.from.x,s.from.y,s.to.x,s.to.y,(now-fA)/dur);missileHi(c,tr.x,tr.y,tr.a,sz,bCol(s.a),tr.boost);
      if(rep){if(!paused)bRibbonAdd(s,tr.x-Math.cos(tr.a)*6*sz,tr.y-Math.sin(tr.a)*6*sz,now,sz)}else if(Math.floor(tn/50)%2===0&&BP.length<BPMAX-30)bTrailFx(tr.x,tr.y,tr.a,sz)}});
  if(dt>0&&!paused){var spd=rep?BREP.sp:1;BFXT+=dt*1000*spd;bStep(dt*spd)}bDrawCollapse(c,BFXT);bDrawParticles(c);
  // smoke on badly hit buildings (at most 6 columns in view)
  if(BL.damage){var nSm=0;for(var hk in P.hit){var bl=BBLD[hk]||[];for(var bi in P.hit[hk]){var b=bl[+bi];if(!b||nSm>=6)continue;var d=bBld(null,b.i,b.j);if(d<.5)continue;var hh=typeof bh==='function'?bh(b.r):40,rb=bRebuild(),top=b.p.y+4-Math.max(pxBreak(hh,bBldHeld(b.i,b.j)),rb*hh);if(!inView(b.p))continue;nSm++;if(rb<=0)smokeHi(c,b.p.x+2,top-6,d>=1)}}
    // the rebuild, pixel by pixel: while the cranes work, voxels in the building's colours fly in from the hook and land on the build line
    if(BL.damage&&!reduce&&dt>0){var rb2=bRebuild();if(rb2>0&&rb2<1){var nB=0;for(var hk2 in P.hit){var bl2=BBLD[hk2]||[];for(var bi2 in P.hit[hk2]){var b2=bl2[+bi2];if(!b2||nB>=8||!inView(b2.p))continue;var dh=bBldHeld(b2.i,b2.j);if(dh<=0)continue;nB++;
      if(rnd(Math.floor(tn/140)+b2.i*3+b2.j)<.5){var h2=typeof bh==='function'?bh(b2.r):40,tiers2=typeof towerTiers==='function'?towerTiers(h2):[[.78,h2]],w2=tiers2[0][0],hw2=TW/2*w2,hh2=TH/2*w2,base2=b2.p.y+4,yb=rb2*h2,side=rnd(tn+b2.i)<.5?0:1,u=.05+rnd(tn*.7+b2.j)*.9,q=fpt(b2.p.x,base2,hw2,hh2,side,u,yb+(rnd(tn+u)-.5)*2),cr2=rgb(bCol(hk2)),L2=P.light;
        bEmit({k:'build',x0:b2.p.x+4+(rnd(tn*.3)-.5)*20,y0:base2-h2-40,x1:q[0],y1:q[1],x:0,y:0,arc:8+rnd(tn)*10,s:.8+rnd(tn*1.3)*.8,col:hex([cr2[0]*L2,cr2[1]*L2,cr2[2]*L2]),life:.8+rnd(tn*.9)*.4})}}}}}}
  // the counts and the countdown, in screen space
  c.setTransform(dpr,0,0,dpr,0,0);badges.forEach(function(b){if(b[5])badgeHi(c,cam.x+b[0]*cam.z,cam.y+b[1]*cam.z,b[2],b[3],b[4])});
  if(rep)bHitLabels(c,P,S,now);
  if(S.live&&now>=S.count&&now<S.salvo&&P.n>0)countdownHi(c,vw/2,vh*.42,(now-S.count)/(S.salvo-S.count))}
/** the world card's battle lines */
function battleCard(key){if(!BON||!BDATA)return '';var m=(BDATA.members||{})[key];
  if(!m)return '<div class="c-grow"><div class="row"><span>Battles</span><b>Peaceful zone</b></div></div>';
  var P=bPlan(Date.now()),S=bS(),now=bNow(),mine=P.byA[key]||[],seg=bSegment(S,now),took=0,open=0;for(var bi in (P.hit[key]||{})){var b=(BBLD[key]||[])[+bi];(P.hit[key][bi]||[]).forEach(function(h){took+=h.f});if(b)open+=bBld(null,b.i,b.j)}
  var wn={orbital:'orbital',beam:'beam',cannon:'cannon',catapult:'catapult'}[m.best]||'catapult',lab={idle:'quiet',supply:'supply drop',loading:'loading',countdown:'countdown',salvo:'salvo',damage:'hit, cranes at midnight',rebuild:'rebuilding, whole by noon'}[seg];
  return '<div class="c-grow"><div class="row"><span>Shield</span><b>'+Math.round((m.sh||0)*100)+'%'+(m.beg?' (beginner)':'')+'</b></div>'
    +'<div class="row"><span>Today</span><b>'+mine.length+' missile'+(mine.length===1?'':'s')+' ('+e(wn)+'), '+lab+'</b></div>'
    +(took>0?'<div class="row"><span>Hits taken</span><b>'+Math.round(took*10)/10+' facade'+(took===1?'':'s')+(seg==='rebuild'?', '+Math.round(bRebuild()*100)+'% rebuilt':'')+'</b></div>':'')+'</div>'}
window.CALDERA_BATTLE_API={
  view:function(on,data){BON=!!on;if(data)BDATA=data;if(!on&&BREP)bReplayEnd(false);bIndex();if(!on){BP.length=0}draw()},
  layers:function(o){for(var k in o)if(k in BL)BL[k]=!!o[k];draw()},
  /** the cinematic replay of today's shots ('demo': a sample battle between the biggest cities). Returns the missile count */
  replay:function(mode,o){return bReplayStart(mode,o&&o.speed)},
  stop:function(){if(BREP)bReplayEnd(true)},
  skip:function(){return bSkip()},
  next:function(){return bSkip()},
  prev:function(){return bPrev()},
  /** 0.5, 1 or 2: the replay clock's rate (kept for the next replay too). Returns the speed in force */
  speed:function(v){return v==null?(BREP?BREP.sp:BSPD):bSpeed(v)},
  /** the viewer's camera: follow(true|false) gives it back to the auto camera or takes it; fit() frames the whole battlefield */
  follow:function(on){return bFollow(on)},
  fit:function(){bFitAll();return true},
  camera:function(){var l=bCamLim();return {follow:BREP?BREP.follow:false,x:cam.x,y:cam.y,z:cam.z,minZ:l.min,maxZ:l.max}},
  seek:function(ms){return bJump(Math.max(0,+ms||0))},
  dbg:function(){if(!BREP)return null;var ok=BREP.P.shots.every(function(s){return s.b&&s.to&&Math.abs(s.to.x-s.b.p.x)<=TW/2&&Math.abs(s.to.y-(s.b.p.y+4-s.b.h))<=TH/2||s.d.charAt(0)!=='@'});var b=bBeatAt(BREP.R,bNow())||BREP.R.beats[0],pad=bPad(b.a);return {onBuildings:ok,dropped:BREP.P.dropped,n:BREP.P.n,beats:BREP.R.beats.map(function(x){return {a:x.a,d:x.d,targets:x.targets,self:x.shots.some(function(q){return q.a===q.d}),t0:x.t0,launch:x.launch,hit:x.hit,end:x.end,ri:x.lead.ri,dist:Math.round(x.lead.dist)}}),S:BREP.R.S,cam:[cam.x,cam.y,cam.z,vw,vh],from:b.lead.from,to:b.lead.to,pad:pad,g:GM[b.a]&&GM[b.a].b,frame:bRepCam(BREP.R,bNow(),BREP.home,vw,vh,reduce),keys:Object.keys(BREP.P.byA)}},
  pause:function(on){return bPause(on)},
  fly:function(h){return window.CALDERA_GROWTH_API&&window.CALDERA_GROWTH_API.plot?window.CALDERA_GROWTH_API.plot(h,1.3):false},
  phase:function(){var P=bPlan(Date.now()),S=bS(),now=bNow(),seg=bSegment(S,now),landed=0,fired=0;P.shots.forEach(function(s){if(bLandOf(S,s)<=now)landed++;if(bFireOf(S,s)<=now)fired++});
    var until=seg==='rebuild'?S.end:seg==='salvo'||seg==='damage'?S.hold:S.salvo,o={seg:seg,until:BREP?Date.now()+bRealMs(until-now,BREP.sp):until,salvoAt:S.salvo,total:P.n,landed:landed,fired:fired,night:P.night,replay:!!BREP,rebuilt:bRebuild()};
    if(BREP){var R=BREP.R,b=bBeatAt(R,now),st=bRepStage(R,now),nb=null;if(!b&&st!=='wide'&&st!=='rebuild')for(var i=0;i<R.beats.length;i++)if(now<R.beats[i].t0){nb=R.beats[i];break}var cur=b||nb;
      o.speed=BREP.sp;o.follow=BREP.follow;var hn2=bHitsNow(BREP.P,BREP.R.S,now),lh=hn2.length?hn2[hn2.length-1]:null;o.hit=lh?{d:lh.s.d,from:6-lh.t0,to:6-lh.t1,of:6,shield:!lh.hit}:null;o.stage=st;o.beats=R.beats.length;o.beat=cur?cur.i+1:R.beats.length;o.demo=!!BREP.demo;o.paused=BREP.pauseAt!=null;o.t=now;o.dur=R.S.end;o.seg=st==='beat'||st==='pre'?'salvo':st==='wide'?'damage':st==='rebuild'?'rebuild':'idle';
      o.label=cur?(cur.raid?'Raiders':cur.a)+' → '+(cur.d.charAt(0)==='@'?cur.d:'the sea')+(cur.targets.length>1?' +'+(cur.targets.length-1):'')+' · '+cur.n+' missile'+(cur.n===1?'':'s'):st==='wide'?'Every strike landed':st==='rebuild'?'Cranes, '+Math.round(bRebuild()*100)+'% rebuilt':'';}
    return o},
  state:function(){return {on:BON,layers:BL,phase:this.phase(),cities:BDATA&&BDATA.members?Object.keys(BDATA.members).length:0}},
  dmg:function(i,j){return bBld(null,i,j)}};
`;

export const BATTLE_DRAW_JS = BATTLE_ART_JS + BATTLE_LOGIC_JS;
