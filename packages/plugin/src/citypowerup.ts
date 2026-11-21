/**
 * Viewer power-ups v1 (map-audit DESIGN.md item 10, mockup 05; Mike D1 11-20: "Ship v1 cosmetic, free and local"). During a
 * battle replay the viewer arms a power-up in the hub's tray (battleclient.ts: keys 1 2 3, charges, limits, toast) and taps the
 * map; city.ts sees the tap (under 180 ms and 8 px, puIsTap) and hands it to window.CALDERA_BATTLE_TAP, which calls
 * CALDERA_BATTLE_API.drop(kind, clientX, clientY) here. Three drops, drawn only for this viewer: a repair crate on a green and
 * white parachute (then a green ring, rising "+" glyphs, and for 6 s the building's plume at half and its crane at 3x), a
 * firework (a rocket line, then a 26-ray burst, half the time a second smaller one), a cheer (34 confetti bars and three pink
 * rings). No network call, no storage, nothing changes in battle data. Its own particle pool (80; phone 50) so it never
 * starves the battle effects. prefers-reduced-motion: a 300 ms fade-in of the end state, no fall and no burst.
 * Runs inside the CITY_JS closure after BATTLE_LOGIC_JS (cam, vw, dpr, reduce, BBLD, bBuildings, bCenter, GM, spGlowC, draw).
 */
export const POWERUP_JS = String.raw`
// ---- viewer power-ups v1 (citypowerup.ts POWERUP_JS): cosmetic, local to this viewer, no network call, no storage
var PUC={heal:'#4BE38A',fw:'#FFC83D',cheer:'#FF7BD0'},PUFW=['255,200,61','61,242,255','255,123,208','139,108,246'],PUCF=['#FF7BD0','#3DF2FF','#FFC83D','#8B6CF6','#4BE38A','#FFFFFF'];
var PUP=[],PUREP={},PULT=0,PUTIMER=0,PUFALL=1400,PUBOOST=6000,PUSNAP=60;
function puMax(){return vw<700?50:80}
/** the power-up pool: never more than puMax() pieces; the oldest go first */
function puAdd(p){var m=puMax();while(PUP.length>=m)PUP.shift();PUP.push(p);return p}
/** a tap drops (DESIGN.md 10 rule 2): under 180 ms and under 8 px of travel; anything longer or farther is a drag (it pans) */
function puIsTap(ms,dist){return ms>=0&&ms<180&&dist>=0&&dist<8}
function puRoof(b){var h=b.h;if(typeof pxBreak==='function'&&typeof bBldHeld==='function')h=pxBreak(h,bBldHeld(b.i,b.j));return {x:b.p.x,y:b.p.y+4-h,gy:b.p.y+4}}
function puSegD(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,u=l>0?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;return Math.hypot(px-ax-dx*u,py-ay-dy*u)}
/** where a tap at stage px (sx,sy) lands: the roof of the closest building whose tower (base to roof) is within 60 css px,
 *  otherwise the ground under the tap. key: that building's city, otherwise the nearest city */
function puTarget(sx,sy){if(typeof BBLD==='undefined')return null;if(!Object.keys(BBLD).length&&typeof bBuildings==='function')bBuildings();
  var z=cam.z,best=null,bd=PUSNAP;for(var k in BBLD){if(k.charAt(0)!=='@')continue;BBLD[k].forEach(function(b){var r=puRoof(b),x=cam.x+r.x*z,d=puSegD(sx,sy,x,cam.y+r.y*z,x,cam.y+r.gy*z);if(d<bd){bd=d;best={x:r.x,y:r.y,key:k,i:b.i,j:b.j,snap:true}}})}
  if(best)return best;var wx=(sx-cam.x)/z,wy=(sy-cam.y)/z,hk=null,hd=1e18;
  if(typeof GM!=='undefined'&&typeof bCenter==='function')for(var g in GM){if(g.charAt(0)!=='@')continue;var c=bCenter(g);if(!c)continue;var dd=(c.x-wx)*(c.x-wx)+(c.y-wy)*(c.y-wy);if(dd<hd){hd=dd;hk=g}}
  return {x:wx,y:wy,key:hk,snap:false}}
/** drop kind ('heal' | 'fw' | 'cheer') at stage px; returns {ok, handle (the city it went to, or null), snap, x, y (stage px)} */
function puDrop(kind,sx,sy){if(!PUC[kind]||!isFinite(sx)||!isFinite(sy))return {ok:false,handle:null};var t=puTarget(sx,sy);if(!t)return {ok:false,handle:null};
  var tn=performance.now(),rm=!!reduce,ph=vw<700,r=Math.random;
  if(kind==='heal')puAdd({k:'crate',x:t.x,y:t.y,t0:tn,rm:rm,b:t.snap?t.i+','+t.j:null,seed:r()*9});
  else if(kind==='fw'){var n=r()<.5?2:1;for(var b=0;b<n;b++){var sc=b?.7:1;puAdd({k:'fw',x:t.x+(b?(r()<.5?-1:1)*(18+r()*22):0),y:t.y,h:(150+r()*60)*(b?.85:1),R:(64+r()*28)*sc,col:PUFW[Math.floor(r()*4)],t0:tn+b*250,n:ph?16:26,rm:rm,seed:r()*99})}}
  else{puAdd({k:'rings',x:t.x,y:t.y,t0:tn,rm:rm});var nc=ph?20:34;for(var q=0;q<nc;q++){var a=-Math.PI/2+(r()-.5)*1.5,v=120+r()*140;puAdd({k:'cf',x:t.x,y:t.y,ox:0,oy:0,vx:Math.cos(a)*v,vy:Math.sin(a)*v,w:4+r()*5,hh:1.6+r()*1.6,col:PUCF[q%6],rot:r()*6.283,vr:(r()-.5)*14,t0:tn,rm:rm})}}
  puWake();return {ok:true,handle:t.key,snap:t.snap,x:cam.x+t.x*cam.z,y:cam.y+t.y*cam.z}}
/** with reduced motion the page draws on demand: keep frames coming while a drop is on screen */
function puWake(){if(typeof draw==='function')draw();if(!reduce||PUTIMER||typeof frame!=='function')return;PUTIMER=setInterval(function(){if(!PUP.length){clearInterval(PUTIMER);PUTIMER=0}frame()},60)}
/** a repaired building (6 s after its crate lands): its plume draws at half, a crane next to it swings at 3x */
function puPlume(i,j){var q=PUREP[i+','+j];return q&&q.until>performance.now()?.5:1}
function puCrane(k){var tn=performance.now(),dt=k.pul?Math.min(100,tn-k.pul):0;k.pul=tn;if(!dt)return;for(var id in PUREP){var q=PUREP[id];if(q.until<=tn){delete PUREP[id];continue}if(Math.abs(k.x-q.x)<TW*1.2&&Math.abs(k.y-q.y)<TH*2.5){k.ex=(k.ex||0)+2*dt;return}}}
/** the fade of the reduced-motion end state: in over 300 ms, held, out over 300 ms */
function puRmA(age,life){return Math.max(0,Math.min(1,age/300,(life-age)/300))}
function puCrateHi(c,x,y,s,al,open){c.save();c.globalAlpha=al;if(open>0){var cy0=y-30*s*open,rx=20*s*open,ry=15*s*open;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=.9*s;c.beginPath();[-1,-.35,.35,1].forEach(function(d){c.moveTo(x+d*rx,cy0);c.lineTo(x+d*5*s,y-9*s)});c.stroke();
    var g=c.createLinearGradient(x-rx,0,x+rx,0);['#35C876','#F4F6FA','#35C876','#F4F6FA','#35C876'].forEach(function(k,i){g.addColorStop(i/5,k);g.addColorStop(Math.max(0,(i+1)/5-.001),k)});c.fillStyle=g;c.beginPath();c.ellipse(x,cy0,rx,ry,0,Math.PI,0);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse(x,cy0,rx,ry*.27,0,0,Math.PI);c.fill()}
  var a=7*s,h=8*s,q=a/2;poly(c,[[x-a,y-h],[x,y-h+q],[x,y+q],[x-a,y]],'#DDE2EA');poly(c,[[x,y-h+q],[x+a,y-h],[x+a,y],[x,y+q]],'#B9C0CC');poly(c,[[x,y-h-q],[x+a,y-h],[x,y-h+q],[x-a,y-h]],'#F4F6FA');
  c.fillStyle='#22B864';c.fillRect(x-a*.72,y-h*.55-.8*s,a*.5,1.6*s);c.fillRect(x-a*.47-.8*s,y-h*.55-a*.25,1.6*s,a*.5);c.restore()}
function puHealFx(c,x,y,s,la,rm,al){c.save();c.globalCompositeOperation='lighter';
  var u=rm?1:Math.min(1,la/500),ga=rm?.5*al:.55*(1-u);if(ga>0){var g=c.createRadialGradient(x,y,0,x,y,60*s);g.addColorStop(0,'rgba(75,227,138,'+ga.toFixed(3)+')');g.addColorStop(.5,'rgba(75,227,138,'+(ga*.36).toFixed(3)+')');g.addColorStop(1,'rgba(75,227,138,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,60*s,0,7);c.fill()}
  var ru=rm?1:Math.min(1,la/600),ra=rm?al:1-ru;if(ra>0)[26,44].forEach(function(q,i){var k=.6+.4*ru;c.beginPath();c.ellipse(x,y+6*s,q*s*k,q*s*k*.5,0,0,7);c.lineWidth=(2-i*.8)*s;c.strokeStyle='rgba(120,255,170,'+((.8-i*.4)*ra).toFixed(3)+')';c.stroke()});
  var pu=rm?.5:Math.min(1,la/900),pa=rm?al:pu<.7?1:(1-pu)/.3;if(pa>0)[[0,-12,7,.95],[-22,0,5,.7],[20,-20,5,.6],[10,-34,4,.4],[-14,-26,4,.5]].forEach(function(p){var q=p[2]*s,yy=y+p[1]*s-40*s*pu;c.fillStyle='rgba(150,255,190,'+(p[3]*pa).toFixed(3)+')';c.fillRect(x+p[0]*s-q,yy-q*.3,q*2,q*.6);c.fillRect(x+p[0]*s-q*.3,yy-q,q*.6,q*2)});
  c.restore()}
function puBurst(c,p,cx0,cy0,s,g,al){var R=p.R*s,n=p.n;c.save();c.globalCompositeOperation='lighter';
  var gl=c.createRadialGradient(cx0,cy0,0,cx0,cy0,R*.9);gl.addColorStop(0,'rgba('+p.col+','+(.5*al*(1-g*.6)).toFixed(3)+')');gl.addColorStop(1,'rgba('+p.col+',0)');c.fillStyle=gl;c.beginPath();c.arc(cx0,cy0,R*.9,0,7);c.fill();
  var tip=typeof spGlowC==='function'?spGlowC(p.col):null;c.lineWidth=1.6*s;
  for(var k=0;k<n;k++){var a=k/n*6.283+rnd(p.seed+k)*.2,l=R*(.7+rnd(p.seed+k*7.3)*.35)*g,x1=cx0+Math.cos(a)*l,y1=cy0+Math.sin(a)*l+l*l/R*.14+g*g*6*s;if(l<1)continue;
    var gr=c.createLinearGradient(cx0,cy0,x1,y1);gr.addColorStop(0,'rgba('+p.col+',0)');gr.addColorStop(.5,'rgba('+p.col+','+(.5*al).toFixed(3)+')');gr.addColorStop(1,'rgba(255,255,255,'+(.95*al).toFixed(3)+')');c.strokeStyle=gr;
    c.beginPath();c.moveTo(cx0+Math.cos(a)*l*.12,cy0+Math.sin(a)*l*.12);c.quadraticCurveTo(cx0+Math.cos(a)*l*.6,cy0+Math.sin(a)*l*.6,x1,y1);c.stroke();
    if(tip){c.globalAlpha=al;c.drawImage(tip,x1-6*s,y1-6*s,12*s,12*s);c.globalAlpha=1}}
  c.restore()}
function puConf(c,x,y,p,s,al){c.save();c.globalAlpha=al;c.translate(x,y);c.rotate(p.rot);c.fillStyle=p.col;var w=p.w*s,h=p.hh*s;c.beginPath();if(c.roundRect)c.roundRect(-w/2,-h/2,w,h,h/2);else c.rect(-w/2,-h/2,w,h);c.fill();c.restore()}
/** step and draw every power-up piece (world transform; sizes are css px, so they read the same at any zoom). Real time: a
 *  paused replay still shows the drop, and a drop never pauses the replay */
function puDraw(c){if(!PUP.length)return;var tn=performance.now(),dt=PULT?Math.min(.05,(tn-PULT)/1000):0,s=1/Math.max(.05,cam.z);PULT=tn;
  c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  for(var i=PUP.length-1;i>=0;i--){var p=PUP[i],age=tn-p.t0;if(age<0)continue;
    if(p.k==='crate'){var life=p.rm?1500:PUFALL+1300;if(age>=life){PUP.splice(i,1);continue}
      var la=p.rm?age:age-PUFALL;if(la>=0&&p.b&&!p.boost){p.boost=1;PUREP[p.b]={until:tn+PUBOOST-Math.max(0,la),x:p.x,y:p.y}}
      if(p.rm){var al=puRmA(age,life);puHealFx(c,p.x,p.y,s,0,true,al);puCrateHi(c,p.x,p.y,s,al,0);continue}
      if(la<0){var u=age/PUFALL,f=u<.2?1.75*u*u:.07+(u-.2)*1.1625,sw=Math.sin(u*9+p.seed)*2.2*s*(u>.2?1:u/.2);puCrateHi(c,p.x+sw,p.y-170*(1-f),s,1,u<.2?u/.2:1)}
      else{puHealFx(c,p.x,p.y,s,la,false,1);puCrateHi(c,p.x,p.y,s,la<900?1:Math.max(0,1-(la-900)/400),Math.max(0,1-la/300))}}
    else if(p.k==='fw'){var lf=p.rm?1400:1700;if(age>=lf){PUP.splice(i,1);continue}var top=p.y-p.h;
      if(p.rm){puBurst(c,p,p.x,top,s,1,puRmA(age,lf)*.9);continue}
      if(age<600){var e=age/600,e2=1-(1-e)*(1-e),hy=p.y-p.h*e2;c.save();c.globalCompositeOperation='lighter';var lg=c.createLinearGradient(p.x,p.y,p.x,hy);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(1,'rgba(255,240,210,.75)');c.strokeStyle=lg;c.lineWidth=1.5*s;c.beginPath();c.moveTo(p.x,Math.min(p.y,hy+60));c.lineTo(p.x,hy);c.stroke();
        c.fillStyle='rgba(255,246,220,.95)';c.beginPath();c.arc(p.x,hy,1.8*s,0,7);c.fill();c.restore()}
      else{var a2=(age-600)/1100,g2=1-Math.pow(1-a2,3);puBurst(c,p,p.x,top,s,g2,a2<.6?1:(1-a2)/.4)}}
    else if(p.k==='rings'){var lr=p.rm?1500:900;if(age>=lr){PUP.splice(i,1);continue}var ru=p.rm?1:age/lr,ra=p.rm?puRmA(age,lr):1-ru;c.save();
      [30,50,72].forEach(function(q,j){var k2=.5+.5*ru;c.beginPath();c.ellipse(p.x,p.y,q*s*k2,q*s*k2*.5,0,0,7);c.lineWidth=(2.5-j*.7)*s;c.strokeStyle='rgba(255,123,208,'+((.7-j*.2)*ra).toFixed(3)+')';c.stroke()});c.restore()}
    else if(p.k==='cf'){var lc=p.rm?1500:1600;if(age>=lc){PUP.splice(i,1);continue}
      if(p.rm){if(!p.done){p.done=1;var tt=.7;p.ox=p.vx*tt;p.oy=p.vy*tt+100*tt*tt;p.rot+=p.vr*tt}puConf(c,p.x+p.ox*s,p.y+p.oy*s,p,s,puRmA(age,lc));continue}
      p.vy+=200*dt;p.ox+=p.vx*dt;p.oy+=p.vy*dt;p.rot+=p.vr*dt;var uc=age/lc;puConf(c,p.x+p.ox*s,p.y+p.oy*s,p,s,uc<.7?1:(1-uc)/.3)}}}
window.CALDERA_BATTLE_API.drop=function(kind,clientX,clientY){var r=typeof st!=='undefined'&&st&&st.getBoundingClientRect?st.getBoundingClientRect():{left:0,top:0};return puDrop(kind,clientX-r.left,clientY-r.top)};
window.CALDERA_BATTLE_API.powerups=function(){var o={};PUP.forEach(function(p){o[p.k]=(o[p.k]||0)+1});return {n:PUP.length,max:puMax(),kinds:o,repaired:Object.keys(PUREP)}};
`;
