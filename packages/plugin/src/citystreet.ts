// Street people and vehicles in 3D (Mike 2026-11-18: "increase fidelity of humans and cars moving on caldera, make them
// directional, 3d and better"). Built to the design spec (scratchpad people-cars-design.md, Fable): every street figure and
// vehicle is a vector box model on true iso axes, lit like the buildings (top brightest, left face lit, right face dark),
// drawn per heading (no mirroring for cars, so the lit side stays right), cached as device-resolution sprites keyed by
// type|colour|heading|sky|lamps|lod|bucket, built lazily (at most 4 per frame) with an LRU cap. Detail drops by on-screen
// size: full, simplified, a 3-tone box / dot-and-body, then a 2-tone dash or dot. Sky 'grid' (Tron) is not drawn here.
// Embedded in CITY_JS after LIFE_JS; uses the page globals sky, dpr, cam, reduce, GHOSTCOL, MINI at call time only.
export const STREET_JS = String.raw`
var PERSON_H=9,CAR_K=.85,S3={m:new Map(),t:-1e9,n:0,ctr:0,built:0},S3BK=[.5,1,1.5,2,3,4,6,8],S3CAP=256,S3BUDGET=4;
function s3hx(h){h=String(h||'#888888');if(h.charAt(0)==='#')h=h.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16)||0;return [(n>>16)&255,(n>>8)&255,n&255]}
function s3c(col,m,tint,ta){var c=s3hx(col),t=tint?s3hx(tint):null,r=[0,0,0];for(var i=0;i<3;i++){var v=Math.min(255,c[i]*m);if(t)v=v+(t[i]-v)*ta;r[i]=Math.round(Math.max(0,Math.min(255,v)))}return 'rgb('+r[0]+','+r[1]+','+r[2]+')'}
function s3a(col,a){var c=s3hx(col);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}
function s3hash(n){n=(Math.imul((n|0)^0x9E3779B9,0x85EBCA6B)>>>0);n=(Math.imul(n^(n>>>13),0xC2B2AE35)>>>0);return (n^(n>>>16))>>>0}
function s3Sky(){return sky==='night'?'night':sky==='dusk'?'dusk':'day'}
// ---- shading: one rule for every face (spec 0, 1.3)
var S3SH={day:{top:1.16,roof:1.24,cam:.82,dl:.14},dusk:{top:1.0,roof:1.06,cam:.71,dl:.13},night:{top:.62,roof:.66,cam:.43,dl:.07}};
function s3Face(col,sk,np,nq,kind,mul){var S=S3SH[sk],m,lit;if(kind){m=S[kind];lit=true}else{m=S.cam+S.dl*(nq-np);lit=nq>=np}m*=(mul||1);
  if(sk==='dusk')return lit?s3c(col,m,'#FF9A6B',.12):s3c(col,m,'#3B2E5A',.10);if(sk==='night')return s3c(col,m,'#2A3A6A',.18);return s3c(col,m)}
// ---- projection: heading h in 45 degree steps (0 SE, 2 SW, 4 NW, 6 NE are the road axes); a forward, b to the right, z up
function s3Ax(h,k){var ph=h*Math.PI/4,cs=Math.cos(ph),sn=Math.sin(ph);if(Math.abs(cs)<1e-9)cs=0;if(Math.abs(sn)<1e-9)sn=0;
  return {ux:(cs-sn)*.894*k,uy:(cs+sn)*.447*k,vx:(-sn-cs)*.894*k,vy:(-sn+cs)*.447*k,cs:cs,sn:sn,k:k}}
function s3P(A,a,b,z){return [a*A.ux+b*A.vx,a*A.uy+b*A.vy-z*A.k]}
function s3poly(c,q,fill){c.beginPath();c.moveTo(q[0][0],q[0][1]);for(var i=1;i<q.length;i++)c.lineTo(q[i][0],q[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}}
function s3lerp(p,q,t){return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]}
function s3qp(q,s,t){return s3lerp(s3lerp(q[0],q[1],s),s3lerp(q[3],q[2],s),t)}   // a point inside a face quad: s along the bottom edge, t up
function s3sub(q,s0,s1,t0,t1){return [s3qp(q,s0,t0),s3qp(q,s1,t0),s3qp(q,s1,t1),s3qp(q,s0,t1)]}
// a frustum box: bottom rect [a0,a1]x[b0,b1] at z0, top rect T=[a0,a1,b0,b1] at z1. Draws visible sides then the top; returns the visible faces
function s3Box(c,A,sk,col,a0,a1,b0,b1,z0,z1,T,o){o=o||{};T=T||[a0,a1,b0,b1];var vis=[],P=function(a,b,z){return s3P(A,a,b,z)};
  var F=[['f',A.cs,A.sn,[P(a1,b0,z0),P(a1,b1,z0),P(T[1],T[3],z1),P(T[1],T[2],z1)]],['r',-A.cs,-A.sn,[P(a0,b1,z0),P(a0,b0,z0),P(T[0],T[2],z1),P(T[0],T[3],z1)]],
    ['R',-A.sn,A.cs,[P(a0,b1,z0),P(a1,b1,z0),P(T[1],T[3],z1),P(T[0],T[3],z1)]],['L',A.sn,-A.cs,[P(a1,b0,z0),P(a0,b0,z0),P(T[0],T[2],z1),P(T[1],T[2],z1)]]];
  F.forEach(function(f){if(f[1]+f[2]<=1e-6)return;var q=f[3];if(!o.noSides){var y0=(q[2][1]+q[3][1])/2,y1=(q[0][1]+q[1][1])/2,g=c.createLinearGradient(0,y0,0,y1+.001);
      g.addColorStop(0,s3Face(col,sk,f[1],f[2],null,o.mul));g.addColorStop(1,s3Face(col,sk,f[1],f[2],null,(o.mul||1)*.86));s3poly(c,q,g)}vis.push({id:f[0],np:f[1],nq:f[2],q:q})});
  if(!o.noTop)s3poly(c,[P(T[0],T[2],z1),P(T[1],T[2],z1),P(T[1],T[3],z1),P(T[0],T[3],z1)],o.topFill||s3Face(col,sk,0,0,o.roof?'roof':'top',o.mul));
  return vis}
function s3crease(sk){return sk==='night'?'rgba(190,210,255,.30)':sk==='dusk'?'rgba(255,214,180,.30)':'rgba(255,255,255,.38)'}
function s3edges(c,vis,sk,w){c.strokeStyle=s3crease(sk);c.lineWidth=w;c.lineCap='round';vis.forEach(function(f){if(f.nq<=f.np)return;c.beginPath();c.moveTo(f.q[3][0],f.q[3][1]);c.lineTo(f.q[2][0],f.q[2][1]);c.stroke()})}
// a flat rect on a face plane: side faces use (a,z), end faces use (b,z)
function s3onSide(c,A,b,fn){var o=s3P(A,0,b,0);c.save();c.transform(A.ux/A.k,A.uy/A.k,0,-1,o[0],o[1]);c.scale(A.k,A.k);fn();c.restore()}
function s3onEnd(c,A,a,fn){var o=s3P(A,a,0,0);c.save();c.transform(A.vx/A.k,A.vy/A.k,0,-1,o[0],o[1]);c.scale(A.k,A.k);fn();c.restore()}
var S3GLASS={day:['#9CC3EA','#4E79AD','#B4D6F4','#6F9FD0'],dusk:['#6A7DAE','#2E3A5E','#8A86B8','#3A3F68'],night:['#18213A','#0F1626','#18213A','#0F1626']};
function s3glass(c,q,sk,end,lit){var G=S3GLASS[sk],y0=Math.min(q[2][1],q[3][1]),y1=Math.max(q[0][1],q[1][1]),g=c.createLinearGradient(0,y0,0,y1+.001);
  if(lit){g.addColorStop(0,'#F5D28A');g.addColorStop(1,'#D9B06A')}else{g.addColorStop(0,G[end?2:0]);g.addColorStop(1,G[end?3:1])}s3poly(c,q,g)}
function s3glint(c,q,sk,left){var a=sk==='night'?(left?.18:0):sk==='dusk'?(left?.40:.16):(left?.55:.22);if(a<=0)return;var col=sk==='night'?'180,200,255':sk==='dusk'?'255,190,140':'255,255,255';
  s3poly(c,[s3qp(q,.26,0),s3qp(q,.34,0),s3qp(q,.42,1),s3qp(q,.34,1)],'rgba('+col+','+a+')')}
// ---- cars (spec 1.2): L W g zb | cabin a0 a1 | in | zr | f r s | wheel a, radius
var S3CAR={sedan:[18,8,1.1,4.4,-6,3,.65,7.2,1.8,1.4,.5,5.5,1.8],hatch:[15,7.8,1.1,4.6,-7,2.4,.6,7.5,1.7,.7,.45,4.6,1.8],suv:[19,8.4,1.5,5.4,-9,4.2,.45,9,1.5,.5,.35,5.9,2.1],
  van:[20,8.4,1.5,5.4,-9.6,5.6,.2,10.2,1.2,.2,.2,6.2,2.1],pickup:[19,8.2,1.5,5,-.8,4.2,.55,8.4,1.5,.5,.4,5.9,2.1],taxi:[18,8,1.1,4.4,-6,3,.65,7.2,1.8,1.4,.5,5.5,1.8]};
var S3PAL=[['#ECEFF3',22],['#3A3F4B',16],['#AEB6C2',14],['#D9483B',12],['#3F7FD9',12],['#2FA39A',9],['#E07B39',8],['#7A5AA8',7]],S3TYPES=[['sedan',44],['hatch',26],['suv',16],['pickup',7],['taxi',7]];   // vans only mean sales (spec 1.2 option)
function s3pick(T,r){var t=0,i;for(i=0;i<T.length;i++)t+=T[i][1];r=r%t;for(i=0;i<T.length;i++){if(r<T[i][1])return T[i][0];r-=T[i][1]}return T[0][0]}
function s3CarLook(seed){var h=s3hash(seed),type=s3pick(S3TYPES,h%1000);return {type:type,col:type==='taxi'?'#F2C14E':s3pick(S3PAL,(h>>>10)%1000)}}
function s3lamps(c,A,sk,on,face,L,W,lod,kind){var head=face==='f',b0=W/2-(head?1.4:1.3),w=head?1.9:2,z0=head?2.6:3.1,z1=head?3.7:4,col=head?(on?'#FFF2C2':'#F4F7FA'):(on?'#FF3B3B':'#B3262B');
  if(kind==='bus'){b0=W/2-1.5}
  s3onEnd(c,A,head?L/2:-L/2,function(){c.fillStyle=col;[-1,1].forEach(function(s){c.fillRect(s*b0-w/2,z0,w,z1-z0)});
    if(head&&lod>=2&&kind!=='bus'){c.fillStyle='#1B1D22';c.fillRect(-2,1.7,4,.8)}if(lod>=2){c.fillStyle='#E8EAEE';c.fillRect(-1.3,1.5,2.6,.7)}});
  if(on){c.save();c.globalCompositeOperation='lighter';[-1,1].forEach(function(s){var p=s3P(A,head?L/2:-L/2,s*b0,(z0+z1)/2),r=(head?3.4:2.6)*A.k,g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],r);
    g.addColorStop(0,head?'rgba(255,236,170,.55)':'rgba(255,60,60,.50)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(p[0]-r,p[1]-r,2*r,2*r)});c.restore()}}
function s3wrap(c,A,side,L,on){s3onSide(c,A,side,function(){c.fillStyle=on?'#FFF2C2':'#F4F7FA';c.fillRect(L/2-1,2.6,1,1.1);c.fillStyle=on?'#FF3B3B':'#B3262B';c.fillRect(-L/2,3.1,.9,.9)})}
function s3wheels(c,A,sk,side,wa,r,lod){var hub=sk==='day'?'#9AA3AF':sk==='dusk'?'#6C7480':'#3C4350';s3onSide(c,A,side,function(){[-wa,wa].forEach(function(x){c.fillStyle='#0E1118';c.beginPath();c.arc(x,r,r+.45,0,Math.PI);c.fill();
    c.fillStyle='#14161C';c.beginPath();c.arc(x,r,r,0,7);c.fill();if(lod>=2){c.fillStyle=hub;c.beginPath();c.arc(x,r,r*.42,0,7);c.fill()}})})}
function s3shadow(c,A,sk,L,W){var Aa=sk==='night'?.36:sk==='dusk'?.30:.26,ft=function(gr){var a=L/2+gr,b=W/2+gr;return [s3P(A,-a,-b,0),s3P(A,a,-b,0),s3P(A,a,b,0),s3P(A,-a,b,0)].map(function(p){return [p[0]+1.8,p[1]+1]})};
  s3poly(c,ft(1.2),'rgba(0,0,0,'+(.45*Aa).toFixed(3)+')');s3poly(c,ft(0),'rgba(0,0,0,'+Aa+')');
  s3poly(c,[s3P(A,-L/2+.6,-W/2+.6,0),s3P(A,L/2-.6,-W/2+.6,0),s3P(A,L/2-.6,W/2-.6,0),s3P(A,-L/2+.6,W/2-.6,0)],'rgba(0,0,0,.16)')}
// draw one car around its ground centre (0,0) in world px. o: {type,col,h,lamps,lod,open,stripe}
function s3DrawCar(c,o){var sk=o.sky||s3Sky(),A=s3Ax(o.h,CAR_K),D=S3CAR[o.type]||S3CAR.sedan,L=D[0],W=D[1],g=D[2],zb=D[3],lod=o.lod,van=o.type==='van',body=van?'#ECEFF3':o.col,on=!!o.lamps;
  s3shadow(c,A,sk,L,W);
  if(lod<=0){var v0=s3Box(c,A,sk,body,-L/2,L/2,-W/2,W/2,g,zb);s3poly(c,[s3P(A,D[4],-W/2+D[6],zb+.01),s3P(A,D[5],-W/2+D[6],zb+.01),s3P(A,D[5],W/2-D[6],zb+.01),s3P(A,D[4],W/2-D[6],zb+.01)],s3Face(body,sk,0,0,'top',.6));
    if(sk!=='day'&&on){var f=s3P(A,L/2,0,3),r=s3P(A,-L/2,0,3.4);c.fillStyle='#FFF2C2';c.fillRect(f[0]-.6,f[1]-.6,1.2,1.2);c.fillStyle='#FF3B3B';c.fillRect(r[0]-.6,r[1]-.6,1.2,1.2)}return}
  var vis=s3Box(c,A,sk,body,-L/2,L/2,-W/2,W/2,g,zb),side=null,end=null;vis.forEach(function(f){if(f.id==='R')side=W/2;if(f.id==='L')side=-W/2;if(f.id==='f'||f.id==='r')end=f.id});
  // bumper / sill band and the van's district stripe
  vis.forEach(function(f){var lo=g,hi=g+.9;s3poly(c,s3sub(f.q,0,1,0,(hi-lo)/(zb-g)),s3Face(body,sk,f.np,f.nq,null,.55));
    if(van&&(f.id==='R'||f.id==='L'))s3poly(c,s3sub(f.q,0,1,(3-g)/(zb-g),1),s3Face(o.col,sk,f.np,f.nq))});
  if(o.type==='pickup')s3poly(c,[s3P(A,-9.1+.7,-W/2+.7,zb+.01),s3P(A,-1.4,-W/2+.7,zb+.01),s3P(A,-1.4,W/2-.7,zb+.01),s3P(A,-9.1+.7,W/2-.7,zb+.01)],s3c(o.col,.5));
  if(lod>=2&&end){var fs=(end==='f'?-1:1)*(W/2-1.5);s3onEnd(c,A,end==='f'?L/2:-L/2,function(){c.fillStyle='#14161C';c.fillRect(fs-.6,0,1.2,g+.2)})}   // the far wheel under the bumper
  s3wheels(c,A,sk,side,D[11],D[12],lod);
  // cabin: tapered box, glass on every visible face
  var ins=D[6],ca0=D[4],ca1=D[5],zr=D[7],T=[ca0+D[9],ca1-D[8],-W/2+ins+D[10],W/2-ins-D[10]];
  var cv=s3Box(c,A,sk,body,ca0,ca1,-W/2+ins,W/2-ins,zb,zr,T,{roof:true,noTop:true});
  var t0=.25/(zr-zb),t1=1-.35/(zr-zb);cv.forEach(function(f){var isEnd=f.id==='f'||f.id==='r',len=isEnd?(W-2*ins):(ca1-ca0),pw=.55/len,lit=f.nq>f.np;
    if(isEnd){var q=s3sub(f.q,pw,1-pw,t0,t1);s3glass(c,q,sk,true);if(lod>=2)s3glint(c,q,sk,lit);if(sk==='night'&&on&&f.id==='f')s3poly(c,s3sub(q,0,1,0,.4),'rgba(255,214,150,.16)');return}
    var s0=pw,s1=1-pw;if(van)s0=Math.max(s0,(1.5-ca0)/(ca1-ca0));if(o.type==='pickup')s0=pw;
    if(lod>=2&&!van){var bm=1-.42,bw=.55/len/2;[[s0,bm-bw],[bm+bw,s1]].forEach(function(r){var q=s3sub(f.q,r[0],r[1],t0,t1);s3glass(c,q,sk,false);s3glint(c,q,sk,lit)})}
    else{var q2=s3sub(f.q,s0,s1,t0,t1);s3glass(c,q2,sk,false);if(lod>=2)s3glint(c,q2,sk,lit)}});
  s3poly(c,[s3P(A,T[0],T[2],zr),s3P(A,T[1],T[2],zr),s3P(A,T[1],T[3],zr),s3P(A,T[0],T[3],zr)],s3Face(van?o.col:body,sk,0,0,'roof'));
  if(o.type==='taxi'){s3Box(c,A,sk,on||sk!=='day'?'#FFE9A0':'#FFFDF0',-1.9,-.3,-1.2,1.2,zr,zr+1.1,null,{});
    vis.forEach(function(f){if(f.id!=='R'&&f.id!=='L')return;s3poly(c,s3sub(f.q,0,1,(3.2-g)/(zb-g),(3.8-g)/(zb-g)),lod>=2?'#1B1D22':'rgba(27,29,34,.85)')})}
  if(o.open&&van){if(side===W/2)s3onSide(c,A,side,function(){c.fillStyle='#0E1420';c.fillRect(-4,1.9,4.5,6.7)});if(end==='r')s3onEnd(c,A,-L/2,function(){c.fillStyle='#0E1420';c.fillRect(-3.2,1.9,6.4,7.1)})}
  if(end)s3lamps(c,A,sk,on,end,L,W,lod,'car');if(side!==null)s3wrap(c,A,side,L,on);
  s3edges(c,vis,sk,.3);s3edges(c,cv,sk,.3)}
function s3DrawBus(c,o){var sk=o.sky||s3Sky(),A=s3Ax(o.h,CAR_K),L=30,W=9,g=1.3,zr=10.5,lod=o.lod,col=o.col||'#F2A33A',on=!!o.lamps,litW=sk!=='day';
  s3shadow(c,A,sk,L,W);var vis=s3Box(c,A,sk,col,-L/2,L/2,-W/2,W/2,g,zr,null,{roof:true}),side=null,end=null;vis.forEach(function(f){if(f.id==='R')side=W/2;if(f.id==='L')side=-W/2;if(f.id==='f'||f.id==='r')end=f.id});
  var H=zr-g,zt=function(z){return (z-g)/H};
  vis.forEach(function(f){s3poly(c,s3sub(f.q,0,1,0,zt(2.2)),s3Face(col,sk,f.np,f.nq,null,.55));if(lod<=0){if(f.id==='R'||f.id==='L')s3poly(c,s3sub(f.q,.04,.96,zt(5.2),zt(8.8)),litW?'#C9A866':'#2A3550');return}
    if(f.id==='R'||f.id==='L'){var q=s3sub(f.q,.02,.98,zt(5.2),zt(8.8));s3glass(c,q,sk,false,litW);var n=Math.floor(L/3.6);for(var i=1;i<n;i++){var s=i/n;s3poly(c,s3sub(f.q,s-.01,s+.01,zt(5.2),zt(8.8)),s3Face(col,sk,f.np,f.nq,null,litW?.5:1))}
      if(f.id==='R'){[[9,12],[-3,0]].forEach(function(d){var q3=s3sub(f.q,(d[0]+L/2)/L,(d[1]+L/2)/L,zt(1.8),zt(8.8));s3poly(c,q3,(o.open?'#0E1420':s3c(S3GLASS[sk][1],.8)))})}}
    else if(f.id==='f'){var w=s3sub(f.q,(W/2-3.9)/W,(W/2+3.9)/W,zt(4.4),zt(9));s3glass(c,w,sk,true);s3poly(c,s3sub(f.q,(W/2-3.9)/W,(W/2+3.9)/W,zt(9.2),zt(10.1)),'#1B1D22');s3poly(c,s3sub(f.q,(W/2-1.5)/W,(W/2+1.5)/W,zt(9.4),zt(9.9)),'#FFC24A')}
    else{s3glass(c,s3sub(f.q,(W/2-3.2)/W,(W/2+3.2)/W,zt(6),zt(8.8)),sk,true);s3poly(c,s3sub(f.q,.2,.8,zt(2.2),zt(3.6)),'#1B1D22')}});
  if(lod>=1){[[-6,0],[5,0]].forEach(function(v){s3Box(c,A,sk,'#C9CDD4',v[0]-.8,v[0]+.8,-.5,.5,zr,zr+.4,null,{})});s3wheels(c,A,sk,side,9.5,2.2,lod);if(end)s3lamps(c,A,sk,on,end,L,W,lod,'bus');if(side!==null)s3wrap(c,A,side,L,on);s3edges(c,vis,sk,.3)}}
function s3DrawScooter(c,o){var sk=o.sky||s3Sky(),A=s3Ax(o.h,CAR_K),lod=o.lod,col=o.col||'#FF8A3D',on=!!o.lamps,P=function(a,b,z){return s3P(A,a,b,z)};
  var Aa=sk==='night'?.34:sk==='dusk'?.28:.24;c.save();var p0=P(0,0,0);c.translate(p0[0]+.9,p0[1]+.4);c.rotate(Math.atan2(A.uy,A.ux));c.fillStyle='rgba(0,0,0,'+Aa+')';c.beginPath();c.ellipse(0,0,4.2*CAR_K,1.4*CAR_K,0,0,7);c.fill();c.restore();
  if(lod<=0){var a=P(-2.5,0,1.5),b=P(2.5,0,1.5);c.strokeStyle=col;c.lineWidth=1.4;c.lineCap='round';c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();var hd=P(-.6,0,6);c.fillStyle='#ECEFF3';c.beginPath();c.arc(hd[0],hd[1],.9,0,7);c.fill();return}
  s3onSide(c,A,0,function(){[-2.9,2.9].forEach(function(x){c.fillStyle='#14161C';c.beginPath();c.arc(x,1.3,1.3,0,7);c.fill();if(lod>=2){c.fillStyle='#9AA3AF';c.beginPath();c.arc(x,1.3,.5,0,7);c.fill()}})});
  s3Box(c,A,sk,col,-3,2,-1,1,.9,2.2);s3Box(c,A,sk,'#2A2D35',2.2,3,-.4,.4,2.2,5.2);s3Box(c,A,sk,'#1B1D22',2.4,2.8,-1.6,1.6,5.2,5.7);s3Box(c,A,sk,'#1B1D22',-2.6,0,-.9,.9,2.2,3.4);
  var bx=s3Box(c,A,sk,col,-3.8,-1.8,-1.2,1.2,3.4,5.8);bx.forEach(function(f){s3poly(c,s3sub(f.q,0,1,.45,.55),'rgba(255,255,255,.85)')});
  // the rider: seated, facing the heading, blue top, white helmet
  var hip=P(-.8,0,3.4),knee=P(1.2,0,3.6),foot=P(1.6,0,2.3);c.strokeStyle=s3c('#2E3A52',S3PL[sk][0]);c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(hip[0],hip[1]);c.lineTo(knee[0],knee[1]);c.lineTo(foot[0],foot[1]);c.stroke();
  s3Box(c,A,sk,'#3F7FD9',-1.6,-.2,-1,1,3.4,6.8);var sh=P(-.6,0,6.4),hd2=P(2.4,0,5.3);c.strokeStyle=s3c('#3F7FD9',S3PL[sk][1]);c.lineWidth=.8;c.beginPath();c.moveTo(sh[0],sh[1]);c.lineTo(hd2[0],hd2[1]);c.stroke();
  var hp=P(-.7,0,8),hr=1.3;c.fillStyle=s3c('#D49D6E',S3PL[sk][0]);c.beginPath();c.arc(hp[0],hp[1],hr,0,7);c.fill();c.save();c.beginPath();c.arc(hp[0],hp[1],hr+.01,0,7);c.clip();c.fillStyle=s3c('#ECEFF3',S3PL[sk][0]);c.fillRect(hp[0]-hr,hp[1]-hr,2*hr,hr*2*.7);c.restore();
  var front=A.cs+A.sn>0,lp=front?P(3,0,4.2):P(-3.8,0,2.6);c.fillStyle=front?(on?'#FFF2C2':'#F4F7FA'):(on?'#FF3B3B':'#B3262B');c.fillRect(lp[0]-.45,lp[1]-.45,.9,.9)}
// the beam on the road ahead (moving cars, dusk and night): a ground trapezoid and a nose pool, plus a red smear behind at night
function s3DrawCone(c,o){var sk=o.sky||s3Sky(),A=s3Ax(o.h,CAR_K),L=o.kind==='bus'?30:o.kind==='scooter'?7.6:18,W=(o.kind==='bus'?9:o.kind==='scooter'?4.2:8)*(o.kind==='bus'?1.2:1),len=o.kind==='scooter'?14:22,a0=sk==='night'?.38:.22;
  var P=function(a,b){return s3P(A,a,b,0)},g0=P(L/2,0),g1=P(L/2+len,0),g=c.createLinearGradient(g0[0],g0[1],g1[0],g1[1]);g.addColorStop(0,'rgba(255,238,180,'+a0+')');g.addColorStop(1,'rgba(255,238,180,0)');
  s3poly(c,[P(L/2,-.4*W),P(L/2+len,-1.2*W),P(L/2+len,1.2*W),P(L/2,.4*W)],g);var np=P(L/2+3,0);c.fillStyle='rgba(255,238,180,'+(sk==='night'?.30:.20)+')';c.beginPath();c.ellipse(np[0],np[1],5*CAR_K,2.4*CAR_K,Math.atan2(A.uy,A.ux),0,7);c.fill();
  if(sk==='night')s3poly(c,[P(-L/2,-.4*W),P(-L/2-5,-.5*W),P(-L/2-5,.5*W),P(-L/2,.4*W)],'rgba(255,50,50,.16)')}
// ---- people (spec 2): design height 10.5, built at PERSON_H; 4 diagonal directions (0 SE, 1 SW, 2 NW, 3 NE) x frames 0-3 walk, 4 stand, 5 hammer
var S3OUT=[['#D9483B','#2E3A52'],['#3F7FD9','#4A4A4A'],['#F2C14E','#34406B'],['#ECEFF3','#B59B6E'],['#2FA39A','#3B4654'],['#7A5AA8','#23262E'],['#F08A6C','#6F8FB8'],['#3F7A52','#8A6B4A']],
  S3SKIN=['#F6D7BD','#EBBE98','#D49D6E','#B07A4E','#8A5A38','#5C3A24'],S3HAIR=['#1B1512','#3B2616','#7A4A22','#D8A850','#B9BCC2'],S3PL={day:[1,.74],dusk:[.86,.62],night:[.58,.42]};
var S3LOOKS=(function(){var L=[],s=12345,r=function(){s=(Math.imul(s,1103515245)+12345)>>>0;return s>>>8};for(var i=0;i<24;i++){var o=S3OUT[(i*3+(r()%3))%8];
  L.push({id:i,top:o[0],bot:o[1],skin:S3SKIN[r()%6],hair:S3HAIR[r()%5],shoe:r()%3===0?'#E6E8EC':'#15181F',hat:i%8===3?1:i%14===9?2:0,pack:i%6===2,tote:i%5===1})}return L})();
function s3Look(seed,col){var b=S3LOOKS[s3hash(seed)%24];if(!col)return b;var o={};for(var k in b)o[k]=b[k];o.top=col;o.id=b.id+'|'+col;return o}
var S3GHOST={id:'ghost',ghost:1},S3CREW={id:'crew',top:'#FF8A3D',bot:'#2E3A52',skin:'#EBBE98',hair:'#3B2616',shoe:'#15181F',hat:3,crew:1};
function s3Dir(ux,uy){return ux>=0?(uy>=0?0:3):(uy>=0?1:2)}
function s3pc(col,sk,lit,ghost){if(ghost)return s3c(GHOSTCOL,lit?1:.82);var m=S3PL[sk][lit?0:1];if(sk==='dusk')return lit?s3c(col,m,'#FF9A6B',.10):s3c(col,m);if(sk==='night')return s3c(col,m,'#2A3A6A',.18);return s3c(col,m)}
function s3two(c,path,x0,x1,col,sk,ghost){path();c.fillStyle=s3pc(col,sk,false,ghost);c.fill();c.save();c.beginPath();c.rect(x0-5,-30,(x1-x0)*.55+5,40);c.clip();path();c.fillStyle=s3pc(col,sk,true,ghost);c.fill();c.restore()}
function s3DrawPerson(c,L,sk,lod,dir,fr){var k=PERSON_H/10.5,G=!!L.ghost,front=dir<2,mx=(dir===0||dir===3)?1:-1,hx=mx*.894,hy=front?.447:-.447;
  c.save();c.scale(k,k);c.fillStyle='rgba(0,0,0,'+(G?.10:sk==='night'?.34:sk==='dusk'?.28:.24)+')';c.beginPath();c.ellipse(.9,.4,2.6,1.1,0,0,7);c.fill();
  var hamm=fr===5,stand=fr>=4,f=stand?-1:(lod<=1?fr%2*1:fr),nd=0,fd=0,nl=0,fl=0,bob=0,ah=0;
  if(f===0){nd=1.5;fd=-1.5;ah=-1.1}else if(f===2){nd=-1.5;fd=1.5;ah=1.1}else if(f===1){fl=.7;bob=-.5}else if(f===3){nl=.7;bob=-.5}
  var top=G?GHOSTCOL:L.top,bot=G?GHOSTCOL:L.bot,skin=G?GHOSTCOL:L.skin,hair=G?GHOSTCOL:(L.hat===1?s3c(L.top,.8):L.hat===2?'#C9B8D8':L.hat===3?'#FFD24A':L.hair);
  var legs=[{x:-.6*mx,d:nd,l:nl,near:1},{x:.6*mx,d:fd,l:fl,near:0}];legs.sort(function(a,b){return (a.d*hy)-(b.d*hy)});
  var drawLeg=function(g){var fx=g.x+g.d*hx,fy=-g.l+g.d*hy;c.strokeStyle=s3pc(bot,sk,g.x<0,G);if(!g.near)c.strokeStyle=s3c(G?GHOSTCOL:bot,(S3PL[sk][g.x<0?0:1])*.8);c.lineWidth=lod<=1?1.2:1.1;c.lineCap='round';c.beginPath();c.moveTo(g.x,-4.2+bob);c.lineTo(fx,fy-.7);c.stroke();
    if(lod>=2&&!G){c.fillStyle=L.shoe;c.beginPath();c.ellipse(fx+.4*hx,fy-.35,.6,.35,0,0,7);c.fill()}};
  legs.forEach(drawLeg);
  var tw=lod<=1?1.9:1.6,ww=lod<=1?1.6:1.3,t=.35*mx*(front?1:-1);
  var torso=function(){c.beginPath();c.moveTo(-ww,-4+bob);c.lineTo(ww,-4+bob);c.lineTo(tw,-7.9+bob-t);c.lineTo(-tw,-7.9+bob+t);c.closePath()};
  var arm=function(s,sw){var sx=s*1.75,sy=-7.4+bob,hxp=sx+sw*hx,hyp=sy+3.3+sw*hy;c.strokeStyle=s3pc(top,sk,s<0,G);c.lineWidth=.95;c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.lineTo(hxp,hyp);c.stroke();if(lod>=2&&!G){c.fillStyle=s3pc(skin,sk,s<0);c.beginPath();c.arc(hxp,hyp,.5,0,7);c.fill()}return [hxp,hyp]};
  if(lod>=2&&!hamm)arm(mx,-ah*(front?1:-1));   // the far arm behind the body
  if(L.pack&&front&&lod>=2&&!G){c.fillStyle=s3c(L.top,.6);c.fillRect(-1.2-mx*.6,-7.4+bob,.5,2.6)}
  s3two(c,torso,-tw,tw,top,sk,G);
  if(L.crew&&lod>=2){c.fillStyle='rgba(240,240,200,.9)';c.fillRect(-ww-.15,-6.2+bob,2*ww+.3,.6)}
  if(L.pack&&!front&&lod>=2&&!G){c.fillStyle=s3c(L.top,.6);c.fillRect(-.9,-7.2+bob,1.8,2.4)}
  if(lod>=2){var hand=hamm?null:arm(-mx,ah*(front?1:-1));if(hamm){var sx=-mx*1.75,sy=-7.4+bob,ex=sx+mx*-.6,ey=sy-3.1;c.strokeStyle=s3pc(top,sk,true,G);c.lineWidth=.95;c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();c.strokeStyle='#5A4632';c.lineWidth=.5;c.beginPath();c.moveTo(ex,ey);c.lineTo(ex+mx*1.6,ey-.6);c.stroke();c.fillStyle='#8A929C';c.fillRect(ex+mx*1.4-.4,ey-1.2,.8,1.2)}
    if(L.tote&&hand&&!G){c.fillStyle=s3c(L.bot,1.2);c.fillRect(hand[0]-.7,hand[1]-.2,1.4,1.6)}}
  c.fillStyle=s3pc(skin,sk,true,G);c.fillRect(-.5,-8.15+bob,1,.4);
  var cx0=.45*mx,cy0=-9+bob,r=1.45,head=function(){c.beginPath();c.arc(cx0,cy0,r,0,7)};
  if(front&&!G)s3two(c,head,cx0-r,cx0+r,skin,sk,G);else s3two(c,head,cx0-r,cx0+r,hair,sk,G);
  if(!G){c.save();head();c.clip();c.fillStyle=s3pc(hair,sk,true);var hh=front?(L.hat===3?.55:.4):.85;c.fillRect(cx0-r-.1,cy0-r-.1,2*r+.2,2*r*hh+.1);if(front&&L.hat!==3)c.fillRect(mx>0?cx0-r-.1:cx0+r-.5,cy0-r,.6,2*r*.62);
    if(!front&&lod>=2){c.fillStyle=s3pc(skin,sk,false);c.fillRect(cx0-r,cy0+r*.7,2*r,.5)}c.restore();
    if(L.hat===3){c.fillStyle=s3pc('#FFD24A',sk,true);c.fillRect(cx0-r-.25,cy0-r+2*r*.55-.25,2*r+.5,.5)}
    if(front&&lod>=2){c.fillStyle='#1B1512';[-.45,.45].forEach(function(e){c.beginPath();c.arc(cx0+.45*mx+e,cy0-.05,.18,0,7);c.fill()})}}
  c.restore()}
function s3DotBody(c,L,x,y,dir,s){var k=PERSON_H/10.5*s,G=!!L.ghost;c.fillStyle='rgba(0,0,0,'+(G?.1:.26)+')';c.beginPath();c.ellipse(x+.9*k,y+.4*k,2.6*k,1.1*k,0,0,7);c.fill();
  c.fillStyle=G?GHOSTCOL:L.bot;c.fillRect(x-1.2*k,y-6*k*.45-.0,2.4*k,6*k*.45);c.fillStyle=G?GHOSTCOL:L.top;c.fillRect(x-1.2*k,y-6*k-.0,2.4*k,6*k*.55);
  c.fillStyle=G?GHOSTCOL:(dir<2?L.skin:L.hair);c.beginPath();c.arc(x,y-7.6*k,1.5*k,0,7);c.fill()}
// ---- the sprite cache: device-resolution canvases, LRU, at most S3BUDGET builds per frame
function s3Zoom(){return cam.z}
function s3Boost(cap){var z=s3Zoom();return z>=.6?1:Math.min(cap||1.6,Math.sqrt(.6/z))}
function s3Bucket(boost){var need=(typeof dpr==='number'?dpr:1)*s3Zoom()*(boost||1);for(var i=0;i<S3BK.length;i++)if(S3BK[i]>=need)return S3BK[i];return S3BK[S3BK.length-1]}
function s3CarLod(boost){var px=18*CAR_K*s3Zoom()*boost;return px>=21?2:px>=9?1:px>=4.5?0:-1}
function s3PedLod(boost){var px=PERSON_H*s3Zoom()*boost;return px>=14?2:px>=6?1:px>=3?0:-1}
function s3frame(){var t=performance.now();if(t-S3.t>8){S3.t=t;S3.n=0}}
function s3Get(key,W,H,ax,ay,bk,draw){var m=S3.m,s=m.get(key);if(s){m.delete(key);m.set(key,s);return s}s3frame();if(S3.n>=S3BUDGET)return null;S3.n++;S3.built++;
  var cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(W*bk));cv.height=Math.max(1,Math.ceil(H*bk));var g=cv.getContext('2d');s={cv:cv,W:W,H:H,ax:ax,ay:ay};
  if(g){g.scale(bk,bk);g.translate(ax,ay);g.lineJoin='round';draw(g)}m.set(key,s);while(m.size>S3CAP)m.delete(m.keys().next().value);return s}
function s3Blit(c,s,x,y,k,sx,sy,sw,sh){if(sw)c.drawImage(s.cv,sx,sy,sw,sh,x-s.ax*k,y-s.ay*k,s.W*k,s.H*k);else c.drawImage(s.cv,x-s.ax*k,y-s.ay*k,s.W*k,s.H*k)}
// draw a vehicle at world (x,y). v: {kind,type,col,h,lamps,open}. Falls back to the cheap box when the build budget is spent
function s3Vehicle(c,x,y,v,boost){var lod=s3CarLod(boost),sk=s3Sky();if(lod<0)return s3Micro(c,x,y,v,boost);var kd=v.kind||'car',bk=s3Bucket(boost),bus=kd==='bus',sc=kd==='scooter';
  var key=(bus?'bus':sc?'sct':v.type)+'|'+v.col+'|'+v.h+'|'+sk+'|'+(v.lamps?1:0)+'|'+lod+'|'+(v.open?1:0)+'|'+bk,W=bus?44:sc?16:32,H=bus?32:sc?18:28,ax=bus?21:sc?8:15,ay=bus?22:sc?13:19;
  var o={type:v.type,col:v.col,h:v.h,lamps:v.lamps,open:v.open,lod:lod,sky:sk},fn=bus?s3DrawBus:sc?s3DrawScooter:s3DrawCar,s=s3Get(key,W,H,ax,ay,bk,function(g){fn(g,o)});
  if(s){s3Blit(c,s,x,y,boost);return lod}o.lod=0;c.save();c.translate(x,y);c.scale(boost,boost);fn(c,o);c.restore();return 0}
function s3Micro(c,x,y,v,boost){var A=s3Ax(v.h,1),z=s3Zoom()*(typeof dpr==='number'?dpr:1),len=Math.max(3/z,(v.kind==='bus'?5:3)/z),wd=Math.max(2/z,1.2/z),sk=s3Sky();
  if(sk==='night'&&v.lamps){c.fillStyle='#FFF2C2';c.fillRect(x+A.ux*len/2-wd/2,y+A.uy*len/2-wd/2,wd,wd);c.fillStyle='#FF3B3B';c.fillRect(x-A.ux*len/2-wd/2,y-A.uy*len/2-wd/2,wd,wd);return -1}
  var col=v.kind==='van'?'#ECEFF3':v.col;c.lineCap='butt';c.strokeStyle=s3Face(col,sk,1,0);c.lineWidth=wd;c.beginPath();c.moveTo(x-A.ux*len/2,y-A.uy*len/2+wd*.25);c.lineTo(x+A.ux*len/2,y+A.uy*len/2+wd*.25);c.stroke();
  c.strokeStyle=s3Face(col,sk,0,0,'top');c.lineWidth=wd*.5;c.beginPath();c.moveTo(x-A.ux*len/2,y-A.uy*len/2-wd*.25);c.lineTo(x+A.ux*len/2,y+A.uy*len/2-wd*.25);c.stroke();return -1}
function s3Cone(c,x,y,v,boost){var bk=s3Bucket(boost),sk=s3Sky(),kd=v.kind==='bus'?'bus':v.kind==='scooter'?'scooter':'car',s=s3Get('cone|'+kd+'|'+v.h+'|'+sk+'|'+bk,72,48,36,24,bk,function(g){s3DrawCone(g,{kind:kd,h:v.h,sky:sk})});if(s)s3Blit(c,s,x,y,boost)}
// a person at world (x,y): an atlas per look|sky|lod|bucket (4 directions x 6 frames)
function s3Person(c,x,y,L,dir,fr,boost,scale){var lod=s3PedLod(boost),k=boost*(scale||1);if(lod<0){var z=s3Zoom()*(typeof dpr==='number'?dpr:1);c.fillStyle=L.ghost?GHOSTCOL:L.top;c.fillRect(x-.75/z,y-3/z,1.5/z,1.5/z);return -1}
  if(lod===0){s3DotBody(c,L,x,y,dir,k);return 0}var sk=L.ghost?'day':s3Sky(),bk=s3Bucket(boost),key='ped|'+L.id+'|'+sk+'|'+lod+'|'+bk;
  var s=s3Get(key,60,56,0,0,bk,function(g){for(var d=0;d<4;d++)for(var f=0;f<6;f++){if(f===5&&!L.crew)continue;g.save();g.translate(f*10+5,d*14+12.5);s3DrawPerson(g,L,sk,lod,d,f);g.restore()}});
  if(!s){s3DotBody(c,L,x,y,dir,k);return 0}var sx=(fr*10)*bk,sy=(dir*14)*bk;c.drawImage(s.cv,sx,sy,10*bk,14*bk,x-5*k,y-12.5*k,10*k,14*k);return lod}
// heading of a vehicle from its road segment (0 SE +i, 2 SW +j, 4 NW -i, 6 NE -j) with a short in-between frame on a turn
function s3Head(car,tn){var di=car.ti-car.i,dj=car.tj-car.j,h=di>0?0:di<0?4:dj>0?2:dj<0?6:(car._h!=null?car._h:0);
  if(car._h==null){car._h=h;return h}if(h!==car._h){var d=(h-car._h+8)%8;car._turn={from:car._h,d:d,t0:tn};car._h=h}
  var T=car._turn;if(T&&!reduce){var e=tn-T.t0;if(T.d===4){if(e<110)return (T.from+1)%8;if(e<220)return (T.from+3)%8}else if(e<140)return (T.from+(T.d===2?1:7))%8;car._turn=null}return h}
function s3seed(x){if(typeof x==='number')return x|0;x=String(x);var h=7;for(var i=0;i<x.length;i++)h=(Math.imul(h,31)+x.charCodeAt(i))|0;return h}
function s3Lane(h){var A=s3Ax(h,1);return [A.vx*8,A.vy*8]}
// a draw cap that does not flicker: rank by a stable hash, keep the first n
function s3Cap(list,n,seedOf){if(list.length<=n)return list;return list.map(function(x){return [s3hash(seedOf(x)),x]}).sort(function(a,b){return a[0]-b[0]}).slice(0,n).map(function(p){return p[1]})}
`;
