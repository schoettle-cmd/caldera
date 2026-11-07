/**
 * The World's Battle view (caldera.social/world?view=battle), inside the city renderer (city.ts CITY_JS), on top of the growth
 * plots (citygrowth.ts). Mike 2026-11-07, approved proposal r-caldera-growth-86be0fb2 section 5 "Cities at war".
 *
 * Destruction is a visual state over the earned state, only in the Battle view: a hit lot shows scorch marks and drops a tier
 * (a house falls to its frame), smoke rises while it's badly hit, a fire crew and a crane work on it while it rebuilds. The
 * Attacks layer draws last night's shots as arcs (beam towers and orbital strikes as beams); the Shields layer draws a dome
 * per opted-in city (white for a beginner shield). Peaceful zones get nothing drawn on them. Replay plays the night: the
 * raid, then the rebuild to how the city stands now, then the all clear.
 * Data: window.CALDERA_BATTLE (the hub's /v1/world/battle). The page drives it through window.CALDERA_BATTLE_API.
 * Runs inside the CITY_JS closure after GROWTH_DRAW_JS: GM, gState, iso, dia, poly, minifig, rnd, hash, cam, dpr, cx, T,
 * reduce, sky, mix, e, draw are in scope.
 */
export const BATTLE_DRAW_JS = String.raw`
var BON=false,BDATA=window.CALDERA_BATTLE||null,BL={damage:true,attacks:true,shields:true},BREP=null,BHITS={};
var BW={orbital:'#FF5FD2',beam:'#3DF2FF',cannon:'#FFB347',catapult:'#E8D27A'};
function bIndex(){BHITS={};if(!BDATA||!BDATA.members)return;for(var k in BDATA.members){var m=BDATA.members[k],o={};(m.hits||[]).forEach(function(h){var li=h[0];if(!o[li])o[li]=[];o[li].push(h)});BHITS[k]=o}}
bIndex();
/** damage showing on one lot (0 none, 1+ badly hit): live = what is left now; in a replay, the raid lands at each shot's time
 *  and the rebuild phase brings it down to what is left now */
function bDmg(key,li){if(!BON||!BL.damage)return 0;var o=BHITS[key];if(!o||!o[li])return 0;var s=0;
  o[li].forEach(function(h){if(BREP){if(h[3]>BREP.t)return;s+=h[2]-(h[2]-h[1])*BREP.reb}else s+=h[1]});return s}
function bCenter(key){var g=GM[key];if(!g||!g.b)return null;var S=(g.cs||gState(g)).side;return iso(g.b.x+S/2-.5,g.b.y+S/2-.5)}
function bLotXY(key,li){var g=GM[key];if(!g||!g.b)return null;var ab=gXY(li);return iso(g.b.x+ab[0],g.b.y+ab[1])}
function bSea(key){var c=bCenter(key);return c?{x:c.x-260,y:c.y-150}:null}
/** under the building, on the object layer: scorch marks on a hit lot */
function bScorch(c,x,y,d){return scorchHi(c,x,y,d);var a=Math.min(.6,.25+.3*d);c.fillStyle='rgba(20,14,10,'+a+')';c.beginPath();c.ellipse(x+3,y+1,15,6.5,0,0,7);c.fill();c.fillStyle='rgba(20,14,10,'+(a*.6)+')';for(var k=0;k<4;k++){c.beginPath();c.ellipse(x+(rnd(x+k*3)-.5)*28,y+(rnd(y+k*5)-.5)*10,4.5,2.2,0,0,7);c.fill()}}
function bSmoke(c,x,y,tn,heavy){return smokeHi(c,x,y,heavy);for(var k=0;k<(heavy?5:3);k++){var f=((reduce?0:tn/1500)+k/5)%1;c.fillStyle='rgba(110,110,120,'+(.5*(1-f))+')';c.beginPath();c.arc(x+Math.sin(k+(reduce?0:tn/700))*5,y-f*34,3+f*7,0,7);c.fill()}
  if(heavy&&!reduce&&Math.floor(tn/350)%2){c.fillStyle='rgba(255,120,40,.85)';c.beginPath();c.arc(x-4,y+4,2.2,0,7);c.fill()}}
function bTruck(c,x,y){return truckHi(c,x,y);c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(x+2,y+2,11,4.5,0,0,7);c.fill();c.fillStyle='#D83A3A';c.fillRect(x-8,y-7,16,7);c.fillStyle='#B22E2E';c.fillRect(x-12,y-5,5,5);c.strokeStyle='#C9CDD4';c.lineWidth=1;c.beginPath();c.moveTo(x-4,y-7);c.lineTo(x+12,y-17);c.stroke();c.fillStyle='#4FC3FF';c.fillRect(x-6,y-9,2,2);c.fillStyle='#14161C';[[-8,1],[0,1],[6,1]].forEach(function(w){c.beginPath();c.arc(x+w[0],y+w[1],1.6,0,7);c.fill()})}
function bRgba(hx,a){var n=parseInt(hx.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function bBeam(c,a,b,col,f){var x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;c.save();c.globalCompositeOperation='lighter';c.strokeStyle=bRgba(col,.35);c.lineWidth=6;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(x,y);c.stroke();c.strokeStyle=col;c.lineWidth=1.6;c.stroke();c.strokeStyle='#fff';c.lineWidth=.6;c.stroke();
  if(f>=1){c.shadowColor=col;c.shadowBlur=14;c.fillStyle=bRgba(col,.9);c.beginPath();c.arc(b.x,b.y,5,0,7);c.fill()}c.restore()}
function bArc(c,a,b,col,f,alpha){var mx=(a.x+b.x)/2,my=Math.min(a.y,b.y)-60-Math.abs(a.x-b.x)*.15;c.save();c.strokeStyle=bRgba(col,alpha);c.lineWidth=1.4;c.setLineDash([5,4]);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(mx,my,b.x,b.y);c.stroke();c.setLineDash([]);
  if(f!=null&&f<=1){var u=1-f,px=u*u*a.x+2*u*f*mx+f*f*b.x,py=u*u*a.y+2*u*f*my+f*f*b.y;c.fillStyle=col;c.shadowColor=col;c.shadowBlur=8;c.beginPath();c.arc(px,py,2.6,0,7);c.fill()}c.restore()}
function bShieldDome(c,x,y,rx,col,a){c.save();c.globalCompositeOperation='lighter';var gr=c.createRadialGradient(x,y-rx*.3,rx*.2,x,y-rx*.3,rx);gr.addColorStop(0,bRgba(col,0));gr.addColorStop(.85,bRgba(col,a*.5));gr.addColorStop(1,bRgba(col,a));c.fillStyle=gr;c.beginPath();c.ellipse(x,y-rx*.3,rx,rx*.75,0,0,7);c.fill();
  c.strokeStyle=bRgba(col,Math.min(1,a+.2));c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx,rx*.5,0,Math.PI,0);c.stroke();c.restore()}
function bRaiderShip(c,x,y,tn){c.save();var bob=reduce?0:Math.sin(tn/600)*2;c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+20,y+90,24,6,0,0,7);c.fill();c.fillStyle='#3A1E2A';c.beginPath();c.ellipse(x,y+bob,30,10,0,0,7);c.fill();c.fillStyle='#7A2E3E';c.beginPath();c.ellipse(x,y-3+bob,30,6,0,0,7);c.fill();c.fillStyle='#E8457A';c.fillRect(x-1,y-26+bob,2,22);c.beginPath();c.moveTo(x+1,y-26+bob);c.lineTo(x+14,y-21+bob);c.lineTo(x+1,y-16+bob);c.fill();c.restore()}
/** over the map, every frame: shields, last night's attacks (or the replay's), smoke and crews on hit lots */
function battleOver(){if(!BON||!BDATA||typeof GM==='undefined')return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var M=BDATA.members||{},rt=BREP?BREP.t:null;
  if(BL.shields)for(var k in M){var ctr=bCenter(k),g=GM[k];if(!ctr||!g)continue;var S=(g.cs||gState(g)).side,sh=M[k].sh||0;if(sh<=0)continue;
    var hitNow=false;if(BREP&&BREP.reb===0)(BDATA.shots||[]).forEach(function(s){if(s[1]===k&&Math.abs(s[4]-rt)<4*60000)hitNow=true});
    bShieldDome(c,ctr.x,ctr.y+8,S*TW*.42+20,M[k].beg?'#FFFFFF':'#3DF2FF',(M[k].beg?.12:.08+.22*sh)+(hitNow?.18:0))}
  if(BL.attacks||BREP){var shots=BDATA.shots||[],ships={};
    shots.forEach(function(s,ix){var to=s[1].charAt(0)==='@'?bCenter(s[1]):null,from=s[0].charAt(0)==='@'?bCenter(s[0]):null;
      if(s[0].charAt(0)!=='@'&&to){from=bSea(s[1]);ships[s[1]]=from}if(s[1].charAt(0)!=='@'&&from){to=bSea(s[0]);ships[s[0]]=to}if(!from||!to)return;
      var col=BW[s[2]]||'#FFB347',tgt=s[5]>=0&&s[1].charAt(0)==='@'?bLotXY(s[1],s[5])||to:to;tgt={x:tgt.x,y:tgt.y-12};var src={x:from.x,y:from.y-30};
      if(BREP){if(BREP.reb>0)return;var dt=(rt-s[4])/90000;if(dt<0||dt>1.6)return;var f=Math.min(1,dt);if(s[2]==='beam'||s[2]==='orbital')bBeam(c,s[2]==='orbital'?{x:tgt.x,y:tgt.y-220}:src,tgt,col,f);else bArc(c,src,tgt,col,f,.7);
        if(dt>=1&&s[3]>0)bSmoke(c,tgt.x,tgt.y,tn,true)}
      else{var ph=reduce?null:((tn/2600+ix*.137)%1);bArc(c,src,tgt,col,ph,.32)}});
    for(var sk in ships)if(ships[sk])bRaiderShip(c,ships[sk].x,ships[sk].y,tn)}
  // smoke over badly hit lots (at most 6 columns in view, embers only at night), a fire truck and a crew where it's rebuilding
  if(BL.damage){var nSm=0,vb=hView(TH*2);for(var hk in BHITS){var lots=BHITS[hk];for(var li in lots){var d=bDmg(hk,+li);if(d<=0)continue;var q=bLotXY(hk,+li);if(!q||q.x<vb[0]||q.x>vb[1]||q.y<vb[2]||q.y>vb[3]+60)continue;
    if(d>=.5){if(nSm<6){nSm++;smokeHi(c,q.x+4,q.y-26,d>=1)}}else{truckHi(c,q.x-TW*.32,q.y+TH*.22);figHi(c,q.x+TW*.2,q.y+TH*.18,'#D83A3A',+li,0)}}}}}
/** the world card's battle lines */
function battleCard(key){if(!BON||!BDATA)return '';var m=(BDATA.members||{})[key];
  if(!m)return '<div class="c-grow"><div class="row"><span>Battles</span><b>Peaceful zone</b></div></div>';
  var hits=(m.hits||[]).reduce(function(t,h){return t+h[1]},0),last=(BDATA.shots||[]).filter(function(s){return s[1]===key}),from={};last.forEach(function(s){from[s[0]]=1});
  var wn={orbital:'orbital strike',beam:'beam tower',cannon:'cannon',catapult:'catapult'}[m.best]||'catapult';
  return '<div class="c-grow"><div class="row"><span>Shield</span><b>'+Math.round((m.sh||0)*100)+'%'+(m.beg?' (beginner)':'')+'</b></div>'
    +'<div class="row"><span>Tonight</span><b>'+m.ammo+' ammo &middot; '+m.shots+' '+e(wn)+' shot'+(m.shots===1?'':'s')+'</b></div>'
    +(last.length?'<div class="row"><span>Last night</span><b>raided by '+e(Object.keys(from).join(', '))+'</b></div>':'')
    +(hits>0?'<div class="row"><span>Rebuilding</span><b>'+m.reb+'% done, whole on its own</b></div>':'')+'</div>'}
window.CALDERA_BATTLE_API={
  view:function(on,data){BON=!!on;if(data)BDATA=data;bIndex();if(!on)BREP=null;draw()},
  layers:function(o){for(var k in o)if(k in BL)BL[k]=!!o[k];draw()},
  replay:function(r){BREP=r||null;draw()},
  fly:function(h){return window.CALDERA_GROWTH_API&&window.CALDERA_GROWTH_API.plot?window.CALDERA_GROWTH_API.plot(h,1.3):false},
  state:function(){return {on:BON,layers:BL,replay:BREP,cities:BDATA&&BDATA.members?Object.keys(BDATA.members).length:0}},
  dmg:function(h,li){return bDmg(h,li)}};
`;
