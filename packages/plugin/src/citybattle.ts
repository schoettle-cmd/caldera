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
function missileHi(c,x,y,a,sz,col,boost){var n=hn(),L=(sz<.8?7:10)*sz,R=1.5*sz;if(sz<.8)boost=0;   // a shell is short and has no motor; a cruise missile (sz 1.4) carries wings
  c.save();c.translate(x,y);c.rotate(a);
  if(boost>0){c.save();c.globalCompositeOperation='lighter';var pl=(6+8*boost)*sz,g=c.createLinearGradient(-L/2,0,-L/2-pl,0);g.addColorStop(0,'rgba(255,250,230,.95)');g.addColorStop(.25,'rgba(255,190,80,.8)');g.addColorStop(.6,'rgba(255,110,40,.35)');g.addColorStop(1,'rgba(255,80,20,0)');c.fillStyle=g;
    c.beginPath();c.moveTo(-L/2,-R*.7);c.lineTo(-L/2-pl,-R*1.6-(rnd(x)*.6));c.lineTo(-L/2-pl*1.15,0);c.lineTo(-L/2-pl,R*1.6+(rnd(y)*.6));c.lineTo(-L/2,R*.7);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(-L/2-1.2*sz,0,2*sz,R*.8,0,0,7);c.fill();c.restore()}
  var bg=c.createLinearGradient(0,-R,0,R);bg.addColorStop(0,n?'#C9CDD4':'#F4F5F7');bg.addColorStop(.5,n?'#9AA1AD':'#D5D9DF');bg.addColorStop(1,n?'#555B68':'#8A9099');
  c.fillStyle='#2A2D35';c.beginPath();c.moveTo(-L/2,-R*1.9);c.lineTo(-L/2+3*sz,-R);c.lineTo(-L/2+3*sz,R);c.lineTo(-L/2,R*1.9);c.closePath();c.fill();
  if(sz>=1.35){c.fillStyle='#3A3F4A';c.beginPath();c.moveTo(L*.08,-R);c.lineTo(-L*.16,-R*3.4);c.lineTo(-L*.26,-R*3.4);c.lineTo(-L*.12,-R);c.closePath();c.fill();c.beginPath();c.moveTo(L*.08,R);c.lineTo(-L*.16,R*3.4);c.lineTo(-L*.26,R*3.4);c.lineTo(-L*.12,R);c.closePath();c.fill()}
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
  else if(p.k==='rez'){p.vy+=40*dt;p.vx*=(1-1.2*dt);p.vy*=(1-1.2*dt);p.x+=p.vx*dt;p.y+=p.vy*dt}
  else if(p.k==='debris'||p.k==='spark'||p.k==='glass'){p.vy+=(p.k==='spark'?90:p.k==='glass'?200:240)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>p.g){p.y=p.g;p.vy=-p.vy*.35;p.vx*=.6;if(Math.abs(p.vy)<8)p.vy=0}p.rot+=p.vr*dt}
  else{p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.k==='smoke'){p.vx*=(1-.8*dt);p.vy-=14*dt}}}}
function bDrawParticles(c){BP.forEach(function(p){var f=p.age/p.life;
  if(p.k==='smoke'||p.k==='dust'){var r=p.r0+(p.r1-p.r0)*f,al=p.al*(1-f)*(f<.15?f/.15:1),g=c.createRadialGradient(p.x,p.y,r*.15,p.x,p.y,r);g.addColorStop(0,'rgba('+p.col+','+al.toFixed(3)+')');g.addColorStop(1,'rgba('+p.col+',0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r,0,7);c.fill()}
  else if(p.k==='vox'){var av=f>.72?(1-f)/.28:1;if(av<1)c.globalAlpha=av;c.fillStyle=p.col;c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);if(p.s>1&&!p.down){c.fillStyle='rgba(255,255,255,.28)';c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s*.4)}if(av<1)c.globalAlpha=1}
  else if(p.k==='build'){c.fillStyle=p.col;c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);if(f>.85){c.fillStyle='rgba(255,255,255,'+((f-.85)/.15*.8).toFixed(2)+')';c.fillRect(p.x-p.s,p.y-p.s,p.s*2,p.s*2)}}
  else if(p.k==='debris'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.col;c.globalAlpha=f>.8?(1-f)/.2:1;c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*.35);c.restore()}
  else if(p.k==='rez'){var on=f<.55||rnd(Math.floor(p.age*22)+p.ph)>f*.9,s2=p.s*(f<.7?1:1-(f-.7)/.3*.6);if(on){var ar=f<.7?1:(1-f)/.3;c.globalAlpha=ar;c.fillStyle=f<.25?p.col:f<.6?'#7FF6FF':'#E8FEFF';c.fillRect(p.x-s2/2,p.y-s2/2,s2,s2);c.strokeStyle='rgba(61,242,255,'+(.9*ar).toFixed(2)+')';c.lineWidth=.5;c.strokeRect(p.x-s2/2,p.y-s2/2,s2,s2);c.globalAlpha=1}}   // 11-14 the derezz: a cube in the city's colour goes cyan, then white, flickers and is gone
  else if(p.k==='glass'){var tw=.5+.5*Math.sin(p.age*30+p.rot*7);c.fillStyle='rgba('+(tw>.7?'255,255,255':'190,228,250')+','+(f>.8?(1-f)/.2:1).toFixed(2)+')';c.fillRect(p.x-.6,p.y-.6,1.2,1.2)}
  else if(p.k==='spark'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,'+Math.round(200-120*f)+',80,'+(1-f).toFixed(3)+')';c.lineWidth=.8;hline(c,p.x,p.y,p.x-p.vx*.03,p.y-p.vy*.03);c.restore()}
  else if(p.k==='flash'){c.save();c.globalCompositeOperation='lighter';var rr=p.r0+(p.r1-p.r0)*Math.sqrt(f),g2=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);g2.addColorStop(0,'rgba(255,255,240,'+(.95*(1-f)).toFixed(3)+')');g2.addColorStop(.4,'rgba(255,190,90,'+(.7*(1-f)).toFixed(3)+')');g2.addColorStop(1,'rgba(255,120,40,0)');c.fillStyle=g2;c.beginPath();c.arc(p.x,p.y,rr,0,7);c.fill();c.restore()}
  else if(p.k==='fire'){c.save();c.globalCompositeOperation='lighter';var rf=p.r0+(p.r1-p.r0)*Math.min(1,f*2.2),af=Math.pow(1-f,1.4),g3=c.createRadialGradient(p.x,p.y,0,p.x,p.y,rf);g3.addColorStop(0,'rgba(255,250,220,'+(.95*af).toFixed(3)+')');g3.addColorStop(.35,'rgba(255,170,60,'+(.8*af).toFixed(3)+')');g3.addColorStop(.7,'rgba(230,80,30,'+(.45*af).toFixed(3)+')');g3.addColorStop(1,'rgba(120,30,10,0)');c.fillStyle=g3;c.beginPath();c.arc(p.x,p.y,rf,0,7);c.fill();c.restore()}
  else if(p.k==='ring'){c.save();c.strokeStyle='rgba(255,230,190,'+(.7*(1-f)).toFixed(3)+')';c.lineWidth=1.2*(1-f)+.3;c.beginPath();c.ellipse(p.x,p.y,p.r1*f+1,(p.r1*f+1)*.5,0,0,7);c.stroke();c.restore()}})}
/** what a hit does to the air: flash and fireball, shock ring, chunks of the building in its own colours and window glass
 *  (bigger and more of them for a big hit), sparks, a dust cloud, then smoke. gy = the ground under the hit (chunks land there) */
var BFXN={debris:[14,24,40,64],panel:[2,4,7,12],glint:[16,28,48,80],spark:[10,16,28,44],dust:[5,8,14,22],smoke:[4,6,10,16],flash:[18,30,60,140],fire:[12,20,34,64],ring:[24,40,70,120],k:[.7,1,1.35,1.8]},
  BFXFLOOR={debris:6,panel:1,glint:4,spark:4,dust:2,smoke:1};
/** the budget scale (spec): walked in x1 (phone .45), street x.4 (phone .25), world map x.08 */
function bFxScale(){var ph=vw<700;return LODN>=2?(ph?.45:1):LODN===1?(ph?.25:.4):.08}
/** a hit (11-14, Mike: "way more shrapnel"): flash, fireball and air ring, chunks of the building in its own colours, facade panels
 *  that hang then tumble, glass glints, sparks, dust (60% at the hit, 40% at the foot) and smoke. Counts per size from the spec,
 *  scaled to the zoom and the device; a shield cuts them to max(.25, 1 - shield). k = size class 0..3 (S M L XL), from w or strength */
function bImpactFx(x,y,col,strength,gy,w,sh){var k=w!=null&&BCLS[w]!=null?BCLS[w]:strength<.45?0:strength<.8?1:strength<1.4?2:3,K=BFXN.k[k],g0=gy==null?y+2:gy,sc=bFxScale()*Math.max(.25,1-(sh||0)),
    N=function(nm){var v=Math.round(BFXN[nm][k]*sc);if(LODN<1&&(nm==='panel'||nm==='glint'))return 0;return Math.max(BFXFLOOR[nm],v)},big=LODN<1?2.5:1;
  bEmit({k:'flash',x:x,y:y-4,r0:4,r1:BFXN.flash[k],life:.34});bEmit({k:'fire',x:x,y:y-6,vx:0,vy:-16,r0:3,r1:BFXN.fire[k],life:.9+k*.07});bEmit({k:'ring',x:x,y:y,r1:BFXN.ring[k],life:.7});
  var cols=[hmul(col,.92),hmul(col,.7),hmul(col,.5),'#8A8A93','#C9E3F6','#3A3D47'],nd=N('debris');for(var q=0;q<nd;q++){var an=rnd(q*3.7+x)*6.283,sp=(50+rnd(q+y)*110)*K;bEmit({k:'debris',x:x+(rnd(q)-.5)*10,y:y-6,vx:Math.cos(an)*sp,vy:-(60+rnd(q*5+.2)*150)*K,g:g0+rnd(q*7)*12,rot:rnd(q)*6,vr:(rnd(q+.3)-.5)*16,s:(.9+rnd(q*11)*3.3)*big,col:cols[Math.floor(rnd(q*2+.5)*cols.length)],life:1.5+rnd(q)*1.1})}
  var np=N('panel');for(var j=0;j<np;j++)bEmit({k:'debris',x:x+(rnd(j*4.1+y)-.5)*14,y:y-2+rnd(j)*6,vx:(rnd(j*2.3+x)-.5)*40,vy:-6-rnd(j*1.3)*20,g:g0+rnd(j*3)*8,rot:rnd(j*5)*6,vr:(rnd(j+.9)<.5?-1:1)*(3+rnd(j*6)*6),s:2+rnd(j*7)*2.5,col:hmul(col,.8+rnd(j)*.15),life:2.4+rnd(j)*.8});   // facade panels: 4-9 px, tumbling down the face
  var ng=N('glint');for(var gq=0;gq<ng;gq++){var ag=rnd(gq*2.9+x)*6.283,vg=(40+rnd(gq+y)*120)*K;bEmit({k:'glass',x:x+(rnd(gq)-.5)*8,y:y-4,vx:Math.cos(ag)*vg,vy:-40-rnd(gq*3.3)*90,g:g0+rnd(gq*5)*10,rot:rnd(gq*1.7),vr:0,life:1+rnd(gq)*.8})}
  var ns=N('spark');for(var s2=0;s2<ns;s2++){var a2=rnd(s2*5+x)*6.283,v=(90+rnd(s2)*120)*K;bEmit({k:'spark',x:x,y:y-5,vx:Math.cos(a2)*v,vy:-40-rnd(s2+.7)*130,g:y+6,rot:0,vr:0,life:.5+rnd(s2)*.3})}
  var nu=N('dust');for(var d=0;d<nu;d++)bEmit({k:'dust',x:x+(rnd(d*9+x)-.5)*20,y:(d<nu*.6?y:g0)-2,vx:(rnd(d+.1)-.5)*28,vy:-4-rnd(d)*6,r0:3,r1:(14+rnd(d*3)*10)*K,al:.42,col:hn()?'120,110,100':'170,160,145',life:2.4+rnd(d)*1.2});
  var nm2=N('smoke');for(var m=0;m<nm2;m++)bEmit({k:'smoke',x:x+(rnd(m*2+y)-.5)*8,y:y-8-m*2,vx:(rnd(m)-.5)*6,vy:-10-rnd(m*4)*8,r0:2.5,r1:12*K,al:.45,col:hn()?'80,82,92':'110,110,120',life:2.8+rnd(m)*1.5})}
/** the L and XL sizes on top (11-14: "escalated nukes, like larger explosions and larger desolations"): a white flash as wide as
 *  the blast, a fireball, two or three ground shock rings racing out to the scorch line, a dust skirt rolling out, and for XL a
 *  mushroom: a fire column with a dark cap */
function bBigFx(x,y,gy,w,col,now){var D=BDES[w];if(!D)return;var T=BTILE,ph=vw<700,sc=bFxScale();
  if(!D.xl){bEmit({k:'fire',x:x,y:y-8,vx:0,vy:-24,r0:6,r1:34,life:1.1});bEmit({k:'ring',x:x,y:gy,r1:2.25*T,life:.6});
    for(var q=0;q<Math.max(6,Math.round(16*sc));q++)bEmit({k:q%3?'smoke':'fire',x:x+(rnd(q*3+x)-.5)*6,y:gy-4-q*3.6,vx:(rnd(q)-.5)*4,vy:-14-rnd(q*2)*8,r0:3,r1:9+rnd(q)*5,al:.5,col:hn()?'70,66,70':'110,104,104',life:1.4});   // the column to 60 px
    bFlash(now,.18,140);bShake(now,3,350);return}
  bEmit({k:'flash',x:x,y:y-10,r0:10,r1:140,life:.45});bEmit({k:'fire',x:x,y:y-10,vx:0,vy:-37,r0:10,r1:64,life:2.4});bEmit({k:'fire',x:x,y:y-6,vx:0,vy:-30,r0:14,r1:90,life:2});
  bEmit({k:'ring',x:x,y:gy,r1:4.5*T,life:.9});bEmit({k:'ring',x:x,y:gy-40,r1:2.2*T,life:.6});
  var nk=Math.max(8,Math.round(24*sc));for(var a=0;a<nk;a++){var an=a/nk*6.283;bEmit({k:'dust',x:x+Math.cos(an)*T*.4,y:gy+Math.sin(an)*T*.2,vx:Math.cos(an)*2.5*T/1.3,vy:Math.sin(an)*1.25*T/1.3,r0:5,r1:16+rnd(a)*10,al:.5,col:hn()?'110,96,82':'170,150,128',life:1.5+rnd(a*3)*.4})}   // the brown dust wall to 2.5 tiles
  for(var k2=0;k2<Math.round(24*sc);k2++){var ak=rnd(k2*1.9+gy)*6.283,sp=120+rnd(k2*2.7)*200;bEmit({k:'debris',x:x,y:y-4,vx:Math.cos(ak)*sp,vy:-140-rnd(k2*4.1)*200,g:gy+(rnd(k2*6)-.3)*T,rot:rnd(k2)*6,vr:(rnd(k2+.2)-.5)*18,s:1+rnd(k2*8)*3,col:k2%3?hmul(col,.6):'#3A3D47',life:2.2+rnd(k2)*1})}
  bMushroom(x,gy,ph?44:87,1);bFlash(now,.45,300);bShake(now,ph?5:7,900)}
/** the mushroom (spec): a stem 14 px wide rising at 42 px/s, a cap at 150 px growing to r 46 that glows orange then hangs grey-brown */
function bMushroom(x,gy,n,s){n=Math.round(n*Math.max(.3,Math.min(1,bFxScale()*1.4)));var st=Math.round(n*.25);for(var m=0;m<st;m++)bEmit({k:m%2?'fire':'smoke',x:x+(rnd(m*3+x)-.5)*14*s,y:gy-6-m*(140*s/st),vx:0,vy:-42,r0:4*s,r1:(9+rnd(m)*4)*s,al:.55,col:hn()?'64,58,58':'104,96,94',life:1.5+rnd(m)*.4});
  for(var q=st;q<n;q++){var an=rnd(q*5.3+x)*6.283,rr=Math.sqrt(rnd(q*2.9))*46*s,cx0=x+Math.cos(an)*rr,cy0=gy-150*s+Math.sin(an)*rr*.45;if(q%3===0)bEmit({k:'fire',x:cx0,y:cy0,vx:Math.cos(an)*8,vy:-6,r0:6*s,r1:(14+rnd(q)*8)*s,life:1.5});
    else bEmit({k:'smoke',x:cx0,y:cy0,vx:Math.cos(an)*10*s,vy:-4-rnd(q*3)*4,r0:6*s,r1:(18+rnd(q)*12)*s,al:.6,col:hn()?'60,52,48':'104,92,84',life:5+rnd(q)*2})}}
/** the last strike's blast on the fallen city: the biggest flash of the night, a fireball over the whole city, three rings past
 *  its edge, a tall mushroom; the screen goes white for a moment (battleOver) and the camera shakes */
function bNukeFx(x,top,gy,R){var lite=vw<700?.6:1;bEmit({k:'flash',x:x,y:top,r0:20,r1:R*1.3+140,life:.8});bEmit({k:'fire',x:x,y:top+10,vx:0,vy:-10,r0:20,r1:R*.6+60,life:2.2});bEmit({k:'fire',x:x,y:gy-10,vx:0,vy:-3,r0:16,r1:R*.8+40,life:1.6});
  [1.1,1.6,2.3].forEach(function(f,k){bEmit({k:'ring',x:x,y:gy,r1:(R+TW)*f,life:1.1+k*.5})});
  var nk=Math.round(28*lite);for(var a=0;a<nk;a++){var an=a/nk*6.283;bEmit({k:'dust',x:x+Math.cos(an)*R*.3,y:gy+Math.sin(an)*R*.15,vx:Math.cos(an)*(R+80),vy:Math.sin(an)*(R+80)*.5,r0:6,r1:22+rnd(a)*14,al:.55,col:hn()?'105,95,88':'170,160,148',life:2.6+rnd(a*3)*.8})}
  bMushroom(x,gy,lite<1?50:100,1.35)}
/** a fallen item's cubes as one more sixth of it derezzes (u0 to u1): the floors it loses go into cubes that drift up and out
 *  from ground zero, glow cyan, flicker and vanish. Budget: the pool's share over every item and step of the fall */
function bRezFx(it,u0,u1,F){var col=bCol(F.key),ph=vw<700,tot=LODN<1?160:ph?800:2500,mx=ph?180:420;if(F.area==null){F.area=0;F.items.forEach(function(x){F.area+=x.h})}   // spec: 2500 cubes for the city on a desktop, 800 on a phone, 160 on the world map
  var share=Math.max(it.t==='b'?14:6,Math.min(mx,Math.round(tot*it.h/Math.max(1,F.area)))),per=Math.max(1,Math.round(share/(it.t==='b'?6:1))),cs=LODN<1?5:ph?2.5:2,cr=LODN<1?2:ph?2:1.5,sh=[];
  if(it.t==='b'){var h=it.b.h,tiers=typeof towerTiers==='function'?towerTiers(h):[[.78,h]];sh=pxShards(it.p.x,it.p.y+4,tiers[0][0],h*(1-u1),h*(1-u0)+1,col,hash(F.key)+it.b.idx*13+Math.round(u1*6),per)}
  else{if(!(u0<.5&&u1>=.5)&&it.t==='l')return;var hh=it.h*(it.t==='s'?.6:1);for(var k=0;k<per;k++){var s=it.p.x*.37+it.p.y+k*1.618;sh.push({x:it.p.x+(rnd(s)-.5)*TW*.7,y:it.p.y+4-rnd(s+1)*hh,col:k%3?col:hmul(col,.7)})}}
  sh.forEach(function(q,k){var dx=q.x-F.c.x,dy=(q.y-F.c.y)*2,dd=Math.max(6,Math.hypot(dx,dy)),sp=20+rnd(k*2.3+q.x)*50;bEmit({k:'rez',x:q.x,y:q.y,vx:dx/dd*sp+(rnd(k+.7)-.5)*16,vy:-24-rnd(k*1.9+q.y)*50,s:cs+rnd(k*4.7)*cr,col:q.col,ph:k*3.1,life:1.3+rnd(k*3.3)*1.3})})}
/** the fallen city's rubble on the grid (cached layer): a few dark bit-blocks with cyan edges around the footprint */
function bRezHeap(c,px,base,w,col,a,seed){if(a<=0||LODN<1)return;var hw=TW/2*w,hh=TH/2*w,N=Math.round(18*a);c.save();for(var k=0;k<N;k++){var s=seed+k*2.71,q=tpt(px,base,hw*1.2,hh*1.2,rnd(s)*2-1,rnd(s+1)*2-1),z=1+rnd(s+2)*1.6;c.fillStyle=k%2?hmul(col,.45):'#1A1D24';c.fillRect(q[0]-z/2,q[1]-z,z,z);if(k%3===0){c.fillStyle='rgba(61,242,255,.55)';c.fillRect(q[0]-z/2,q[1]-z,z,.5)}}c.restore()}
/** a raider ship of the fleet the night's last strike takes (only drawn while the raiders fall) */
function bFleetHi(c,x,y,a,tn){if(a<=0)return;c.save();c.globalAlpha=Math.min(1,a*1.4);var n=hn();poly(c,[[x-22,y-2],[x+20,y-8],[x+26,y-4],[x+4,y+6],[x-18,y+4]],n?'#2A2E38':'#4A4F5C');poly(c,[[x-8,y-4],[x+8,y-9],[x+12,y-14],[x-4,y-9]],n?'#3A3F4C':'#6A7080');c.fillStyle='rgba(255,'+(170+Math.round(40*Math.sin(tn*.004)))+',80,.9)';c.fillRect(x+2,y-11,1.5,1.5);c.restore()}
/** the fall over the map: the fleet (raiders), the last strike out of the sky with its target ring, the blast, the derezz with a
 *  cyan scan line on each item as it goes */
function bFallOver(c,F,S,now,last,fx,tn,rep){var c0=F.c,t0=F.items[0],top=F.raid?c0.y-6:c0.y-(t0&&t0.t==='b'?t0.h:24);
  if(F.raid&&now>=S.zf0-2500)F.items.forEach(function(it){var u=bRezU(S,it,now);if(u<1)bFleetHi(c,it.p.x,it.p.y,Math.min(1,(now-S.zf0+2500)/1200)*(1-u),tn)});
  if(now>=S.zf-1200&&now<S.zf){var u=(now-(S.zf-1200))/1200,e=u*u,sx=c0.x+160,sy=top-760,x=bLerp(sx,c0.x,e),y=bLerp(sy,top,e),a=Math.atan2(top-sy,c0.x-sx);
    c.save();c.strokeStyle='rgba(255,70,60,'+(.5+.4*Math.sin(now*.02)).toFixed(2)+')';c.lineWidth=1.2;var rr=(F.R*.7+30)*(1-u)+10;c.beginPath();c.ellipse(c0.x,c0.y,rr,rr*.5,0,0,7);c.stroke();c.beginPath();c.ellipse(c0.x,c0.y,rr*.4,rr*.2,0,0,7);c.stroke();c.restore();
    missileHi(c,x,y,a,2.4,'#F2F2F5',1);if(fx&&!reduce&&Math.floor(tn/40)%2===0)bTrailFx(x,y,a,2.4)}
  if(fx&&!reduce&&bBetween(S.zf,last,now)){bNukeFx(c0.x,top,c0.y,F.R);bShake(now,9,1100);bFlash(now,.85,420);bRedraw()}
  var q=0;F.items.forEach(function(it){var u=bRezU(S,it,now);q+=Math.round(u*6);var was=it.q||0;it.q=u;if(fx&&!reduce&&u>was)bRezFx(it,was,u,F);
    var uf0=now-(S.zf+it.dl);if(it.t==='b'&&uf0>=0&&uf0<BFL.flash){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.75*(1-uf0/BFL.flash*.5);var tw0=typeof towerTiers==='function'?towerTiers(it.h)[0][0]:.78;prismHi(c,it.p.x,it.p.y+4,tw0,it.h,'#3DF2FF',{parapet:false});c.restore()}   // spec: a 180 ms cyan flash, then the dissolve
    var uc=(uf0-BFL.flash)/BFL.rez;if(uc>0&&uc<1&&(it.t==='b'||uc<.6)){var hw=TW/2*.78,hh=TH/2*.78,yb=it.p.y+4-(it.t==='b'?it.h*(1-uc):it.h*.5);c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(61,242,255,'+(.9*(1-uc*.5)).toFixed(2)+')';c.lineWidth=1.1;c.shadowColor='#3DF2FF';c.shadowBlur=8;c.beginPath();c.moveTo(it.p.x-hw,yb);c.lineTo(it.p.x,yb-hh);c.lineTo(it.p.x+hw,yb);c.lineTo(it.p.x,yb+hh);c.closePath();c.stroke();c.restore()}});
  if(now>=S.zf&&now<S.zf+BFL.ring*1.8)q+=1e3*Math.floor((now-S.zf)/250);   // the ring sweeping the trees away
  if(q!==F.qq){var first=F.qq==null;F.qq=q;if(!first)bRedraw()}}
// the replay camera's shake on the big blasts (virtual ms; the camera adds it, none with reduced motion)
var BSHK=null;
function bShake(now,a,dur){if(reduce||now==null)return;dur=dur||600;var cur=BSHK?BSHK.a*Math.exp(-4*(now-BSHK.t)/BSHK.dur):0;if(a>cur)BSHK={t:now,a:a,dur:dur}}
// the full-frame flash of the big blasts (spec: L .18 for 140 ms, XL .45 for 300, the last strike .85 easing out over 420)
var BFLS=null;function bFlash(now,a,dur){if(reduce||now==null)return;if(!BFLS||now>=BFLS.t+BFLS.dur||a>=BFLS.a)BFLS={t:now,a:a,dur:dur}}
function bShakeAt(now){if(!BSHK||reduce)return [0,0];var u=now-BSHK.t;if(u<0||u>BSHK.dur*1.2)return [0,0];var a=BSHK.a*Math.exp(-4*u/BSHK.dur);return [Math.sin(u*.093)*a+Math.sin(u*.051)*a*.5,Math.cos(u*.077)*a*.6]}
/** under the objects, over the ground (city.ts frame calls it): the scorched desolation of every L and XL blast with embers, held
 *  until the cranes clear it, and the fallen city's ground: one big scorch and a glowing grid where each building stood */
function battleUnder(){if(!BON||!BDATA||!BL.damage||typeof GM==='undefined')return;var P=BREP?BREP.P:BPLAN;if(!P)return;var S=bS();if(!S)return;var now=bNow();if(S.live&&now>=S.end)return;
  var ra=1-bRebuild(),c=cx,vb=hView(TH*3),inV=function(x,y,r){return x>vb[0]-r&&x<vb[1]+r&&y>vb[2]-r&&y<vb[3]+r};c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();
  var scorch=function(x,y,R,al){var g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba(10,7,5,'+(.75*al).toFixed(3)+')');g.addColorStop(.55,'rgba(26,17,11,'+(.5*al).toFixed(3)+')');g.addColorStop(1,'rgba(40,26,16,0)');c.fillStyle=g;c.save();c.translate(x,y);c.scale(1,.5);c.beginPath();c.arc(0,0,R,0,7);c.restore();c.fill()};
  var embers=function(x,y,R,al,sd){if(reduce||LODN<1)return;c.globalCompositeOperation='lighter';for(var k=0;k<10;k++){var a=rnd(k*3.3+sd)*6.283,rr=rnd(k*1.9+sd)*R*.8,ex=x+Math.cos(a)*rr,ey=y+Math.sin(a)*rr*.5,fl=.5+.5*Math.sin(now*.006+k*2.1);c.fillStyle='rgba(255,'+(110+Math.round(60*fl))+',40,'+(.6*al*fl).toFixed(3)+')';c.fillRect(ex-.8,ey-.8,1.6,1.6)}c.globalCompositeOperation='source-over'};
  if(ra>0)P.shots.forEach(function(s){var D=BDES[s.w];if(!D||!s.to)return;var ia=bImpactOf(S,s);if(now<ia)return;var g=bGround(s),R=D.r*TW*Math.max(.5,s.cut||1),al=ra*Math.min(1,(now-ia)/500);if(al<.02||!inV(g.x,g.y,R))return;scorch(g.x,g.y,R,al);embers(g.x,g.y,R,al,s.ix*7.1)});
  var F=P.fall;if(F&&S.zf!=null&&now>=S.zf){var fa=BREP?1:ra;if(fa>0){var rr=Math.min(F.R+TW*1.2,(now-S.zf)/BFL.ring*(F.R+TW*1.2));if(rr>4)scorch(F.c.x,F.c.y,rr,fa);embers(F.c.x,F.c.y,F.R+TW,fa,hash(F.key));
    c.globalCompositeOperation='lighter';F.items.forEach(function(it){if(it.t==='s')return;var u=bRezU(S,it,now);if(it.t==='l'?u<.5:u<1)return;if(!BREP&&it.t==='b'&&bRebuildOf(it.b.i,it.b.j)>0)return;if(!inV(it.p.x,it.p.y,TW))return;var hw=TW/2*.9,hh=TH/2*.9,d=[[it.p.x,it.p.y-hh],[it.p.x+hw,it.p.y],[it.p.x,it.p.y+hh],[it.p.x-hw,it.p.y]],pl=.55+.25*Math.sin(now*6.283/2400);c.strokeStyle='rgba(61,242,255,'+(pl*fa).toFixed(3)+')';c.lineWidth=.8;poly(c,d,null);c.stroke();c.fillStyle='rgba(61,242,255,'+(.07*fa).toFixed(3)+')';c.fill()})}}
  c.restore()}
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
function bBeats(shots,now0,reduce,FF){var by={},keys=[];shots.forEach(function(s){if(!by[s.a]){by[s.a]=[];keys.push(s.a)}by[s.a].push(s)});
  keys.sort(function(a,b){var ra=a.charAt(0)!=='@',rb=b.charAt(0)!=='@';if(ra!==rb)return ra?1:-1;var d=by[b].length-by[a].length;return d||(a<b?-1:a>b?1:0)});
  var t=now0+BRT.pre,beats=[];keys.forEach(function(k,i){var L=by[k],n=L.length,ap=reduce?400:BRT.approach+(i?0:BRT.first),step=n>1?Math.min(BRT.step,BRT.ripple/(n-1)):0,launch=t+ap,lastHit=launch;
    L.forEach(function(s,j){s.rf=launch+j*step;s.fl=Math.min(BRT.flCap,bRepFlight(s.dist));s.ri=s.rf+s.fl;if(s.ri>lastHit)lastHit=s.ri});
    var end=Math.min(t+BRT.beatMax+(i?0:BRT.first),lastHit+BRT.hold);var tg={};L.forEach(function(s){tg[s.d]=(tg[s.d]||0)+1});var d=Object.keys(tg).sort(function(p,q){return tg[q]-tg[p]});
    var lead=L[0];for(var q=0;q<L.length;q++)if(L[q].f>0&&L[q].b){lead=L[q];break}   // the camera follows a missile that lands, not one a shield holds
    beats.push({i:i,a:k,d:lead.d,targets:d,shots:L,n:n,t0:t,launch:launch,hit:lastHit,end:end,lead:lead,raid:k.charAt(0)!=='@'});t=end});
  var fall0=FF?t:null,wide=FF?t+(reduce?BFL.hit+1800:BFL.len):t,hold=wide+BRT.wide,reb=Math.max(BRT.rebMin,BRT.total-(hold-now0)-BRT.tail),end=hold+reb;   // 11-14: the fall, between the last strike and the wide shot
  return {beats:beats,by:by,shots:shots,F:FF||null,total:end+BRT.tail-now0,S:{D:now0,live:false,rep:true,drop:now0,dropStep:0,fall:0,zf0:fall0,zf:FF?fall0+(reduce?400:BFL.hit):null,load0:now0,load1:now0,loadDur:0,count:beats.length?beats[0].launch:now0,salvo:beats.length?beats[0].launch:now0,ripple:0,wide:wide,hold:hold,end:end}}}
/** the beat at now (or null before the first / after the last) */
function bBeatAt(R,now){for(var i=0;i<R.beats.length;i++){var b=R.beats[i];if(now<b.end)return now>=b.t0?b:null}return null}
/** the stage at now: pre, beat, wide, rebuild, done */
function bRepStage(R,now){if(now<R.S.D+BRT.pre)return 'pre';if(now<R.S.wide)return R.S.zf0!=null&&now>=R.S.zf0?'fall':'beat';if(now<R.S.hold)return 'wide';if(now<R.S.end)return 'rebuild';return 'done'}
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
  if(st==='fall'){var FR=R.F,lf=R.beats[R.beats.length-1],from0=lf?bHitFrame(lf,vw):home,uf=(now-S.zf0)/BFL.cam,k2=Math.max(0,now-S.zf),zf=FR.z*(1-.08*Math.min(1,k2/4000));if(reduce)return FR;
    return uf>=1?{x:FR.x,y:FR.y,z:zf}:bCamMix(from0,{x:FR.x,y:FR.y,z:zf},uf)}   // ease to the whole city, then a slow pull back while it derezzes
  if(st==='wide'||st==='rebuild'){var wide=bWideFrame(R.shots,vw,vh)||home,lb=R.beats[R.beats.length-1],fromC=R.F?{x:R.F.x,y:R.F.y,z:R.F.z*.92}:lb?bHitFrame(lb,vw):home,u=(now-S.wide)/(BRT.wide*.7);return reduce?wide:u>=1?wide:bCamMix(fromC,wide,u)}
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
var BLOTS={},BON=false,BDATA=window.CALDERA_BATTLE||null,BL={damage:true,attacks:true,shields:true},BPLAN=null,BREP=null,BLAST=0,BQ=-1,BBLD={},BBAT={},BHITB={},BSZ={cruise:1.4,tactical:1.15,rocket:.95,shell:.75,orbital:1.3,beam:1.1,cannon:.95,catapult:.8},BWS={cruise:1.5,tactical:1,rocket:.6,shell:.3,orbital:1.3,beam:1,cannon:.7,catapult:.45},BWN={cruise:'cruise missiles',tactical:'tactical missiles',rocket:'rockets',shell:'shells',orbital:'orbital',beam:'beam',cannon:'cannon',catapult:'catapult'},BFQ=-1,BDOME={};
// ---- 11-13 (Mike: "every missile needs to create damage ... set the buildings on fire with smoke"): a shot row may carry x at index 8
// (the hub's physics: u = blast dollars, fu = fire dollars, fi = the tower share the fire takes, sp = the fire spread, m = miss in
// metres, sh = shield, pot = dollars a full shield held off). f is the share of the tower the blast took. Rows without x are nights
// from before the change: f is in facades, scored at $5M each, and they burn for show only.
// ---- 11-15 (Mike 11-14: "every missile strike needs to create damage"): a shield cuts a hit, it never cancels it. The hub's
// x.sh is the share the shield took off; the rest lands. A shielded hit flashes on the dome (the interception, above the
// roof), then lands smaller: the impact, the flames and the smoke are scaled by bCut, from what got through (1 - sh).
/** how big a hit looks next to an unshielded one: 1 with no shield, about .46 through the 99% beginner dome, .8 through 56% */
function bCut(s){var sh=s&&!s.blocked?+s.sh||0:0;return sh>0?.4+.6*Math.sqrt(Math.max(0,1-Math.min(1,sh))):1}
function bUsd(n){n=Math.round(n||0);var f=function(v,u){return '$'+(v>=100?Math.round(v):Math.round(v*10)/10)+u};return n>=1e9?f(n/1e9,'B'):n>=1e6?f(n/1e6,'M'):n>=1e3?f(n/1e3,'k'):'$'+n}
/** the fire's time constant: one hour on the live day, 2.6 s on the replay clock */
function bTau(S){return S&&S.live?36e5:2600}
/** the tower share a hit's fire has burnt by now: fi x (1 - e^(-t/tau)) */
function bBurnOf(S,h,now){var ia=bImpactOf(S,h);return now<ia||!h.fi?0:h.fi*(1-Math.exp(-(now-ia)/bTau(S)))}
/** damage as the pixels show it: 24 steps, rounded up, so any hit takes at least one step off its tower */
function bQ(v){return v<=0?0:Math.min(1,Math.ceil(v*24-1e-9)/24)}
/** the night's wind (the same all night, seeded by the night): how far smoke drifts sideways per px it rises */
function bWind(P){var hsh=hash(String(P&&P.night||'calm'));return (hsh%2?1:-1)*(.35+(hsh%7)/10)}
/** a smoke plume over a burning or smouldering tower: puffs rise, drift downwind, widen and thin; inten 0..1 */
function bPlumeHi(c,x,y,inten,wind,seed){var tn=reduce?0:T,n=hn(),N=4+Math.round(inten*5),rise=40+46*inten,cl=n?[70,72,82]:[98,98,108];for(var k=0;k<N;k++){var f=((tn/2800)+k/N+rnd(seed+k)*.07)%1,up=f*rise,dx=wind*Math.pow(f,1.3)*rise*.95+Math.sin(k*1.7+seed+tn/1300)*3*f,r=2.5+f*(7+11*inten),al=(n?.5:.56)*Math.pow(inten,.6)*Math.pow(1-f,1.5)*(f<.08?f/.08:1),li=Math.round(40*f),g=c.createRadialGradient(x+dx,y-up,r*.2,x+dx,y-up,r),rgbs=(cl[0]+li)+','+(cl[1]+li)+','+(cl[2]+li);g.addColorStop(0,'rgba('+rgbs+','+al.toFixed(3)+')');g.addColorStop(1,'rgba('+rgbs+',0)');c.fillStyle=g;c.beginPath();c.arc(x+dx,y-up,r,0,7);c.fill()}}
/** flames on a burning tower: a glow and three flickering tongues, their height the fire's strength (it dies down as e^(-t/tau)) */
function bFlameHi(c,x,y,inten,seed){var tn=reduce?0:T;c.save();c.globalCompositeOperation='lighter';var gr=8+14*inten,g0=c.createRadialGradient(x,y-2,1,x,y-2,gr);g0.addColorStop(0,'rgba(255,170,60,'+(.34*inten+.06).toFixed(3)+')');g0.addColorStop(1,'rgba(255,90,20,0)');c.fillStyle=g0;c.beginPath();c.arc(x,y-2,gr,0,7);c.fill();
  for(var k=0;k<3;k++){var ph=tn/95+k*2.1+seed,hg=(4+10*inten)*(.72+.28*Math.sin(ph)),px=x+(k-1)*(2.4+2.6*inten)+Math.sin(ph*.7)*.8,rw=1.6+2*inten,g=c.createLinearGradient(px,y+1,px,y-hg);g.addColorStop(0,'rgba(255,244,200,.95)');g.addColorStop(.45,'rgba(255,160,50,.85)');g.addColorStop(1,'rgba(210,60,20,0)');c.fillStyle=g;c.beginPath();c.moveTo(px-rw,y+1);c.quadraticCurveTo(px-rw*.9,y-hg*.5,px+Math.sin(ph)*1.2,y-hg);c.quadraticCurveTo(px+rw*.9,y-hg*.5,px+rw,y+1);c.closePath();c.fill()}c.restore()}
var BSPD=1;   // the speed the next replay starts at (the page remembers the viewer's choice and sets it)
function bNow(){return BREP?(BREP.pauseAt!=null?BREP.vt:bVirt(BREP.vt,BREP.pt,BREP.sp,performance.now())):Date.now()}
function bS(){return BREP?BREP.R.S:BPLAN?BPLAN.S:null}
function bRedraw(){if(reduce)setTimeout(draw,0);else draw()}
function bNoonOf(t){var d=new Date(t);d.setHours(12,0,0,0);return d.getTime()}
/** the night the hub resolved inside (noon - 24h, noon]: it drops at that noon, fires at 20:00 and is rebuilt the next morning */
function bPick(noon){var c=[];if(BDATA&&BDATA.t0!=null)c.push({t0:BDATA.t0,shots:BDATA.shots||[],key:BDATA.night||'',fallen:BDATA.fallen||null});if(BDATA&&BDATA.prev&&BDATA.prev.t0!=null)c.push({t0:BDATA.prev.t0,shots:BDATA.prev.shots||[],key:BDATA.prev.night||'p',fallen:BDATA.prev.fallen||null});
  for(var i=0;i<c.length;i++)if(c[i].t0>noon-BDAY&&c[i].t0<=noon)return c[i];return null}
/** each member's GitHub buildings (the repo towers in their neighborhood), tallest first (the hub's lot is a tower index), and which building a tile is */
function bBuildings(){BBLD={};BBAT={};if(typeof GM==='undefined'||typeof tiles==='undefined')return;var own={};for(var k in GM){var g=GM[k];(g.n&&g.n.ds||[]).forEach(function(d){if(!d.estate)own[d.name]=k});BBLD[k]=[]}
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var t=tiles[i+','+j];if(!t||t.t!=='b'||!t.d||!t.r||t.r.kind)continue;var key=own[t.d.name];if(!key)continue;BBLD[key].push({i:i,j:j,r:t.r,p:iso(i,j),h:typeof bh==='function'?bh(t.r):40})}
  for(var kk in BBLD){BBLD[kk].sort(function(a,b){return (b.h-a.h)||(a.j-b.j)||(a.i-b.i)});BBLD[kk].forEach(function(b,ix){b.idx=ix;BBAT[b.i+','+b.j]={key:kk,idx:ix}})}
  BLOTS={};if(typeof gLot==='function')for(var j2=0;j2<=H;j2++)for(var i2=0;i2<=W;i2++){var t2=tiles[i2+','+j2];if(!t2||t2.t!=='L'||!GM[t2.key])continue;var g2=GM[t2.key],s2=g2.cs||gState(g2);if(t2.a>=s2.side||t2.b>=s2.side)continue;var li=gLot(t2.a,t2.b);if(!(s2.codes[li]>0))continue;(BLOTS[t2.key]=BLOTS[t2.key]||[]).push({i:i2,j:j2,li:li,p:iso(i2,j2),cd:s2.codes[li]})}}
/** the shot objects of a shot list, numbered per attacker (k), each with its launch point, target tower and flight length.
 *  A shot at a city with no repo towers has nowhere to land (Mike 11-08: never green space): it is dropped, not counted */
function bShots(raw){var byA={},shots=[],hit={},dropped=0;raw.forEach(function(s,ix){var a=s[0],o={ix:ix,a:a,d:s[1],w:s[2],f:s[3],lot:s[5],blocked:s[6],x:s[8]||null};o.usd=o.x?(o.x.u||0)+(o.x.fu||0):Math.round(o.f*5e6);o.fi=o.x?o.x.fi||0:0;o.pot=o.x&&o.x.pot||0;o.sh=o.x?o.x.sh||0:0;o.cut=bCut(o);o.burn=o.blocked||!(o.f>0)?0:(o.x?(o.x.sp?1:.45):(rnd(ix*5.7+3.1)<.35?1:.45))*o.cut;if(o.blocked)o.cut=.46;var pad=bPad(a),from=pad?bPadLauncher(pad.x,pad.y):a.charAt(0)!=='@'?bSea(o.d):null,tg=bTargetOf(o);if(!from||!tg){dropped++;return}   // only raiders fire from the sea; a member without a pad has no launch point
    if(!byA[a])byA[a]=[];o.k=byA[a].length;byA[a].push(o);shots.push(o);o.from={x:from.x+8,y:from.y-24};o.pad=pad?{x:pad.x,y:pad.y}:o.from;o.to=tg;o.dist=Math.hypot(tg.x-o.from.x,tg.y-o.from.y);o.sz=BSZ[o.w]||1;
    if(o.b&&!o.blocked){o.v=bVis(o);if(!hit[o.d])hit[o.d]={};if(!hit[o.d][o.b.idx])hit[o.d][o.b.idx]=[];hit[o.d][o.b.idx].push(o)}});   // 11-14: every shot that reaches a building leaves damage (one the shield held whole, from before 11-15, breaks on the dome)
  var P={shots:shots,byA:byA,hit:hit,n:shots.length,dropped:dropped,lots:{}};bCollateral(P);return P}
// ---- 11-14 (Mike: "way more shrapnel ... Every single hit needs to have physical damage to the building ... escalated nukes, like
// larger explosions and larger desolations. One city should be totally destroyed by the end of every battle, like in tiny little
// bit blocks, similar to the way things break up in Tron"). Pictures over the physics, never instead of it: the dollars stay the
// hub's. (1) Every shot that reaches a building takes at least BVMIN world px off it (a floor or more by size; what a shield let
// through scales it, never below half), more when the blast did more. (2) The L and XL sizes flatten what stands near the hit: the
// defender's other buildings and plot lots inside BDES tiles of it lose a share falling off with distance, as the shock ring
// reaches them (the blast front: 3.75 tiles a second for L, 5 for XL), and the ground there stays scorched. (3) The fall: the city that took the most damage
// that night (the hub's choice, battle.ts fallenOf; the raiders' fleet counts) is hit by a last strike and derezzes building by
// building as the ring sweeps out from the tallest tower, into cubes, leaving a glowing empty grid. Battle layer only: in the
// replay it stays a grid to the end; on the live day the cranes rebuild it with everything else, whole by noon.
// the numbers are the Fable design spec of 11-14 (Battle FX: per-size tables, budgets, the fall's timeline)
var BCLS={shell:0,catapult:0,rocket:1,cannon:1,tactical:2,beam:2,cruise:3,orbital:3},BVMIN={shell:4,rocket:6,tactical:12,cruise:24,orbital:24,beam:12,cannon:6,catapult:4},BVPCT=[.06,.10,.22,.43],
  BTILE=TW*.7071,BDES={tactical:{r:1.25,ms:1000/3.75,xl:0},beam:{r:1.25,ms:1000/3.75,xl:0},cruise:{r:2.5,ms:1000/5,xl:1},orbital:{r:2.5,ms:1000/5,xl:1}};
var BFL={pick:1400,hit:2600,cam:1400,len:7400,ring:2200,flash:180,rez:700,liveGap:3500};
/** the share of its height a neighbour loses at u = distance / blast radius (spec: L 30% inside half, 10% to the edge; XL flattened
 *  inside .35, 55% to .7, 22% to the edge; out to 1.3 the glass goes and soot marks the wall), as damage (d 1 = 58% of the height) */
function bShare(D,u){var g=D.xl?(u<.35?1:u<.7?.55:u<1?.22:u<1.3?.03:0):(u<.5?.3:u<1?.1:u<1.3?.03:0);return Math.min(1,g/.58)}
/** the share of its tower one shot shows taken (0..1): the physics, or the size's minimum in px, whichever is more */
function bVis(s){if(!s.b)return 0;var h=Math.max(14,s.b.h||40),k=BCLS[s.w]==null?1:BCLS[s.w],lost=Math.max(3,Math.max(BVMIN[s.w]||6,BVPCT[k]*h)*Math.max(.35,s.cut||1)),m=lost/(.58*h);return Math.min(1,Math.max(s.f>0?s.f:0,m))}   // spec: S max(4 px, 6% h), M max(6, 10%), L max(12, 22%), XL max(24, 43%); through a shield x max(.35, cut), never under 3 px
/** the ground point of a shot's blast (the tower's foot on a direct hit, the street on a miss) */
function bGround(s){return s.to&&s.to.miss?{x:s.to.x,y:s.to.y}:s.b?{x:s.b.p.x,y:s.b.p.y+4}:s.to}
/** collateral from the L and XL sizes: entries on the defender's other buildings (P.hit) and lots (P.lots), riding the source shot */
function bCollateral(P){var V=[];P.shots.forEach(function(s){var D=BDES[s.w];if(!D||!s.b||s.blocked)return;var g=bGround(s),R=D.r*BTILE,cut=Math.max(.35,s.cut||1);
  var near=function(p){var dd=Math.hypot(p.x-g.x,(p.y-g.y)*2);return dd<R*1.3?dd:-1};
  (BBLD[s.d]||[]).forEach(function(b){if(b===s.b)return;var dd=near(b.p);if(dd<0)return;var v=bShare(D,dd/R)*cut;if(v<.02)return;var o={src:s,dl:dd*D.ms/BTILE,b:b,d:s.d,a:s.a,w:s.w,ix:s.ix,f:0,fi:0,burn:0,cut:cut,v:v,usd:0,to:{x:g.x,y:g.y-10},col:1};V.push(o);
    if(!P.hit[s.d])P.hit[s.d]={};if(!P.hit[s.d][b.idx])P.hit[s.d][b.idx]=[];P.hit[s.d][b.idx].push(o)});
  (BLOTS[s.d]||[]).forEach(function(l){var dd=near(l.p);if(dd<0)return;var v=bShare(D,dd/R)*cut*1.6;if(v<.05)return;var o={src:s,dl:dd*D.ms/BTILE,lot:l,d:s.d,a:s.a,w:s.w,ix:s.ix,v:Math.min(1,v),col:1};V.push(o);var m=P.lots[s.d]=P.lots[s.d]||{};(m[l.li]=m[l.li]||[]).push(o)})});
  P.virt=V}
/** the city that falls: the hub's pick when it is on the map, else the same rule here (most dollars taken, then hits, then name) */
function bFallKey(P,hint){var ok=function(k){return k&&(k.charAt(0)!=='@'?P.shots.some(function(s){return s.d===k}):(BBLD[k]||[]).length>0||(BLOTS[k]||[]).length>0)};if(ok(hint))return hint;
  var m={};P.shots.forEach(function(s){var r=m[s.d]=m[s.d]||{u:0,n:0};r.u+=s.usd||0;r.n++});var ks=Object.keys(m).filter(ok).sort(function(a,b){return (m[b].u-m[a].u)||(m[b].n-m[a].n)||(a<b?-1:a>b?1:0)});return ks[0]||null}
/** the fall's plan: the key, the ground zero (the tallest tower's foot; out at sea for the raiders), every building and lot with
 *  the delay until the ring reaches it, and the size of the city (for the camera) */
function bFallOf(P,hint){var key=bFallKey(P,hint);if(!key)return null;var raid=key.charAt(0)!=='@',F={key:key,raid:raid,items:[],at:{},lot:{}},c;
  if(raid){var sh=P.shots.filter(function(s){return s.d===key&&s.to})[0];if(!sh)return null;c={x:sh.to.x,y:sh.to.y};for(var k=0;k<3;k++)F.items.push({t:'s',k:k,p:{x:c.x+(k-1)*38+(k===1?0:6),y:c.y+(k===1?-10:8)},h:12})}
  else{var L=BBLD[key]||[],T=(BLOTS[key]||[]);c=L.length?{x:L[0].p.x,y:L[0].p.y+4}:{x:T[0].p.x,y:T[0].p.y+4};L.forEach(function(b){F.items.push({t:'b',b:b,p:b.p,h:b.h})});T.forEach(function(l){F.items.push({t:'l',l:l,p:l.p,h:24})})}
  var R=1,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;F.items.forEach(function(it){var dd=Math.hypot(it.p.x-c.x,(it.p.y-c.y)*2);it.dd=dd;R=Math.max(R,dd);x0=Math.min(x0,it.p.x);x1=Math.max(x1,it.p.x);y0=Math.min(y0,it.p.y-it.h);y1=Math.max(y1,it.p.y)});
  F.items.forEach(function(it){it.dl=Math.round(it.dd/R*BFL.ring);if(it.t==='b')F.at[it.b.i+','+it.b.j]=it;if(it.t==='l')F.lot[it.l.i+','+it.l.j]=it});F.c=c;F.R=R;F.box={x0:x0,x1:x1,y0:y0,y1:y1};return F}
/** the camera on the fall: the whole city in view, never closer than a pad, never farther than .45 */
function bFallFrame(F,vw,vh){var b=F.box,w=b.x1-b.x0+TW*2,h=b.y1-b.y0+TH*3,z=Math.min(bPadZoom(vw)*.9,Math.max(.45,Math.min(vw*.8/w,vh*.62/h)));return {x:(b.x0+b.x1)/2,y:(b.y0+b.y1)/2,z:z}}
/** the plan in force (the replay's or the live day's) and its fall */
function bFP(){var P=BREP?BREP.P:BPLAN;return P&&P.fall?P:null}
/** how far one item of the fallen city has derezzed at now: 0 standing, 1 gone (in sixths, so the cache redraws six times) */
function bRezU(S,it,now){if(!S||S.zf==null)return 0;var u=(now-(S.zf+it.dl+BFL.flash))/BFL.rez;return u<=0?0:u>=1?1:Math.ceil(u*6)/6}
/** a tower of the fallen city: 0..1 derezzed */
function bRaze(i,j){if(!BON||!BL.damage)return 0;var P=bFP();if(!P)return 0;var it=P.fall.at[i+','+j];if(!it)return 0;var S=bS(),now=bNow();if(S.live&&now>=S.end)return 0;return bRezU(S,it,now)}
/** a ground point inside the fall's blast once the ring has passed it (city.ts leaves the trees out there); held like the towers */
function bScorched(p){if(!BL.damage)return false;var P=bFP();if(!P)return false;var F=P.fall,S=bS();if(!S||S.zf==null)return false;var now=bNow();if(now<S.zf||(S.live&&(now>=S.end||(now>=S.hold&&bRebuild()>.5))))return false;var dd=Math.hypot(p.x-F.c.x,(p.y-F.c.y)*2);return dd<F.R+TW*1.2&&now>=S.zf+dd/Math.max(1,F.R)*BFL.ring}
/** a plot lot of the fallen city: gone once the ring has passed it; live, the cranes bring the lots back one by one through the morning */
function bRazeLot(key,i,j){if(!BON||!BL.damage)return 0;var P=bFP();if(!P||P.fall.key!==key)return 0;var it=P.fall.lot[i+','+j];if(!it)return 0;var S=bS(),now=bNow();if(S.live&&(now>=S.end||(now>=S.hold&&bRebuild()>.1+rnd(i*3.1+j*1.7)*.8)))return 0;return bRezU(S,it,now)>=.5?1:0}
/** the battle damage on a plot lot (citygrowth.ts growObject): the desolation of a big blast nearby, 0..1, held until the rebuild */
function bDmg(key,li){if(!BON||!BL.damage)return 0;var P=BREP?BREP.P:BPLAN;if(!P||!P.lots||!P.lots[key]||!P.lots[key][li])return 0;var S=bS(),now=bNow(),s=0;if(S.live&&now>=S.end)return 0;
  P.lots[key][li].forEach(function(o){if(now>=bImpactOf(S,o))s+=o.v});s=bQ(s);return now<S.hold?s:Math.max(0,s*(1-bRebuild()))}
/** how many shots have reached this building by now (craters: one per hit at least) */
function bHitsOn(i,j){var P=BREP?BREP.P:BPLAN,e=BBAT[i+','+j];if(!P||!e||!P.hit[e.key]||!P.hit[e.key][e.idx])return 0;var S=bS(),now=bNow(),n=0;P.hit[e.key][e.idx].forEach(function(h){if(now>=bImpactOf(S,h))n+=h.src?0:1});return n}
/** today's plan: the shots of the day's night; during a replay, the replay's own plan (the live one is left as it was) */
function bPlan(now){if(BREP)return BREP.P;var wall=Date.now(),noon=bNoonOf(wall),fire=wall>=noon,dayNoon=fire?noon:noon-BDAY,src=bPick(dayNoon),sig=dayNoon+'|'+(src?src.key+':'+src.shots.length:'-');
  if(BPLAN&&BPLAN.sig===sig)return BPLAN;
  bBuildings();var P=bShots(src?src.shots:[]);P.sig=sig;P.dayNoon=dayNoon;P.S=bSchedule(dayNoon,true);P.night=src?src.key:'';P.live=true;P.fall=bFallOf(P,src&&src.fallen);if(P.fall){var li0=P.S.salvo;P.shots.forEach(function(q){li0=Math.max(li0,bImpactOf(P.S,q))});P.S.zf0=li0+BFL.liveGap-BFL.hit;P.S.zf=li0+BFL.liveGap}BPLAN=P;BHITB=P.hit;BLAST=0;BQ=-1;BFQ=-1;return BPLAN}
function bIndex(){BPLAN=null;if(BON)bPlan(Date.now())}
bIndex();
/** per-shot moments: the live day runs on the schedule and the shot's number, the replay on the beats */
function bFireOf(S,s){return S.live?bFireAt(S,s.k):s.rf}
function bImpactOf(S,s){if(s.src)return bImpactOf(S,s.src)+s.dl;return S.live?bFireAt(S,s.k)+bFlightDur(s.dist):s.ri}
function bFlightOf(S,s){return S.live?bFlightDur(s.dist):s.fl}
function bLandOf(S,s){return S.live?bLandAt(S,s.k):S.D-1}
function bLoadOf(S,s,n){return S.live?bLoadAt(S,s.k,n):S.D-1}
function bImpactAt(S,s){return bImpactOf(S,s)}
/** damage on one GitHub building (0..1, in sixths): full from each hit's impact until the hold ends, then down to nothing */
function bBld(t,i,j){if(!BON||!BL.damage)return 0;var P=BREP?BREP.P:BPLAN;if(!P)return 0;var e=BBAT[i+','+j];if(!e)return 0;var o=P.hit[e.key];if(!o||!o[e.idx])return bRaze(i,j)>0?1/24:0;var S=bS(),now=bNow(),s=0;o[e.idx].forEach(function(h){if(now>=bImpactOf(S,h))s+=h.v+bBurnOf(S,h,now)});if(now>=S.end)return 0;s=bQ(s);return now<S.hold?s:Math.round(s*(1-(now-S.hold)/(S.end-S.hold))*24)/24}   // held damage rounds up (every hit shows); the rebuild takes it down in 24ths
/** the damage a building took this night, in sixths, as it stood when the hold ended (the break line is drawn from this while the cranes work, the build line rises through it) */
function bBldHeld(i,j){if(!BON||!BL.damage)return 0;var P=BREP?BREP.P:BPLAN;if(!P)return 0;var e=BBAT[i+','+j];if(!e)return 0;var o=P.hit[e.key];if(!o||!o[e.idx])return bRaze(i,j)>0?1/24:0;var S=bS(),now=bNow(),s=0;o[e.idx].forEach(function(h){if(now>=bImpactOf(S,h))s+=h.v+bBurnOf(S,h,now)});return bQ(s)}
// ---- the saved battle state (Mike 11-11: "slowly rebuild over time, state saved safely"). localStorage caldera.battle.state, versioned:
// v1 {v:1, night, at, bld:{"<member>|<tower index>":{d, f}}} with d the damage the tower took that night (sixths) and f how far its
// rebuild has got (0..1). A reload or restart picks up from here: a tower's rebuild never goes backwards (the clock schedule and the
// saved fraction, whichever is further), and a new night starts a fresh record. bStateLoad is pure and takes anything the key may
// hold: a v1 record, the pre-11-11 shape {night, reb, dmg:{key:sixths}} (migrated), an unknown version or corrupt JSON (a fresh record).
var BSTATE_KEY='caldera.battle.state',BSTATE=null,BSAVED=0;
function bStateFresh(night){return {v:1,night:night||'',at:0,bld:{}}}
function bStateLoad(raw){var o=null;try{o=typeof raw==='string'?JSON.parse(raw):raw}catch(err){o=null}
  if(!o||typeof o!=='object')return bStateFresh('');
  var bld={},k,e;
  if(o.v===1){if(o.bld&&typeof o.bld==='object')for(k in o.bld){e=o.bld[k];if(e&&typeof e==='object'&&+e.d>0)bld[k]={d:Math.min(1,+e.d),f:Math.max(0,Math.min(1,+e.f||0))}}return {v:1,night:String(o.night||''),at:+o.at||0,bld:bld}}
  if(o.v==null&&o.dmg&&typeof o.dmg==='object'){var f0=Math.max(0,Math.min(1,+o.reb||0));for(k in o.dmg){var d0=+o.dmg[k];if(d0>0)bld[k]={d:Math.min(1,d0),f:f0}}return {v:1,night:String(o.night||''),at:+o.at||0,bld:bld}}
  return bStateFresh('')}
function bStore(){try{return window.localStorage||localStorage}catch(err){return null}}
function bStateRead(){var st=bStore(),raw=null;try{raw=st?st.getItem(BSTATE_KEY):null}catch(err){}BSTATE=bStateLoad(raw);return BSTATE}
function bStateWrite(now){var st=bStore();if(!st||!BSTATE)return false;BSTATE.at=now;try{st.setItem(BSTATE_KEY,JSON.stringify(BSTATE));BSAVED=now;return true}catch(err){return false}}
/** records tonight's damage and rebuild progress for every hit tower (live days only), writing when something changed or every 30 s */
function bStateSync(P,now){if(!P||!P.live||!P.night||!BL.damage)return;if(!BSTATE)bStateRead();if(BSTATE.night!==P.night)BSTATE=bStateFresh(P.night);
  var f=bRebuild(),changed=false;for(var key in P.hit){var bl=BBLD[key]||[];for(var bi in P.hit[key]){var b=bl[+bi];if(!b)continue;var d=bBldHeld(b.i,b.j);if(d<=0)continue;var id=key+'|'+bi,e=BSTATE.bld[id],nf=Math.max(e?e.f:0,f);
    if(!e||e.d!==d||e.f!==nf){BSTATE.bld[id]={d:d,f:nf};changed=true}}}
  if(changed||now-BSAVED>3e4)bStateWrite(now)}
/** a tower's rebuild progress: the schedule's, or further if the saved record says so (never backwards within a night) */
function bRebuildOf(i,j){var f=bRebuild(),e=BBAT[i+','+j],P=BREP?BREP.P:BPLAN;if(BREP&&e&&P&&P.fall&&e.key===P.fall.key)return 0;if(BREP||!e||!BSTATE||!P||BSTATE.night!==P.night)return f;var r=BSTATE.bld[e.key+'|'+e.idx];return r&&r.f>f?Math.min(1,r.f):f}
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
  // a miss past the wall (more than 10 m off) comes down in the street beside the tower: the blast still reaches it, weaker
  if(s.x&&s.x.m>10&&!s.blocked&&s.f>0){var mm=Math.min(TW*.72,TW*.36+(s.x.m-10)*TW*.03),an=rnd(s.ix*9.1+4.4)*3.1416;return {x:b.p.x+Math.cos(an)*mm,y:b.p.y+4+Math.sin(an)*mm*.5,miss:1}}
  return {x:b.p.x+(rnd(s.ix*7.3+1.7)-.5)*TW*.2,y:b.p.y+4-h+(rnd(s.ix*3.1+2.3)-.5)*TH*.2}}
function bRgba(hx,a){var n=parseInt(hx.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function bShieldDome(c,x,y,rx,col,a){c.save();c.globalCompositeOperation='lighter';var gr=c.createRadialGradient(x,y-rx*.3,rx*.2,x,y-rx*.3,rx);gr.addColorStop(0,bRgba(col,0));gr.addColorStop(.85,bRgba(col,a*.5));gr.addColorStop(1,bRgba(col,a));c.fillStyle=gr;c.beginPath();c.ellipse(x,y-rx*.3,rx,rx*.75,0,0,7);c.fill();
  c.strokeStyle=bRgba(col,Math.min(1,a+.2));c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx,rx*.5,0,Math.PI,0);c.stroke();c.restore()}
function bCol(key){var g=GM[key];return g?gLang(g):key.charAt(0)==='@'?'#8B6CF6':'#B8B8C2'}
// ---- the replay: its own plan (a copy of today's shots, or the demo), the beats, the camera and the clock
/** a sample battle on the real map: the members with the most repo towers attack each other (synthetic shots), raiders last */
function bDemoShots(){bBuildings();var keys=Object.keys(BBLD).filter(function(k){return k.charAt(0)==='@'&&BBLD[k].length>0&&bPad(k)}).sort(function(a,b){return (BBLD[b].length-BBLD[a].length)||(a<b?-1:1)}).slice(0,5);
  if(keys.length<2)return [];var raw=[],counts=[5,4,3,2,2],W=['cruise','tactical','rocket','shell','rocket'],DF={cruise:.5,tactical:.22,rocket:.07,shell:.02},DX=function(w,k,held){var f=held?0:DF[w]*(k%3===1?.5:1),v=24e6,sp=k%2===0?1:0,fi=f*.5*(sp?.8:.15);return {u:Math.round(f*v),fi:fi,fu:Math.round(fi*v),sp:sp,m:held?0:k%3===1?15:3,sh:held?1:0,pot:held?Math.round(DF[w]*v):0,v:v}};
  // each city fires at its nearest rivals (the two closest, most shots at the closest), so the arcs read on a phone
  keys.forEach(function(a,i){var n=counts[i]||2,ca=bCenter(a),near=keys.filter(function(k){return k!==a}).sort(function(p,q){var cp=bCenter(p),cq=bCenter(q);return Math.hypot(cp.x-ca.x,cp.y-ca.y)-Math.hypot(cq.x-ca.x,cq.y-ca.y)});
    for(var k=0;k<n;k++){var d=near[k%n<n-1||near.length<2?0:1],held=k===n-1&&n>2;var w=W[i%W.length];raw.push([a,d,w,held?0:DF[w]*(k%3===1?.5:1),0,held?-1:(k+i)%Math.max(1,BBLD[d].length),held?1:0,0,DX(w,k,held)])}});
  raw.push(['~raiders',keys[0],'rocket',DF.rocket,0,0,0,0,DX('rocket',0,false)]);raw.push(['~raiders',keys[0],'rocket',DF.rocket*.5,0,1%Math.max(1,BBLD[keys[0]].length),0,0,DX('rocket',1,false)]);return raw}
/** start a replay: today's shots (or the demo), the beats on a virtual clock from 0, the camera saved to come back to */
function bReplayStart(mode,sp){if(BREP)bReplayEnd(false);var demo=mode==='demo',src0=demo?null:bPick(bPlan(Date.now()).dayNoon),raw=demo?bDemoShots():(src0||{shots:[]}).shots;
  if(!raw.length)return 0;bBuildings();var P=bShots(raw);if(!P.n)return 0;P.demo=demo;P.night=demo?'demo':BPLAN?BPLAN.night:'';P.live=false;P.fall=bFallOf(P,demo?null:src0&&src0.fallen);
  var R=bBeats(P.shots,0,reduce,P.fall?bFallFrame(P.fall,vw,vh):null),home={x:(vw/2-cam.x)/cam.z,y:(vh*.52-cam.y)/cam.z,z:cam.z};P.S=R.S;
  // on a phone the map takes the whole screen for the replay (Mike 11-08: "couldn't really see it"); back to the page at the end
  var full=vw<700&&typeof cssFull==='function'&&typeof st!=='undefined'&&!st.classList.contains('c-full');if(full)cssFull(true);
  if(typeof flyStop==='function')flyStop();if(typeof INTRO!=='undefined'&&INTRO&&typeof introFinish==='function')introFinish(true);if(typeof BUILDING!=='undefined'&&BUILDING&&typeof buildDone==='function')buildDone();
  if(sp!=null)BSPD=bSpeedOf(sp);BREP={vt:0,pt:performance.now(),sp:BSPD,pauseAt:null,P:P,R:R,home:home,demo:demo,full:full,follow:true,ease:null};BHITB=P.hit;BLAST=0;BQ=-1;BFQ=-1;BP.length=0;BCOL.length=0;BFXT=0;bRibbonsClear();
  if(reduce&&typeof frame==='function'){BREP.timer=setInterval(function(){if(!BREP){return}frame()},120)}
  draw();return P.n}
/** the replay is over (or stopped): the map goes back to the live clock and the camera flies home */
function bReplayEnd(fly){if(!BREP)return;var h=BREP.home,full=BREP.full;if(BREP.timer)clearInterval(BREP.timer);BREP=null;BLAST=0;BQ=-1;BFQ=-1;BP.length=0;BCOL.length=0;bRibbonsClear();if(BPLAN)BHITB=BPLAN.hit;
  var go=function(){if(fly&&h&&typeof flyTo==='function')flyTo(vw/2-h.x*h.z,vh*.52-h.y*h.z,h.z,reduce?1:BRT.tail);else bRedraw()};
  if(full&&typeof cssFull==='function'){cssFull(false);setTimeout(go,60)}else go()}
/** skip to the next beat (a tap on the map, the Skip button); past the last beat: to the wide shot, then straight to the end */
/** jump the virtual clock to a moment in ms: the flights jumped over leave their ribbons and hits, no burst of effects */
function bJump(to){if(!BREP)return false;var now=bNow();if(to===now)return true;BREP.vt=to;BREP.pt=performance.now();var n2=bNow();
  BREP.P.shots.forEach(function(s){if(s.rf<n2&&(!s.tr||s.tr.pts.length<8||s.ri>now||to<now))bRibbonFill(s,n2,s.sz);else if(s.rf>=n2&&s.tr)s.tr.pts.length=0});BLAST=n2;BP.length=0;BCOL.length=0;bRedraw();return true}
/** step back: to the start of this strike (or the one before it when this one began under 1.5 s ago), then the pre-roll */
function bPrev(){if(!BREP)return false;var R=BREP.R,now=bNow(),to=0;R.beats.forEach(function(b){if(b.t0<now-1500)to=Math.max(to,b.t0)});return bJump(to)}
function bSkip(){if(!BREP)return false;var R=BREP.R,now=bNow(),to=null,st=bRepStage(R,now);
  if(st==='pre'||st==='beat'){for(var i=0;i<R.beats.length;i++)if(now<R.beats[i].end){to=R.beats[i].end;break}if(to==null)to=R.S.zf0!=null?R.S.zf0:R.S.wide}else if(st==='fall')to=R.S.wide;else if(st==='wide')to=R.S.hold;else to=R.S.end;
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
  var sk=bShakeAt(bNow());x+=sk[0];y+=sk[1];
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
function bShatterFor(s,iA,cap){var b=s.b,P=bPlan(Date.now()),S=bS(),L=(P.hit[s.d]||{})[b.idx]||[],d0=0,d1=0;L.forEach(function(q){var ia=bImpactOf(S,q);if(ia<=iA)d1+=q.v;if(ia<iA)d0+=q.v});d0=bQ(d0);d1=bQ(d1);if(d1<=d0)return 0;
  var h=b.h,tiers=typeof towerTiers==='function'?towerTiers(h):[[.78,h]],w=tiers[0][0],base=b.p.y+4,lo=pxBreak(h,d1),hi=pxBreak(h,d0),col=bCol(s.d),st=Math.min(1.9,.5+(BWS[s.w]||.6)),max=cap||Math.max(8,Math.round([60,120,260,520][BCLS[s.w]==null?1:BCLS[s.w]]*bFxScale()*Math.max(.25,1-(s.sh||0))));   // spec: vox per hit S 60, M 120, L 260, XL 520 walked in
  var sh=pxShards(b.p.x,base,w,lo,hi,col,hash(s.d)+s.ix*7,max),cx0=s.to.x,cy0=s.to.y;
  sh.forEach(function(q,k){var dx=q.x-cx0,dy=q.y-cy0,dd=Math.max(4,Math.hypot(dx,dy)),sp=(50+rnd(k*3.1+q.x)*120)*st,up=-(60+rnd(k*1.7+q.y)*150)*st;
    bEmit({k:'vox',x:q.x,y:q.y,vx:dx/dd*sp+(rnd(k+.4)-.5)*30,vy:dy/dd*sp*.4+up,g:q.g,s:.9+rnd(k*5.3)*1.3,col:q.col,life:2.6+rnd(k*2.9)*1.6})});return sh.length}
function bCollapseFor(s,iA,tn){var b=s.b,P=bPlan(Date.now()),S=bS(),L=(P.hit[s.d]||{})[b.idx]||[],d0=0,d1=0;L.forEach(function(q){var ia=bImpactOf(S,q);if(ia<=iA)d1+=q.v;if(ia<iA)d0+=q.v});d0=bQ(d0);d1=bQ(d1);if(d1<=d0)return;
  var h=b.h,tiers=typeof towerTiers==='function'?towerTiers(h):[[.62,h]];bCollapseAdd(b.p.x,b.p.y+4,Math.max(10,Math.round(h*(1-.5*d0))),Math.max(10,Math.round(h*(1-.5*d1))),tiers[tiers.length-1][0],bCol(s.d),tn,BREP?BCOLREP:BCOLMS)}
// ---- the damage tier readout (Mike 11-08: show the tier dropping): for 2.6 s after each impact, a pill over the tower with six pips
// (the tower's six damage steps; the ones this hit takes go red and fade) and the numbers, with the shield's share when one
// cut it (cyan edge); "Shield held" only on nights from before 11-15
var BHLMS=2600;
/** the damage steps (0..6) a tower had just before and just after this shot's impact */
function bTiers(S,s){var P=BREP?BREP.P:BPLAN,L=P&&s.b&&P.hit[s.d]?P.hit[s.d][s.b.idx]||[]:[],ia=bImpactOf(S,s),d0=0,d1=0;L.forEach(function(q){var t=bImpactOf(S,q);if(t<=ia)d1+=q.v;if(t<ia)d0+=q.v});return [Math.min(1,d0),Math.min(1,d1)]}
/** the impacts that are still on show at now, one per tower (the latest), newest last: {s, age, hit, t0, t1} */
function bHitsNow(P,S,now){var best={},out=[];P.shots.forEach(function(s){if(!s.to)return;var ia=bImpactOf(S,s),age=now-ia;if(age<0||age>=BHLMS)return;var hit=s.f>0&&!!s.b,key=s.d+'|'+(hit?s.b.idx:'sh'+Math.round(s.to.x));if(!best[key]||ia>best[key].ia)best[key]={s:s,ia:ia,age:age,hit:hit}});
  for(var k in best){var o=best[k],t=o.hit?bTiers(S,o.s):[0,0];out.push({s:o.s,ia:o.ia,age:o.age,hit:o.hit,t0:t[0],t1:t[1]})}return out.sort(function(a,b){return a.ia-b.ia})}
function bHitLabels(c,P,S,now){var L=bHitsNow(P,S,now);if(!L.length)return;L=L.slice(-6);c.save();c.font='600 10px IBM Plex Mono,Menlo,monospace';c.textBaseline='middle';c.textAlign='left';
  L.forEach(function(o){var x=cam.x+o.s.to.x*cam.z,y=cam.y+(o.s.to.y-34)*cam.z;if(!isFinite(x)||!isFinite(y)||x<-80||x>vw+80||y<-30||y>vh+30)return;
    var landed=o.s.f>0&&!o.s.blocked,cut=landed&&o.s.sh>0,txt=landed?'-'+bUsd(o.s.usd)+((o.s.x?o.s.x.sp:o.s.burn>=1)?' +fire':'')+(cut?' \u00b7 shield '+Math.round(o.s.sh*100)+'%':''):'Shield held'+(o.s.pot?' '+bUsd(o.s.pot):''),tw=c.measureText(txt).width,pw=o.hit?42:0,w=8+pw+(pw?6:0)+tw+8,h=18,x0=Math.round(x-w/2),y0=Math.round(y-h/2),al=reduce?1:Math.min(1,o.age/150)*Math.min(1,(BHLMS-o.age)/500);
    c.globalAlpha=al;c.fillStyle='rgba(15,16,22,.94)';c.strokeStyle=landed&&!cut?'rgba(255,255,255,.28)':'rgba(61,242,255,.7)';c.lineWidth=1;c.beginPath();if(c.roundRect)c.roundRect(x0,y0,w,h,9);else c.rect(x0,y0,w,h);c.fill();c.stroke();
    if(o.hit){var bw=40,w1=Math.round(bw*(1-o.t1)),w0=Math.max(w1+2,Math.round(bw*(1-o.t0)));   // the tower still standing (teal), what this hit took (red, fading), what was gone before
      c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x0+8,y0+6,bw,h-12);c.fillStyle='#4FD1C5';c.fillRect(x0+8,y0+6,w1,h-12);c.fillStyle='rgba(255,90,70,'+(reduce?.9:Math.max(.25,1-o.age/1800)).toFixed(2)+')';c.fillRect(x0+8+w1,y0+6,Math.min(bw,w0)-w1,h-12)}
    c.fillStyle='#F2F2F5';c.fillText(txt,x0+8+pw+(pw?6:0),y0+h/2+.5)});c.restore()}
/** over the map, every frame: shields, pads with their stacks and launch centers, drops, loading, the countdown, the salvo,
 *  impacts, smoke ribbons and columns, and the counts */
function battleOver(){if(!BON||!BDATA||typeof GM==='undefined')return;var c=cx,tn=performance.now(),P=bPlan(Date.now()),S=bS(),now=bNow();bClock(now);P=bPlan(Date.now());S=bS();now=bNow();var dt=battleOver.tp?Math.min(.05,(tn-battleOver.tp)/1000):0;battleOver.tp=tn;
  if(BREP){if(typeof INTRO!=='undefined'&&INTRO&&typeof introFinish==='function')introFinish(true);if(typeof BUILDING!=='undefined'&&BUILDING&&typeof buildDone==='function')buildDone()}   // the city intro and new-land builds never run over a replay
  var rep=!!BREP,paused=rep&&BREP.pauseAt!=null,fx=BLAST>0&&now-BLAST<5000,last=BLAST;BLAST=now;BPMAX=bPoolMax();if(!rep&&(now-BSAVED>2000||BSAVED===0))bStateSync(P,now);
  c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var M=BDATA.members||{},vb=hView(TH*3),inView=function(p){return p&&p.x>vb[0]-60&&p.x<vb[1]+60&&p.y>vb[2]-200&&p.y<vb[3]+80};
  var FD=BL.damage?bFP():null,fdk=FD&&S.zf0!=null?FD.fall.key:null;   // the doomed city's dome flickers and dies before the last strike (spec: 900 to 1300 ms into the fall)
  if(BL.shields)for(var k in M){var ctr=bCenter(k),g=GM[k];if(!ctr||!g||!inView(ctr))continue;var sd=(g.cs||gState(g)).side,sh=M[k].sh||0;if(sh<=0)continue;if(k===fdk&&now>=S.zf0+900&&(now>=S.zf0+1300||rnd(Math.floor(now/60))<.5)&&!(S.live&&now>=S.hold&&bRebuild()>.5))continue;var dz=BDOME[k]?Math.max(0,1-(tn-BDOME[k])/900):0;bShieldDome(c,ctr.x,ctr.y+8,sd*TW*.42+20,dz>0?'#3DF2FF':M[k].beg?'#FFFFFF':'#3DF2FF',(M[k].beg?.12:.08+.22*sh)+.55*dz)}
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
    if(bBetween(iA,last,now)){if(rep&&(!s.tr||s.tr.pts.length<8))bRibbonFill(s,iA,sz);if(fx&&s.b&&!s.blocked&&!reduce){if(s.sh>0)bShieldFx(s.to.x,s.to.y-26,'#3DF2FF');bImpactFx(s.to.x,s.to.y+(s.to.miss?0:4),bCol(s.d),0,s.b.p.y+4,s.w,s.sh||0);bShatterFor(s,iA);if(BDES[s.w])bBigFx(s.to.x,s.to.y,bGround(s).y,s.w,bCol(s.d),rep?now:null);else if(rep&&BCLS[s.w]===1)bShake(now,1.2,160)}else if(fx&&!reduce){bShieldFx(s.to.x,s.to.y,'#3DF2FF');bImpactFx(s.to.x,s.to.y,'#8A8A93',0,s.to.y+30,'shell',.75)}if(!(s.f>0)||s.sh>0)BDOME[s.d]=tn;if(s.b&&!s.blocked)bRedraw()}   // a shot the dome held whole breaks up on it: sparks and its own fragments
    if(s.a.charAt(0)!=='@'&&fx&&bBetween(fA,last,now)){if(rep)bLaunchFxBig(s.from.x,s.from.y,-1);else bLaunchFx(s.from.x,s.from.y,-1)}
    if(now>=fA&&now<iA&&BL.attacks&&(inView(s.from)||inView(s.to)||rep)){var tr=bTraj(s.from.x,s.from.y,s.to.x,s.to.y,(now-fA)/dur);missileHi(c,tr.x,tr.y,tr.a,sz,bCol(s.a),tr.boost);
      if(rep){if(!paused)bRibbonAdd(s,tr.x-Math.cos(tr.a)*6*sz,tr.y-Math.sin(tr.a)*6*sz,now,sz)}else if(Math.floor(tn/50)%2===0&&BP.length<BPMAX-30)bTrailFx(tr.x,tr.y,tr.a,sz)}});
  // 11-14 collateral: the shock ring of an L or XL blast reaches the defender's buildings and lots nearby and breaks them too
  if(BL.damage&&P.virt&&last>0)P.virt.forEach(function(v){var iv=bImpactOf(S,v);if(!bBetween(iv,last,now))return;if(v.b)bRedraw();if(!fx||reduce)return;
    if(v.b){if(!inView(v.b.p))return;var hv=v.b.h*(1-.4*Math.min(1,v.v));bImpactFx(v.b.p.x,v.b.p.y+4-hv,bCol(v.d),.3+v.v,v.b.p.y+4);bShatterFor(v,iv,Math.round(bVoxMax()/3))}
    else if(v.lot&&inView(v.lot.p)){bRedraw();for(var k=0;k<4;k++)bEmit({k:'dust',x:v.lot.p.x+(rnd(k+v.lot.li)-.5)*20,y:v.lot.p.y+2,vx:(rnd(k*3)-.5)*20,vy:-5,r0:3,r1:14,al:.45,col:hn()?'110,100,90':'175,165,150',life:1.8});for(var k2=0;k2<6;k2++)bEmit({k:'debris',x:v.lot.p.x,y:v.lot.p.y-6,vx:(rnd(k2*1.3+v.lot.li)-.5)*90,vy:-60-rnd(k2)*60,g:v.lot.p.y+6,rot:k2,vr:4,s:1+rnd(k2*2)*1.6,col:hmul(bCol(v.d),.7),life:1.4})}});
  var FP=BL.damage?bFP():null;if(FP&&S.zf!=null&&now>=S.zf0-2600)bFallOver(c,FP.fall,S,now,last,fx,tn,rep);
  if(dt>0&&!paused){var spd=rep?BREP.sp:1;BFXT+=dt*1000*spd;bStep(dt*spd)}bDrawCollapse(c,BFXT);bDrawParticles(c);
  // fire and smoke (Mike 11-13): every hit tower burns. Flames die down as e^(-t/tau), the plume drifts downwind and thins more
  // slowly; once the cranes start it only smoulders, and stops when the rebuild is under way. Street craters mark the misses.
  if(BL.damage){var nSm=0,fq=0,tau=bTau(S),wind=bWind(P),ra=1-bRebuild();
    if(ra>0)P.shots.forEach(function(s){if(!s.to||!s.to.miss||!(s.f>0)||now<bImpactOf(S,s)||!inView(s.to))return;var r=(1.8+2.6*(BWS[s.w]||.6));c.fillStyle='rgba(18,13,10,'+(.6*ra).toFixed(2)+')';c.beginPath();c.ellipse(s.to.x,s.to.y,r*1.6,r*.8,0,0,7);c.fill();c.strokeStyle='rgba(120,105,90,'+(.45*ra).toFixed(2)+')';c.lineWidth=.6;c.stroke()});
    for(var hk in P.hit){var bl=BBLD[hk]||[];for(var bi in P.hit[hk]){var b=bl[+bi];if(!b)continue;var d=bBld(null,b.i,b.j);fq+=Math.round(d*24);if(d<=0||nSm>=10||!inView(b.p)||bRaze(b.i,b.j)>=1)continue;
      var fl=0,sm=0;P.hit[hk][bi].forEach(function(q){var ag=now-bImpactOf(S,q);if(ag<0)return;fl=Math.max(fl,q.burn*Math.exp(-ag/tau));sm=Math.max(sm,(.4*(q.cut||1)+.6*q.burn)*Math.exp(-ag/(2.5*tau)))});
      var hh=b.h,rb=bRebuildOf(b.i,b.j),top=b.p.y+4-Math.max(pxBreak(hh,bBldHeld(b.i,b.j)),rb*hh);
      if(now>=S.hold){fl=0;sm=Math.max(sm,.24)*Math.max(0,1-rb*2.5)}else sm=Math.max(sm,.14);
      nSm++;if(sm>.03)bPlumeHi(c,b.p.x+2,top-4,Math.min(1,sm),wind,b.i*7+b.j);if(fl>.04)bFlameHi(c,b.p.x+1,top+1,Math.min(1,fl),b.i*3+b.j)}}
    if(fq!==BFQ){var f0=BFQ<0;BFQ=fq;if(!f0)bRedraw()}
    // the rebuild, pixel by pixel: while the cranes work, voxels in the building's colours fly in from the hook and land on the build line
    if(BL.damage&&!reduce&&dt>0){var rb2=bRebuild();if(rb2>0&&rb2<1){var nB=0;for(var hk2 in P.hit){var bl2=BBLD[hk2]||[];for(var bi2 in P.hit[hk2]){var b2=bl2[+bi2];if(!b2||nB>=8||!inView(b2.p))continue;var dh=bBldHeld(b2.i,b2.j);if(dh<=0)continue;nB++;var rbB=bRebuildOf(b2.i,b2.j);if(rbB>=1||(rbB<=0&&bRaze(b2.i,b2.j)>0))continue;
      if(rnd(Math.floor(tn/140)+b2.i*3+b2.j)<.5){var h2=typeof bh==='function'?bh(b2.r):40,tiers2=typeof towerTiers==='function'?towerTiers(h2):[[.78,h2]],w2=tiers2[0][0],hw2=TW/2*w2,hh2=TH/2*w2,base2=b2.p.y+4,yb=rbB*h2,side=rnd(tn+b2.i)<.5?0:1,u=.05+rnd(tn*.7+b2.j)*.9,q=fpt(b2.p.x,base2,hw2,hh2,side,u,yb+(rnd(tn+u)-.5)*2),cr2=rgb(bCol(hk2)),L2=P.light;
        bEmit({k:'build',x0:b2.p.x+4+(rnd(tn*.3)-.5)*20,y0:base2-h2-40,x1:q[0],y1:q[1],x:0,y:0,arc:8+rnd(tn)*10,s:.8+rnd(tn*1.3)*.8,col:hex([cr2[0]*L2,cr2[1]*L2,cr2[2]*L2]),life:.8+rnd(tn*.9)*.4})}}}}}}
  // the counts and the countdown, in screen space
  // none of it while the replay plays: the pure city (PURE, city.ts), only buildings, missiles, hits, fire and cranes
  var pure=typeof PURE!=='undefined'&&PURE;c.setTransform(dpr,0,0,dpr,0,0);if(!pure)badges.forEach(function(b){if(b[5])badgeHi(c,cam.x+b[0]*cam.z,cam.y+b[1]*cam.z,b[2],b[3],b[4])});
  if(rep&&!pure)bHitLabels(c,P,S,now);
  if(BFLS&&!reduce){var uf=(now-BFLS.t)/BFLS.dur;if(uf>=0&&uf<1){c.fillStyle='rgba(255,250,235,'+(BFLS.a*(1-uf)*(1-uf)).toFixed(3)+')';c.fillRect(0,0,vw,vh)}}   // the big blasts white out the screen for a moment
  if(!pure&&S.live&&now>=S.count&&now<S.salvo&&P.n>0)countdownHi(c,vw/2,vh*.42,(now-S.count)/(S.salvo-S.count))}
/** the world card's battle lines */
function battleCard(key){if(!BON||!BDATA)return '';var m=(BDATA.members||{})[key];
  if(!m)return '<div class="c-grow"><div class="row"><span>Battles</span><b>Peaceful zone</b></div></div>';
  var P=bPlan(Date.now()),S=bS(),now=bNow(),mine=P.byA[key]||[],seg=bSegment(S,now),took=0,open=0;for(var bi in (P.hit[key]||{})){var b=(BBLD[key]||[])[+bi];(P.hit[key][bi]||[]).forEach(function(h){took+=h.usd});if(b)open+=bBld(null,b.i,b.j)}
  var wn=BWN[m.best]||'shells',lab={idle:'quiet',supply:'supply drop',loading:'loading',countdown:'countdown',salvo:'salvo',damage:'hit, cranes at midnight',rebuild:'rebuilding, whole by noon'}[seg];
  return '<div class="c-grow"><div class="row"><span>Shield</span><b>'+Math.round((m.sh||0)*100)+'%'+(m.beg?' (beginner)':'')+'</b></div>'
    +'<div class="row"><span>Today</span><b>'+mine.length+' missile'+(mine.length===1?'':'s')+' (up to '+e(wn)+'), '+lab+'</b></div>'
    +(took>0?'<div class="row"><span>Hits taken</span><b>'+bUsd(took)+' of damage'+(seg==='rebuild'?', '+Math.round(bRebuild()*100)+'% rebuilt':'')+'</b></div>':'')+'</div>'}
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
  dbg:function(){if(!BREP)return null;var ok=BREP.P.shots.every(function(s){return s.b&&s.to&&Math.abs(s.to.x-s.b.p.x)<=TW/2&&Math.abs(s.to.y-(s.b.p.y+4-s.b.h))<=TH/2||s.d.charAt(0)!=='@'||s.b&&s.to&&s.to.miss});var b=bBeatAt(BREP.R,bNow())||BREP.R.beats[0],pad=bPad(b.a);return {onBuildings:ok,dropped:BREP.P.dropped,n:BREP.P.n,beats:BREP.R.beats.map(function(x){return {a:x.a,d:x.d,targets:x.targets,self:x.shots.some(function(q){return q.a===q.d}),t0:x.t0,launch:x.launch,hit:x.hit,end:x.end,ri:x.lead.ri,dist:Math.round(x.lead.dist)}}),S:BREP.R.S,cam:[cam.x,cam.y,cam.z,vw,vh],from:b.lead.from,to:b.lead.to,pad:pad,g:GM[b.a]&&GM[b.a].b,frame:bRepCam(BREP.R,bNow(),BREP.home,vw,vh,reduce),keys:Object.keys(BREP.P.byA)}},
  pause:function(on){return bPause(on)},
  fly:function(h){return window.CALDERA_GROWTH_API&&window.CALDERA_GROWTH_API.plot?window.CALDERA_GROWTH_API.plot(h,1.3):false},
  phase:function(){var P=bPlan(Date.now()),S=bS(),now=bNow(),seg=bSegment(S,now),landed=0,fired=0;P.shots.forEach(function(s){if(bLandOf(S,s)<=now)landed++;if(bFireOf(S,s)<=now)fired++});
    var until=seg==='rebuild'?S.end:seg==='salvo'||seg==='damage'?S.hold:S.salvo,o={seg:seg,until:BREP?Date.now()+bRealMs(until-now,BREP.sp):until,salvoAt:S.salvo,total:P.n,landed:landed,fired:fired,night:P.night,replay:!!BREP,rebuilt:bRebuild()};
    if(BREP){var R=BREP.R,b=bBeatAt(R,now),st=bRepStage(R,now),nb=null;if(!b&&st!=='wide'&&st!=='rebuild'&&st!=='fall')for(var i=0;i<R.beats.length;i++)if(now<R.beats[i].t0){nb=R.beats[i];break}var cur=b||nb;
      o.speed=BREP.sp;o.follow=BREP.follow;var hn2=bHitsNow(BREP.P,BREP.R.S,now),lh=hn2.length?hn2[hn2.length-1]:null;o.hit=lh?{d:lh.s.d,a:lh.s.a,w:lh.s.w,from:Math.round((1-lh.t0)*1e4)/100,to:Math.round((1-lh.t1)*1e4)/100,of:100,shield:!!lh.s.blocked||!(lh.s.f>0),sh:lh.s.blocked?0:lh.s.sh||0,usd:lh.s.f>0?lh.s.usd:0,pot:lh.s.pot||0,fire:!!(lh.s.x?lh.s.x.sp:lh.s.burn>=1)&&lh.s.f>0,ix:lh.s.ix}:null;o.stage=st;o.beats=R.beats.length;o.beat=cur?cur.i+1:R.beats.length;o.demo=!!BREP.demo;o.paused=BREP.pauseAt!=null;o.t=now;o.dur=R.S.end;o.seg=st==='beat'||st==='pre'?'salvo':st==='wide'||st==='fall'?'damage':st==='rebuild'?'rebuild':'idle';
      var FF=BREP.P.fall;o.fallen=FF?FF.key:null;o.label=st==='fall'&&FF?(FF.raid?'The raiders fall':FF.key+' falls'):cur?(cur.raid?'Raiders':cur.a)+' → '+(cur.d.charAt(0)==='@'?cur.d:'the sea')+(cur.targets.length>1?' +'+(cur.targets.length-1):'')+' · '+cur.n+' missile'+(cur.n===1?'':'s'):st==='wide'?(FF?(FF.raid?'The raiders fell':FF.key+' fell')+' · every strike landed':'Every strike landed'):st==='rebuild'?'Cranes, '+Math.round(bRebuild()*100)+'% rebuilt':'';}
    return o},
  state:function(){return {on:BON,layers:BL,phase:this.phase(),cities:BDATA&&BDATA.members?Object.keys(BDATA.members).length:0}},
  dmg:function(i,j){return bBld(null,i,j)},
  /** the saved record (caldera.battle.state v1) and a tower's rebuild progress with it */
  saved:function(){return BSTATE||bStateRead()},rebuilt:function(i,j){return bRebuildOf(i,j)}};
bStateRead();
`;

export const BATTLE_DRAW_JS = BATTLE_ART_JS + BATTLE_LOGIC_JS;
