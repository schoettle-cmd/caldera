/**
 * The World's growth views (caldera.social/world?view=day|week|month), inside the city renderer (city.ts CITY_JS).
 * Mike 2026-11-07, approved proposal "Caldera growth views" (directions A "Zoned to grow" and D "Commit rain").
 *
 * Every member's neighborhood gets one more block: their plot. Lots fill it ring by ring and each lot is bought in four
 * stages (zoned with survey stakes, graded earth, a slab with a scaffolded frame and a crane, then a building that climbs
 * houses, mid-rise, tower, solar/AI campus). The plot's own road ring moves out when the outer row is complete; the next
 * row is surveyed beyond it once 60% of the outer row is built. Day, Week and Month add what happened inside the window:
 * purple "new" outlines, crews, commit drops landing as bricks, a warm heat glow (blue frost when quiet), events, the
 * daily drop's animations, and a replay. Now is today's map with the plots as they stand.
 * Data: window.CALDERA_GROWTH (the hub's /v1/world/state, embedded so the layout is known at load). No GitHub calls.
 * Runs inside the CITY_JS closure: tiles, blocks, iso, poly, dia, prism, facadeWindows, houseAt, scaffold, studs, minifig,
 * roofProps, mix, LANG, P, sky, T, cam, dpr, cranes, hits, NBM, byName, draw are all in scope.
 */

/** layout: estates join each neighborhood's districts before it is packed (inside `if(D.world)`, before sizing) */
export const GROWTH_LAYOUT_JS = String.raw`
var GROW=window.CALDERA_GROWTH&&window.CALDERA_GROWTH.members?window.CALDERA_GROWTH:null,GM={},GV='now',GVIEW0=(window.CALDERA_GVIEW||'now');
if(GROW){NBS.forEach(function(n){var m=GROW.members[n.key];if(!m)return;var side=Math.max(2,Math.min(16,m.k|0));
  var d={name:n.key+'/~plot',label:'Plot',nb:n.key,notes:0,repos:[],estate:true,K:side+2};n.ds.push(d);
  GM[n.key]={key:n.key,v:m,side0:side,K:side+2,d:d,n:n,lang:null,cs:null}})}
`;

/** drawing and the API (after the renderer's helpers exist) */
export const GROWTH_DRAW_JS = String.raw`
function placeEstate(d,x,y,k){var b={d:d,x:x,y:y,k:k,estate:true};blocks.push(b);var g=GM[d.nb];if(g)g.b=b;
  for(var j=0;j<k;j++)for(var i=0;i<k;i++)tiles[(x+i)+','+(y+j)]={t:'L',d:d,a:i,b:j,key:d.nb};return b}
var GPURPLE='#8B6CF6',GLOW='#C4B5FF',GDATA=GROW,GT0=null,GCUR=null,GHEAT=true,GZONE=false,GDROPS=[],GDROPT=0,GDROP=null,GDROPAT=0;
try{GHEAT=localStorage.getItem('caldera.world.heat')!=='0';GZONE=localStorage.getItem('caldera.world.zoning')==='1'}catch(err){}
function gLot(a,b){var r=Math.max(a,b);return r*r+(a===r?(b<r?b:r):r+1+a)}
function gXY(i){var r=Math.floor(Math.sqrt(i)),o=i-r*r;return o<r?[r,o]:o===r?[r,r]:[o-r-1,r]}
function gLang(g){if(g.lang)return g.lang;var best=null;(g.n.ds||[]).forEach(function(d){(d.repos||[]).forEach(function(r){if(!r.kind&&!r.locked&&(!best||r.commits>best.commits))best=r})});
  g.lang=best&&LANG[best.language]||'#8A8A93';return g.lang}
function gRgba(hx,a){var n=parseInt(hx.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
/** the plot at the replay cursor: side, lot codes, which lots changed inside the window so far, whether the ring moved */
function gState(g){var v=g.v,T0=GCUR;if(!v)return {side:g.side0,codes:[],fresh:{},ring:false,survey:false,prog:-1};
  var side,codes,fresh={},ring=false;
  if(GV==='now'||T0==null){side=v.k;codes=String(v.l).split('').map(Number);if(GV!=='now')(v.g||[]).forEach(function(e){if(e[1]<0)ring=true;else fresh[e[1]]=1})}
  else{side=v.k0;codes=String(v.l0).split('').map(Number);(v.g||[]).forEach(function(e){if(e[0]>T0)return;if(e[1]<0){side=e[2];ring=true}else{codes[e[1]]=e[2];fresh[e[1]]=1}})}
  side=Math.max(2,Math.min(g.K-2,side));var n=side*side;while(codes.length<n)codes.push(0);
  var r=side-1,outer=0,built=0;for(var o=0;o<2*r+1;o++){outer++;if(codes[r*r+o]>=4)built++}
  return {side:side,codes:codes,fresh:fresh,ring:ring,survey:built/Math.max(1,outer)>=.6,prog:codes.findIndex(function(x){return x>=1&&x<=3})}}
function gRefresh(){for(var k in GM){var g=GM[k];g.v=GDATA&&GDATA.members[k]||null;g.cs=gState(g)}}
function gWin(){return GV!=='now'}
function gHc(g){return g.v&&g.v.st?g.v.st.hc:0}
function gDirt(){return sky==='night'||sky==='evening'?['#3A2E22','#2B2219','#5A5D66']:['#8A6A4A','#6E5238','#C9C4B8']}
function gStake(c,x,y){c.fillStyle=sky==='night'?'#D9D2C4':'#FFF8E8';c.fillRect(x-.7,y-6,1.4,6);c.fillStyle='#FF7A59';c.fillRect(x-1.2,y-6.5,2.4,1.5)}
function gOutline(c,i,j,s,col,w,dash){var q=dia(i,j,s);c.save();c.strokeStyle=col;c.lineWidth=w;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(q[0][0],q[0][1]);for(var k=1;k<4;k++)c.lineTo(q[k][0],q[k][1]);c.closePath();c.stroke();c.restore()}
/** ground: the plot's road ring, slab, lots by stage, the surveyed next row, zoning hatch, frost (drawn on L1 after the blocks) */
function growGround(c){if(!GROW)return;var dk=gDirt();
  for(var k in GM){var g=GM[k],b=g.b;if(!b)continue;var s=g.cs||(g.cs=gState(g)),S=s.side,col=gLang(g),hc=gHc(g),lapsed=hc>=2;
    for(var j=0;j<b.k;j++)for(var i=0;i<b.k;i++){var m=Math.max(i,j),X=b.x+i,Y=b.y+j;if(m!==S)continue;poly(c,dia(X,Y,1.02),(X+Y)%2?P.road:P.road2);
      if(gWin()&&s.ring)gOutline(c,X,Y,1.02,'rgba(196,181,255,.75)',1.2)}
    var x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+S-.5+.08,y1=b.y+S-.5+.08,A=corner(x0,y0),B=corner(x1,y0),C=corner(x1,y1),Dd=corner(x0,y1),h=3;
    poly(c,[Dd,C,[C[0],C[1]+h],[Dd[0],Dd[1]+h]],P.walkSide);poly(c,[C,B,[B[0],B[1]+h],[C[0],C[1]+h]],P.walkSide);poly(c,[A,B,C,Dd],P.walk);
    for(var li=0;li<S*S;li++){var ab=gXY(li),X2=b.x+ab[0],Y2=b.y+ab[1],cd=s.codes[li]||0,q=iso(X2,Y2);
      if(cd===0){poly(c,dia(X2,Y2,.9),P.park);gOutline(c,X2,Y2,.84,lapsed?'rgba(140,140,150,.45)':gRgba(col,.4),1,[4,3])}
      else if(cd===1){poly(c,dia(X2,Y2,.9),P.park);if(lapsed)gOutline(c,X2,Y2,.84,'rgba(150,150,160,.7)',1.2,[4,3])}   // zoned: lotHi draws the outline, stakes and board
      else if(cd===2||cd===3)poly(c,dia(X2,Y2,.92),dk[0]);
      else if(cd===4)poly(c,dia(X2,Y2,.92),P.grass2);
      else if(cd===7)poly(c,dia(X2,Y2,.9),P.park);
      else poly(c,dia(X2,Y2,.9),P.plaza);
      if(hc>=3&&cd>=4){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.8;c.beginPath();c.moveTo(q.x-8,q.y);c.lineTo(q.x-2,q.y-2);c.lineTo(q.x+2,q.y+2);c.stroke();c.strokeStyle=sky==='night'?'#6B7436':'#B7BF62';c.beginPath();c.moveTo(q.x+9,q.y+3);c.lineTo(q.x+7,q.y-1);c.moveTo(q.x+9,q.y+3);c.lineTo(q.x+11,q.y-1);c.stroke()}
      if(GZONE&&gWin()){c.save();poly(c,dia(X2,Y2,.98));c.clip();c.fillStyle=gRgba(col,.14);c.fill();c.strokeStyle=gRgba(col,.5);c.lineWidth=1;c.beginPath();for(var hk=-6;hk<=6;hk++){c.moveTo(q.x-40,q.y+hk*5-20);c.lineTo(q.x+40,q.y+hk*5+20)}c.stroke();c.restore()}
      if(gWin()&&hc>=1&&GHEAT){poly(c,dia(X2,Y2,.95),'rgba(150,180,235,.14)');c.fillStyle='rgba(220,235,255,.7)';for(var fr=0;fr<3;fr++)c.fillRect(q.x+(rnd(X2*9+Y2*4+fr)-.5)*TW*.6,q.y+(rnd(X2*3+Y2*8+fr)-.5)*TH*.5,1.2,1.2)}}
    if(s.survey&&S+1<b.k)for(var o2=0;o2<=2*S+2;o2++){var e2=gXY((S+1)*(S+1)+o2);if(Math.max(e2[0],e2[1])!==S+1)continue;var X3=b.x+e2[0],Y3=b.y+e2[1];if(e2[0]>=b.k||e2[1]>=b.k)continue;
      gOutline(c,X3,Y3,.84,lapsed?'rgba(140,140,150,.35)':gRgba(col,.38),1,[3,4])}}}
/** objects on lots, in the renderer's depth order */
/** the variant of a lot (stable per lot) and its cast shadow footprint [w, h] for the ground's unioned shadow */
function gVar(key,li){return (li*7+hash(key))%3}
function gShadow(t){var g=GM[t.key];if(!g||!g.b)return null;var s=g.cs||(g.cs=gState(g));if(t.a>=s.side||t.b>=s.side)return null;var li=gLot(t.a,t.b),cd=s.codes[li]||0,v=gVar(t.key,li);
  return cd===3?[.62,22]:cd===5?[.64,v===0?40:v===1?34:30]:cd===6?[.68,68]:cd===7&&v!==1?[v===0?.8:.6,v===0?14:11]:null}
/** objects on lots, in the renderer's depth order: the high-detail tiers (lotHi, houseLotHi, midHi, towerHi, campusHi),
 *  through the atlas at LOD 1 unless the lot is new in the window or hit in the Battle view */
function growObject(c,t,i,j,p,LOD){var g=GM[t.key];if(!g||!g.b)return;var s=g.cs||(g.cs=gState(g)),S=s.side;if(t.a>=S||t.b>=S)return;
  var li=gLot(t.a,t.b),cd=s.codes[li]||0,col=gLang(g),hc=gHc(g),dim=hc>=2,base=p.y+4,top=base,seed=hash(t.key)+li*7,isNew=gWin()&&s.fresh[li],v=gVar(t.key,li);
  if(dim)col=mix(col,.55,'#8A8E96');
  var bd=typeof bDmg==='function'?bDmg(t.key,li):0,dcd=cd;if(bd>0){scorchHi(c,p.x,p.y+4,bd);if(bd>=.5&&cd>=4)cd=cd>4?cd-1:3}   // the Battle view: a hit lot drops a tier (a house to its frame) until it rebuilds
  var litp=dim?0:Math.min(P.lit==null?1:P.lit,hc===1?.25:.75),lq=Math.round(litp*8)/8,o={variant:v,col:col,seed:seed%12,litp:lq,dim:dim,stage:cd,crew:hc===0&&!gWin()&&!BON,turbine:false},ex=null;
  if(cd>=1&&cd<=3)o.seed=seed%3;   // sprite keys carry only what changes the picture, so lots across the world share sprites
  var key=bd>0?null:cd===4?'gh|'+(seed%12)+'|'+(dim?1:0):cd<=3?'gl|'+cd+'|'+col+'|'+(o.crew?1:0)+'|'+o.seed:'g|'+cd+'|'+v+'|'+col+'|'+lq+'|'+(dim?1:0)+'|'+(seed%12),rel=0;
  if(cd>=1&&cd<=3)hiDraw(c,key,92,70,46,40,p.x,p.y,function(cc){ex=lotHi(cc,0,0,o)});
  else if(cd===4){if(!BON)hiDraw(c,key,72,54,33,37,p.x,p.y,function(cc){houseLotHi(cc,0,0,{seed:seed%12,n:3,dim:dim})})}   // the Battle view keeps only the code-built buildings
  else if(cd===5)hiDraw(c,key,92,100,46,64,p.x,p.y,function(cc){rel=midHi(cc,0,0,o)});
  else if(cd===6)hiDraw(c,key,116,150,58,116,p.x,p.y,function(cc){rel=towerHi(cc,0,0,{variant:v,col:col,seed:seed%12,tiers:[[.68,46],[.52,22]],litp:lq,roof:!dim})});
  else if(cd===7){hiDraw(c,key,92,70,46,44,p.x,p.y,function(cc){rel=campusHi(cc,0,0,o)});if(v===1&&LODN>0)turbineHi(c,p.x-20,p.y+8,dim)}
  // where the top is (labels, hits, cranes) without drawing again when the sprite came from the atlas
  top=cd===3?base-22:cd===4?base-14:cd===5?base-(v===0?40:v===1?34:30):cd===6?base-68:cd===7?base-(v===0?14:v===2?11:8):base;
  if(cd===3&&hc===0&&LODN>0)cranes.push({x:p.x+6,y:base-22,seed:seed,col:col});
  if(bd>0&&LODN>0&&dcd>=3){var hw0=TW/2*.64;if(bd>=.5){rubbleHi(c,p.x+TW*.2,base+TH*.22,col);if(cd>=4)tarpHi(c,p.x,top,cd===6?.52:.64)}
    tapeHi(c,[[p.x-26,base+3],[p.x-6,base+15],[p.x+14,base+6]]);if(cd>=4)scaffoldHi(c,p.x,base,cd===4?.5:.64,base-top,1)}
  if(hc>=4&&cd>=5){c.fillStyle='rgba(60,45,30,.85)';var hw=TW/2*.62;for(var bk=0;bk<2;bk++){c.fillRect(p.x-hw*.8,base-10-bk*9,hw*.7,3);c.fillRect(p.x+hw*.1,base-8-bk*9,hw*.7,3)}}
  if(hc>=4&&li===0)gSign(c,p.x+14,base+2,'For lease');
  if(isNew&&cd>0&&!LOD){c.save();c.strokeStyle=GLOW;c.lineWidth=1.6/Math.max(cam.z,.4);c.shadowColor=GPURPLE;c.shadowBlur=10;var hw2=TW/2*.66,hh2=TH/2*.66;c.beginPath();c.moveTo(p.x-hw2,base);c.lineTo(p.x,base+hh2);c.lineTo(p.x+hw2,base);c.lineTo(p.x+hw2,Math.min(base,top+2));c.lineTo(p.x,Math.min(base,top+2)-hh2);c.lineTo(p.x-hw2,Math.min(base,top+2));c.closePath();c.stroke();c.restore()}
  if(gWin()&&li===s.prog){var wc=g.v&&g.v.w?g.v.w.c:0;if(wc>0)pileHi(c,p.x-20,base+6,col,Math.min(3,1+Math.floor(Math.log2(1+wc/5))))}
  var rep=g.n&&g.n.rep;if(rep)hits.push({block:rep,x0:p.x-TW*.4,x1:p.x+TW*.4,y0:Math.min(top,base-10)-6,y1:p.y+TH*.45})}
function gTurbine(c,x,y,dim){return turbineHi(c,x,y,dim);c.strokeStyle=dim?'#8A8E96':'#E8EEF4';c.lineWidth=1.3;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-30);c.stroke();var a=(reduce||dim?0:T/600)%(Math.PI*2);c.lineWidth=1.6;c.beginPath();for(var k=0;k<3;k++){var b2=a+k*2.094;c.moveTo(x,y-30);c.lineTo(x+Math.cos(b2)*11,y-30+Math.sin(b2)*11)}c.stroke();c.fillStyle='#C9D2E6';c.fillRect(x-1.5,y-31.5,3,3)}
function gSign(c,x,y,text){c.fillStyle='#8B6A48';c.fillRect(x-.8,y-14,1.6,14);c.fillStyle=sky==='night'?'#D8D2C4':'#FFF8E8';c.fillRect(x-16,y-22,32,9);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.6;c.strokeRect(x-16,y-22,32,9);c.fillStyle='#3A2E22';c.font='bold 5.5px IBM Plex Sans,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-17.3)}
function gPile(c,x,y,col,rows){for(var r=0;r<rows;r++)for(var k=0;k<rows-r+1;k++){var bx=x-7+k*5+r*2.5,by=y-r*3.2;c.fillStyle=mix(col,.8);c.fillRect(bx,by-3,4.6,3);c.fillStyle=mix(col,1.15);c.fillRect(bx,by-3.8,4.6,1)}}
/** under the buildings: the heat glow (warm with the window's points, blue frost when quiet) */
function growUnder(){if(!GROW||!gWin()||!GHEAT)return;var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';
  var days=GV==='month'?30:GV==='week'?7:1;
  for(var k in GM){var g=GM[k],n=g.n;if(!g.v||!n)continue;var hc=gHc(g),pts=g.v.w?g.v.w.pts:0,ctr=iso(n.ox+n.w/2-.5,n.oy+n.h/2-.5),rx=(n.w+n.h)*TW/4*.9;
    if(GCUR!=null&&g.v.hist&&g.v.hist.length){var f=(GCUR-GDATA.t0)/(days*864e5),nb=g.v.hist.length,upto=Math.max(0,Math.min(nb,Math.ceil(f*nb))),tot=0,sum=0;g.v.hist.forEach(function(h2,ix){tot+=h2;if(ix<upto)sum+=h2});pts=tot>0?pts*sum/tot:pts}
    var a=Math.min(.42,pts/(days*30)*.42);if(hc>=1)a=0;
    var col=hc>=1?[150,190,255]:[255,170,90];if(hc>=1)a=.16;
    if(a<=.02)continue;var gr=c.createRadialGradient(ctr.x,ctr.y,4,ctr.x,ctr.y,rx);gr.addColorStop(0,'rgba('+col.join(',')+','+a+')');gr.addColorStop(1,'rgba('+col.join(',')+',0)');c.fillStyle=gr;c.beginPath();c.ellipse(ctr.x,ctr.y,rx,rx*.5,0,0,7);c.fill()}
  c.restore()}
/** over everything on the map: crews, commit drops, events, and the daily drop's animations */
function growOver(){if(!GROW)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  if(gWin()){
    for(var k in GM){var g=GM[k],b=g.b,s=g.cs;if(!b||!s||!g.v)continue;var hc=gHc(g),col=gLang(g);
      // crews on the lot being built (paused after 14 quiet days)
      if(hc===0&&!BON){for(var li=0;li<s.side*s.side;li++){var cd=s.codes[li];if(cd<1||cd>3)continue;var ab=gXY(li),q=iso(b.x+ab[0],b.y+ab[1]);figHi(c,q.x-TW*.26,q.y+TH*.18,col,li,1);if(cd>=2)figHi(c,q.x+TW*.22,q.y+TH*.12,col,li+3,2);break}}
      // commit drops: falling light in the member's colour, landing as bricks
      var wc=g.v.w?g.v.w.c:0;if(wc>0&&!reduce&&hc===0){var days=GV==='month'?30:GV==='week'?7:1,rate=Math.min(2.4,.12+.35*Math.log2(1+wc/days));
        if(GCUR!=null&&g.v.hist){var nb=g.v.hist.length,ix=Math.max(0,Math.min(nb-1,Math.floor((GCUR-GDATA.t0)/(days*864e5)*nb)));rate=g.v.hist[ix]>0?Math.min(3,.4+.5*Math.log2(1+g.v.hist[ix])):0}
        g.acc=(g.acc||0)+rate*Math.min(.1,(tn-(g.lt||tn))/1000);g.lt=tn;while(g.acc>=1&&GDROPS.length<160){g.acc-=1;var L2i=Math.floor(Math.random()*s.side*s.side),xy=gXY(L2i),qq=iso(b.x+xy[0],b.y+xy[1]);GDROPS.push({x:qq.x+(Math.random()-.5)*20,y:qq.y,col:col,born:tn})}}
      else g.lt=tn;
      (g.v.fx||[]).forEach(function(f){if(GCUR!=null&&f[1]>GCUR)return;var ctr=iso(b.x+s.side/2-.5,b.y+s.side/2-.5);
        if(f[0]==='rel')gRibbon(c,ctr.x+18,ctr.y+10);else if(f[0]==='storm')gStorm(c,ctr.x,ctr.y-70,tn);else if(f[0]==='new')gTripod(c,ctr.x-22,ctr.y+8);else if(f[0]==='fire')smokeHi(c,ctr.x,ctr.y-20,true);else if(f[0]==='par')gParade(c,g,tn,null)})}
    GDROPS=GDROPS.filter(function(d){return tn-d.born<900});c.save();c.globalCompositeOperation='lighter';
    GDROPS.forEach(function(d){var f=(tn-d.born)/900,y=d.y-95*(1-Math.min(1,f*1.4));if(f<.72){var gr=c.createLinearGradient(0,y-40,0,y);gr.addColorStop(0,gRgba(d.col,0));gr.addColorStop(1,gRgba(d.col,.95));c.strokeStyle=gr;c.lineWidth=2;c.beginPath();c.moveTo(d.x,y-40);c.lineTo(d.x,y);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(d.x,y,1.6,0,7);c.fill()}
      else{var a=1-(f-.72)/.28;c.strokeStyle=gRgba(d.col,a*.9);c.lineWidth=1.2;c.beginPath();c.ellipse(d.x,d.y,6+(1-a)*8,3+(1-a)*4,0,0,7);c.stroke()}});c.restore()}
  growDrops(c,tn)}
function gRibbon(c,x,y){c.strokeStyle='#D9D2C4';c.lineWidth=1;c.beginPath();c.moveTo(x-10,y);c.lineTo(x-10,y-14);c.moveTo(x+10,y+5);c.lineTo(x+10,y-9);c.stroke();c.strokeStyle='#E8457A';c.lineWidth=1.6;c.beginPath();c.moveTo(x-10,y-11);c.quadraticCurveTo(x,y-4,x+10,y-6);c.stroke()}
function gTripod(c,x,y){c.strokeStyle='#CFC8B8';c.lineWidth=1;c.beginPath();c.moveTo(x,y-12);c.lineTo(x-4,y);c.moveTo(x,y-12);c.lineTo(x+4,y);c.moveTo(x,y-12);c.lineTo(x+1,y-2);c.stroke();c.fillStyle='#F2D24A';c.fillRect(x-2.5,y-15,5,3.5);minifig(c,x+9,y+2,'#F2D24A',7)}
function gStorm(c,x,y,tn){c.save();c.fillStyle=sky==='night'?'rgba(40,46,64,.85)':'rgba(90,98,118,.8)';[[0,0,26],[-20,6,18],[20,5,20],[-8,-8,16]].forEach(function(o){c.beginPath();c.ellipse(x+o[0],y+o[1],o[2],o[2]*.55,0,0,7);c.fill()});
  c.strokeStyle='rgba(185,166,255,.75)';c.lineWidth=1.2;for(var k=0;k<12;k++){var ox=(rnd(k*7)-.5)*60,ph=((tn/9+k*37)%60);c.beginPath();c.moveTo(x+ox,y+10+ph);c.lineTo(x+ox-2,y+18+ph);c.stroke()}c.restore()}
function gSmoke(c,x,y,tn){c.save();for(var k=0;k<5;k++){var f=((tn/1400)+k/5)%1;c.fillStyle='rgba(120,120,130,'+(.5*(1-f))+')';c.beginPath();c.arc(x+Math.sin(k+tn/700)*6,y-f*40,4+f*8,0,7);c.fill()}
  if(Math.floor(tn/400)%2){c.fillStyle='rgba(255,70,60,.9)';c.beginPath();c.arc(x+16,y+16,2.5,0,7);c.fill()}c.restore()}
/** a parade marches around the plot's road ring, with a banner */
function gParade(c,g,tn,banner){var b=g.b,s=g.cs;if(!b||!s)return;var S=s.side,path=[];for(var a=0;a<=S;a++)path.push([a,S]);for(var bb=S;bb>=0;bb--)path.push([S,bb]);
  var L=path.length,cols=['#E8457A','#F2D24A','#4FD1C5','#8B6CF6','#FF9A3D','#FFFFFF'];
  if(!BON)for(var k=0;k<7;k++){var f=((tn/9000)+k*.035)%1,u=f*(L-1),ix=Math.floor(u),fr=u-ix,p0=path[ix],p1=path[Math.min(L-1,ix+1)],q=iso(b.x+p0[0]+(p1[0]-p0[0])*fr,b.y+p0[1]+(p1[1]-p0[1])*fr);minifig(c,q.x,q.y,cols[k%cols.length],k)}
  if(banner){var f0=((tn/9000))%1,u0=f0*(L-1),i0=Math.floor(u0),pp=path[i0],qb=iso(b.x+pp[0],b.y+pp[1]);c.save();c.setTransform(dpr,0,0,dpr,0,0);var sx=cam.x+qb.x*cam.z,sy=cam.y+(qb.y-34)*cam.z;pill(c,sx,sy,banner,'rgba(139,108,246,.95)','#fff','700 11px IBM Plex Sans,Arial,sans-serif');c.restore()}}
// ---------------------------------------------------------------- the daily drop: a manifest of parametric animations
function gPhaseOk(t){if(!t)return true;var h=new Date().getHours()+new Date().getMinutes()/60;if(t==='dawn')return true;if(t==='dusk')return true;var m=/^(\d\d):(\d\d)$/.exec(t);return !m||h>=+m[1]+(+m[2])/60}
function gNight(){return sky==='night'||sky==='evening'||sky==='dusk'}
function growDrops(c,tn){if(!GDROP||!GDROP.drops||reduce&&!GDROP.drops.length)return;var W0=iso(0,H),W1=iso(W,0),Hy=iso(W,H);
  GDROP.drops.forEach(function(d,ix){if(!gPhaseOk(d.t))return;var g=d.at?GM[d.at]:null;
    if(d.kind==='parade'&&g)gParade(c,g,tn,d.banner||null);
    else if(d.kind==='airship'){var f=((tn/1000+ix*13)%90)/90,ns=d.path==='north-south',x=ns?W0.x+(W1.x-W0.x)*.5+(f-.5)*200:W0.x+(W1.x-W0.x)*f,y=ns?-60+(Hy.y+60)*f:Hy.y*.25-80;gAirship(c,x,y,d.livery||GPURPLE)}
    else if(d.kind==='festival'){for(var k in GM){var gg=GM[k];if(!gg.b||!gg.v||!(gg.v.st&&gg.v.st.thr))continue;gLanterns(c,gg,d.lights||'#FFC46B',tn)}}
    else if(d.kind==='wildlife'){for(var w=0;w<5;w++){var gi=Math.floor(rnd(ix*31+w*17)*W),gj=Math.floor(rnd(ix*13+w*29)*H),t2=tiles[gi+','+gj];if(!t2||t2.t!=='g')continue;var q=iso(gi,gj);gAnimal(c,q.x+Math.sin(tn/2400+w)*6,q.y,d.species,tn+w*300)}}
    else if((d.kind==='fireworks'||d.kind==='welcome')&&g&&g.b){var ctr=iso(g.b.x+g.cs.side/2-.5,g.b.y+g.cs.side/2-.5);gBurst(c,ctr.x,ctr.y-60,tn,d.kind==='welcome'||!gNight())}
    else if(d.kind==='storm'&&g&&g.b){var c2=iso(g.b.x+g.cs.side/2-.5,g.b.y+g.cs.side/2-.5);gStorm(c,c2.x,c2.y-70,tn)}})}
function gAirship(c,x,y,col){c.save();c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+30,y+120,26,7,0,0,7);c.fill();var gr=c.createLinearGradient(0,y-12,0,y+12);gr.addColorStop(0,mix(col,1.25));gr.addColorStop(1,mix(col,.7));c.fillStyle=gr;c.beginPath();c.ellipse(x,y,34,12,0,0,7);c.fill();
  c.fillStyle=mix(col,.6);c.beginPath();c.moveTo(x-30,y);c.lineTo(x-42,y-9);c.lineTo(x-40,y);c.lineTo(x-42,y+9);c.closePath();c.fill();c.fillStyle='#2B3242';c.fillRect(x-8,y+11,16,5);c.fillStyle='rgba(255,224,150,.9)';for(var k=0;k<3;k++)c.fillRect(x-6+k*5,y+12.5,2.5,2);c.restore()}
function gLanterns(c,g,col,tn){var b=g.b,S=g.cs.side,a=iso(b.x-.5,b.y+S-.5),z=iso(b.x+S-.5,b.y+S-.5),z2=iso(b.x+S-.5,b.y-.5),on=gNight()?1:.45;
  [[a,z],[z,z2]].forEach(function(seg){for(var k=0;k<=8;k++){var f=k/8,x=seg[0].x+(seg[1].x-seg[0].x)*f,y=seg[0].y+(seg[1].y-seg[0].y)*f-22+Math.sin(f*Math.PI)*6;var fl=.75+.25*Math.sin(tn/300+k);c.save();c.globalCompositeOperation='lighter';c.fillStyle=gRgba(col,.9*on*fl);c.beginPath();c.arc(x,y,2.2,0,7);c.fill();c.fillStyle=gRgba(col,.25*on);c.beginPath();c.arc(x,y,6,0,7);c.fill();c.restore()}})}
function gAnimal(c,x,y,sp,tn){if(sp==='gulls'||sp==='geese'){c.strokeStyle=sp==='gulls'?'#F2F2F5':'#6B6B6B';c.lineWidth=1.2;var fl=Math.sin(tn/180)*3,yy=y-26;c.beginPath();c.moveTo(x-6,yy-fl);c.quadraticCurveTo(x-3,yy-3,x,yy);c.quadraticCurveTo(x+3,yy-3,x+6,yy-fl);c.stroke();return}
  var col=sp==='foxes'?'#D0662E':sp==='rabbits'?'#BFAE98':'#9A6B42',bob=Math.max(0,Math.sin(tn/500))*1.2;c.fillStyle=col;c.beginPath();c.ellipse(x,y-6,5,2.6,0,0,7);c.fill();c.fillRect(x-4,y-5,1,5);c.fillRect(x+3,y-5,1,5);c.beginPath();c.ellipse(x+5.5,y-8-bob,2,1.6,0,0,7);c.fill();if(sp==='deer'){c.strokeStyle='#6B4B2E';c.lineWidth=.8;c.beginPath();c.moveTo(x+5,y-10-bob);c.lineTo(x+4,y-13-bob);c.moveTo(x+6,y-10-bob);c.lineTo(x+7,y-13-bob);c.stroke()}}
function gBurst(c,x,y,tn,confetti){c.save();c.globalCompositeOperation=confetti?'source-over':'lighter';var cols=['#FFC46B','#E8457A','#4FD1C5','#B9A6FF','#FFFFFF'];
  for(var b2=0;b2<2;b2++){var f=((tn/1600)+b2*.5)%1,cx0=x+(b2?24:-18),cy0=y+(b2?10:0);for(var k=0;k<14;k++){var a=k/14*Math.PI*2,r=f*(confetti?18:30);c.fillStyle=cols[(k+b2)%cols.length];c.globalAlpha=1-f;c.beginPath();c.arc(cx0+Math.cos(a)*r,cy0+Math.sin(a)*r*.8+(confetti?f*f*20:f*f*8),confetti?1.6:1.3,0,7);c.fill()}}c.restore()}
// ---------------------------------------------------------------- the world card's growth lines
var GTIER=['','Lot','Houses','Mid-rise','Tower','Solar and AI campus'],GHEALTH=['Building','Crews paused','Windows dimming','Weathered','Dormant'];
function growCard(key){var g=GM[key];if(!g||!g.v)return '';var v=g.v,st=v.st||{},s=g.cs||gState(g),built=0;s.codes.forEach(function(cd){if(cd>=4)built++});
  var wn={now:'today',day:'today',week:'this week',month:'this month'}[GV],w=v.w||{};
  var rows='<div class="row"><span>Plot</span><b>'+s.side+'&times;'+s.side+' &middot; '+built+' of '+(s.side*s.side)+' lots built</b></div>'
   +'<div class="row"><span>Tier</span><b>'+e(GTIER[st.tier||1]||'Lot')+'</b></div>'
   +'<div class="row"><span>Build points '+wn+'</span><b>'+(GV==='now'?(st.pts||0):(w.pts||0))+'</b></div>'
   +(st.streak?'<div class="row"><span>Daily streak</span><b>'+st.streak+' day'+(st.streak===1?'':'s')+'</b></div>':'')
   +(st.ai?'<div class="row" title="'+e((st.ai[2]||[]).join(', '))+'"><span>AI boost</span><b>x'+st.ai[0]+': '+st.ai[1]+' signal'+(st.ai[1]===1?'':'s')+'</b></div>':'')
   +(gWin()&&(w.z||w.top||w.up)?'<div class="row"><span>'+e(wn.charAt(0).toUpperCase()+wn.slice(1))+'</span><b>'+[w.z?w.z+' broke ground':'',w.top?w.top+' topped out':'',w.up?w.up+' upgraded':''].filter(Boolean).join(', ')+'</b></div>':'')
   +'<div class="row"><span>State</span><b>'+e(GHEALTH[st.hc||0])+(st.idle!=null&&st.hc?' ('+st.idle+' days quiet)':'')+'</b></div>';
  return '<div class="c-grow">'+rows+'</div>'}
// ---------------------------------------------------------------- the page's controls drive this
if(GROW){gRefresh();window.CALDERA_GROWTH_API={
  view:function(v,data){GV=v||'now';if(data&&data.members)GDATA=data;GCUR=null;gRefresh();GDROPS=[];draw()},
  cursor:function(t){GCUR=t;gRefresh();draw()},
  heat:function(on){GHEAT=!!on;try{localStorage.setItem('caldera.world.heat',on?'1':'0')}catch(err){}draw()},
  zoning:function(on){GZONE=!!on;try{localStorage.setItem('caldera.world.zoning',on?'1':'0')}catch(err){}draw()},
  drops:function(m){GDROP=m&&Array.isArray(m.drops)?m:null},
  fly:function(h){var b=byName[h];if(b){worldFocus(b);return true}return false},
  plot:function(h,z){var g=GM[h];if(!g||!g.b)return false;var s=g.cs||gState(g),c=iso(g.b.x+s.side/2-.5,g.b.y+s.side/2-.5);cam.z=z||1.5;cam.x=vw/2-c.x*cam.z;cam.y=vh/2-c.y*cam.z;draw();return true},
  state:function(){return {view:GV,cursor:GCUR,heat:GHEAT,zoning:GZONE,plots:Object.keys(GM).length}},
  plotInfo:function(h){var g=GM[h];if(!g)return null;var s=g.cs||gState(g);return {K:g.K,side:s.side,lots:s.codes.join(''),survey:s.survey,b:g.b?{x:g.b.x,y:g.b.y,k:g.b.k}:null,tile:g.b?tiles[(g.b.x+s.side)+','+(g.b.y)]:null}}};
  if(GVIEW0!=='now')GV=GVIEW0}
`;
