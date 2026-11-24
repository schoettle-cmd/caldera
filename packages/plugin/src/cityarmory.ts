/**
 * The Armory yard on every member's growth plot (Mike 2026-11-21: "the plain green grid of empty zoned lots ... reads as
 * nothing. Make it an obvious video-game armory"). Design: Fable, reports/2026-11-21-armory (ARMORY.md, armory-mockup.html).
 *
 * The empty lots (code 0) at the plot's front corner become a paved yard: a launcher, an armory bunker and up to six pallets
 * that hold today's missiles (one size per pallet, heaviest nearest the launcher; one drawn missile stands for 1, 2, 5, 10,
 * 25, 50 or 100 when the day is huge). The yard follows the night battle (20:00 Pacific since 2026-11-25, data.next): Stock (stacks grow),
 * Load (B-8 h to B-30 min: the door opens, a cart runs, the stacks drain onto the launcher), Ready (last 30 min: arm up,
 * green lamps), Fired (B to B+4 h: arm up and empty, scorch, the new day's stacks). Built lots (codes 1-7) are never used.
 * With fewer than 4 empty lots the yard moves to the tiles outside the plot road at the same corner.
 * Data: window.CALDERA_BATTLE members["@handle"].n (today's arsenal) and .nx (the arsenal of the next battle, when it is not
 * the work day's: from the 19:45 PT lock to the battle), shots (last night). No battle data: the zero-missile look.
 * Drawn from citygrowth.ts: pads in growGround, objects in growObject (atlas sprites at LOD 1), the cart and the beacon in
 * growOver; the chip goes through the world labels (city.ts worldLabels). Runs inside the CITY_JS closure.
 */

/** the rules, pure (unit tested on their own: test/cityarmory.test.mjs) */
export const ARMORY_RULES_JS = String.raw`
var YCAP={cruise:2,tactical:3,rocket:6,shell:9},YORD=['cruise','tactical','rocket','shell'],YSTEP=[1,2,5,10,25,50,100],YDAY=864e5,YHR=36e5;
/** a lot's index from its (a,b) inside the plot (citygrowth.ts gLot) */
function yLotI(a,b){var r=Math.max(a,b);return r*r+(a===r?(b<r?b:r):r+1+a)}
/** empty lots in yard order: the front corner first (ring from the corner, then distance, then a descending) */
function yOrder(S,free){return free.slice().sort(function(A,B){var ra=Math.max(S-1-A[0],S-1-A[1]),rb=Math.max(S-1-B[0],S-1-B[1]),da=2*S-2-A[0]-A[1],db=2*S-2-B[0]-B[1];return ra-rb||da-db||B[0]-A[0]})}
/** the yard's lots: launcher, armory, pallet lots (Y of them). Only lots with code 0; fewer than 4: outside the plot road */
function yLay(S,codes){var free=[];for(var b=0;b<S;b++)for(var a=0;a<S;a++)if(!(+codes[yLotI(a,b)]>0))free.push([a,b]);
  var o=yOrder(S,free);if(o.length>=4){var Y=Math.min(6,o.length-2);return {out:false,la:o[0],ar:o[1],pal:o.slice(2,2+Y),Y:Y}}
  return {out:true,la:[S+1,S+1],ar:[S+1,S],pal:[[S,S+1],[S+1,S-1],[S-1,S+1]],Y:3}}
/** counts to pallets: one size per pallet, heaviest first; the first glyph step u that fits on Y pallets, else 100 and the first Y */
function yPlan(n,Y){n=n||{};var out=null;for(var s=0;s<YSTEP.length;s++){var u=YSTEP[s],pal=[];
    YORD.forEach(function(k){var g=+n[k]>0?Math.ceil(n[k]/u):0;while(g>0){pal.push({k:k,g:Math.min(YCAP[k],g)});g-=YCAP[k]}});
    out={u:u,pallets:pal};if(pal.length<=Y)return out}
  out.pallets=out.pallets.slice(0,Y);return out}
/** the battle's offset in the UTC day (data.next: 04:00 UTC in winter, 03:00 in summer), 10:00 UTC when there is no data */
function yOff(D){var t=D&&+D.next;return t>0?((t%YDAY)+YDAY)%YDAY:10*YHR}
/** the state from the clock: last = the latest battle at or before now, B = the next one */
function yPhase(now,off){if(off==null)off=10*YHR;var last=Math.floor((now-off)/YDAY)*YDAY+off,B=last+YDAY;
  if(now<last+4*YHR)return {ph:'fired',B:B,last:last,f:0};
  if(now>=B-.5*YHR)return {ph:'ready',B:B,last:last,f:1};
  if(now>=B-8*YHR)return {ph:'load',B:B,last:last,f:Math.min(1,(now-(B-8*YHR))/(7.5*YHR))};
  return {ph:'stock',B:B,last:last,f:0}}
/** glyphs left per pallet: Load moves floor(G*f) (the first glyph of pallet 0 is the one on the rail, then from the last pallet back) */
function yDrain(pl,ph,f){var gl=pl.map(function(x){return x.g}),G=0;gl.forEach(function(v){G+=v});
  var gone=ph==='load'?Math.min(G,Math.floor(G*Math.max(0,Math.min(1,f)))):ph==='ready'?G:0,left=gone;
  if(left>0&&gl.length){gl[0]--;left--}for(var q=gl.length-1;q>=0&&left>0;q--){var tk=Math.min(gl[q],left);gl[q]-=tk;left-=tk}
  return {gl:gl,G:G,gone:gone}}
function ySum(n){var t=0;if(n)YORD.forEach(function(k){if(+n[k]>0)t+=+n[k]});return t}
/** the arsenal that fires at battle B: .nx while the data is from before its day's battle, .n (the data's day) fires the day after */
function yArs(D,key,B){var m=D&&D.members&&D.members[key];if(!m)return null;if(+D.next===B)return m.nx||m.n||null;
  var at=Date.parse(D.at||'');return isFinite(at)&&(Math.floor(at/YDAY)+1)*YDAY+yOff(D)===B?m.n||null:null}
/** missiles fired at the battle 'last' (the night's shots when the data has them) */
function yFired(D,key,last){if(!D)return 0;if(+D.t0===last&&Array.isArray(D.shots)){var c=0;D.shots.forEach(function(r){if(r&&r[0]===key)c++});return c}return ySum(yArs(D,key,last))}
/** everything the yard draws, for one plot at one time */
function yState(lay,D,key,now){var ph=yPhase(now,yOff(D)),n=yArs(D,key,ph.B)||{},pl=yPlan(n,lay.Y),dr=yDrain(pl.pallets,ph.ph,ph.f);
  return {ph:ph.ph,B:ph.B,last:ph.last,f:ph.f,n:n,N:ySum(n),u:pl.u,pallets:pl.pallets,gl:dr.gl,G:dr.G,gone:dr.gone,F:ph.ph==='fired'?yFired(D,key,ph.last):0,
    np:Math.min(lay.pal.length,Math.max(2,pl.pallets.length)),heavy:pl.pallets.length?pl.pallets[0].k:null}}
/** the chip on the map and the tooltip (always the true count); clock: the battle on the viewer's clock */
function yTexts(st,clock){var N=st.N,F=st.F,s=function(x){return x===1?'':'s'};
  if(st.ph==='fired'&&F>0)return {chip:'Armory · fired '+F,tip:'Armory · fired '+F+' last night.'};
  if(!N)return {chip:'Armory',tip:'Armory · empty. Ship today to build missiles for '+clock+'.'};
  if(st.ph==='load')return {chip:'Armory · loading '+N,tip:'Armory · loading '+N+' for '+clock+'.'};
  if(st.ph==='ready')return {chip:'Armory · '+N+' ready',tip:'Armory · '+N+' ready for '+clock+'.'};
  return {chip:'Armory · '+N,tip:'Armory · '+N+' missile'+s(N)+' for tonight, '+clock+'.'}}
`;

/** drawing and the hooks citygrowth.ts / city.ts call (inside the CITY_JS closure, after GROWTH_DRAW_JS's helpers) */
export const ARMORY_JS = ARMORY_RULES_JS + String.raw`
var YT=null,YSIG='',YCHK=0,YARM={},YTTL=null,YAX=35.78,YDIR=[.8944,-.4472],YBAND={shell:'#FFD24A',rocket:'#9FD8FF',tactical:'#FF7A1F',cruise:'#B9A6FF'},
  YMS={shell:{L:6,t:2.6},rocket:{L:11,t:2},tactical:{L:15,t:3},cruise:{L:21,t:4}};
function yNow(){return YT!=null?YT:Date.now()}
function yData(){return typeof BDATA!=='undefined'&&BDATA?BDATA:window.CALDERA_BATTLE||null}
function yNt(){return sky==='night'||sky==='evening'||sky==='dusk'}
/** night: toward the night ink; evening and dusk: half way (bands, tags, lamps and pips are never dimmed) */
function yDim(h){return sky==='night'?mix(h,.54,'#0B1020'):sky==='evening'||sky==='dusk'?mix(h,.36,'#1B1E3A'):h}
function yClock(B){var d=new Date(B),h=d.getHours(),m=d.getMinutes();return (h<10?'0':'')+h+':'+(m<10?'0':'')+m}
/** one plot's yard now: the lots (cached per plot state) and the state (cached per data and clock second) */
function yardOf(g){if(!g||!g.b||!GROW)return null;var s=g.cs||(g.cs=gState(g)),D=yData(),now=yNow(),tk=Math.floor(now/1000),y=g.yd;
  if(y&&y.cs===s&&y.D===D&&y.tk===tk)return y;
  var lay=y&&y.cs===s?y.lay:yLay(s.side,s.codes),st=yState(lay,D,g.key,now),at={};
  at[lay.la.join(',')]={k:'la'};at[lay.ar.join(',')]={k:'ar'};for(var i=0;i<st.np;i++)at[lay.pal[i].join(',')]={k:'pal',ix:i};
  y=g.yd={cs:s,D:D,tk:tk,lay:lay,st:st,at:at};return y}
function yardTip(key){var Y=yardOf(GM[key]);return Y?yTexts(Y.st,yClock(Y.st.B)).tip:''}
/** the world card's row */
function yardRow(key){var t=yardTip(key);if(!t)return '';return '<div class="row"><span>Armory</span><b>'+e(t.replace(/^Armory · /,'').replace(/\.$/,''))+'</b></div>'}
/** a redraw only when a yard's picture changes (phase, missiles moved, fired count); the arm's tween starts here */
function yTick(){var tn=Date.now();if(tn-YCHK<1000)return;YCHK=tn;var sig='';
  for(var k in GM){var g=GM[k];if(!g.b)continue;var Y=yardOf(g);if(!Y)continue;var st=Y.st;sig+=st.ph+st.gone+'.'+st.F+'.'+st.G+',';
    if(g.yph==='load'&&st.ph==='ready'&&!reduce)YARM[k]=performance.now();g.yph=st.ph}
  if(sig!==YSIG){var first=!YSIG;YSIG=sig;if(!first)draw()}}
if(GROW&&reduce)setInterval(yTick,15000);
// ---- the kit (Fable's mockup kit(), lot centre at the origin; heights in px at zoom 1)
function yP(i,j,h){return [(i-j)*TW/2,(i+j)*TH/2-(h||0)]}
function yDia(i,j,s){var q=yP(i,j),hw=TW/2*s,hh=TH/2*s;return [[q[0],q[1]-hh],[q[0]+hw,q[1]],[q[0],q[1]+hh],[q[0]-hw,q[1]]]}
function yBox(c,i0,j0,i1,j1,z0,z1,cl){poly(c,[yP(i0,j1,z0),yP(i1,j1,z0),yP(i1,j1,z1),yP(i0,j1,z1)],yDim(cl[1]));
  poly(c,[yP(i1,j1,z0),yP(i1,j0,z0),yP(i1,j0,z1),yP(i1,j1,z1)],yDim(cl[2]));poly(c,[yP(i0,j0,z1),yP(i1,j0,z1),yP(i1,j1,z1),yP(i0,j1,z1)],yDim(cl[0]))}
function yLn(c,a,b,w,col){c.strokeStyle=col;c.lineWidth=w;c.lineCap='butt';c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
function yDot(c,q,r,col){c.fillStyle=col;c.beginPath();c.arc(q[0],q[1],r,0,7);c.fill()}
function yLamp(c,q,col){c.save();c.globalAlpha=yNt()?.38:.22;yDot(c,q,4,col);c.restore();yDot(c,q,1.3,col)}
function yMissile(c,x,y,dx,dy,k,flat){var M=YMS[k],L=M.L,t=M.t,nx=dy,ny=-dx,ex=x+dx*L,ey=y+dy*L,hi=flat||yDim('#EEF1F5'),lo=flat||yDim('#AEB4C0'),dk=flat||yDim('#666C7A');
  function fin(bx,by,out,back,len,s){poly(c,[[bx+s*nx*t*.35,by+s*ny*t*.35],[bx+s*nx*(t*.5+out)-dx*back,by+s*ny*(t*.5+out)-dy*back],[bx+dx*len+s*nx*t*.35,by+dy*len+s*ny*t*.35]],dk)}
  if(k==='cruise'){var mx=x+dx*L*.42,my=y+dy*L*.42;fin(mx,my,4.6,2.5,4.5,1);fin(mx,my,4.6,2.5,4.5,-1)}
  if(k==='cruise'||k==='tactical'){fin(x,y,2.2,1.4,3,1);fin(x,y,2.2,1.4,3,-1)}
  yLn(c,[x,y],[ex,ey],t,lo);yLn(c,[x+nx*t*.22,y+ny*t*.22],[ex+nx*t*.22,ey+ny*t*.22],t*.5,hi);
  if(!flat)yLn(c,[x+dx*L*.6,y+dy*L*.6],[x+dx*L*.82,y+dy*L*.82],t,YBAND[k]);
  var tl=t*1.5;poly(c,[[ex+nx*t/2,ey+ny*t/2],[ex+dx*tl,ey+dy*tl],[ex-nx*t/2,ey-ny*t/2]],flat||yDim(k==='cruise'?'#DADFE8':'#8E95A3'))}
function yShell(c,x,y){c.fillStyle=yDim('#6B7359');c.fillRect(x-1.3,y-4.2,2.6,4.2);c.fillStyle=YBAND.shell;c.fillRect(x-1.3,y-2.7,2.6,1.2);poly(c,[[x-1.3,y-4.2],[x,y-6.4],[x+1.3,y-4.2]],yDim('#C3C8D1'))}
/** a pallet of one size with g glyphs (none: two empty cradles and a grey edge) */
function yStack(c,k,g,far){yBox(c,-.26,-.34,.26,.34,0,2,['#B48A58','#8F6B42','#765736']);
  poly(c,[yP(-.26,.34,0),yP(.26,.34,0),yP(.26,.34,2),yP(-.26,.34,2)],k&&g>0?YBAND[k]:yDim('#8A8E96'));
  if(far){if(k&&g>0){var f=yP(0,0,2);c.fillStyle=YBAND[k];c.fillRect(f[0]-5,f[1]-6,10,7)}return}
  if(!g||!k){var sd=['#6A6F78','#50545C','#3F434A'];yBox(c,-.2,-.22,.2,-.14,2,3.4,sd);yBox(c,-.2,.14,.2,.22,2,3.4,sd)}
  else if(k==='shell'){yBox(c,-.24,-.3,.24,.3,2,3.6,['#7A5B38','#765736','#5F462B']);var n=0;for(var jj=-1;jj<=1;jj++)for(var ii=-1;ii<=1;ii++){if(n++>=g)continue;var q=yP(ii*.14,jj*.17,3.6);yShell(c,q[0],q[1])}}
  else{var pos=k==='cruise'?[[-.11,4],[.11,4]]:k==='tactical'?[[-.09,3.5],[.09,3.5],[0,6.3]]:[[-.14,3],[0,3],[.14,3],[-.14,5.3],[0,5.3],[.14,5.3]],tj=k==='cruise'?.3:k==='tactical'?.2:.14;
    for(var m=0;m<g&&m<pos.length;m++){var t0=yP(pos[m][0],tj,pos[m][1]);yMissile(c,t0[0],t0[1],YDIR[0],YDIR[1],k)}
    if(k==='rocket'){var fr=yDim('#4A4F5A');[[-.21,.1],[.21,.1],[.21,-.12]].forEach(function(e2){yLn(c,yP(e2[0],e2[1],2),yP(e2[0],e2[1],7.6),.8,fr)});yLn(c,yP(-.21,.1,7.6),yP(.21,.1,7.6),.8,fr);yLn(c,yP(.21,.1,7.6),yP(.21,-.12,7.6),.8,fr)}}
  if(k&&g>0){var tp=yP(.31,.4,0);yLn(c,tp,[tp[0],tp[1]-7],.8,yDim('#4A4F5A'));c.fillStyle=YBAND[k];c.fillRect(tp[0]-2.4,tp[1]-10.4,4.8,3.6)}}
/** the launcher: long axis along j, cab at -j; st: angle (0 flat, 1.01 raised), k (missile on the rail), lamps, lampCol, beacon, fired */
function yLauncher(c,st,far){var ol=['#7D8A62','#5F6A4A','#4C553B'],ol2=['#8E9B73','#6A7653','#566043'],an=st.angle||0;
  if(st.fired&&!far){var s=yP(0,.43);c.fillStyle='rgba(18,14,10,.5)';c.beginPath();c.ellipse(s[0]-3,s[1]+1,12,5.5,0,0,7);c.fill()}
  if(an>0&&!far){var jk=['#3A3F48','#2B2F36','#22252B'];yBox(c,-.22,.28,-.15,.36,0,2.5,jk);yBox(c,.15,.28,.22,.36,0,2.5,jk)}
  yBox(c,-.15,-.36,.15,.36,2.5,8,ol);
  if(!far){[-.27,-.09,.09,.27].forEach(function(jj){var w=yP(.15,jj,2.2);c.fillStyle='#17191E';c.beginPath();c.ellipse(w[0],w[1],2.2,2.6,0,0,7);c.fill()})}
  yBox(c,-.15,-.36,.15,-.17,8,12.5,ol2);
  if(!far){poly(c,[yP(.15,-.34,9.3),yP(.15,-.2,9.3),yP(.15,-.2,11.8),yP(.15,-.34,11.8)],yNt()?'rgba(255,208,120,.92)':'#C9E3F6');
    [0,.12,.24].forEach(function(jj,ix){var q=yP(.15,jj,5.6);c.fillStyle=ix<(st.lamps||0)?st.lampCol:'#20232A';c.fillRect(q[0]-.9,q[1]-.9,1.8,1.8)})}
  var hz=9.2,hj=.32,d=25,p0=yP(0,hj,hz),p1=yP(0,hj-d*Math.cos(an)/YAX,hz+d*Math.sin(an));
  if(an>0&&!far)yLn(c,yP(0,-.04,8),yP(0,hj-13*Math.cos(an)/YAX,hz+13*Math.sin(an)),1.5,yDim('#2F3440'));
  yLn(c,p0,p1,far?3:2.2,yDim('#3C4234'));
  if(st.k){var len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),dx=(p1[0]-p0[0])/len,dy=(p1[1]-p0[1])/len,off=YMS[st.k].t/2+1.1;
    if(far){if(an>0)yDot(c,p1,3.2,YBAND[st.k])}else yMissile(c,p0[0]+dx*1.5+dy*off,p0[1]+dy*1.5-dx*off,dx,dy,st.k)}
  if(st.beacon&&!far)yLamp(c,yP(0,-.27,12.9),st.beacon)}
/** the bunker: door on the left face (+j), hazard header, state lamp, slit windows, roof slab with a stencil, mast and flag */
function yArmory(c,st,far){var w=['#8C9580','#6A735F','#555D4C'],roof=['#9FA892','#7A836E','#646C5A'],dj=.36,nt=yNt();
  yBox(c,-.38,-.36,.38,.36,0,15,w);
  if(!far){
    poly(c,[yP(-.2,dj,0),yP(.2,dj,0),yP(.2,dj,11),yP(-.2,dj,11)],st.door==='open'?'#0D0F13':yDim('#30343C'));
    if(st.door==='open')poly(c,[yP(-.2,dj,0),yP(.2,dj,0),yP(.2,dj,6),yP(-.2,dj,6)],'rgba(255,196,107,.6)');
    else [2.8,5.6,8.4].forEach(function(z){yLn(c,yP(-.2,dj,z),yP(.2,dj,z),.7,yDim('#4A4F5A'))});
    poly(c,[yP(-.26,dj,11),yP(.26,dj,11),yP(.26,dj,13.2),yP(-.26,dj,13.2)],yDim('#F2C230'));
    for(var k=0;k<4;k++){var u=-.24+.13*k;poly(c,[yP(u,dj,11),yP(u+.05,dj,11),yP(u+.09,dj,13.2),yP(u+.04,dj,13.2)],'#1B1D22')}
    [-.2,.08].forEach(function(jj){poly(c,[yP(.38,jj,8.6),yP(.38,jj+.12,8.6),yP(.38,jj+.12,10.8),yP(.38,jj,10.8)],nt?'rgba(255,208,120,.95)':'rgba(28,34,46,.75)')})}
  yBox(c,-.42,-.4,.42,.4,15,17.5,roof);
  c.save();c.strokeStyle=yDim('#F2C230');c.lineWidth=far?2:1;poly(c,[yP(-.35,-.33,17.5),yP(.35,-.33,17.5),yP(.35,.33,17.5),yP(-.35,.33,17.5)]);c.stroke();c.restore();
  if(far)return;
  var t0=yP(.02,.24,17.5);yMissile(c,t0[0],t0[1],YDIR[0],YDIR[1],'tactical',nt?'rgba(255,255,255,.78)':'rgba(255,255,255,.95)');
  if(st.lamp)yLamp(c,yP(0,dj,14.4),st.lamp);
  var m0=yP(-.34,-.32,17.5);yLn(c,m0,[m0[0],m0[1]-13],.9,yDim('#D9DEE6'));c.fillStyle=st.flag||'#3178C6';c.fillRect(m0[0]+.4,m0[1]-12.6,6,3.8);if(nt)yLamp(c,[m0[0],m0[1]-13.6],'#FF5A4D')}
function yCart(c,k){yBox(c,-.07,-.11,.07,.11,0,3,['#F2C230','#C99E1F','#A9841A']);if(k){var t0=yP(0,.2,4.7);yMissile(c,t0[0],t0[1],YDIR[0],YDIR[1],k)}}
/** the launcher's look in this state (arm: the tween's 0..1 at Ready, while the page watched the change) */
function yLaunch(st,arm,blink){var ph=st.ph,o;
  if(ph==='load')o={angle:0,k:st.gone>0?st.heavy:null,lamps:Math.max(1,Math.ceil(st.f*3)),lampCol:'#FFB347',beacon:blink?null:'#FFB347'};
  else if(ph==='ready')o={angle:1.01*(arm==null?1:arm),k:st.heavy,lamps:3,lampCol:'#5BE08A',beacon:'#5BE08A'};
  else if(ph==='fired')o={angle:1.01,k:null,fired:true};
  else o={angle:0,k:null};
  o.id=ph+'|'+(o.k||'-')+'|'+(o.lamps||0)+'|'+(o.beacon?1:0);return o}
// ---- the hooks
/** ground: the pads (yellow bay line, solid on the launcher lot) and, at night while loading, the floodlight on the launcher */
function yPad(c,X,Y,solid){poly(c,dia(X,Y,.92),yDim('#BDBAB0'));c.save();c.strokeStyle=yDim('#F2C230');c.lineWidth=LODN===0?1.4:.9;if(!solid)c.setLineDash([3,2.2]);poly(c,dia(X,Y,.74));c.stroke();c.restore()}
function yardGround(c,g,Y){var b=g.b,lay=Y.lay;if(lay.out)for(var k in Y.at){if(BON&&Y.at[k].k==='la')continue;var ab=k.split(','),a=+ab[0],bb=+ab[1];if(a>=b.k||bb>=b.k)continue;yPad(c,b.x+a,b.y+bb,Y.at[k].k==='la')}
  if(yNt()&&!BON&&(Y.st.ph==='load'||Y.st.ph==='ready')){var A=iso(b.x+lay.ar[0],b.y+lay.ar[1]),r=yP(.42,.4,17.5),src=[A.x+r[0],A.y+r[1]],dd=dia(b.x+lay.la[0],b.y+lay.la[1],.92);
    c.save();c.globalCompositeOperation='lighter';poly(c,[src,dd[3],dd[2],dd[1]],'rgba(255,230,160,.10)');poly(c,dia(b.x+lay.la[0],b.y+lay.la[1],.84),'rgba(255,230,160,.10)');c.restore()}}
/** objects: true when (a,b) is a yard lot (drawn here, with its hit box) */
function yardObject(c,g,a,b,p){var Y=yardOf(g),yk=Y&&Y.at[a+','+b];if(!yk)return false;var st=Y.st,far=LODN===0,sk=sky,rep=g.n&&g.n.rep,top=p.y-12;
  if(yk.k==='ar'){var door=st.ph==='load'?'open':'shut',lc=st.ph==='load'?'#FFB347':st.ph==='ready'?'#5BE08A':yNt()?'#C9D2E6':'',flag=gLang(g);
    hiDraw(c,'ya|'+door+'|'+lc+'|'+flag+'|'+sk+'|'+(far?1:0),64,64,32,50,p.x,p.y,function(cc){yArmory(cc,{door:door,lamp:lc,flag:flag},far)});top=p.y-44}
  else if(yk.k==='la'){if(BON)return true;var t0=YARM[g.key],arm=t0!=null&&!reduce?Math.min(1,(performance.now()-t0)/1200):null,ls=yLaunch(st,arm==null?null:arm*arm*(3-2*arm),st.ph==='load'&&!reduce);
    hiDraw(c,arm!=null&&arm<1?null:'yl|'+ls.id+'|'+sk+'|'+(far?1:0),76,76,40,56,p.x,p.y,function(cc){yLauncher(cc,ls,far)});top=p.y-(ls.angle>0?34:16)}
  else{var pp=st.pallets[yk.ix],k=pp?pp.k:null,gg=pp?st.gl[yk.ix]:0;hiDraw(c,'ys|'+(k||'-')+'|'+gg+'|'+sk+'|'+(far?1:0),60,48,30,32,p.x,p.y,function(cc){yStack(cc,k,gg,far)})}
  if(rep)hits.push({block:rep,armory:g.key,x0:p.x-TW*.4,x1:p.x+TW*.4,y0:top-6,y1:p.y+TH*.45});return true}
/** over the map, each frame: the redraw check, the arm's tween, and (Load, in view, not reduced) the beacon and the cart */
function yardOver(c,tn){yTick();var wn=performance.now();for(var ak in YARM){dirty=true;if(wn-YARM[ak]>=1200)delete YARM[ak]}
  if(reduce||LODN===0||BON||sky==='grid')return;var vb=hView(TH*3),carts=0;
  for(var k in GM){var g=GM[k],Y=g.yd;if(!g.b||!Y||Y.st.ph!=='load')continue;var b=g.b,lay=Y.lay,st=Y.st,ql=iso(b.x+lay.la[0],b.y+lay.la[1]);
    if(ql.x<vb[0]-40||ql.x>vb[1]+40||ql.y<vb[2]-40||ql.y>vb[3]+60)continue;
    if(Math.floor(tn/500)%2===0){var bq=yP(0,-.27,12.9);yLamp(c,[ql.x+bq[0],ql.y+bq[1]],'#FFB347')}
    if(carts>=8||st.gone>=st.G||!st.G)continue;carts++;var ix=0;for(var q=st.gl.length-1;q>0;q--)if(st.gl[q]>0){ix=q;break}
    var pl=lay.pal[ix],pk=st.pallets[ix]?st.pallets[ix].k:st.heavy,cyc=(tn+(hash(k)%6000))%6000;if(!pl)continue;
    var u=Math.min(1,cyc/4000),e2=u*u*(3-2*u),dA=[lay.ar[0],lay.ar[1]+.54],di=dA[0]-pl[0],dj=dA[1]-pl[1],dl=Math.hypot(di,dj)||1,s0=[pl[0]+di/dl*.42,pl[1]+dj/dl*.42],
      ci=s0[0]+(dA[0]-s0[0])*e2,cj=s0[1]+(dA[1]-s0[1])*e2,cq=iso(b.x+ci,b.y+cj);
    c.save();c.translate(cq.x,cq.y);yCart(c,cyc<4000?pk:null);c.restore()}}
/** the chips (world labels): one per plot, above the armory, with a dot per size held */
function yardLabels(cand,S){if(sky==='grid')return;for(var k in GM){var g=GM[k],Y=g.yd||yardOf(g);if(!g.b||!Y)continue;var ar=Y.lay.ar,q=iso(g.b.x+ar[0],g.b.y+ar[1]),sp=S(q.x,q.y-50),st=Y.st;
  cand.push({pr:2.5,sc:0,x:sp[0],y:sp[1],text:yTexts(st,yClock(st.B)).chip,bg:'rgba(17,20,32,.88)',fg:'#F2F2F5',font:'600 10.5px IBM Plex Sans,Arial,sans-serif',block:g.n&&g.n.rep,armory:k,
    dots:YORD.filter(function(z){return +st.n[z]>0})})}}
/** a place-label pill with the size dots after the text */
function yChip(c,x,y,text,dots,font){c.font=font;var tw=c.measureText(text).width,pw=dots.length?dots.length*8+2:0,w=tw+12+pw,h=17,r=8.5,x0=x-w/2;
  c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=6;c.shadowOffsetY=2;c.fillStyle='rgba(17,20,32,.88)';c.beginPath();
  c.moveTo(x0+r,y-h);c.arcTo(x0+w,y-h,x0+w,y,r);c.arcTo(x0+w,y,x0,y,r);c.lineTo(x+3,y);c.lineTo(x,y+4);c.lineTo(x-3,y);c.arcTo(x0,y,x0,y-h,r);c.arcTo(x0,y-h,x0+w,y-h,r);c.closePath();c.fill();c.restore();
  c.fillStyle='#F2F2F5';c.textAlign='left';c.textBaseline='middle';c.fillText(text,x0+6,y-h/2+.5);c.textBaseline='alphabetic';
  dots.forEach(function(k,ix){yDot(c,[x0+6+tw+6+ix*8,y-h/2],2.8,YBAND[k])})}
`;
