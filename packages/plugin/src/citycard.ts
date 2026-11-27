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
 * BATTLE.md (Fable 11-24, Mike: "label panel" in the way): the plate is gone. The same words now sit in the top corner as a strike
 * callout with no box (a soft shade only), from the first impact to the 11-20 exit time; a fly line names who fires while the
 * missiles fly; money counts with the landed missiles; a rank chip (NOW 1ST to 3RD). The saved pictures do not change.
 * Runs inside the CITY_JS closure after BATTLE_LOGIC_JS (BREP, BRT, BFL, bNow, bPause, bUsd, BBLD, bImpactOf, BCLS, cam, vw,
 * vh, dpr, reduce, cv, st, sound, AC). Only block comments in here, no non-ASCII characters (escapes instead).
 */
export const STRIKE_CARD_JS = String.raw`
/* ---- the strike card (citycard.ts STRIKE_CARD_JS). Times in ms at 1x on the replay clock (spec section 7) */
var BCT={enter:BRT.cardIn,exit:200,hold:BRT.card,last:3000,rmIn:BRT.cardInRm,rmHold:BRT.cardRm,rmOut:150,still:1120,floor:12e2,lift:300,gap:48,slam:200},BCV=null,BCARD=null,BCSAVE=0;
var BCTONE={gold:['#FFC83D','#B07A0E','#5E3F04'],cyan:['#3DF2FF','#1596A3','#0A4B53'],grey:['#C9CEDA','#5B6170','#2A2E38'],red:['#FF4D5E','#A3202E','#560D16'],atk:['#FF6A3D','#B23E1B','#5F1F0B'],you:['#B9A6FF','#4B36A8','#2A1D66']};
var BCCOL={atk:'#FF6A3D',def:'#58B4FF',you:'#8B6CF6',raid:'#F2F2F5',gold:'#FFC83D',grey:'rgba(244,246,250,.46)'};
var BCMON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],BCSIZE=['S','M','L','XL'];
/** a card's phases: in (enter or fade in), h (the hold), o (exit), len. kind: beat, fall, last; rm: reduced motion */
function bCardTimes(kind,rm){var h=rm?BCT.rmHold:kind==='last'?BCT.last:BCT.hold,i=rm?BCT.rmIn:BCT.enter,o=rm?BCT.rmOut:BCT.exit;return {i:i,h:h,o:o,len:i+h+o}}
/** what one beat adds to the replay for its card: the hold (the enter sits inside the last 500 ms of the hold on the hit) */
function bCardAdd(rm){return rm?BCT.rmHold:BCT.hold}
/** the clock rate while a card holds: never shorter than 1.2 s of real time (2x would make it 1 s) */
function bCardSpeed(sp,T){var cap=(T?T.h:BCT.hold)/BCT.floor;return Math.min(sp,cap)}
/** every card of a replay: one per beat (citybattle.ts puts c0 on the beat), the fall, and the last card in the wide shot.
 *  BATTLE.md U4/U5 (Fable 11-24): a beat's callout shows from its first impact (s0; at the settle with reduced motion) to the
 *  same exit as the 11-20 card (x1 = c0 + T.len); its fly line from the launch (f0) to the first impact (f1); the settle is the
 *  last impact. The hold (c0 + T.i to c0 + T.i + T.h) and the 1.2 s floor do not change */
function bCardPlan(R,rm){var L=[],S=R.S;R.beats.forEach(function(b){if(b.c0==null)return;var lo=1e18,hi=-1e18;b.shots.forEach(function(s){var t=bImpactOf(S,s);if(t<lo)lo=t;if(t>hi)hi=t});
    var T=bCardTimes('beat',rm),cap=b.c0+T.i;if(!(lo<1e18)){lo=hi=b.c0}hi=Math.min(hi,cap);lo=Math.min(lo,hi);L.push({k:'beat',b:b,c0:b.c0,T:T,f0:b.launch<lo?b.launch:null,f1:lo,hit0:lo,settle:hi})});
  if(R.F&&S.zf0!=null){var T2=bCardTimes('fall',rm);L.push({k:'fall',c0:rm?S.zf0+BFL.hit:S.wide-T2.len,T:T2})}
  var T3=bCardTimes('last',rm),pe=L.length?L[L.length-1].c0+L[L.length-1].T.len:0;L.push({k:'last',c0:Math.max(S.wide,pe),T:T3});
  L.forEach(function(c,i){c.id=i;c.x1=c.c0+c.T.len;if(c.settle==null){c.hit0=c.settle=c.c0;c.f0=null}c.s0=rm?c.settle:c.hit0});return L}
/** the card showing at now and how far into it (tau): the callout {c,tau} from s0, or its fly line {c,tau,fly:true} from f0; null between */
function bCardAt(L,now){if(!L)return null;for(var i=0;i<L.length;i++){var c=L[i];if(now>=c.s0&&now<c.x1)return {c:c,tau:now-c.s0,fly:false};if(c.f0!=null&&now>=c.f0&&now<c.f1)return {c:c,tau:now-c.f0,fly:true}}return null}
/** the money a beat's missiles have landed by now (U4: the number counts with the missiles, never ahead of the map) */
function bCardLive(c,now){var u=0;if(!c||!c.b)return 0;c.b.shots.forEach(function(s){if(bImpactOf(BREP?BREP.R.S:{live:false},s)<=now)u+=bCardUsd(s)});return u}
/** a callout whose big value is money counts up; a word or a percent waits for the settle */
function bcMoney(M){return M.kind==='beat'&&(M.state==='small'||M.state==='multi'||M.state==='montage')}
/** U6: the rank chip after the settle: NOW 1ST, 2ND, 3RD; none for rank 4 and lower, a shield, a miss, a montage, the fall or last card */
function bcRank(M){var r=M.rank;if(M.kind!=='beat'||!(r>=1&&r<=3)||/^(shield|miss|montage)$/.test(M.state))return '';return 'NOW '+r+['ST','ND','RD'][r-1]}
/** U5: the fly line, from the launch to the first impact. b: a beat, V: the viewer (YOU) or null */
function bFlyModel(b,V){var n=b.n||b.shots.length;if(b.montage){var k0=b.cities||1;return {l1:[[k0+' MORE CIT'+(k0===1?'Y FIRES':'IES FIRE')]],sub:'',subS:''}}
  var A=b.a,D=b.targets[0],k=b.targets.length-1,dn=V&&D===V?'YOUR CITY':bcName(D,null);
  return {l1:[[bcName(A,V),bcCls(A,V,'atk')],[' '+bcVerb(A,V,'FIRE')+' '+n+' MISSILE'+(n===1?'':'S')]],sub:'at '+dn+(k===1?' and 1 more city':k>1?' and '+k+' more cities':''),subS:'at '+dn+(k>0?' +'+k:'')}}
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
/** Mike 11-20: a member in the strip links to their Caldera profile with their avatar (window.CALDERA_PEOPLE from the hub:
 *  handle -> avatar path or ""; no entry = not a member). Raiders and non-members stay plain. */
function bcLink(h){if(!h||h.charAt(0)!=='@'||bcRaid(h))return null;var P=typeof window!=='undefined'&&window.CALDERA_PEOPLE||null;if(P&&!Object.prototype.hasOwnProperty.call(P,h))return null;
  var web=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&location.origin!=='null',base=web?'':'https://caldera.social',av=P&&P[h]?String(P[h]):'';
  return {href:base+'/'+encodeURIComponent(h).replace('%40','@')+'/',av:av&&/^\/[\w@%./-]+$/.test(av)?base+av:''}}
function bcAv(h,av){return '<span aria-hidden="true" class="av'+(av?' p" style="background-image:url(&quot;'+bcE(av)+'&quot;)"':'"')+'>'+bcE(h.charAt(1).toUpperCase())+'</span>'}   /* the initial when there is no photo; a grey circle if a photo fails */
function bcStrip(L,cur,up,V){var o=[];for(var i=0;i<3;i++){var r=L[i];o.push(r?[bcRaid(r.a)?'SEA RAIDERS':r.a.slice(1).toUpperCase(),bUsd(r.usd),r.a===cur?'cur':V&&r.a===V?'me':'',r.a===cur&&up>0?up:0,r.a]:null)}return o}
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
    var L1=bCardRanks(R.beats,b.i),L0=b.i>0?bCardRanks(R.beats,b.i-1):[],r1=bCardRankOf(L1,A),r0=bCardRankOf(L0,A),cur=b.montage?null:A;M.rank=r1;M.lb=bcStrip(L1,cur,r0&&r1&&r0>r1?r0-r1:0,V);
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
var BCCSS='.bcall{position:absolute;z-index:6;left:16px;top:14px;max-width:calc(100% - 200px);pointer-events:none;--f1:34px;--fb:76px;--ft:30px;--fact:12.5px;--tl:190px;--tc:#FFC83D;--e1:#B07A0E;--e2:#5E3F04;--ac:#FF6A3D;--ink:#F4F6FA;--ink2:rgba(244,246,250,.86);--cyan:#3DF2FF;--you:#B9A6FF;--atk:#FF6A3D;--def:#58B4FF;--gold:#FFC83D;--raid:#F2F2F5;--slam:"Saira Extra Condensed","Barlow Condensed","Arial Narrow",Arial,sans-serif;--disp:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--ui:"IBM Plex Sans",-apple-system,"Segoe UI",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-family:var(--ui);color:var(--ink);box-sizing:border-box;-webkit-user-select:none;user-select:none}'
 +'.bcall *{box-sizing:border-box}.bcall.sz-m{left:14px;--f1:26px;--fb:54px;--ft:22px;--fact:12px;--tl:140px}.bcall.sz-s{left:12px;top:12px;right:12px;max-width:none;--f1:20px;--fb:42px;--ft:18px;--fact:11.5px;--tl:110px}'
 /* a soft shade under the text only: a corner on wide stages, a thin top fade on small panes. No plate */
 +'.bcall::before{content:"";position:absolute;z-index:-1;left:-16px;top:-14px;width:calc(100% + 190px);height:calc(100% + 80px);background:radial-gradient(ellipse farthest-side at 0 0,rgba(8,9,14,.84),rgba(8,9,14,.52) 48%,rgba(8,9,14,0) 100%);pointer-events:none}'
 +'.bcall.sz-s::before{left:-12px;top:-12px;width:calc(100% + 24px);height:calc(100% + 34px);background:linear-gradient(180deg,rgba(8,9,14,.8),rgba(8,9,14,.5) 60%,rgba(8,9,14,0))}'
 +'.bcall .bc-head{font-family:var(--slam);font-weight:900;text-transform:uppercase;letter-spacing:.01em;white-space:nowrap;transform:skewX(-8deg);transform-origin:0 100%}'
 +'.bcall .bc-l1{font-size:calc(var(--f1)*var(--k,1));line-height:1;text-shadow:0 2px 0 rgba(0,0,0,.7),0 0 6px rgba(8,9,14,.9);overflow:hidden;text-overflow:ellipsis}'
 +'.bcall .bc-l2{display:flex;align-items:flex-end;gap:.26em;margin-top:3px;font-size:calc(var(--ft)*var(--k,1));line-height:.95}'
 +'.bcall .bc-big{display:inline-block;font-size:calc(var(--fb)*var(--k,1));line-height:.84;color:var(--tc);transform-origin:0 100%;font-variant-numeric:tabular-nums;text-shadow:.016em .008em 0 var(--e1),.032em .016em 0 var(--e1),.048em .024em 0 var(--e1),.064em .032em 0 var(--e2),.08em .04em 0 var(--e2),.12em .075em .05em rgba(0,0,0,.6)}'
 +'.bcall .bc-tail{padding-bottom:.08em;text-shadow:0 2px 0 rgba(0,0,0,.7),0 0 6px rgba(8,9,14,.9);overflow:hidden;text-overflow:ellipsis}'
 +'.bcall .bc-rank{align-self:center;margin-left:.3em;padding:.2em .42em .16em;background:var(--gold);color:#0B0D13;font:700 calc(var(--ft)*.52)/1 var(--disp);letter-spacing:.1em}'
 +'.bcall b{font-weight:inherit}.bcall .atk{color:var(--atk)}.bcall .def{color:var(--def)}.bcall .you{color:var(--you)}.bcall .raid{color:var(--raid)}.bcall .gold{color:var(--gold)}'
 +'.bcall.sz-s .bc-l1,.bcall.sz-s .bc-l2{max-width:calc(100% - var(--tools,140px))}'
 +'.bcall .bc-timer{height:3px;width:var(--tl);margin-top:7px;background:var(--ac);transform-origin:0 50%}'
 +'.bcall .bc-row{display:flex;align-items:center;gap:10px;margin-top:7px;min-width:0}'
 +'.bcall .bc-facts,.bcall .bc-cities,.bcall .bc-sub{min-width:0;font:500 var(--fact)/1.35 var(--mono);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 rgba(0,0,0,.8),0 0 5px rgba(8,9,14,.95)}'
 +'.bcall .bc-facts b{color:#fff;font-weight:600}.bcall .bc-cities{margin-top:2px}.bcall .bc-cities b{color:var(--def);font:600 calc(var(--fact) + .5px)/1 var(--disp);letter-spacing:.1em}.bcall .bc-cities b.you{color:var(--you)}.bcall .bc-cities i{font-style:normal;color:var(--gold)}'
 +'.bcall.sz-s .bc-cities{display:none}.bcall.sz-s .bc-row{justify-content:space-between}'
 +'.bcall .bc-save{pointer-events:auto;position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px 0 8px;border-radius:8px;border:1px solid rgba(255,255,255,.34);background:rgba(11,13,19,.72);color:var(--ink);font:600 12px/1 var(--ui);white-space:nowrap;cursor:pointer}'
 +'.bcall .bc-save::after{content:"";position:absolute;inset:-8px}.bcall .bc-save svg{width:14px;height:14px;flex:none}.bcall .bc-save:hover{background:var(--ink);color:#0B0D13;border-color:var(--ink)}.bcall .bc-save:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}.bcall .bc-save[disabled]{cursor:default}.bcall.sz-s .bc-save{height:32px}'
 +'.bcall .sc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}'
 /* the quiet line while the missiles fly */
 +'.bcall.in{--f1:26px}.bcall.in.sz-m{--f1:22px}.bcall.in.sz-s{--f1:18px}.bcall.in::before{opacity:.8}.bcall .bc-sub{margin-top:4px}.bcall.in.sz-s .bc-sub{max-width:calc(100% - var(--tools,140px))}'
 /* motion: one timeline from the first impact; paused here and driven from the replay clock (bCardDrive). --l2: the big value's
  * slam (100 ms for money, the settle for a word or a percent), --settle: the last impact, --hold: the timer, --xo: the exit */
 +'.bcall.go{animation:scOut 200ms cubic-bezier(.4,0,1,1) var(--xo,2500ms) forwards}'
 +'.bcall.go .bc-l1{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) both}.bcall.go .bc-big{animation:scSlam 220ms cubic-bezier(.2,.9,.3,1) var(--l2,100ms) both}.bcall.go .bc-tail{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) calc(var(--l2,100ms) + 100ms) both}'
 +'.bcall.go .bc-rank{animation:scPop 200ms cubic-bezier(.2,.9,.3,1) var(--settle,0ms) both}.bcall.go .bc-row,.bcall.go .bc-cities{animation:scFade 160ms ease-out var(--settle,0ms) both}.bcall.go .bc-timer{animation:scTimer var(--hold,2000ms) linear var(--settle,0ms) both}'
 +'.bcall.go.in{animation:scFade 150ms ease-out both,scFadeOut 150ms linear var(--xo,1000ms) forwards}.bcall.go.in .bc-l1{animation:none}'
 +'.bcall.drv,.bcall.drv *{animation-play-state:paused!important}'
 +'@keyframes scTimer{from{transform:scaleX(1)}to{transform:scaleX(0)}}@keyframes scSlide{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}@keyframes scSlam{0%{opacity:0;transform:scale(2.6)}55%{opacity:1;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}'
 +'@keyframes scPop{from{opacity:0;transform:scale(1.5)}to{opacity:1;transform:none}}@keyframes scOut{to{opacity:0;transform:translateY(-6px)}}'
 +'@keyframes scFade{from{opacity:0}to{opacity:1}}@keyframes scFadeOut{to{opacity:0}}@keyframes scShake{0%{transform:translateX(0)}25%{transform:translateX(4px)}60%{transform:translateX(-3px)}100%{transform:translateX(0)}}@keyframes scRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes scRank{0%{background:rgba(255,106,61,.5)}100%{background:transparent}}'
 /* reduced motion: one fade in at the settle with the final values, the still hold, one fade out; no slam, slide, count or pop */
 +'.bcall.go.rm{animation:scFade 150ms linear both,scFadeOut 150ms linear var(--xo,2750ms) forwards}.bcall.go.rm *{animation:none!important}.bcall.go.rm .bc-timer{animation:scTimer var(--hold,2600ms) linear 150ms both!important}';
var BCICO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
function bcE(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function bcParts(a){return (a||[]).map(function(p){return p[1]?'<b class="'+p[1]+'">'+bcE(p[0])+'</b>':bcE(p[0])}).join('')}
function bcTrack(f,t){f=Math.max(0,Math.min(100,f));t=Math.max(0,Math.min(f,t));return '<div class="track"><i class="left" style="width:'+t+'%"></i><i class="lost" style="left:'+t+'%;width:'+(f-t)+'%"></i></div>'}
/** can this page save a file? hosted city pages are sandboxed (an opaque origin): no downloads there, so no Save button */
function bCardCanSave(){try{if(typeof window==='undefined'||!window.document||!document.createElement)return false;if(window.origin==='null'||(typeof location!=='undefined'&&location.origin==='null'))return false;void window.localStorage;return typeof HTMLCanvasElement!=='undefined'&&!!HTMLCanvasElement.prototype.toBlob}catch(e){return false}}
/** the size class from the stage width (DESIGN.md): L 1100 and up, M 600 to 1099, S under 600 */
function bCardSize(w){return w>=1100?'l':w>=600?'m':'s'}
/** U1: the city line of the callout (section 4): the cities of a multi strike with their damage, else the bar's line, else the
 *  viewer's own line. Parts [name or '', cls, value]; bcCityLine is the plain text */
function bcCityParts(M){if(M.rows){var P=M.rows.map(function(r){return [r[0],/^YOUR /.test(r[0])?'you':'',r[3]==='held'?'held':'\u2212'+r[4]]});if(M.more)P.push(['','',M.more]);return P}
  if(M.bar)return [[M.bar[0],/^YOUR /.test(M.bar[0])?'you':'',M.bar[3],1]];if(M.you)return [['','',M.you]];return []}
function bcCityLine(M){return bcCityParts(M).map(function(p){return p[0]?p[0]+(p[3]?' \u00b7 ':' ')+p[2]:p[2]}).join(' \u00b7 ')}
/** U1: the callout on the stage: the hidden sentence, the headline, the big value with its tail and rank chip, the timer line, the
 *  facts with Save, the city line. No plate. size: l, m or s (short fact words on s); save: the page can save a file */
function bCardHTML(M,size,save){var T=BCTONE[M.tone]||BCTONE.gold,ac=BCCOL[M.ac]||BCCOL.atk,big=M.bigYou?'<b class="you">'+bcE(M.big)+'</b>':bcE(M.big),rk=bcRank(M);
  var btn=function(f,l,al){return '<button class="bc-save" type="button" data-save="'+f+'" aria-label="'+al+'">'+BCICO+'<span>'+l+'</span></button>'};
  var btns=!save?'':M.kind==='last'?btn('p','Save post','Save this card as a post picture')+btn('s','Save story','Save this card as a story picture'):btn('p','Save','Save a picture of this strike');
  var cl=bcCityParts(M).map(function(p){return p[0]?'<b'+(p[1]?' class="'+p[1]+'"':'')+'>'+bcE(p[0])+'</b>'+(p[3]?' \u00b7 ':' ')+(p[2].charAt(0)==='\u2212'?'<i>'+bcE(p[2])+'</i>':bcE(p[2])):bcE(p[2])}).join(' \u00b7 ');
  var h='<span class="sc-sr">'+bcE(M.say)+'</span><div class="bc-head" aria-hidden="true"><div class="bc-l1">'+bcParts(M.l1)+'</div><div class="bc-l2"><span class="bc-big">'+big+'</span>'
   +(M.tail&&M.tail.length?'<span class="bc-tail">'+bcParts(M.tail)+'</span>':'')+(rk?'<span class="bc-rank">'+rk+'</span>':'')+'</div></div><div class="bc-timer" aria-hidden="true"></div>'
   +'<div class="bc-row"><span class="bc-facts" aria-hidden="true">'+(M.facts||[]).map(function(f){return '<b>'+bcE(f[0])+'</b> '+bcE(size==='s'&&f[2]||f[1])}).join(' \u00b7 ')+'</span>'+btns+'</div>'
   +(cl?'<div class="bc-cities" aria-hidden="true">'+cl+'</div>':'');
  return {html:h,vars:'--tc:'+T[0]+';--e1:'+T[1]+';--e2:'+T[2]+';--ac:'+ac}}
/** U5: the fly line: one headline and one mono line (the short one on a small pane); not read by a screen reader */
function bFlyHTML(F,size){var sub=size==='s'?F.subS:F.sub;return '<div class="bc-head"><div class="bc-l1">'+bcParts(F.l1)+'</div></div>'+(sub?'<div class="bc-sub">'+bcE(sub)+'</div>':'')}
/** the 11-20 card sat over the bottom of the map; the callout is in the top corner, so nothing needs room at the bottom */
function bCardBot(size){return 0}
/** the long-name rule: shrink line 1, the big number and the tail together in 5% steps down to 70%, then cut with an ellipsis */
function bCardFit(el){var hd=el.querySelector('.bc-head');if(!hd)return;var k=1;hd.style.setProperty('--k','1');var tight=function(){var l1=hd.querySelector('.bc-l1'),l2=hd.querySelector('.bc-l2');return l1&&l1.scrollWidth>l1.clientWidth+1||l2&&l2.scrollWidth>l2.clientWidth+1};while(tight()&&k>.7){k-=.05;hd.style.setProperty('--k',k.toFixed(2))}}
function bCardFonts(){try{if(document.fonts&&document.fonts.load){['900 80px "Saira Extra Condensed"','600 16px "Barlow Condensed"','700 54px "Barlow Condensed"','500 15px "IBM Plex Mono"','600 24px "IBM Plex Mono"','500 24px "IBM Plex Sans"'].forEach(function(f){document.fonts.load(f).catch(function(){})})}}catch(e){}}
function bCardCss(){try{if(document.getElementById('bcard-css'))return;var s=document.createElement('style');s.id='bcard-css';s.textContent=BCCSS+BLCSS;(document.head||document.documentElement).appendChild(s)}catch(e){}}
function bcMs(v){return Math.max(0,Math.round(v))+'ms'}
/** the callout (or with fly, the fly line) for c goes up: the model (the viewer sees YOU), the DOM, the size, the fit; animations
 *  paused for the clock to drive. Times are ms from the first impact (the fly line: from the launch) */
function bCardMount(c,fly){bCardOff();var X={R:BREP.R,P:BREP.P,S:BREP.R.S,V:BCV},M=fly?bFlyModel(c.b,BCV):bCardModel(c,X),sT=c.settle-c.s0,live=!fly&&!reduce&&bcMoney(M),l2=live?100:sT;
  BCARD={id:c.id,fly:!!fly,c:c,m:M,el:null,anim:null,tau:-1,live:live,big:null,slam:l2+120};
  if(typeof st==='undefined'||!st||!st.appendChild||typeof document==='undefined'||!document.createElement)return;
  try{bCardCss();bCardFonts();var size=bCardSize(st.clientWidth||vw),el=document.createElement('div');
    if(fly){el.className='bcall go in sz-'+size+(reduce?' rm':'');el.setAttribute('aria-hidden','true');el.setAttribute('data-card','fly');el.style.cssText='--xo:'+bcMs(c.f1-c.f0-150);el.innerHTML=bFlyHTML(M,size)}
    else{var H=bCardHTML(M,size,bCardCanSave()),xo=c.c0+c.T.i+c.T.h-c.s0;el.className='bcall go sz-'+size+(reduce?' rm':'')+(M.shield?' shield':'');el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('data-card',M.state);
      el.style.cssText=H.vars+';--settle:'+bcMs(sT)+';--l2:'+bcMs(l2)+';--xo:'+bcMs(xo)+';--hold:'+bcMs(reduce?xo-150:xo-sT);el.innerHTML=H.html}
    st.appendChild(el);BCARD.el=el;
    if(size==='s'){var tl=st.querySelector&&st.querySelector('.c-tools'),tw=tl&&tl.offsetWidth?tl.offsetWidth+8:0;if(tw)el.style.setProperty('--tools',tw+'px')}
    bCardFit(el);if(el.getAnimations){el.classList.add('drv');void el.offsetWidth;BCARD.anim=el.getAnimations({subtree:true})}
    if(!fly)document.documentElement.classList.add('w-card');bCardWire(el)}catch(e){}}
function bCardOff(){if(!BCARD)return;var el=BCARD.el;BCARD=null;if(el&&el.parentNode)el.parentNode.removeChild(el);try{document.documentElement.classList.remove('w-card')}catch(e){}}
/** U1: the text takes no pointer: the map drags and zooms under it, no pause on hover or tap. Only Save stops the pointer */
function bCardWire(el){var stop=function(ev){ev.stopPropagation()};Array.prototype.forEach.call(el.querySelectorAll('[data-save]'),function(b){['pointerdown','mousedown','touchstart','click','dblclick'].forEach(function(k){b.addEventListener(k,stop,k==='touchstart'?{passive:true}:false)});
    b.addEventListener('click',function(){bCardSave(b.getAttribute('data-save'),b)})})}
/** every frame: each animation of the callout at tau (a seek shows it settled, a pause freezes it, the timer line included) */
function bCardDrive(tau){if(!BCARD)return;var prev=BCARD.tau;BCARD.tau=tau;var A=BCARD.anim;if(A)for(var i=0;i<A.length;i++){try{A[i].currentTime=Math.max(0,tau)}catch(e){}}
  if(!reduce&&!BCARD.fly&&prev>=0&&prev<BCARD.slam&&tau>=BCARD.slam&&tau-prev<400)bCardThud()}
/** the slam (sound on only): a sine from 90 to 45 Hz in 160 ms, gain .4 */
function bCardThud(){try{if(typeof sound==='undefined'||!sound)return;AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(45,t+.16);g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.17);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.18)}catch(e){}}
/** U4: the big money value: the landed sum of this strike at now; the DOM text changes only when the words change */
function bCardBigNow(now){if(!BCARD||!BCARD.live)return null;var t=bUsd(bCardLive(BCARD.c,now));if(t!==BCARD.big){BCARD.big=t;try{var b=BCARD.el&&BCARD.el.querySelector('.bc-big');if(b)b.textContent=t}catch(e){}}return t}
/** the renderer calls this every frame of a replay (battleOver): the callout or fly line for now, the 1.2 s floor on the hold at 2x */
function bCardTick(now){if(!BREP){bCardOff();return}if(!BREP.cards)BREP.cards=bCardPlan(BREP.R,reduce);var A=bCardAt(BREP.cards,now);
  var h0=A&&!A.fly?A.c.c0+A.c.T.i:0,hold=A&&!A.fly&&now>=h0&&now<h0+A.c.T.h,want=hold?bCardSpeed(BREP.sp,A.c.T):BREP.sp,cur=BREP.esp||BREP.sp;
  if(want!==cur&&BREP.pauseAt==null){BREP.vt=now;BREP.pt=performance.now();BREP.esp=want===BREP.sp?null:want}
  if(!A){bCardOff();return}
  if(!BCARD||BCARD.id!==A.c.id||BCARD.fly!==A.fly){if(!A.fly&&now>=A.c.c0+A.c.T.i+A.c.T.h){bCardOff();return}bCardMount(A.c,A.fly)}   /* never put a callout up in its exit: Next took it away */
  bCardBigNow(now);bCardDrive(A.tau)}
/** the hit labels on the map clear as a callout comes in (120 ms) */
function bCardClear(now){if(!BREP||!BREP.cards)return 1;var A=bCardAt(BREP.cards,now);if(!A||A.fly||A.c.k!=='beat')return 1;return reduce?0:Math.max(0,1-A.tau/120)}
/** U1: the camera no longer lifts the hit: the callout sits in the top corner, clear of it */
function bCardLift(now,y,z){return 0}
/** U8: the strike that landed last at now (the callout showing, else the latest card whose callout started): Save works while
 *  paused and after the callout left */
function bCardPick(now){if(BCARD&&!BCARD.fly)return BCARD.c;if(!BREP)return null;var L=BREP.cards||(BREP.cards=bCardPlan(BREP.R,reduce)),t=now==null?bNow():now,p=null;for(var i=0;i<L.length;i++)if(L[i].s0<=t)p=L[i];return p}
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
function bCardBlob(fmt,withMap){var C={c:BREP?bCardPick():null};if(!C.c)return Promise.reject(new Error('no card'));var L=BCXL[fmt==='s'?'s':'p'],M=bCardModel(C.c,{R:BREP.R,P:BREP.P,S:BREP.R.S,V:null}),src=withMap===false||typeof cv==='undefined'?null:cv,fx=null,fy=null;
  if(src&&C.c.k==='beat'&&!C.c.b.montage&&C.c.b.lead&&C.c.b.lead.to){var d=typeof dpr==='number'?dpr:1;fx=(cam.x+C.c.b.lead.to.x*cam.z)*d;fy=(cam.y+C.c.b.lead.to.y*cam.z)*d}
  M.src=src;M.fx=fx;M.fy=fy;var x=document.createElement('canvas');x.width=L.W;x.height=L.H;bCardDraw(x.getContext('2d'),M,L);
  return new Promise(function(ok,no){try{x.toBlob(function(b){b?ok({blob:b,name:fmt==='s'?M.file.replace(/\.png$/,'-story.png'):M.file}):no(new Error('empty'))},'image/png')}catch(e){if(src&&withMap!==false)bCardBlob(fmt,false).then(ok,no);else no(e)}})}
/** Save: the replay pauses and the card stays; "Saving..."; the share sheet on a phone or tablet that can share files, else a
 *  download; "Saved" for 1.2 s, then the replay goes on. On a failure "Could not save. Try again." for 2 s */
function bCardSave(fmt,btn){if(!BREP||BCSAVE||!bCardPick())return Promise.resolve(false);var lab=btn&&btn.querySelector('span'),was=lab?lab.textContent:'',set=function(t){if(lab)lab.textContent=t};
  var mine=BREP.pauseAt==null;if(mine)bPause(true);BCSAVE=1;set('Saving…');bcTr('strikecard_share_tap',{kind:bcKind(fmt)});if(btn)btn.disabled=true;bCardFonts();
  var done=function(ok,keep){set(ok?'Saved':'Could not save. Try again.');setTimeout(function(){set(was);if(btn)btn.disabled=false;BCSAVE=0;if(mine&&BREP&&BREP.pauseAt!=null)bPause(false)},ok?1200:2000);return ok};
  return bCardBlob(fmt).then(function(r){return bcDeliver(r.blob,r.name)}).then(function(k){if(k==='abort'){bcTr('strikecard_share_done',{ok:false,err:'AbortError'});set(was);if(btn)btn.disabled=false;BCSAVE=0;if(mine&&BREP&&BREP.pauseAt!=null)bPause(false);return false}bcTr('strikecard_share_done',{ok:true,via:k});return done(true)},function(e){bcTr('strikecard_share_done',{ok:false,err:bcErr(e)});return done(false)})}
/** ES session tracer events for the share funnel (MB order 11-21): no-op when the page has no tracer (Obsidian, city pages) */
function bcTr(n,p){try{if(typeof window!=='undefined'&&typeof window.esTrace==='function')window.esTrace(n,p||{})}catch(e){}}
/** what a Save tap will do: the share sheet, a download, or the 4:5 post download */
function bcKind(fmt){if(fmt==='p')return 'post45';var c=false;try{c=matchMedia('(pointer: coarse)').matches&&!!navigator.share&&!!navigator.canShare}catch(e){}return c?'share':'save'}
function bcErr(e){return String(e&&e.name||'Error').slice(0,40)}
/** the last step of a save, shared by the strike card and the leaderboard: the share sheet with the file on a phone or tablet
 *  that can share files (files only: some apps drop the picture when text comes with it), else a download. Resolves 'share',
 *  'save' or 'abort' (the person closed the sheet); rejects on a failure */
function bcDeliver(blob,name){var file=null;try{file=new File([blob],name,{type:'image/png'})}catch(e){}
  var coarse=false;try{coarse=matchMedia('(pointer: coarse)').matches}catch(e){}
  if(file&&coarse&&navigator.canShare&&navigator.share&&navigator.canShare({files:[file]}))return navigator.share({files:[file]}).then(function(){return 'share'},function(e){if(e&&e.name==='AbortError')return 'abort';throw e});
  var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);window.CALDERA_CARD_SAVED=name;return Promise.resolve('save')}
/** will a save open the share sheet? (a phone or tablet that can share an image file; tested with an empty a.png) */
function bcCanShare(){try{if(!matchMedia('(pointer: coarse)').matches)return false;var f=new File([],'a.png',{type:'image/png'});return !!(navigator.canShare&&navigator.share&&navigator.canShare({files:[f]}))}catch(e){return false}}
/* ---- the leaderboard at the end of the replay (LEADERBOARD.md, Fable design 11-21; Mike 11-21: "at the END of every Caldera
 * battle replay, a big video-game-style LEADERBOARD pops up, in the same style as the end-of-strike graphic ... quick way to
 * screenshot/save and send it, and to post it to Instagram"). When the replay stage is done the clock holds at S.end and a
 * results plate slams onto the map: the top 5 attackers by damage, the viewer's own row, three totals and two callouts. One
 * primary button shares (phone) or saves (desktop) a 1080x1920 story picture; desktop also has a 1080x1350 post. Mike's
 * answers (Fable's recommendations): demo + signed out = "Add your city" first; the saved picture shows the saver's row in
 * purple with the handle, never YOU; desktop = story PNG + a small "Post size (4:5)" link, the phone one Share button. */
/* the board's CSS rides in the same style element as BCCSS (bCardCss), so it is in CITY_JS for hosted city pages too */
var BLPLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
var BLCSS='.blb{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:12px 10px;overflow:hidden auto;--tc:#FFC83D;--e1:#B07A0E;--e2:#5E3F04;--plate:rgba(11,13,19,.93);--ink:#F4F6FA;--ink2:rgba(244,246,250,.7);--ink3:rgba(244,246,250,.46);--cyan:#3DF2FF;--you:#8B6CF6;--youink:#B9A6FF;--atk:#FF6A3D;--def:#58B4FF;--gold:#FFC83D;--raid:#F2F2F5;--fall:#FF4D5E;--slam:"Saira Extra Condensed","Barlow Condensed","Arial Narrow",Arial,sans-serif;--disp:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--ui:"IBM Plex Sans",-apple-system,"Segoe UI",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;font-family:var(--ui);color:var(--ink);box-sizing:border-box;-webkit-user-select:none;user-select:none;touch-action:manipulation}'
 +'.blb *{box-sizing:border-box}'
 +'.blb::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,rgba(5,6,10,.5),rgba(5,6,10,.84));animation:scFade 200ms linear both}'
 +'.blb.sz-l{--w:720px;--cut:18px;--px:30px;--pt:15px;--ft:84px;--r1:64px;--rh:40px;--rk:30px;--av:28px;--fn:19px;--fn1:42px;--fs:11px;--fv:15px;--ff:26px;--ch:46px}'
 +'.blb.sz-m{--w:540px;--cut:13px;--px:22px;--pt:11px;--ft:60px;--r1:50px;--rh:33px;--rk:24px;--av:22px;--fn:16px;--fn1:32px;--fs:10px;--fv:13px;--ff:21px;--ch:38px}'
 +'.blb.sz-s{--w:100%;--cut:10px;--px:14px;--pt:10px;--ft:52px;--r1:50px;--rh:36px;--rk:22px;--av:22px;--fn:16px;--fn1:30px;--fs:10px;--fv:12.5px;--ff:20px;--ch:40px}'
 +'.blb .lb-wrap{position:relative;width:var(--w);max-width:100%;display:grid;gap:10px;filter:drop-shadow(0 14px 26px rgba(0,0,0,.55))}'
 +'.blb .lb-plate{position:relative;background:var(--plate);padding-bottom:1px;clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut))}'
 +'.blb .lb-top{height:3px;background:var(--gold)}'
 +'.blb .lb-head{padding:var(--pt) var(--px) 0 calc(var(--px) + 4px)}'
 +'.blb .lb-eye{display:flex;justify-content:space-between;gap:12px;margin:0;font:600 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink2);white-space:nowrap}'
 +'.blb .lb-eye em{font-style:normal;font-weight:500;letter-spacing:0;text-transform:none;color:var(--ink3)}'
 +'.blb .lb-eye .demo{color:#0B0D13;background:var(--gold);padding:2px 5px;margin:-2px 6px -2px 0}'
 +'.blb .lb-title{margin:7px 0 0;font:900 var(--ft)/.86 var(--slam);letter-spacing:.01em;text-transform:uppercase;white-space:nowrap;color:var(--tc);transform:skewX(-8deg);transform-origin:0 100%;text-shadow:.016em .008em 0 var(--e1),.032em .016em 0 var(--e1),.048em .024em 0 var(--e1),.064em .032em 0 var(--e2),.08em .04em 0 var(--e2),.12em .075em .05em rgba(0,0,0,.55)}'
 +'.blb .lb-cols{display:flex;justify-content:space-between;margin:12px calc(var(--px) + 10px) 5px calc(var(--px) + 6px);font:600 11px/1 var(--disp);letter-spacing:.13em;text-transform:uppercase;color:var(--ink3)}'
 +'.blb .lb-rows{list-style:none;margin:0;padding:0 var(--px);display:grid;gap:3px}'
 +'.blb .lb-rows li{position:relative;isolation:isolate;display:grid;grid-template-columns:var(--rk) var(--av) minmax(0,1fr) auto;column-gap:9px;align-items:center;height:var(--rh);padding:0 10px 0 6px;background:rgba(255,255,255,.055);--bc:var(--atk);--bf:rgba(255,106,61,.28)}'
 +'.blb .lb-rows li::before{content:"";position:absolute;z-index:-1;left:0;top:0;bottom:0;width:calc(var(--s,0)*100%);min-width:4px;background:linear-gradient(var(--bc),var(--bc)) left bottom/100% 3px no-repeat,linear-gradient(90deg,var(--bf),transparent);transform-origin:0 50%}'
 +'.blb .lb-rows li>i{font:900 calc(var(--rh)*.7)/1 var(--slam);font-style:normal;text-align:center;color:var(--ink3)}'
 +'.blb .av{width:var(--av);height:var(--av);border-radius:50%;display:inline-grid;place-items:center;background:#2A2D36 center/cover no-repeat;font:600 calc(var(--av)*.5)/1 var(--mono);color:#E8E8EE;overflow:hidden}'
 +'.blb .av.p{color:transparent}'
 +'.blb .av.r{border-radius:0;background:none;color:transparent}'
 +'.blb .av.r::before{content:"";width:46%;height:46%;background:var(--raid);transform:rotate(45deg)}'
 +'.blb .who{display:grid;min-width:0}'
 +'.blb .n{font:600 var(--fn)/1.05 var(--disp);letter-spacing:.03em;text-transform:uppercase;color:var(--ink);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.blb a.n:hover,.blb a.n:focus-visible{text-decoration:underline;outline:none}'
 +'.blb .s{font:500 var(--fs)/1.25 var(--mono);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.blb .v{font:600 var(--fv)/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--gold);white-space:nowrap}'
 +'.blb .lb-rows li.top{height:var(--r1)}'
 +'.blb .lb-rows li.top>i{font-size:calc(var(--r1)*.74);color:var(--gold)}'
 +'.blb .lb-rows li.top .av{width:calc(var(--av)*1.4);height:calc(var(--av)*1.4);font-size:calc(var(--av)*.7)}'
 +'.blb .lb-rows li.top{grid-template-columns:var(--rk) calc(var(--av)*1.4) minmax(0,1fr) auto}'
 +'.blb .lb-rows li.top .n{font:900 var(--fn1)/.92 var(--slam);letter-spacing:.01em;color:var(--atk);padding:0 .1em .06em 0;text-shadow:.02em .012em 0 #B23E1B,.04em .024em 0 #B23E1B,.06em .036em 0 #5F1F0B}'
 +'.blb .lb-rows li.top .v{font:700 calc(var(--fn1)*.78)/1 var(--disp);letter-spacing:.01em}'
 +'.blb .lb-rows li.raid{--bc:var(--raid);--bf:rgba(242,242,245,.16)}'
 +'.blb .lb-rows li.raid .n{color:var(--raid)}'
 +'.blb .lb-rows li.top.raid .n{text-shadow:.02em .012em 0 #5B6170,.04em .024em 0 #5B6170,.06em .036em 0 #2A2E38}'
 +'.blb .lb-rows li.me{outline:1.5px solid var(--you);outline-offset:-1.5px;--bc:var(--you);--bf:rgba(139,108,246,.44)}'
 +'.blb .lb-rows li.me>i,.blb .lb-rows li.me .n{color:var(--youink)}'
 +'.blb .lb-rows li.top.me .n{text-shadow:.02em .012em 0 #4B36A8,.04em .024em 0 #4B36A8,.06em .036em 0 #2A1D66}'
 +'.blb .lb-rows li.pin{margin-top:11px}'
 +'.blb .lb-rows li.pin::after{content:"";position:absolute;left:0;right:0;top:-8px;border-top:2px dotted rgba(255,255,255,.3)}'
 +'.blb .lb-rows li.none{grid-template-columns:minmax(0,1fr);padding:0 10px;font:500 var(--fv)/1 var(--mono);color:var(--ink2)}'
 +'.blb .lb-rows li.none::before{display:none}'
 +'.blb .lb-you{display:flex;align-items:center;gap:7px;margin:9px var(--px) 0 calc(var(--px) + 2px);font:500 calc(var(--fs) + 1px)/1.2 var(--mono);color:var(--ink2)}'
 +'.blb .lb-you::before{content:"";flex:none;width:7px;height:7px;background:var(--you);transform:rotate(45deg)}'
 +'.blb .lb-facts{list-style:none;margin:12px var(--px) 0 calc(var(--px) + 2px);padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'
 +'.blb .lb-facts li{display:grid;gap:1px;min-width:0}'
 +'.blb .lb-facts b{font:700 var(--ff)/1 var(--disp);letter-spacing:.01em;color:var(--ink)}'
 +'.blb .lb-facts b.gold{color:var(--gold)}'
 +'.blb .lb-facts span{font:500 var(--fs)/1.2 var(--mono);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.blb .lb-call{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);margin-top:11px;height:var(--ch);padding:0 calc(var(--px) - 2px);background:rgba(255,255,255,.055)}'
 +'.blb .lb-call>div{display:grid;align-content:center;gap:3px;padding:0 10px;min-width:0;border-left:1px solid rgba(255,255,255,.09)}'
 +'.blb .lb-call>div:first-child{border-left:0;padding-left:4px}'
 +'.blb .lb-call span{font:600 10.5px/1 var(--disp);letter-spacing:.13em;text-transform:uppercase;color:var(--ink2)}'
 +'.blb .lb-call b{font:600 calc(var(--fn) - 1px)/1 var(--disp);letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.blb .lb-call .red span{color:var(--fall)}.blb .lb-call .cyan span{color:var(--cyan)}.blb .lb-call .gold span{color:var(--gold)}'
 +'.blb .lb-act{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}'
 +'.blb .lb-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:40px;padding:0 16px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(9,11,17,.8);color:var(--ink);font:600 14px/1 var(--ui);white-space:nowrap;cursor:pointer;text-decoration:none}'
 +'.blb .lb-btn:hover{background:rgba(255,255,255,.14)}'
 +'.blb .lb-btn.pri{height:44px;padding:0 22px 0 18px;border-radius:22px;border-color:var(--ink);background:var(--ink);color:#0B0D13;font-size:15px}'
 +'.blb .lb-btn.pri:hover{background:#fff}'
 +'.blb .lb-btn svg{width:16px;height:16px;flex:none}'
 // 11-27 the join button for signed-out viewers (Fable reports/2026-11-27-replay-end-join/DESIGN.md)
 +'.blb .lb-act.jn{row-gap:10px}.blb .lb-join{flex:0 0 100%;display:grid;justify-items:center;gap:6px;min-width:0}'
 +'.blb .lb-join .lb-btn.pri{height:46px;padding:0 24px 0 20px;border-radius:23px;font-size:15.5px;gap:9px;transition:background-color .15s ease-out}'
 +'.blb .lb-jd{flex:none;width:8px;height:8px;background:var(--you);transform:rotate(45deg)}'
 +'.blb .lb-sub{margin:0;max-width:100%;text-align:center;font:500 12.5px/1.35 var(--ui);color:var(--ink);opacity:.86;text-shadow:0 1px 2px rgba(0,0,0,.7)}'
 +'.blb.sz-s .lb-join{grid-column:1/-1;justify-items:stretch}.blb.sz-s .lb-join .lb-btn.pri{height:48px;border-radius:24px;padding:0 10px;font-size:15px}.blb.sz-s .lb-sub{font-size:12px}'
 +'.blb.h-s .lb-sub,.blb.h-xs .lb-sub{display:none}@media (max-width:359px){.blb.sz-s .lb-jd{display:none}}@media (prefers-reduced-motion:reduce){.blb .lb-join .lb-btn.pri{transition:none}}'
 +'.blb .lb-btn[disabled]{cursor:default;opacity:.8}'
 +'.blb .lb-btn:focus-visible,.blb .lb-link:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}'
 +'.blb .lb-link{background:none;border:0;padding:8px 6px;font:600 13px/1 var(--ui);color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}'
 +'.blb .lb-hint{margin:0;text-align:center;font:500 12px/1.4 var(--ui);color:var(--ink2)}'
 +'.blb .lb-hint b{font-weight:600;color:var(--cyan)}'
 +'.blb .lb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}'
 +'.blb.sz-s{padding:10px}'
 +'.blb.sz-s .lb-act{display:grid;grid-template-columns:1fr 1fr}'
 +'.blb.sz-s .lb-btn{height:44px;padding:0 8px}'
 +'.blb.sz-s .lb-act.n3{grid-template-columns:repeat(3,1fr)}'
 +'.blb.sz-s .lb-btn.pri,.blb.sz-s .lb-act.n3 .lb-btn.pri{grid-column:1/-1;height:48px;border-radius:24px}'
 +'.blb.sz-s .lb-link{grid-column:1/-1;justify-self:center}'
 +'.blb.h-s .lb-facts,.blb.h-xs .lb-facts,.blb.h-xs .lb-rows li:nth-child(n+4):not(.pin){display:none}'
 +'.blb .lb-plate{animation:lbWipe 140ms cubic-bezier(.2,.8,.2,1) both}'
 +'.blb .lb-eye{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) 80ms both}'
 +'.blb .lb-title{animation:scSlam 220ms cubic-bezier(.2,.9,.3,1) 200ms both}'
 +'.blb .lb-head{animation:scShake 120ms linear 420ms}'
 +'.blb .lb-cols{animation:scFade 160ms ease-out 480ms both}'
 +'.blb .lb-rows li{animation:scSlide 180ms cubic-bezier(.2,.8,.2,1) calc(520ms + var(--d,0)*90ms) both}'
 +'.blb .lb-rows li::before{animation:lbBar 420ms cubic-bezier(.2,.8,.2,1) calc(600ms + var(--d,0)*90ms) both}'
 +'.blb .lb-rows li.top{animation:lbTop 260ms cubic-bezier(.2,.9,.3,1) calc(600ms + var(--d,0)*90ms) both}'
 +'.blb .lb-rows li.me{animation-name:scSlide,lbMe;animation-duration:180ms,700ms;animation-delay:calc(520ms + var(--d,0)*90ms),1300ms;animation-timing-function:cubic-bezier(.2,.8,.2,1),ease-out;animation-fill-mode:both,none}'
 +'.blb .lb-you,.blb .lb-facts{animation:scFade 160ms ease-out 1400ms both}'
 +'.blb .lb-call{animation:scRise 200ms ease-out 1500ms both}'
 +'.blb .lb-act,.blb .lb-hint{animation:scRise 200ms ease-out 1650ms both}'
 +'@keyframes lbWipe{from{clip-path:polygon(var(--cut) 0,var(--cut) 0,var(--cut) 100%,var(--cut) 100%,0 100%,0 var(--cut));opacity:.4}to{clip-path:polygon(var(--cut) 0,100% 0,100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,0 100%,0 var(--cut));opacity:1}}'
 +'@keyframes lbBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}'
 +'@keyframes lbTop{0%{opacity:0;transform:scale(1.5)}55%{opacity:1;transform:scale(.98)}100%{opacity:1;transform:none}}'
 +'@keyframes lbMe{0%{box-shadow:0 0 0 0 rgba(139,108,246,.9)}100%{box-shadow:0 0 0 14px rgba(139,108,246,0)}}'
 +'.blb.fin::before,.blb.fin *,.blb.fin *::before{animation:none!important}'
 +'.blb.rm .lb-wrap{animation:scFade 150ms linear both}'
 +'.blb.rm .lb-wrap *,.blb.rm .lb-wrap *::before{animation:none!important}';
var BLN=5,BLB=null,BLHOOK={},BLENTRY=1850;
/** one pass over the night's shots: fired and landed per attacker; hits, blocked and held per defender */
function bLbTally(P){var A={},D={};(P.shots||[]).forEach(function(s){var a=A[s.a]||(A[s.a]={fired:0,land:0}),d=D[s.d]||(D[s.d]={d:s.d,hits:0,blocked:0,held:0});
  a.fired++;if(s.f>0&&!s.blocked){a.land++;d.hits++}if(s.blocked)d.blocked++;d.held+=bCardHeld(s)});return {A:A,D:D}}
/** the board's words and numbers. X: {R,P,S,V}; pic: true for a saved picture (the viewer keeps the purple row but reads as the handle) */
function bLbModel(X,pic){var R=X.R,P=X.P,S=X.S,V=X.V||null,T=bLbTally(P),L=bCardRanks(R.beats,R.beats.length-1),top=L[0]?L[0].usd:0,demo=!!P.demo,dt=bcDate(P.night);
  var all=L.map(function(r,i){var raid=bcRaid(r.a),me=!!(V&&r.a===V),t=T.A[r.a]||{fired:0,land:0};
    return {rank:i+1,a:r.a,name:raid?'SEA RAIDERS':me&&!pic?'YOU':r.a.slice(1).toUpperCase(),usd:r.usd,v:bUsd(r.usd),s:top?r.usd/top:0,fired:t.fired,land:t.land,cls:((i===0?'top ':'')+(me?'me ':'')+(raid?'raid':'')).trim()}});
  var last=bCardModel({k:'last'},{R:R,P:P,S:S,V:pic?null:V}),M={demo:demo,date:dt.d,year:dt.y,rows:all.slice(0,BLN),pin:null,you:null,call:[],facts:last.facts.map(function(f,i){return [f[0],f[1],i===2?'gold':'']})};
  if(V){var mine=all.filter(function(r){return r.a===V})[0],t=T.A[V];if(mine&&mine.rank>BLN)M.pin=mine;
    if(!pic){var y=!mine?(t&&t.fired?'You fired '+t.fired+' missile'+(t.fired===1?'':'s')+'. No hit.':'You fired no missiles.'):'';M.you=((y+' '+(last.you?last.you+'.':'')).trim())||null}}
  if(P.fall&&R.F)M.call.push([bcRaid(P.fall.key)?'Fleet sunk':'City down',bcName(P.fall.key,null),'red']);
  else{var w=null,wp=0;Object.keys(T.D).forEach(function(d){var s1=bCardStand(P,S,d,S.wide);if(s1==null)return;var q=100-bcPct(s1);if(q>wp){wp=q;w=d}});if(w)M.call.push(['Hardest hit',bcName(w,null)+' −'+wp+'%','gold'])}
  var b=null;Object.keys(T.D).forEach(function(d){var x=T.D[d];if(x.blocked>0&&(!b||x.blocked>b.blocked||(x.blocked===b.blocked&&x.held>b.held)))b=x});if(b)M.call.push(['Best shield',bcName(b.d,null)+' · '+b.blocked+' blocked','cyan']);
  M.file='caldera-leaderboard-'+(demo?'demo':bcIso(P.night))+'.png';return M}
/** the file name of a saved picture: the story adds -story before .png (as bCardBlob) */
function bLbFile(M,fmt){return fmt==='p'?M.file:M.file.replace(/\.png$/,'-story.png')}
/** the button set (spec section 6): which buttons, in which order, which one is primary. o: {save, share, signedIn} */
function bLbButtons(M,o){var n=M.rows.length,save=!!(o.save&&n),demoAdd=M.demo&&!o.signedIn,join=!M.demo&&!o.signedIn,L=[];   // 11-27 (caldera-replay-end-join, Fable DESIGN.md): a signed-out viewer of a real night gets the join button first, in place of the old "Add your city" link
  if(demoAdd)L.push('add');if(join)L.push('join');if(save)L.push('save');L.push('again','exit');if(save&&!o.share)L.push('post');
  return {list:L,pri:demoAdd?'add':join?'join':save?'save':'again',n3:(demoAdd||join)&&save,jn:join}}
var BLSHARE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"/></svg>';
/** one row: rank, avatar (bcAv; the raiders a white diamond), name (a member links to the profile), the line under it, damage */
function bLbRow(r,size,d,pin){var raid=bcRaid(r.a),lk=raid?null:bcLink(r.a),sub=r.land+' of '+r.fired+(size==='s'?' hit':' missiles hit');
  return '<li class="'+r.cls+(pin?' pin':'')+'" value="'+r.rank+'" style="--s:'+Math.max(.02,r.s).toFixed(3)+';--d:'+d+'"><i aria-hidden="true">'+r.rank+'</i>'+(raid?'<span aria-hidden="true" class="av r"></span>':bcAv(r.a,lk&&lk.av))
    +'<span class="who">'+(lk?'<a class="n" href="'+bcE(lk.href)+'" target="_top" rel="noopener">':'<span class="n">')+bcE(r.name)+(lk?'</a>':'</span>')
    +'<span class="s">'+(r.rank===1?'TOP ATTACKER · ':'')+bcE(sub)+'</span></span><span class="v" data-usd="'+Math.round(r.usd||0)+'">'+bcE(r.v)+'<span class="lb-sr"> damage</span></span></li>'}
/** the board's markup (spec section 7). o: {save: bCardCanSave(), share: phone with file sharing, signedIn, rm, hint, add (href)} */
function bLbHTML(M,size,o){var n=M.rows.length,B=bLbButtons(M,o),h='<div class="blb sz-'+size+(o.rm?' rm':'')+'" role="dialog" aria-modal="true" aria-labelledby="lb-t"><div class="lb-wrap"><div class="lb-plate"><div class="lb-top"></div>';
  h+='<header class="lb-head"><p class="lb-eye"><span>'+(M.demo?'<b class="demo">DEMO</b>Sample battle':'Last night · '+bcE(M.date))+'</span><em>caldera.social</em></p><h2 class="lb-title" id="lb-t">Battle results</h2></header>';
  h+='<div class="lb-cols" aria-hidden="true"><span>Top attackers</span><span>Damage</span></div><ol class="lb-rows">';
  if(!n)h+='<li class="none">No missile hit a city.</li>';
  M.rows.forEach(function(r,i){h+=bLbRow(r,size,i===0?n-1:n-1-i,false)});
  if(M.pin)h+=bLbRow(M.pin,size,n+2,true);
  h+='</ol>'+(M.you?'<p class="lb-you">'+bcE(M.you)+'</p>':'');
  h+='<ul class="lb-facts">'+M.facts.map(function(f){return '<li><b'+(f[2]?' class="'+f[2]+'"':'')+'>'+bcE(f[0])+'</b><span>'+bcE(f[1])+'</span></li>'}).join('')+'</ul>';
  if(M.call.length)h+='<div class="lb-call">'+M.call.map(function(c){return '<div class="'+c[2]+'"><span>'+bcE(c[0])+'</span><b>'+bcE(c[1])+'</b></div>'}).join('')+'</div>';
  var add=bcE(o.add||'/#start'),cls=function(k){return 'lb-btn'+(B.pri===k?' pri':'')},P={
    add:'<a class="'+cls('add')+'" data-lb="add" href="'+add+'" target="_top" rel="noopener">Add your city</a>',
    save:'<button type="button" class="'+cls('save')+'" data-lb="save" data-fmt="s" aria-label="'+(o.share?'Share the results as a picture':'Save the results as a picture')+'">'+(o.share?BLSHARE:BCICO)+'<span>'+(o.share?'Share':'Save picture')+'</span></button>',
    again:'<button type="button" class="'+cls('again')+'" data-lb="again">'+BLPLAY+'<span>Replay again</span></button>',exit:'<button type="button" class="lb-btn" data-lb="exit">Exit</button>',
    post:'<button type="button" class="lb-link" data-lb="save" data-fmt="p">Post size (4:5)</button>',
    join:'<div class="lb-join"><a class="lb-btn pri" data-lb="add" data-jn="board" href="'+bcE(o.join||bLbJoin())+'" target="_top" rel="nofollow noopener" aria-describedby="lb-js"><i class="lb-jd" aria-hidden="true"></i><span>Put your city in tonight\u2019s battle</span></a><p class="lb-sub" id="lb-js">Free. Your GitHub becomes a city, and today\u2019s code becomes missiles.</p></div>'};
  h+='</div><div class="lb-act'+(B.n3?' n3':'')+(B.jn?' jn':'')+'">'+B.list.map(function(k){return P[k]}).join('')+'</div>'+(o.hint?bLbHintHTML():'')+'</div></div>';return h}
function bLbHintHTML(){return '<p class="lb-hint" role="status">For an Instagram story: add a Link sticker. Put it on the <b>caldera.social</b> box.</p>'}
/** signed in? the hub says (boardHooks signedIn: a value or a function), else a known viewer (BCV) */
function bLbSigned(){var s=BLHOOK.signedIn;if(typeof s==='function'){try{return !!s()}catch(e){return !!BCV}}return s==null?!!BCV:!!s}
/** the "Add your city" link: the hub's, else the /world action's ("/#start"), on caldera.social when the page is not on the web */
/** the join link at the end of a real night's replay (11-27): the hub's (boardHooks join), else /join?tp=replay_end on caldera.social */
function bLbJoin(){if(BLHOOK.join)return String(BLHOOK.join);var web=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&location.origin!=='null';return (web?'':'https://caldera.social')+'/join?tp=replay_end'}
function bLbAdd(){if(BLHOOK.add)return String(BLHOOK.add);var web=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&location.origin!=='null';return (web?'':'https://caldera.social')+'/#start'}
/** the stage's height class: under 620 px the totals go, under 520 px only ranks 1 to 3 and the pinned row */
function bLbH(h){return h<520?'h-xs':h<620?'h-s':''}
/** the replay reached S.end: hold the clock there (the map stands whole) and put the board up, once */
function bLbHold(S){if(!BREP)return;if(BREP.pauseAt==null||BREP.vt!==S.end){BREP.vt=S.end;BREP.pt=performance.now();BREP.pauseAt=performance.now();BREP.esp=null}if(!BLB)bLbMount()}
/** the board goes up on the stage (z-index 8): the model (the viewer sees YOU), the DOM, the photos for the picture, the entry */
function bLbMount(){bLbOff();bCardOff();if(!BREP)return null;var M=bLbModel({R:BREP.R,P:BREP.P,S:BREP.R.S,V:BCV},false),B={m:M,el:null,size:null,t0:performance.now(),fin:!!reduce,av:{},busy:0,hint:false,raf:0,tm:[],key:null,eat:false};BLB=B;bcTr('leaderboard_shown',{demo:!!M.demo,rows:M.rows.length,signed:bLbSigned()});
  try{document.documentElement.classList.add('w-board')}catch(e){}bLbPhotos(M);
  if(typeof st==='undefined'||!st||!st.appendChild||typeof document==='undefined'||!document.createElement)return B;
  try{bCardCss();bCardFonts();var w=st.clientWidth||vw,hh=st.clientHeight||vh,size=bCardSize(w),save=bCardCanSave(),share=save&&bcCanShare(),wrap=document.createElement('div');
    wrap.innerHTML=bLbHTML(M,size,{save:save,share:share,signedIn:bLbSigned(),rm:!!reduce,add:bLbAdd(),join:bLbJoin()});var el=wrap.firstChild,hc=bLbH(hh);if(hc)el.classList.add(hc);
    st.appendChild(el);B.el=el;B.size=size;B.share=share;bLbWire(el);
    if(reduce)bLbFocus();else{bLbCount(el);B.tm.push(setTimeout(function(){if(BLB===B)bLbFin()},BLENTRY));B.tm.push(setTimeout(function(){if(BLB===B&&!B.fin)bCardThud()},200));
      B.tm.push(setTimeout(function(){if(BLB===B&&!B.fin)bCardThud()},600+90*Math.max(0,M.rows.length-1)))}}catch(e){}
  return B}
/** the board comes down (Exit, Replay again, the end of the replay) */
function bLbOff(){var B=BLB;if(!B)return;BLB=null;B.tm.forEach(function(t){clearTimeout(t)});if(B.raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(B.raf);
  try{if(B.key)document.removeEventListener('keydown',B.key,true)}catch(e){}if(B.el&&B.el.parentNode)B.el.parentNode.removeChild(B.el);try{document.documentElement.classList.remove('w-board')}catch(e){}}
/** the entry is over (or skipped): every value final, focus on the primary button */
function bLbFin(){var B=BLB;if(!B)return;B.fin=true;if(B.el){B.el.classList.add('fin');Array.prototype.forEach.call(B.el.querySelectorAll('.v[data-usd]'),function(v){if(v.firstChild)v.firstChild.nodeValue=bUsd(+v.getAttribute('data-usd'))})}bLbFocus()}
function bLbFocus(){try{var p=BLB&&BLB.el&&BLB.el.querySelector('.lb-btn.pri');if(p)p.focus({preventScroll:true})}catch(e){}}
/** each row's damage counts up from $0 over 500 ms as its row slides in (real time; the replay clock has stopped) */
function bLbCount(el){var B=BLB,L=[];Array.prototype.forEach.call(el.querySelectorAll('.lb-rows li'),function(li){var v=li.querySelector('.v[data-usd]');if(!v||!v.firstChild)return;var d=+(li.style.getPropertyValue('--d')||0);L.push({n:v.firstChild,u:+v.getAttribute('data-usd'),t:520+d*90});v.firstChild.nodeValue='$0'});
  if(!L.length)return;if(typeof requestAnimationFrame!=='function'){L.forEach(function(x){x.n.nodeValue=bUsd(x.u)});return}
  var step=function(){if(BLB!==B||B.fin)return;var t=performance.now()-B.t0,more=false;L.forEach(function(x){var u=Math.max(0,Math.min(1,(t-x.t)/500));if(u<1)more=true;x.n.nodeValue=bUsd(x.u*(1-Math.pow(1-u,3)))});if(more)B.raf=requestAnimationFrame(step)};B.raf=requestAnimationFrame(step)}
/** the buttons, keys and taps: Esc = Exit, R = Replay again, S = Share / Save; Tab stays inside; a tap on the scrim does nothing;
 *  any key or tap during the entry only skips it (class fin), it does not also press a button */
function bLbWire(el){var stop=function(ev){ev.stopPropagation()},B=BLB;['pointerdown','mousedown','touchstart','wheel','click','dblclick','pointerup','contextmenu'].forEach(function(k){el.addEventListener(k,stop,k==='wheel'||k==='touchstart'?{passive:true}:false)});
  var entry=function(){return !B.fin&&performance.now()-B.t0<BLENTRY};
  el.addEventListener('pointerdown',function(ev){B.eat=false;if(entry()){B.eat=true;bLbFin()}},true);
  el.addEventListener('click',function(ev){if(B.eat){B.eat=false;ev.preventDefault();ev.stopPropagation();return}var t=ev.target&&ev.target.closest&&ev.target.closest('[data-lb]');if(!t||!el.contains(t))return;var k=t.getAttribute('data-lb');if(k==='add')return;ev.preventDefault();bLbAct(k,t)},true);
  B.key=function(ev){if(BLB!==B||ev.altKey||ev.ctrlKey||ev.metaKey)return;if(entry()){ev.preventDefault();ev.stopPropagation();bLbFin();return}var k=ev.key;
    if(k==='Escape'){ev.preventDefault();ev.stopPropagation();bLbAct('exit');return}
    if(k==='r'||k==='R'){ev.preventDefault();ev.stopPropagation();bLbAct('again');return}
    if(k==='s'||k==='S'){var sb=el.querySelector('[data-lb="save"][data-fmt="s"]');ev.preventDefault();ev.stopPropagation();if(sb)bLbAct('save',sb);return}
    if(k==='Tab'){var f=Array.prototype.filter.call(el.querySelectorAll('button:not([disabled]),a[href]'),function(x){return x.offsetParent!==null});if(!f.length)return;var i=f.indexOf(document.activeElement);ev.preventDefault();f[ev.shiftKey?(i<=0?f.length-1:i-1):(i<0||i>=f.length-1?0:i+1)].focus()}};
  document.addEventListener('keydown',B.key,true)}
/** a button: save / share, Replay again (same mode, speed and full screen; the hub's play() when it gave one), Exit (the hub's
 *  stopPlay() when it gave one, else back to the page as the bar's End does) */
function bLbAct(k,btn){if(!BLB)return false;if(k==='save'){bLbSave(btn&&btn.getAttribute('data-fmt')||'s',btn);return true}
  var demo=!!(BREP&&BREP.demo),sp=BREP?BREP.sp:null;
  if(k==='again'){bLbOff();if(typeof BLHOOK.again==='function')BLHOOK.again(demo);else bReplayStart(demo?'demo':undefined,sp,true);return true}
  if(k==='exit'){bLbOff();if(typeof BLHOOK.exit==='function')BLHOOK.exit();else bReplayEnd(true);return true}return false}
/** the photos for the picture: loaded at mount with crossOrigin; Save never waits for them (the rest get the initial) */
function bLbPhotos(M){if(typeof Image==='undefined')return;var B=BLB;M.rows.concat(M.pin?[M.pin]:[]).forEach(function(r){var lk=bcRaid(r.a)?null:bcLink(r.a);if(!lk||!lk.av)return;try{var im=new Image();im.crossOrigin='anonymous';im.onload=function(){if(BLB===B)B.av[r.a]=im};im.src=lk.av}catch(e){}})}
/* the export layouts. s: 1080x1920 story (0-250 and 1580-1920 stay empty); p: 1080x1350 post.
   rh: [row height with no pinned row, with a pinned row]. The link spot is the same box as BCXL (house rule 11). */
var BLXL={s:{W:1080,H:1920,M:96,top:270,rule:356,ty:500,tf:150,sub:552,r0:584,r1:144,n1:80,rh:[120,96],gap:8,fy:1346,sy:1400,sh:92,urlY:1506,urlW:480,urlH:64,url:32},
          p:{W:1080,H:1350,M:72,top:58,rule:126,ty:250,tf:124,sub:296,r0:322,r1:124,n1:72,rh:[100,84],gap:6,fy:1086,sy:1160,sh:92,urlY:1264,urlW:420,urlH:54,url:28}};
/* draw the leaderboard on ctx. D: the model from bLbModel (pic: true) plus src (the map canvas or null) and av ({handle: loaded Image}); L: BLXL.s or .p */
function bLbDraw(ctx,D,L){var c=ctx,W=L.W,H=L.H,M=L.M,A=W-2*M,T=BCTONE.gold,SL='"Saira Extra Condensed","Barlow Condensed","Arial Narrow",sans-serif',BC='"Barlow Condensed","Arial Narrow",sans-serif',MO='"IBM Plex Mono",Menlo,monospace',UI='"IBM Plex Sans",Arial,sans-serif';
  c.save();c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle='#0E1014';c.fillRect(0,0,W,H);
  /* the map: cover fit, centred; then the scrims. The board needs a solid ground from the title down */
  if(D.src&&D.src.width>0&&D.src.height>0){var sw=D.src.width,sh=D.src.height,k=Math.max(W/sw,H/sh);c.drawImage(D.src,(W-sw*k)/2,(H-sh*k)/2,sw*k,sh*k)}
  var g=c.createLinearGradient(0,0,0,L.rule);g.addColorStop(0,'rgba(5,6,10,.72)');g.addColorStop(1,'rgba(9,11,17,.5)');c.fillStyle=g;c.fillRect(0,0,W,L.rule);
  g=c.createLinearGradient(0,L.rule,0,L.r0);g.addColorStop(0,'rgba(9,11,17,.5)');g.addColorStop(1,'rgba(9,11,17,.93)');c.fillStyle=g;c.fillRect(0,L.rule,W,L.r0-L.rule);c.fillStyle='rgba(9,11,17,.93)';c.fillRect(0,L.r0,W,H-L.r0);
  /* mark, name, date (as bCardDraw) */
  c.fillStyle='#8B6CF6';c.beginPath();c.moveTo(M,L.top+38);c.lineTo(M+22,L.top+2);c.lineTo(M+44,L.top+38);c.closePath();c.fill();c.fillStyle='#F4F6FA';c.font='600 40px Georgia,serif';c.fillText('Caldera',M+58,L.top+36);
  c.font='600 24px '+MO;c.textAlign='right';c.fillStyle=D.demo?'#FFC83D':'rgba(244,246,250,.8)';c.fillText(D.demo?'DEMO BATTLE':'BATTLE \u00b7 '+D.date+', '+D.year,W-M,L.top+32);c.textAlign='left';
  c.fillStyle='#FFC83D';c.fillRect(M,L.rule,A,6);
  /* title: skew -8 deg, 12 shadow steps of (2, 1) px, shrinks to fit */
  var tf=L.tf,title='BATTLE RESULTS';c.font='900 '+tf+'px '+SL;tf*=Math.min(1,(A-50)/c.measureText(title).width);
  c.save();c.translate(M,L.ty);c.transform(1,0,-.1405,1,0,0);c.font='900 '+tf+'px '+SL;for(var e=12;e>=1;e--){c.fillStyle=e>7?T[2]:T[1];c.fillText(title,e*2,e)}c.fillStyle=T[0];c.fillText(title,0,0);c.restore();
  c.font='600 28px '+BC;c.fillStyle=D.demo?'#FFC83D':'rgba(244,246,250,.72)';c.fillText(D.demo?'SAMPLE DATA. NOT A REAL BATTLE.':'TOP ATTACKERS',M,L.sub);
  if(!D.demo){c.textAlign='right';c.fillStyle='rgba(244,246,250,.72)';c.fillText('DAMAGE',W-M,L.sub);c.textAlign='left'}
  /* one row. big: the rank-1 row */
  var row=function(r,y,h,big){var me=/\bme\b/.test(r.cls),raid=/\braid\b/.test(r.cls),col=me?'139,108,246':raid?'242,242,245':'255,106,61',edge=me?'#8B6CF6':raid?'#F2F2F5':'#FF6A3D',cy=y+h/2;
    c.fillStyle='rgba(255,255,255,.06)';c.fillRect(M,y,A,h);var bw=Math.max(8,A*r.s),gg=c.createLinearGradient(M,0,M+bw,0);gg.addColorStop(0,'rgba('+col+','+(me?.44:raid?.16:.28)+')');gg.addColorStop(1,'rgba('+col+',0)');c.fillStyle=gg;c.fillRect(M,y,bw,h);c.fillStyle=edge;c.fillRect(M,y+h-5,bw,5);
    if(me){c.strokeStyle='#8B6CF6';c.lineWidth=3;c.strokeRect(M+1.5,y+1.5,A-3,h-3)}
    var rs=big?104:64,rx=M+(big?56:50);c.font='900 '+rs+'px '+SL;c.textAlign='center';c.fillStyle=me?'#B9A6FF':big?'#FFC83D':'rgba(244,246,250,.46)';c.fillText(String(r.rank),rx,cy+rs*.36);c.textAlign='left';
    var ad=big?88:60,ax=M+(big?116:100),img=D.av&&D.av[r.a];
    if(raid){c.save();c.translate(ax+ad/2,cy);c.rotate(Math.PI/4);c.fillStyle='#F2F2F5';c.fillRect(-ad*.23,-ad*.23,ad*.46,ad*.46);c.restore()}
    else{c.save();c.beginPath();c.arc(ax+ad/2,cy,ad/2,0,Math.PI*2);c.closePath();c.clip();c.fillStyle='#2A2D36';c.fillRect(ax,cy-ad/2,ad,ad);
      if(img&&img.width)c.drawImage(img,ax,cy-ad/2,ad,ad);else{c.font='600 '+Math.round(ad*.5)+'px '+MO;c.textAlign='center';c.fillStyle='#E8E8EE';c.fillText(r.a.charAt(1).toUpperCase(),ax+ad/2,cy+ad*.18);c.textAlign='left'}c.restore()}
    c.font=big?'700 76px '+BC:'600 38px '+MO;c.textAlign='right';c.fillStyle='#FFC83D';var dw=c.measureText(r.v).width;c.fillText(r.v,W-M-24,cy+(big?26:13));c.textAlign='left';
    var nx=ax+ad+22,mw=W-M-24-dw-30-nx,nt=me?BCTONE.you:raid?BCTONE.grey:BCTONE.atk,sub=r.land+' of '+r.fired+' missiles hit';
    if(big){c.font='900 '+L.n1+'px '+SL;var nm=bcClip(c,r.name,mw),ny=cy+12;for(var q=6;q>=1;q--){c.fillStyle=q>4?nt[2]:nt[1];c.fillText(nm,nx+q*2,ny+q)}c.fillStyle=raid?'#F2F2F5':nt[0];c.fillText(nm,nx,ny);c.font='500 24px '+MO;c.fillStyle='rgba(244,246,250,.72)';c.fillText(bcClip(c,sub,mw),nx,cy+46)}
    else{c.font='600 44px '+BC;c.fillStyle=me?'#B9A6FF':raid?'#F2F2F5':'#F4F6FA';c.fillText(bcClip(c,r.name,mw),nx,cy-2);c.font='500 22px '+MO;c.fillStyle='rgba(244,246,250,.72)';c.fillText(bcClip(c,sub,mw),nx,cy+28)}};
  var rh=L.rh[D.pin?1:0],y=L.r0;
  if(!D.rows.length){c.font='500 30px '+MO;c.fillStyle='rgba(244,246,250,.72)';c.fillText('No missile hit a city.',M,L.r0+60)}
  D.rows.forEach(function(r,i){var h=i===0?L.r1:rh;row(r,y,h,i===0);y+=h+L.gap});
  if(D.pin){c.fillStyle='rgba(255,255,255,.3)';for(var x=M;x<W-M;x+=14)c.fillRect(x,y+6,7,4);row(D.pin,y+24,rh,false)}
  /* totals: three columns */
  D.facts.forEach(function(f,i){var x=M+i*A/3;c.font='700 54px '+BC;c.fillStyle=f[2]==='gold'?'#FFC83D':'#F4F6FA';c.fillText(f[0],x,L.fy);c.font='500 24px '+UI;c.fillStyle='rgba(244,246,250,.72)';c.fillText(f[1],x,L.fy+32)});
  /* callouts: one or two cells on the strip */
  if(D.call&&D.call.length){var CC={red:'#FF4D5E',cyan:'#3DF2FF',gold:'#FFC83D'},cw=A/D.call.length;c.fillStyle='rgba(255,255,255,.07)';c.fillRect(M,L.sy,A,L.sh);
    D.call.forEach(function(k2,i){var x=M+i*cw;if(i){c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x,L.sy+14,2,L.sh-28)}c.font='600 22px '+BC;c.fillStyle=CC[k2[2]]||'rgba(244,246,250,.72)';c.fillText(k2[0].toUpperCase(),x+18,L.sy+36);c.font='600 34px '+BC;c.fillStyle='#F4F6FA';c.fillText(bcClip(c,k2[1],cw-36),x+18,L.sy+74)})}
  /* the link spot: the only box on the picture that looks like a button (house rule 11) */
  var ux=(W-L.urlW)/2;c.fillStyle='rgba(61,242,255,.1)';c.fillRect(ux,L.urlY,L.urlW,L.urlH);c.strokeStyle='#3DF2FF';c.lineWidth=2.5;c.strokeRect(ux,L.urlY,L.urlW,L.urlH);c.font='600 '+L.url+'px '+MO;c.fillStyle='#3DF2FF';c.textAlign='center';c.fillText('caldera.social',W/2,L.urlY+L.urlH/2+L.url*.36);c.restore()}
/** the picture (fmt s: 1080x1920 story, p: 1080x1350 post) as a PNG blob. A tainted canvas: again with no photos, then with no map */
function bLbBlob(fmt,o){if(!BLB||!BREP)return Promise.reject(new Error('no board'));o=o||{};fmt=fmt==='p'?'p':'s';var L=BLXL[fmt],D=bLbModel({R:BREP.R,P:BREP.P,S:BREP.R.S,V:BCV},true);
  D.src=o.map===false||typeof cv==='undefined'?null:cv;D.av=o.photos===false?{}:BLB.av;var x=document.createElement('canvas');x.width=L.W;x.height=L.H;bCardFonts();bLbDraw(x.getContext('2d'),D,L);var name=bLbFile(D,fmt);
  return new Promise(function(ok,no){try{x.toBlob(function(b){b?ok({blob:b,name:name}):no(new Error('empty'))},'image/png')}catch(e){if(o.photos!==false)bLbBlob(fmt,{photos:false,map:o.map}).then(ok,no);else if(o.map!==false)bLbBlob(fmt,{photos:false,map:false}).then(ok,no);else no(e)}})}
/** Save / Share (spec section 10, as bCardSave): "Saving...", the share sheet or a download, "Saved" 1.2 s; the hint after a share */
function bLbSave(fmt,btn){var B=BLB;if(!B||B.busy||!B.m.rows.length)return Promise.resolve(false);var lab=btn?btn.querySelector('span')||btn:null,was=lab?lab.textContent:'',set=function(t){if(lab)lab.textContent=t};
  B.busy=1;set('Saving…');if(btn)btn.disabled=true;bCardFonts();bcTr('leaderboard_share_tap',{kind:bcKind(fmt)});
  var free=function(){if(btn)btn.disabled=false;B.busy=0},done=function(ok){set(ok?'Saved':'Could not save. Try again.');setTimeout(function(){set(was);free()},ok?1200:2000);return ok};
  return bLbBlob(fmt).then(function(r){return bcDeliver(r.blob,r.name)}).then(function(k){if(k==='abort'){bcTr('leaderboard_share_done',{ok:false,err:'AbortError'});set(was);free();return false}bcTr('leaderboard_share_done',{ok:true,via:k});if(k==='share')bLbHint();return done(true)},function(e){bcTr('leaderboard_share_done',{ok:false,err:bcErr(e)});return done(false)})}
function bLbHint(){var B=BLB;if(!B||B.hint||!B.el)return;B.hint=true;try{var w=B.el.querySelector('.lb-wrap');if(w)w.insertAdjacentHTML('beforeend',bLbHintHTML())}catch(e){}}
(function(){var A=window.CALDERA_BATTLE_API;if(!A)return;
  /** the signed-in viewer's handle: their own cities read YOU and YOUR on screen (never in a saved picture) */
  A.viewer=function(h){BCV=h?'@'+String(h).replace(/^@/,''):null;return BCV};
  /** the card showing now (for the page and tests): its state, model, and how far in */
  A.card=function(){return BCARD?{id:BCARD.id,kind:BCARD.fly?'fly':BCARD.c.k,state:BCARD.fly?'fly':BCARD.m.state,tau:BCARD.tau,m:BCARD.m,big:BCARD.big}:null};
  A.cards=function(){return BREP?(BREP.cards||(BREP.cards=bCardPlan(BREP.R,reduce))).map(function(c){return {k:c.k,c0:c.c0,len:c.T.len,hold:c.T.h,s0:c.s0,f0:c.f0,f1:c.f1,settle:c.settle,x1:c.x1}}):null};
  A.cardSave=function(fmt){return BCARD&&!BCARD.fly?bCardSave(fmt||'p',BCARD.el&&BCARD.el.querySelector('[data-save="'+(fmt||'p')+'"]')):Promise.resolve(false)};
  A.cardBlob=function(fmt){return bCardBlob(fmt||'p')};
  /** U8: the More menu's "Save strike picture" (key S): the strike that landed last, also paused and after its callout left;
   *  false when none landed yet or the page cannot save. canPic(): 'off' (the page cannot save: no row), 'wait' (dimmed), 'ready' */
  A.canPic=function(){return !bCardCanSave()?'off':BREP&&bCardPick()?'ready':'wait'};
  A.savePic=function(){if(!BREP||!bCardCanSave()||!bCardPick())return false;var b=BCARD&&!BCARD.fly&&BCARD.el?BCARD.el.querySelector('[data-save="p"]'):null;bCardSave('p',b);return true};
  /** the leaderboard at the end of the replay: board() = {m: the model, size} or null; boardSave / boardBlob (fmt s story, p post);
   *  boardHooks({again(demo), exit(), add: href, join: href, signedIn: value or function}) from the hub; boardAct('again'|'exit') for tests */
  A.board=function(){return BLB?{m:BLB.m,size:BLB.size}:null};
  A.boardSave=function(fmt){fmt=fmt==='p'?'p':'s';return BLB?bLbSave(fmt,BLB.el&&BLB.el.querySelector('[data-lb="save"][data-fmt="'+fmt+'"]')):Promise.resolve(false)};
  A.boardBlob=function(fmt){return bLbBlob(fmt==='p'?'p':'s')};
  A.boardHooks=function(o){BLHOOK=o||{};return true};
  A.boardAct=function(k){return bLbAct(k)}})();
`;
