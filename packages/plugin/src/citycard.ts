/**
 * The strike card (map-audit STRIKECARD.md, Fable design 2026-11-20; Mike and Orion: "after every hit, before we kind of scroll
 * the map to the next pending hit ... Orion destroys 25% of Mike's buildings and kind of exciting font video game text that then
 * disappears as it progresses to the next person and maybe has a split second where you can take a screenshot and then save it
 * to kind of post it to social"). After each beat of the replay a dark plate slams into the lower third of the map: who did what
 * in one line, the big number, two or three facts, the defender's city bar and the top three attackers so far. It holds 2 s
 * (BRT.card, added to every beat in citybattle.ts bBeats), then leaves as the camera moves on. One Save button draws the same card
 * over a frame of the map on a canvas, 1080x1350 (the last card also 1080x1920 for a story), and downloads or shares the PNG.
 * Mike's answers to the 4 decisions (Fable's recommendations): +2 s per strike; Save = post size, story only on the last card;
 * Saira Extra Condensed 900 for the headline; signed-in viewers see YOU / YOUR on screen, saved pictures always show handles.
 * The map art is untouched: the card is a DOM overlay on the stage (st), above the canvas. Its CSS animations are paused and
 * driven from the replay's virtual clock (CSSAnimation.currentTime), so pause, speed, seek, Prev and Next all show it right.
 * Runs inside the CITY_JS closure after BATTLE_LOGIC_JS (BREP, BRT, BFL, bNow, bPause, bUsd, BBLD, bImpactOf, BCLS, cam, vw,
 * vh, dpr, reduce, cv, st, sound, AC). Only block comments in here, no non-ASCII characters (escapes instead).
 */
export const STRIKE_CARD_JS = String.raw`
/* ---- the strike card (citycard.ts STRIKE_CARD_JS). Times in ms at 1x on the replay clock (spec section 7) */
var BCT={enter:BRT.cardIn,exit:200,hold:BRT.card,last:3000,rmIn:BRT.cardInRm,rmHold:BRT.cardRm,rmOut:150,still:1120,floor:12e2,lift:300,gap:48,slam:200},BCV=null,BCARD=null,BCSAVE=0;
var BCTONE={gold:['#FFC83D','#B07A0E','#5E3F04'],cyan:['#3DF2FF','#1596A3','#0A4B53'],grey:['#C9CEDA','#5B6170','#2A2E38'],red:['#FF4D5E','#A3202E','#560D16'],atk:['#FF6A3D','#B23E1B','#5F1F0B']};
var BCCOL={atk:'#FF6A3D',def:'#58B4FF',you:'#8B6CF6',raid:'#F2F2F5',gold:'#FFC83D',grey:'rgba(244,246,250,.46)'};
var BCMON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],BCSIZE=['S','M','L','XL'];
/** a card's phases: in (enter or fade in), h (the hold), o (exit), len. kind: beat, fall, last; rm: reduced motion */
function bCardTimes(kind,rm){var h=rm?BCT.rmHold:kind==='last'?BCT.last:BCT.hold,i=rm?BCT.rmIn:BCT.enter,o=rm?BCT.rmOut:BCT.exit;return {i:i,h:h,o:o,len:i+h+o}}
/** what one beat adds to the replay for its card: the hold (the enter sits inside the last 500 ms of the hold on the hit) */
function bCardAdd(rm){return rm?BCT.rmHold:BCT.hold}
/** the clock rate while a card holds: never shorter than 1.2 s of real time (2x would make it 1 s) */
function bCardSpeed(sp,T){var cap=(T?T.h:BCT.hold)/BCT.floor;return Math.min(sp,cap)}
/** every card of a replay: one per beat (citybattle.ts puts c0 on the beat), the fall, and the last card in the wide shot */
function bCardPlan(R,rm){var L=[];R.beats.forEach(function(b){if(b.c0!=null)L.push({k:'beat',b:b,c0:b.c0,T:bCardTimes('beat',rm)})});var S=R.S;
  if(R.F&&S.zf0!=null){var T2=bCardTimes('fall',rm);L.push({k:'fall',c0:rm?S.zf0+BFL.hit:S.wide-T2.len,T:T2})}
  var T3=bCardTimes('last',rm),pe=L.length?L[L.length-1].c0+L[L.length-1].T.len:0;L.push({k:'last',c0:Math.max(S.wide,pe),T:T3});L.forEach(function(c,i){c.id=i});return L}
/** the card showing at now and how far into it (tau), or null */
function bCardAt(L,now){if(!L)return null;for(var i=0;i<L.length;i++){var c=L[i];if(now>=c.c0&&now<c.c0+c.T.len)return {c:c,tau:now-c.c0}}return null}
/** how much of a city still stands at t (0..1, by tower height): each tower loses what the hits on it took (the same sum as the
 *  hit label's STANDING), null for a city with no towers (the raiders' fleet). Pure: blds [{idx,h}], hits {idx:[q]}, imp(q) */
function bCardStandOf(blds,hits,imp,t){if(!blds||!blds.length)return null;var tot=0,s=0;blds.forEach(function(b){var h=Math.max(1,b.h||1),v=0;((hits||{})[b.idx]||[]).forEach(function(q){if(imp(q)<=t)v+=q.v||0});tot+=h;s+=h*(1-Math.min(1,v))});return s/tot}
function bCardStand(P,S,d,t){return bCardStandOf(BBLD[d],P.hit[d],function(q){return bImpactOf(S,q)},t)}
/** a shot's dollars that landed, and what a shield held off */
function bCardUsd(s){return s.f>0&&!s.blocked?s.usd||0:0}
function bCardHeld(s){return s.blocked||s.sh>0?s.pot||0:0}
/** the top attackers after beat upto (its index): a running sum of landed dollars per attacker, ties to the earlier beat */
function bCardRanks(beats,upto){var m={},first={},n=0;for(var i=0;i<=upto&&i<beats.length;i++)beats[i].shots.forEach(function(s){var a=s.a;if(!(a in m)){m[a]=0;first[a]=n++}m[a]+=bCardUsd(s)});
  return Object.keys(m).filter(function(a){return m[a]>0}).sort(function(p,q){return (m[q]-m[p])||(first[p]-first[q])}).map(function(a){return {a:a,usd:m[a]}})}
function bCardRankOf(L,a){for(var i=0;i<L.length;i++)if(L[i].a===a)return i+1;return 0}
/** which card a beat gets: montage, multi, shield, fall, miss, small, hit (spec section 5) */
function bCardState(o){if(o.montage)return 'montage';if(o.targets>1)return 'multi';if(o.n>0&&o.blocked>=o.n)return 'shield';if(o.after!=null&&o.after<=1e-4&&o.dmg>0)return 'fall';
  if(!(o.dmg>0))return o.blocked>0?'shield':'miss';if(o.p==null||o.p<1)return 'small';return 'hit'}
/** names on the card: no @, upper case; the raiders are SEA RAIDERS; the viewer is YOU (on screen only: V is null for a picture) */
function bcRaid(h){return String(h||'').charAt(0)!=='@'}
function bcName(h,V){return V&&h===V?'YOU':bcRaid(h)?'SEA RAIDERS':String(h).slice(1).toUpperCase()}
function bcPoss(h,V){return V&&h===V?'YOUR':bcRaid(h)?'SEA RAIDERS’':String(h).slice(1).toUpperCase()+'’S'}
function bcCls(h,V,role){return V&&h===V?'you':role==='atk'&&bcRaid(h)?'raid':role}
function bcVerb(h,V,v){return V&&h===V||bcRaid(h)?v:v==='FINISH'?'FINISHES':v+'S'}
function bcCity(h){return bcRaid(h)?'FLEET':'CITY'}
function bcPct(v){return Math.round(v*100)}
function bcDate(night){var d=/^\d{4}-\d\d-\d\d$/.test(night||'')?new Date(night+'T12:00:00'):new Date();return {d:BCMON[d.getMonth()]+' '+d.getDate(),y:d.getFullYear()}}
function bcIso(night){var d=/^\d{4}-\d\d-\d\d$/.test(night||'')?night:null;if(d)return d;var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+101).slice(1)+'-'+String(t.getDate()+100).slice(1)}
function bcFile(s){return String(s||'').replace(/^[@~]/,'').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')||'city'}
/** the top-attackers strip: three cells [name, dollars, cur|me, up] or null */
function bcStrip(L,cur,up,V){var o=[];for(var i=0;i<3;i++){var r=L[i];o.push(r?[bcRaid(r.a)?'SEA RAIDERS':r.a.slice(1).toUpperCase(),bUsd(r.usd),r.a===cur?'cur':V&&r.a===V?'me':'',r.a===cur&&up>0?up:0]:null)}return o}
/** the card's words and numbers (spec sections 5 and 6). c: a card of bCardPlan; X: {R,P,S,V}. Every value is final copy */
function bCardModel(c,X){var R=X.R,P=X.P,S=X.S,V=X.V||null,dt=bcDate(P.night),iso=bcIso(P.night),M={kind:c.k,date:dt.d,year:dt.y,facts:[],lb:[],shield:false};
  var stand=function(d,t){return bCardStand(P,S,d,t)};
  if(c.k==='beat'){var b=c.b,sh=b.shots,n=b.n||sh.length,land=0,dmg=0,blk=0,held=0,word=null,big=-1;sh.forEach(function(s){var u=bCardUsd(s);if(s.f>0&&!s.blocked)land++;dmg+=u;if(s.blocked)blk++;held+=bCardHeld(s);if(!word&&s.x&&s.x.word)word=String(s.x.word).toUpperCase();var k=BCLS[s.w];if(k!=null&&k>big)big=k});
    var A=b.a,D=b.targets[0],before=stand(D,b.t0),after=stand(D,c.c0+c.T.i),p=before!=null&&after!=null?bcPct(before)-bcPct(after):null;
    var st=bCardState({montage:b.montage,targets:b.targets.length,n:n,blocked:blk,dmg:dmg,after:after,p:p});M.state=st;M.n=n;M.land=land;M.dmg=dmg;M.held=held;M.p=p;M.a=A;M.d=D;
    var third=held>0?[bUsd(held),'blocked by shield','blocked']:word?[word,'bomb word','word']:big>=0?[BCSIZE[big],'biggest missile','missile']:null,hitF=[land+' of '+n,'missiles hit','hit'];
    var an=[bcName(A,V),bcCls(A,V,'atk')],dp=[bcPoss(D,V),bcCls(D,V,'def')];
    if(st==='hit'){M.l1=[an,[' '+bcVerb(A,V,'DESTROY')]];M.big=p+'%';M.tone='gold';M.tail=[['OF '],dp,[' '+bcCity(D)]];M.facts=[['−'+bUsd(dmg),'damage','damage'],hitF];if(third)M.facts.push(third)}
    else if(st==='small'){M.l1=[an,[' '+bcVerb(A,V,'HIT')+' '],dp,[' '+bcCity(D)]];M.big=bUsd(dmg);M.tone='gold';M.tail=[['DAMAGE']];M.facts=[hitF];if(third)M.facts.push(third)}
    else if(st==='fall'){M.l1=[an,[' '+bcVerb(A,V,'FINISH')+' '],dp,[' '+bcCity(D)]];M.big=bcRaid(D)?'SUNK':'CITY DOWN';M.tone='red';M.tail=[];M.facts=[['−'+bUsd(dmg),'damage','damage'],hitF,['0%','standing','standing']]}
    else if(st==='shield'){M.l1=[dp,[' SHIELD']];M.big='HOLDS';M.tone='cyan';M.tail=[['AGAINST '],an];M.shield=true;M.facts=[[blk+' of '+n,'missiles blocked','blocked'],[bUsd(held),'blocked by shield','by shield']];if(after!=null)M.facts.push([bcPct(after)+'%','still standing','standing'])}
    else if(st==='miss'){M.l1=[an,[' '+bcVerb(A,V,'FIRE')+' AT '],dp,[' '+bcCity(D)]];M.big='MISS';M.tone='grey';M.tail=[['NO DAMAGE']];M.facts=[['0 of '+n,'missiles hit','hit'],['$0','damage','damage']];if(after!=null)M.facts.push([bcPct(after)+'%','still standing','standing'])}
    else if(st==='multi'){M.l1=[an,[' '+bcVerb(A,V,'HIT')+' '+b.targets.length+' CITIES']];M.big=bUsd(dmg);M.tone='gold';M.tail=[['DAMAGE']];M.facts=[hitF];if(held>0)M.facts.push([bUsd(held),'blocked by shield','blocked'])}
    else{var hit={},worst=null,wp=0;sh.forEach(function(s){if(bCardUsd(s)>0)hit[s.d]=1});b.targets.forEach(function(d){var s0=stand(d,b.t0),s1=stand(d,c.c0+c.T.i);if(s0==null||s1==null)return;var q=bcPct(s0)-bcPct(s1);if(q>wp){wp=q;worst=d}});
      M.l1=[[(b.cities||1)+' MORE CIT'+((b.cities||1)===1?'Y FIRES':'IES FIRE')]];M.big=bUsd(dmg);M.tone='gold';M.tail=[['DAMAGE']];M.facts=[hitF,[String(Object.keys(hit).length),'cities hit','cities']];if(worst)M.facts.push([bcName(worst,null)+' −'+wp+'%','hardest hit','hardest'])}
    M.ac=st==='miss'?'grey':st==='shield'?'def':bcRaid(A)?'raid':'atk';
    if(st!=='multi'&&st!=='montage'&&before!=null){var f0=bcPct(before),t0=bcPct(after);M.bar=[(V&&D===V?'YOUR':bcPoss(D,null))+' '+bcCity(D),f0,t0,f0===t0?'still '+t0+'% standing':f0+'% → '+t0+'% standing']}
    if(st==='multi'){var rows=b.targets.map(function(d){var u=0;sh.forEach(function(s){if(s.d===d)u+=bCardUsd(s)});var s0=stand(d,b.t0),s1=stand(d,c.c0+c.T.i);return {d:d,u:u,f:s0==null?100:bcPct(s0),t:s1==null?100:bcPct(s1)}}).sort(function(p,q){return q.u-p.u});
      var more=rows.length>3?rows.length-2:0;M.rows=rows.slice(0,more?2:3).map(function(r){return [V&&r.d===V?'YOUR CITY':bcName(r.d,null),r.f,r.t,r.u>0?'−'+(r.f-r.t)+'%':'held',bUsd(r.u)]});if(more)M.more='+'+more+' more cities'}
    var L1=bCardRanks(R.beats,b.i),L0=b.i>0?bCardRanks(R.beats,b.i-1):[],r1=bCardRankOf(L1,A),r0=bCardRankOf(L0,A),cur=b.montage?null:A;M.lb=bcStrip(L1,cur,r0&&r1&&r0>r1?r0-r1:0,V);
    M.file=b.montage||st==='multi'?'caldera-battle-'+iso+'.png':'caldera-'+bcFile(A)+'-vs-'+bcFile(D)+'-'+iso+'.png'}
  else if(c.k==='fall'){var F=P.fall,key=F.key,fin=null,fr=-1,n2=0,l2=0,d2=0;P.shots.forEach(function(s){if(s.d!==key)return;n2++;if(s.f>0&&!s.blocked){l2++;d2+=bCardUsd(s)}if(s.ri>fr){fr=s.ri;fin=s.a}});
    var bf=stand(key,S.zf0);M.state='fall';M.a=fin;M.d=key;M.l1=fin?[[bcName(fin,V),bcCls(fin,V,'atk')],[' '+bcVerb(fin,V,'FINISH')+' '],[bcPoss(key,V),bcCls(key,V,'def')],[' '+bcCity(key)]]:[[bcPoss(key,V),bcCls(key,V,'def')],[' '+bcCity(key)+' FALLS']];
    M.big=bcRaid(key)?'SUNK':'CITY DOWN';M.tone='red';M.tail=[];M.ac=fin&&bcRaid(fin)?'raid':'atk';M.facts=[['−'+bUsd(d2),'damage','damage'],[l2+' of '+n2,'missiles hit','hit'],['0%','standing','standing']];
    if(bf!=null)M.bar=[(V&&key===V?'YOUR':bcPoss(key,null))+' '+bcCity(key),bcPct(bf),0,bcPct(bf)+'% → 0% standing'];
    var L3=bCardRanks(R.beats,R.beats.length-1);M.lb=bcStrip(L3,fin,0,V);M.file='caldera-'+bcFile(fin||'battle')+'-vs-'+bcFile(key)+'-'+iso+'.png'}
  else{var L4=bCardRanks(R.beats,R.beats.length-1),top=L4[0],cities={},nl=0,tot=0,yh=0;P.shots.forEach(function(s){var u=bCardUsd(s);if(s.f>0&&!s.blocked){nl++;if(V&&s.d===V)yh++}if(u>0)cities[s.d]=1;tot+=u});
    M.state='last';M.l1=[['TOP ATTACKER · '+dt.d]];M.big=top?(bcRaid(top.a)?'SEA RAIDERS':top.a.slice(1).toUpperCase()):'NO ONE';M.bigYou=!!(top&&V&&top.a===V);M.tone=top?'atk':'grey';M.tail=top?[[bUsd(top.usd)+' DAMAGE']]:[['NO DAMAGE']];M.ac='gold';M.a=top?top.a:null;
    M.facts=[[String(Object.keys(cities).length),'cities hit','cities'],[String(nl),'missiles hit','hits'],[bUsd(tot),'damage in all','damage']];
    if(V&&BBLD[V]){var ys=stand(V,S.wide);if(yh>0||ys!=null&&ys<1)M.you='Your city: '+yh+' hit'+(yh===1?'':'s')+(ys!=null?', '+bcPct(ys)+'% standing':'')}
    M.lb=bcStrip(L4,top?top.a:null,0,V);M.file='caldera-battle-'+iso+'.png'}
  M.say=bCardSay(M);return M}
/** the one sentence a screen reader hears */
function bCardSay(M){var tc=function(x){return String(x).toLowerCase().replace(/(^|[\s-])([a-z])/g,function(q,p1,p2){return p1+p2.toUpperCase()})},t=function(a){return (a||[]).map(function(p){return p[1]?tc(p[0]):p[0].toLowerCase()}).join('')};
  var s=(t(M.l1)+' '+(M.state==='last'?tc(M.big):M.big.toLowerCase())+' '+t(M.tail)).replace(/\s+/g,' ').trim();s=s.charAt(0).toUpperCase()+s.slice(1)+'.';
  return s+(M.facts||[]).map(function(f){return ' '+f[0].replace('−','')+' '+f[1]+'.'}).join('')}
/* ---- the card on the stage (DOM) */
var BCCSS='.bcard{position:absolute;z-index:6;left:50%;bottom:var(--bot);width:var(--w);transform:translateX(-50%);filter:drop-shadow(0 12px 22px rgba(0,0,0,.5));--tc:#FFC83D;--e1:#B07A0E;--e2:#5E3F04;--ac:#FF6A3D;--plate:rgba(11,13,19,.93);--ink:#F4F6FA;--ink2:rgba(244,246,250,.7);--ink3:rgba(244,246,250,.46);--cyan:#3DF2FF;--you:#8B6CF6;--atk:#FF6A3D;--def:#58B4FF;--heal:#4BE38A;--gold:#FFC83D;--raid:#F2F2F5;--slam:"Saira Extra Condensed","Barlow Condensed","Arial Narrow",Arial,sans-serif;--disp:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--ui:"IBM Plex Sans",-apple-system,"Segoe UI",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-family:var(--ui);color:var(--ink);box-sizing:border-box;-webkit-user-select:none;user-select:none;touch-action:manipulation}'
 +'.bcard *{box-sizing:border-box}.bcard.sz-l{--w:760px;--cut:16px;--px:30px;--pt:15px;--f1:46px;--fb:128px;--fact:15px;--lbh:44px;--lbn:16px;--row:17px}.bcard.sz-m{--w:560px;--cut:11px;--px:21px;--pt:10px;--f1:31px;--fb:86px;--fact:12.5px;--lbh:36px;--lbn:14px;--row:15px}.bcard.sz-s{--w:calc(100% - 20px);--cut:8px;--px:15px;--pt:9px;--f1:25px;--fb:74px;--fact:11.5px;--lbh:36px;--lbn:13px;--row:15px}'
 +'.bcard .sc-plate{position:relative;background:var(--plate);clip-path:polygon(var(--cut) 0,100% 0,calc(100% - var(--cut)) 100%,0 100%)}.bcard .sc-timer{height:3px;background:var(--ac);transform-origin:0 50%}'
 +'.bcard .sc-main{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:18px;align-items:end;padding:var(--pt) var(--px) 0 calc(var(--px) + 4px)}'
 +'.bcard .sc-head{min-width:0;transform:skewX(-8deg);transform-origin:0 100%;font-family:var(--slam);font-weight:900;text-transform:uppercase;letter-spacing:.01em;white-space:nowrap}'
 +'.bcard .sc-l1{font-size:calc(var(--f1)*var(--k,1));line-height:1;text-shadow:0 2px 0 rgba(0,0,0,.55);overflow:hidden;text-overflow:ellipsis}.bcard .sc-l2{display:flex;align-items:flex-end;gap:.28em;font-size:calc(var(--f1)*var(--k,1));line-height:.95;margin-top:2px}'
 +'.bcard .sc-big{display:inline-block;font-size:calc(var(--fb)*var(--k,1));line-height:.84;color:var(--tc);transform-origin:0 100%;text-shadow:.016em .008em 0 var(--e1),.032em .016em 0 var(--e1),.048em .024em 0 var(--e1),.064em .032em 0 var(--e2),.08em .04em 0 var(--e2),.12em .075em .05em rgba(0,0,0,.55)}'
 +'.bcard .sc-tail{padding-bottom:.08em;text-shadow:0 2px 0 rgba(0,0,0,.55);overflow:hidden;text-overflow:ellipsis}.bcard b{font-weight:inherit}.bcard .atk{color:var(--atk)}.bcard .def{color:var(--def)}.bcard .you{color:var(--you)}.bcard .raid{color:var(--raid)}.bcard .gold{color:var(--gold)}'
 +'.bcard .sc-side{display:grid;justify-items:end;gap:8px;padding-bottom:4px}.bcard .sc-btns{display:flex;gap:6px}'
 +'.bcard .sc-save{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px 0 9px;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:var(--ink);font:600 12px/1 var(--ui);cursor:pointer;position:relative;white-space:nowrap}.bcard .sc-save::after{content:"";position:absolute;inset:-8px}'
 +'.bcard .sc-save:hover{background:var(--ink);color:#0B0D13;border-color:var(--ink)}.bcard .sc-save:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}.bcard .sc-save svg{width:14px;height:14px;flex:none}.bcard .sc-save[disabled]{cursor:default}'
 +'.bcard .sc-facts{list-style:none;margin:0;padding:0;display:grid;justify-items:end;gap:1px;font:500 var(--fact)/1.35 var(--mono);color:var(--ink2);white-space:nowrap}.bcard .sc-facts b{color:var(--ink);font-weight:600}.bcard .sc-facts b.gold{color:var(--gold)}'
 +'.bcard .sc-bar,.bcard .sc-rows,.bcard .sc-you{margin:10px var(--px) 0 calc(var(--px) + 2px)}.bcard .sc-bar,.bcard .sc-rows>div{display:grid;grid-template-columns:auto minmax(40px,1fr) auto;gap:10px;align-items:center;height:var(--row)}'
 +'.bcard .sc-rows{display:grid;gap:3px}.bcard .sc-rows>div{grid-template-columns:minmax(0,7.5em) minmax(40px,1fr) 3.2em 4.6em}.bcard .sc-rows>p{margin:0;font:500 calc(var(--row) - 4.5px)/1 var(--mono);color:var(--ink3)}'
 +'.bcard .lab{font:600 calc(var(--row) - 3px)/1 var(--disp);letter-spacing:.1em;text-transform:uppercase;color:var(--def);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bcard .lab.you{color:var(--you)}'
 +'.bcard .val,.bcard .sc-you{font:500 calc(var(--row) - 4.5px)/1 var(--mono);color:var(--ink2);white-space:nowrap}.bcard .sc-rows .val{text-align:right}.bcard .sc-rows .val.g{color:var(--gold)}'
 +'.bcard .track{position:relative;height:8px;background:rgba(255,255,255,.12);overflow:hidden}.bcard.sz-l .track{height:10px}.bcard .track i{position:absolute;top:0;bottom:0}.bcard .track .left{left:0;background:var(--def)}'
 +'.bcard .track .lost{background:repeating-linear-gradient(-63deg,var(--gold) 0 3px,rgba(255,200,61,.25) 3px 6px);opacity:.75}.bcard .track::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(5% - 1px),rgba(11,13,19,.9) calc(5% - 1px) 5%)}'
 +'.bcard.shield .track{outline:1.5px solid var(--cyan);outline-offset:1px}.bcard .sc-you{display:flex;align-items:center;gap:7px;height:var(--row)}.bcard .sc-you::before{content:"";width:7px;height:7px;background:var(--you);transform:rotate(45deg)}'
 +'.bcard .sc-lb{display:flex;align-items:stretch;margin-top:10px;background:rgba(255,255,255,.055);height:var(--lbh);padding:0 var(--px) 0 calc(var(--px) - 4px)}.bcard .sc-lb .h{display:grid;align-content:center;gap:3px;padding-right:12px;flex:none}'
 +'.bcard .sc-lb .h span{font:600 11px/1 var(--disp);letter-spacing:.13em;text-transform:uppercase;color:var(--ink2);white-space:nowrap}.bcard .sc-lb .h em{font:500 9.5px/1 var(--mono);font-style:normal;color:var(--ink3)}'
 +'.bcard .sc-lb ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:1;min-width:0}.bcard .sc-lb li{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:7px;align-content:center;padding:0 8px;border-left:1px solid rgba(255,255,255,.09);min-width:0}'
 +'.bcard .sc-lb li>i{grid-row:1/3;align-self:center;font:900 calc(var(--lbn) + 9px)/1 var(--slam);font-style:normal;color:var(--ink3)}.bcard .sc-lb .n{font:600 var(--lbn)/1.05 var(--disp);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.bcard .sc-lb .v{font:500 calc(var(--lbn) - 3.5px)/1.2 var(--mono);color:var(--gold)}.bcard .sc-lb li.cur>i{color:var(--ac)}.bcard .sc-lb li.cur .n{color:var(--ink)}.bcard .sc-lb li.me .n{color:var(--you)}.bcard .sc-lb li.none .n,.bcard .sc-lb li.none .v{color:var(--ink3)}'
 +'.bcard .sc-lb .up{display:inline-block;margin-left:5px;font:600 .72em/1 var(--mono);color:var(--heal)}.bcard .sc-lb .up::before{content:"";display:inline-block;border:.34em solid transparent;border-bottom:.5em solid var(--heal);border-top:0;margin-right:2px}'
 +'.bcard .sc-paused{position:absolute;left:calc(var(--px) + 4px);top:8px;z-index:2;font:600 10px/1 var(--mono);letter-spacing:.1em;color:#0B0D13;background:var(--ink);padding:4px 6px;border-radius:3px;display:none}.bcard.hp .sc-paused{display:block}'
 +'.bcard .sc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}'
 +'.bcard.sz-s .sc-main{grid-template-columns:minmax(0,1fr);row-gap:7px}.bcard.sz-s .sc-side{display:contents}.bcard.sz-s .sc-btns{position:absolute;right:var(--px);top:var(--pt)}.bcard.sz-s .sc-save{height:32px}'
 +'.bcard.sz-s .sc-facts{display:flex;flex-wrap:nowrap;overflow:hidden;gap:0;justify-self:start}.bcard.sz-s .sc-facts li+li::before{content:"·";margin:0 .5em;color:var(--ink3)}.bcard.sz-s .sc-tail{white-space:normal;max-width:7.2em}'
 +'.bcard.sz-s .sc-l1{max-width:calc(100% - var(--sbw,84px))}.bcard.sz-s .sc-lb .h{padding-right:8px}.bcard.sz-s .sc-lb li{padding:0 6px;column-gap:5px}.bcard.sz-s .sc-bar,.bcard.sz-s .sc-rows,.bcard.sz-s .sc-you{margin-top:7px}.bcard.sz-s .sc-lb{margin-top:9px}'
 +'.bcard.sz-s .sc-rows>div{grid-template-columns:minmax(0,5.6em) minmax(30px,1fr) 3em 4.4em;gap:7px}'
 /* motion: one timeline from the start of the enter; paused here and driven from the replay clock (bCardDrive) */
 +'.bcard .sc-plate{animation:scWipe 120ms cubic-bezier(.2,.8,.2,1) both,scOut 200ms cubic-bezier(.4,0,1,1) var(--xo) forwards}.bcard .sc-timer{animation:scTimer var(--hd) linear 500ms both}'
 +'.bcard .sc-l1{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) 80ms both}.bcard .sc-big{animation:scSlam 220ms cubic-bezier(.2,.9,.3,1) 200ms both}.bcard .sc-tail{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) 300ms both}.bcard .sc-main{animation:scShake 120ms linear 420ms}'
 +'.bcard .track .lost{animation:scDrain 480ms ease-out 420ms both}.bcard .sc-facts li{animation:scFade 160ms ease-out 500ms both}.bcard .sc-facts li:nth-child(2){animation-delay:560ms}.bcard .sc-facts li:nth-child(3){animation-delay:620ms}'
 +'.bcard .sc-bar,.bcard .sc-rows,.bcard .sc-you{animation:scFade 160ms ease-out 420ms both}.bcard .sc-lb{animation:scRise 200ms ease-out 640ms both}.bcard .sc-lb li.cur{animation:scRank 360ms ease-out 760ms both}.bcard .sc-btns{animation:scFade 160ms ease-out 640ms both}'
 +'.bcard.drv,.bcard.drv *{animation-play-state:paused!important}'
 +'@keyframes scWipe{from{clip-path:polygon(var(--cut) 0,var(--cut) 0,0 100%,0 100%);opacity:.4}to{clip-path:polygon(var(--cut) 0,100% 0,calc(100% - var(--cut)) 100%,0 100%);opacity:1}}@keyframes scOut{to{opacity:0;transform:translateY(8px) scale(.985)}}'
 +'@keyframes scTimer{from{transform:scaleX(1)}to{transform:scaleX(0)}}@keyframes scSlide{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes scSlam{0%{opacity:0;transform:scale(2.6)}55%{opacity:1;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}'
 +'@keyframes scShake{0%{transform:translateX(0)}25%{transform:translateX(4px)}60%{transform:translateX(-3px)}100%{transform:translateX(0)}}@keyframes scDrain{0%{opacity:1;filter:brightness(2.2)}100%{opacity:.75;filter:none}}'
 +'@keyframes scFade{from{opacity:0}to{opacity:1}}@keyframes scFadeOut{to{opacity:0}}@keyframes scRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes scRank{0%{background:rgba(255,106,61,.5)}100%{background:transparent}}'
 /* reduced motion: one fade in, the still hold, one fade out; no wipe, slam, shake, drain or swap */
 +'.bcard.rm .sc-plate{animation:scFade 150ms linear both,scFadeOut 150ms linear var(--xo) forwards}.bcard.rm .sc-timer{animation:scTimer var(--hd) linear 150ms both}.bcard.rm .sc-plate *:not(.sc-timer){animation:none}'
 /* on a phone the overview and the power-up tray step aside while a card shows (any element marked data-card-hide) */
 +'[data-card-hide]{transition:opacity .15s}@media (max-width:599px){html.w-card [data-card-hide]{opacity:0;pointer-events:none}}';
var BCICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
function bcE(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function bcParts(a){return (a||[]).map(function(p){return p[1]?'<b class="'+p[1]+'">'+bcE(p[0])+'</b>':bcE(p[0])}).join('')}
function bcTrack(f,t){f=Math.max(0,Math.min(100,f));t=Math.max(0,Math.min(f,t));return '<div class="track"><i class="left" style="width:'+t+'%"></i><i class="lost" style="left:'+t+'%;width:'+(f-t)+'%"></i></div>'}
/** can this page save a file? hosted city pages are sandboxed (an opaque origin): no downloads there, so no Save button */
function bCardCanSave(){try{if(typeof window==='undefined'||!window.document||!document.createElement)return false;if(window.origin==='null'||(typeof location!=='undefined'&&location.origin==='null'))return false;void window.localStorage;return typeof HTMLCanvasElement!=='undefined'&&!!HTMLCanvasElement.prototype.toBlob}catch(e){return false}}
/** the size class from the stage width (DESIGN.md): L 1100 and up, M 600 to 1099, S under 600 */
function bCardSize(w){return w>=1100?'l':w>=600?'m':'s'}
function bCardHTML(M,size,save){var T=BCTONE[M.tone]||BCTONE.gold,ac=BCCOL[M.ac]||BCCOL.atk,big=M.bigYou?'<b class="you">'+bcE(M.big)+'</b>':bcE(M.big);
  var btn=function(f,l,al){return '<button class="sc-save" type="button" data-save="'+f+'" aria-label="'+al+'">'+BCICO+'<span>'+l+'</span></button>'};
  var btns=!save?'':M.kind==='last'?btn('p','Save post','Save this card as a post picture')+btn('s','Save story','Save this card as a story picture'):btn('p','Save','Save this card as a picture');
  var h='<span class="sc-sr">'+bcE(M.say)+'</span><div class="sc-plate" aria-hidden="false"><div class="sc-timer"></div><span class="sc-paused" aria-hidden="true">PAUSED</span><div class="sc-main">'
   +'<div class="sc-head" aria-hidden="true"><div class="sc-l1">'+bcParts(M.l1)+'</div><div class="sc-l2"><span class="sc-big">'+big+'</span>'+(M.tail&&M.tail.length?'<span class="sc-tail">'+bcParts(M.tail)+'</span>':'')+'</div></div>'
   +'<div class="sc-side">'+(btns?'<div class="sc-btns">'+btns+'</div>':'')+'<ul class="sc-facts" aria-hidden="true">'+M.facts.map(function(f){return '<li><b'+(f[0].charAt(0)==='\u2212'?' class="gold"':'')+'>'+bcE(f[0])+'</b> '+bcE(size==='s'&&f[2]||f[1])+'</li>'}).join('')+'</ul></div></div>';
  if(M.bar)h+='<div class="sc-bar" aria-hidden="true"><span class="lab'+(/^YOUR /.test(M.bar[0])?' you':'')+'">'+bcE(M.bar[0])+'</span>'+bcTrack(M.bar[1],M.bar[2])+'<span class="val">'+bcE(M.bar[3])+'</span></div>';
  if(M.rows)h+='<div class="sc-rows" aria-hidden="true">'+M.rows.map(function(r){return '<div><span class="lab'+(/^YOUR /.test(r[0])?' you':'')+'">'+bcE(r[0])+'</span>'+bcTrack(r[1],r[2])+'<span class="val">'+bcE(r[3])+'</span><span class="val g">'+bcE(r[4])+'</span></div>'}).join('')+(M.more?'<p>'+bcE(M.more)+'</p>':'')+'</div>';
  if(M.you)h+='<div class="sc-you" aria-hidden="true">'+bcE(M.you)+'</div>';
  h+='<div class="sc-lb" aria-hidden="true"><div class="h"><span>Top attackers</span><em>caldera.social</em></div><ol>'+M.lb.map(function(r,i){return r?'<li class="'+r[2]+'"><i>'+(i+1)+'</i><span class="n">'+bcE(r[0])+(r[3]?'<span class="up">'+r[3]+'</span>':'')+'</span><span class="v">'+bcE(r[1])+'</span></li>':'<li class="none"><i>'+(i+1)+'</i><span class="n">—</span><span class="v">&nbsp;</span></li>'}).join('')+'</ol></div></div>';
  return {html:h,vars:'--tc:'+T[0]+';--e1:'+T[1]+';--e2:'+T[2]+';--ac:'+ac}}
/** the space under the card: the spec's distance, or more when the replay bar sits higher (the card always clears it) */
function bCardBot(size){var b=size==='l'?96:72;try{var bp=st&&st.querySelector&&st.querySelector('.b-play');if(bp&&bp.offsetParent!==null){var sr=st.getBoundingClientRect(),pr=bp.getBoundingClientRect();if(pr.height>0)b=Math.max(b,Math.round(sr.bottom-pr.top+10))}}catch(e){}return b}
/** the long-name rule: shrink line 1, the big number and the tail together in 5% steps down to 70%, then cut with an ellipsis */
function bCardFit(el){var hd=el.querySelector('.sc-head');if(!hd)return;var k=1;hd.style.setProperty('--k','1');var tight=function(){var l1=hd.querySelector('.sc-l1'),l2=hd.querySelector('.sc-l2');return hd.scrollWidth>hd.clientWidth+1||l1&&l1.scrollWidth>l1.clientWidth+1||l2&&l2.scrollWidth>hd.clientWidth+1};while(tight()&&k>.7){k-=.05;hd.style.setProperty('--k',k.toFixed(2))}}
function bCardFonts(){try{if(document.fonts&&document.fonts.load){['900 80px "Saira Extra Condensed"','600 16px "Barlow Condensed"','700 54px "Barlow Condensed"','500 15px "IBM Plex Mono"','600 24px "IBM Plex Mono"','500 24px "IBM Plex Sans"'].forEach(function(f){document.fonts.load(f).catch(function(){})})}}catch(e){}}
function bCardCss(){try{if(document.getElementById('bcard-css'))return;var s=document.createElement('style');s.id='bcard-css';s.textContent=BCCSS;(document.head||document.documentElement).appendChild(s)}catch(e){}}
/** the card for c goes up: the model (the viewer sees YOU), the DOM, the size, the fit; animations paused for the clock to drive */
function bCardMount(c){bCardOff();var X={R:BREP.R,P:BREP.P,S:BREP.R.S,V:BCV},M=bCardModel(c,X);BCARD={id:c.id,c:c,m:M,el:null,anim:null,tau:-1,hp:false,tp:false};
  if(typeof st==='undefined'||!st||!st.appendChild||typeof document==='undefined'||!document.createElement)return;
  try{bCardCss();bCardFonts();var size=bCardSize(st.clientWidth||vw),save=bCardCanSave(),H=bCardHTML(M,size,save),el=document.createElement('div');
    el.className='bcard sz-'+size+(reduce?' rm':'')+(M.shield?' shield':'');el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('data-card',M.state);
    el.style.cssText=H.vars+';--bot:'+bCardBot(size)+'px;--xo:'+(c.T.i+c.T.h)+'ms;--hd:'+c.T.h+'ms';el.innerHTML=H.html;st.appendChild(el);BCARD.el=el;
    var bw=el.querySelector('.sc-btns');if(bw&&size==='s')el.style.setProperty('--sbw',(bw.offsetWidth+12)+'px');bCardFit(el);
    if(el.getAnimations){el.classList.add('drv');void el.offsetWidth;BCARD.anim=el.getAnimations({subtree:true})}
    document.documentElement.classList.add('w-card');bCardWire(el)}catch(e){}}
function bCardOff(){if(!BCARD)return;var el=BCARD.el,hp=BCARD.hp||BCARD.tp;BCARD=null;if(el&&el.parentNode)el.parentNode.removeChild(el);try{document.documentElement.classList.remove('w-card')}catch(e){}if(hp&&BREP&&BREP.pauseAt!=null&&!BCSAVE)bPause(false)}
/** pause to look: the pointer on the card pauses (PAUSED chip), leaving resumes; on touch a tap pauses and a second tap (or Play) resumes */
function bCardWire(el){var stop=function(ev){ev.stopPropagation()};['pointerdown','mousedown','touchstart','wheel','click','dblclick'].forEach(function(k){el.addEventListener(k,stop,k==='wheel'||k==='touchstart'?{passive:true}:false)});
  el.addEventListener('pointerenter',function(ev){if(ev.pointerType!=='mouse'||!BCARD||!BREP)return;if(BREP.pauseAt==null){bPause(true);BCARD.hp=true}el.classList.toggle('hp',BREP.pauseAt!=null)});
  el.addEventListener('pointerleave',function(ev){if(ev.pointerType!=='mouse'||!BCARD)return;if(BCARD.hp&&!BCSAVE&&BREP&&BREP.pauseAt!=null)bPause(false);BCARD.hp=false;el.classList.remove('hp')});
  el.addEventListener('pointerup',function(ev){if(ev.pointerType==='mouse'||!BCARD||!BREP||ev.target.closest&&ev.target.closest('.sc-save'))return;if(BREP.pauseAt!=null){bPause(false);BCARD.tp=false}else{bPause(true);BCARD.tp=true}el.classList.toggle('hp',BREP.pauseAt!=null)});
  Array.prototype.forEach.call(el.querySelectorAll('[data-save]'),function(b){b.addEventListener('click',function(){bCardSave(b.getAttribute('data-save'),b)})})}
/** every frame: each animation of the card at tau (a seek shows it settled, a pause freezes it, the timer line included) */
function bCardDrive(tau){if(!BCARD)return;var prev=BCARD.tau;BCARD.tau=tau;var A=BCARD.anim;if(A)for(var i=0;i<A.length;i++){try{A[i].currentTime=Math.max(0,tau)}catch(e){}}
  if(BCARD.el){BCARD.el.classList.toggle('hp',!!BREP&&BREP.pauseAt!=null&&(BCARD.hp||BCARD.tp))}
  if(!reduce&&prev>=0&&prev<BCT.slam&&tau>=BCT.slam&&tau-prev<400)bCardThud()}
/** the slam (sound on only): a sine from 90 to 45 Hz in 160 ms, gain .4 */
function bCardThud(){try{if(typeof sound==='undefined'||!sound)return;AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(45,t+.16);g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.17);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.18)}catch(e){}}
/** the renderer calls this every frame of a replay (battleOver): the card for now, the 1.2 s floor on the hold at 2x */
function bCardTick(now){if(!BREP){bCardOff();return}if(!BREP.cards)BREP.cards=bCardPlan(BREP.R,reduce);var A=bCardAt(BREP.cards,now);
  var hold=A&&A.tau>=A.c.T.i&&A.tau<A.c.T.i+A.c.T.h,want=hold?bCardSpeed(BREP.sp,A.c.T):BREP.sp,cur=BREP.esp||BREP.sp;
  if(want!==cur&&BREP.pauseAt==null){BREP.vt=now;BREP.pt=performance.now();BREP.esp=want===BREP.sp?null:want}
  if(!A){bCardOff();return}
  if(!BCARD||BCARD.id!==A.c.id){if(A.tau>=A.c.T.i+A.c.T.h){bCardOff();return}bCardMount(A.c)}   /* never put a card up in its exit: Next took it away */
  bCardDrive(A.tau)}
/** the hit labels on the map clear as a card comes in (120 ms) */
function bCardClear(now){if(!BREP||!BREP.cards)return 1;var A=bCardAt(BREP.cards,now);if(!A||A.c.k!=='beat')return 1;return reduce?0:Math.max(0,1-A.tau/120)}
/** the hold camera on a short stage: the hit stays 48 px above the card's top edge; the camera eases up by what is missing over
 *  300 ms before the card comes in, and back over the first 300 ms of the next move. y, z: the auto camera's screen y and zoom */
function bCardLift(now,y,z){if(!BREP||!BREP.cards)return 0;var L=BREP.cards;for(var i=0;i<L.length;i++){var c=L[i];if(c.k!=='beat'||c.b.montage)continue;var a=c.c0-BCT.lift,ce=c.c0+c.T.i+c.T.h;if(now<a||now>ce+BCT.lift)continue;
    if(now<=ce){var size=bCardSize((typeof st!=="undefined"&&st&&st.clientWidth)||vw),top=null;if(BCARD&&BCARD.id===c.id&&BCARD.el&&typeof cv!=="undefined"&&cv&&cv.getBoundingClientRect){var r=BCARD.el.getBoundingClientRect();if(r.height>0)top=r.top-cv.getBoundingClientRect().top}
      if(top==null)top=vh-bCardBot(size)-(size==='l'?250:190)-(c.b.targets.length>1?36:0);var iy=y+c.b.lead.to.y*z;c.need=Math.min(0,top-BCT.gap-iy)}
    var need=c.need||0;if(!need)return 0;if(reduce)return now<=ce?need:0;var u=now<=ce?bEase((now-a)/BCT.lift):1-bEase((now-ce)/BCT.lift);return need*u}return 0}
/* ---- the saved picture: one function draws both sizes on a canvas (spec section 8). Names, never "you" */
var BCXL={p:{W:1080,H:1350,M:72,top:58,fy:410,y0:640,urlY:1264,urlW:420,urlH:54,url:28},s:{W:1080,H:1920,M:96,top:270,fy:650,y0:880,urlY:1506,urlW:480,urlH:64,url:32}};
function bcW(c,a){return a.reduce(function(s,p){return s+c.measureText(p[0]).width},0)}
function bcPartsC(c,a,x,y){a.forEach(function(p){c.fillStyle=BCCOL[p[1]]||'#F4F6FA';c.fillText(p[0],x,y);x+=c.measureText(p[0]).width});return x}
function bcClip(c,t,mw){if(c.measureText(t).width<=mw)return t;while(t.length>1&&c.measureText(t+'…').width>mw)t=t.slice(0,-1);return t+'…'}
/** draw the card on ctx. data: the model (V null) plus src (the map canvas or null) and fx, fy (the hit on it, in its px); layout: BCXL.p or .s */
function bCardDraw(ctx,data,L){var S=data,T=BCTONE[S.tone]||BCTONE.gold,W=L.W,H=L.H,M=L.M,A=W-2*M,y0=L.y0,c=ctx,SL='"Saira Extra Condensed","Barlow Condensed","Arial Narrow",sans-serif',BC='"Barlow Condensed","Arial Narrow",sans-serif',MO='"IBM Plex Mono",Menlo,monospace',UI='"IBM Plex Sans",Arial,sans-serif';
  c.save();c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle='#0E1014';c.fillRect(0,0,W,H);
  if(S.src&&S.src.width>0&&S.src.height>0){var sw=S.src.width,sh=S.src.height,k=Math.max(W/sw,H/sh),dw=sw*k,dh=sh*k,fx=S.fx==null?sw/2:S.fx,fy=S.fy==null?sh/2:S.fy,dx=Math.min(0,Math.max(W-dw,W/2-fx*k)),dy=Math.min(0,Math.max(H-dh,L.fy-fy*k));c.drawImage(S.src,dx,dy,dw,dh)}
  var g=c.createLinearGradient(0,0,0,L.top+190);g.addColorStop(0,'rgba(5,6,10,.72)');g.addColorStop(1,'rgba(5,6,10,0)');c.fillStyle=g;c.fillRect(0,0,W,L.top+190);
  g=c.createLinearGradient(0,y0-230,0,y0+40);g.addColorStop(0,'rgba(9,11,17,0)');g.addColorStop(1,'rgba(9,11,17,.93)');c.fillStyle=g;c.fillRect(0,y0-230,W,270);c.fillStyle='rgba(9,11,17,.93)';c.fillRect(0,y0+40,W,H-y0-40);
  c.fillStyle='#8B6CF6';c.beginPath();c.moveTo(M,L.top+38);c.lineTo(M+22,L.top+2);c.lineTo(M+44,L.top+38);c.closePath();c.fill();c.fillStyle='#F4F6FA';c.font='600 40px Georgia,serif';c.fillText('Caldera',M+58,L.top+36);
  c.font='600 24px '+MO;c.fillStyle='rgba(244,246,250,.8)';c.textAlign='right';c.fillText('BATTLE · '+S.date+', '+S.year,W-M,L.top+32);c.textAlign='left';
  c.fillStyle=BCCOL[S.ac]||'#FFC83D';c.fillRect(M,y0-26,A,6);
  var tail=S.tail||[],f1=92,fb=290,kk=1;c.font='900 '+f1+'px '+SL;var w1=bcW(c,S.l1),wt=bcW(c,tail);c.font='900 '+fb+'px '+SL;var wb=c.measureText(S.big).width;kk=Math.min(1,(A-50)/Math.max(w1,wb*1+(wt?26+wt*1:0)));f1*=kk;fb*=kk;
  c.save();c.translate(M,y0+330);c.transform(1,0,-.1405,1,0,0);
  c.font='900 '+f1+'px '+SL;c.shadowColor='rgba(0,0,0,.55)';c.shadowOffsetY=4;bcPartsC(c,S.l1,0,-fb*.76-18);c.shadowColor='transparent';c.shadowOffsetY=0;
  c.font='900 '+fb+'px '+SL;for(var e=12;e>=1;e--){c.fillStyle=e>7?T[2]:T[1];c.fillText(S.big,e*2,e)}c.fillStyle=T[0];c.fillText(S.big,0,0);var bw=c.measureText(S.big).width;
  c.font='900 '+f1+'px '+SL;c.shadowColor='rgba(0,0,0,.55)';c.shadowOffsetY=4;bcPartsC(c,tail,bw+26,-4);c.restore();
  var by=y0+372;if(S.bar){var lab=S.bar[0];c.font='600 26px '+BC;c.fillStyle='#58B4FF';lab=bcClip(c,lab,300);c.fillText(lab,M,by+19);var lx=M+c.measureText(lab).width+20;c.font='500 24px '+MO;var vw2=c.measureText(S.bar[3]).width,tw=W-M-vw2-20-lx;
    c.fillStyle='rgba(255,255,255,.14)';c.fillRect(lx,by,tw,20);c.fillStyle='#58B4FF';c.fillRect(lx,by,tw*S.bar[2]/100,20);c.fillStyle='#FFC83D';c.globalAlpha=.8;c.fillRect(lx+tw*S.bar[2]/100,by,tw*(S.bar[1]-S.bar[2])/100,20);c.globalAlpha=1;
    if(S.shield){c.strokeStyle='#3DF2FF';c.lineWidth=2.5;c.strokeRect(lx-3,by-3,tw+6,26)}c.fillStyle='rgba(9,11,17,.93)';for(var q=1;q<20;q++)c.fillRect(lx+tw*q/20-1.5,by,3,20);c.fillStyle='rgba(244,246,250,.8)';c.fillText(S.bar[3],W-M-vw2,by+19)}
  else if(S.rows){var rh=Math.min(28,60/S.rows.length);S.rows.forEach(function(r,i){var ry=y0+352+i*(rh+4);c.font='600 22px '+BC;c.fillStyle='#58B4FF';c.fillText(bcClip(c,r[0],220),M,ry+rh-6);c.font='500 21px '+MO;c.fillStyle='rgba(244,246,250,.8)';c.textAlign='right';c.fillText(r[3],W-M-130,ry+rh-6);c.fillStyle='#FFC83D';c.fillText(r[4],W-M,ry+rh-6);c.textAlign='left';
    var lx2=M+240,tw2=W-M-130-90-lx2;c.fillStyle='rgba(255,255,255,.14)';c.fillRect(lx2,ry+6,tw2,rh-12);c.fillStyle='#58B4FF';c.fillRect(lx2,ry+6,tw2*r[2]/100,rh-12);c.fillStyle='rgba(255,200,61,.8)';c.fillRect(lx2+tw2*r[2]/100,ry+6,tw2*Math.max(0,r[1]-r[2])/100,rh-12)})}
  else if(S.you){c.font='500 24px '+MO;c.fillStyle='#B9A6FF';c.fillText(S.you,M,by+19)}
  S.facts.forEach(function(f,i){var x=M+i*A/3;c.font='700 54px '+BC;c.fillStyle=f[0].charAt(0)==='−'?'#FFC83D':'#F4F6FA';c.fillText(bcClip(c,f[0],A/3-16),x,y0+462);c.font='500 24px '+UI;c.fillStyle='rgba(244,246,250,.72)';c.fillText(f[1],x,y0+496)});
  var sy=y0+520,shh=92;c.fillStyle='rgba(255,255,255,.07)';c.fillRect(M,sy,A,shh);c.font='600 22px '+BC;c.fillStyle='rgba(244,246,250,.72)';c.fillText('TOP',M+18,sy+40);c.fillText('ATTACKERS',M+18,sy+66);
  var cx0=M+150,cw=(A-150)/3;S.lb.forEach(function(r,i){var x=cx0+i*cw;c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x,sy+14,2,shh-28);c.font='900 56px '+SL;c.fillStyle=r&&r[2]==='cur'?(BCCOL[S.ac==='gold'?'atk':S.ac]||'#FF6A3D'):'rgba(244,246,250,.46)';c.fillText(String(i+1),x+16,sy+66);
    if(!r)return;c.font='600 32px '+BC;c.fillStyle='#F4F6FA';c.fillText(bcClip(c,r[0],cw-70),x+52,sy+42);c.font='600 23px '+MO;c.fillStyle='#FFC83D';c.fillText(r[1],x+52,sy+72)});
  var ux=(W-L.urlW)/2;c.fillStyle='rgba(61,242,255,.1)';c.fillRect(ux,L.urlY,L.urlW,L.urlH);c.strokeStyle='#3DF2FF';c.lineWidth=2.5;c.strokeRect(ux,L.urlY,L.urlW,L.urlH);c.font='600 '+L.url+'px '+MO;c.fillStyle='#3DF2FF';c.textAlign='center';c.fillText('caldera.social',W/2,L.urlY+L.urlH/2+L.url*.36);c.restore()}
/** the picture of the card showing (fmt p: 1080x1350 post, s: 1080x1920 story) as a PNG blob; a map frame that cannot be read
 *  (a tainted canvas) is left out rather than failing */
function bCardBlob(fmt,withMap){var C=BCARD;if(!C)return Promise.reject(new Error('no card'));var L=BCXL[fmt==='s'?'s':'p'],M=bCardModel(C.c,{R:BREP.R,P:BREP.P,S:BREP.R.S,V:null}),src=withMap===false||typeof cv==='undefined'?null:cv,fx=null,fy=null;
  if(src&&C.c.k==='beat'&&!C.c.b.montage&&C.c.b.lead&&C.c.b.lead.to){var d=typeof dpr==='number'?dpr:1;fx=(cam.x+C.c.b.lead.to.x*cam.z)*d;fy=(cam.y+C.c.b.lead.to.y*cam.z)*d}
  M.src=src;M.fx=fx;M.fy=fy;var x=document.createElement('canvas');x.width=L.W;x.height=L.H;bCardDraw(x.getContext('2d'),M,L);
  return new Promise(function(ok,no){try{x.toBlob(function(b){b?ok({blob:b,name:fmt==='s'?M.file.replace(/\.png$/,'-story.png'):M.file}):no(new Error('empty'))},'image/png')}catch(e){if(src&&withMap!==false)bCardBlob(fmt,false).then(ok,no);else no(e)}})}
/** Save: the replay pauses and the card stays; "Saving..."; the share sheet on a phone or tablet that can share files, else a
 *  download; "Saved" for 1.2 s, then the replay goes on. On a failure "Could not save. Try again." for 2 s */
function bCardSave(fmt,btn){if(!BCARD||!BREP||BCSAVE)return Promise.resolve(false);var lab=btn&&btn.querySelector('span'),was=lab?lab.textContent:'',set=function(t){if(lab)lab.textContent=t};
  var mine=BREP.pauseAt==null;if(mine)bPause(true);BCSAVE=1;set('Saving…');if(btn)btn.disabled=true;bCardFonts();
  var done=function(ok,keep){set(ok?'Saved':'Could not save. Try again.');setTimeout(function(){set(was);if(btn)btn.disabled=false;BCSAVE=0;if(mine&&BREP&&BREP.pauseAt!=null&&!(BCARD&&(BCARD.hp||BCARD.tp)))bPause(false)},ok?1200:2000);return ok};
  return bCardBlob(fmt).then(function(r){var file=null;try{file=new File([r.blob],r.name,{type:'image/png'})}catch(e){}
    var coarse=false;try{coarse=matchMedia('(pointer: coarse)').matches}catch(e){}
    if(file&&coarse&&navigator.canShare&&navigator.share&&navigator.canShare({files:[file]}))return navigator.share({files:[file]}).then(function(){return done(true)},function(e){if(e&&e.name==='AbortError'){set(was);if(btn)btn.disabled=false;BCSAVE=0;if(mine&&BREP&&BREP.pauseAt!=null)bPause(false);return false}return done(false)});
    var a=document.createElement('a'),u=URL.createObjectURL(r.blob);a.href=u;a.download=r.name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);window.CALDERA_CARD_SAVED=r.name;return done(true)}).catch(function(){return done(false)})}
(function(){var A=window.CALDERA_BATTLE_API;if(!A)return;
  /** the signed-in viewer's handle: their own cities read YOU and YOUR on screen (never in a saved picture) */
  A.viewer=function(h){BCV=h?'@'+String(h).replace(/^@/,''):null;return BCV};
  /** the card showing now (for the page and tests): its state, model, and how far in */
  A.card=function(){return BCARD?{id:BCARD.id,kind:BCARD.c.k,state:BCARD.m.state,tau:BCARD.tau,m:BCARD.m}:null};
  A.cards=function(){return BREP?(BREP.cards||(BREP.cards=bCardPlan(BREP.R,reduce))).map(function(c){return {k:c.k,c0:c.c0,len:c.T.len,hold:c.T.h}}):null};
  A.cardSave=function(fmt){return BCARD?bCardSave(fmt||'p',BCARD.el&&BCARD.el.querySelector('[data-save="'+(fmt||'p')+'"]')):Promise.resolve(false)};
  A.cardBlob=function(fmt){return bCardBlob(fmt||'p')}})();
`;
