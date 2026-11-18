/**
 * The Frontier on the world map (frontier-design F and G, Fable mockups 06 and 07, Mike 11-17): unclaimed GitHub lands sit
 * in a ring around the members' grid, nearest to the member who added them. They draw fogged: grey with a little of their
 * colour, tinted per sky, no window lights, cranes, steam, crews or building names; ground fog, a dashed plot line, a blank
 * flag and one dashed label "@login · Unclaimed". Zoomed far out (or past 24 in view) a land is a fogged diamond.
 * Tapping one opens the unclaimed card. The hub sends these lands as districts with uc: 1 (frontier.ts).
 */

/** placement (runs inside the world layout, after the neighbourhoods are sized): members on the grid, lands in rings */
export const FRONTIER_LAYOUT_JS = String.raw`
var UCL=NBS.filter(function(n){var d=n.ds[0];if(d&&d.uc){n.uc=1;n.by=d.by||null;n.slot=d.slot||0}return !!n.uc}),MEMS=NBS.filter(function(n){return !n.uc});
var GAP=5,cols=Math.max(1,Math.ceil(Math.sqrt(Math.max(1,MEMS.length)*1.3))),rows=Math.max(1,Math.ceil(Math.max(1,MEMS.length)/cols)),RING=0;
if(UCL.length){RING=1;while(RING<12){var cap=0;for(var rk=1;rk<=RING;rk++)cap+=2*(cols+2*rk)+2*(rows+2*rk)-4;if(cap>=UCL.length)break;RING++}}
MEMS.forEach(function(n,ix){n.cx=RING+ix%cols;n.cy=RING+Math.floor(ix/cols)});
if(UCL.length){var UCELLS=[],UUSED={};for(var rk2=1;rk2<=RING;rk2++)for(var gy=RING-rk2;gy<=RING+rows-1+rk2;gy++)for(var gx=RING-rk2;gx<=RING+cols-1+rk2;gx++)if(gx===RING-rk2||gx===RING+cols-1+rk2||gy===RING-rk2||gy===RING+rows-1+rk2)UCELLS.push([gx,gy,rk2]);
  UCL.sort(function(a,b){return a.slot-b.slot||(a.key<b.key?-1:1)}).forEach(function(n){var by=n.by&&NBM[n.by]&&!NBM[n.by].uc?NBM[n.by]:null,ax=by?by.cx:RING+(cols-1)/2,ay=by?by.cy:RING+(rows-1)/2,best=null,bs=Infinity;
    UCELLS.forEach(function(c){var k=c[0]+','+c[1];if(UUSED[k])return;var s=c[2]*1e6+(c[0]-ax)*(c[0]-ax)+(c[1]-ay)*(c[1]-ay);if(s<bs){bs=s;best=c}});
    if(best){UUSED[best[0]+','+best[1]]=1;n.cx=best[0];n.cy=best[1]}})}
cols+=2*RING;rows+=2*RING;
`;

/** drawing, the card and the hooks (after the renderer's helpers exist) */
export const FRONTIER_DRAW_JS = String.raw`
var UCF={day:{col:'#C9D3E0',mix:.38,keep:.22,alpha:.78,puff:'232,238,246',pa:.34,line:'rgba(40,52,74,.6)'},
  dusk:{col:'#6F6391',mix:.44,keep:.20,alpha:.74,puff:'150,136,186',pa:.30,line:'rgba(226,214,255,.55)'},
  night:{col:'#1E2440',mix:.56,keep:.16,alpha:.70,puff:'74,84,128',pa:.42,line:'rgba(190,204,240,.5)'}},UCC={},UCFULL={},UCN=[],UCMAX=24;
function ucSky(){return sky==='day'||sky==='dusk'?sky:'night'}
function ucIs(t){return !!(t&&t.d&&t.d.uc)}
function ucFog(hx){var s=ucSky(),k=s+hx;if(UCC[k])return UCC[k];var F=UCF[s],c=rgb(hx),t=rgb(F.col),l=.2126*c[0]+.7152*c[1]+.0722*c[2];
  return UCC[k]=hex(c.map(function(v,i){var a=l*(1-F.keep)+v*F.keep;return a+(t[i]-a)*F.mix}))}
function ucCorners(n){return [iso(n.ox-.5,n.oy-.5),iso(n.ox+n.w-.5,n.oy-.5),iso(n.ox+n.w-.5,n.oy+n.h-.5),iso(n.ox-.5,n.oy+n.h-.5)]}
function ucPre(vv){UCFULL={};UCN=NBS.filter(function(n){return n.uc});if(!UCN.length)return;var mx=(vv[0]+vv[1])/2,my=(vv[2]+vv[3])/2,vis=[];
  UCN.forEach(function(n){var q=ucCorners(n),x0=q[3].x-20,x1=q[1].x+20,y0=q[0].y-120,y1=q[2].y+30;n.ucv=!(x1<vv[0]||x0>vv[1]||y1<vv[2]||y0>vv[3]);if(n.ucv)vis.push({n:n,d:Math.hypot((x0+x1)/2-mx,(y0+y1)/2-my)})});
  if(cam.z<.35)return;vis.sort(function(a,b){return a.d-b.d}).slice(0,UCMAX).forEach(function(o){UCFULL[o.n.key]=1})}
function ucFull(t){return !!UCFULL[t.d.nb]}
function ucPuff(c,x,y,rx,ry,rgbs,a){c.save();c.translate(x,y);c.scale(1,ry/rx);var g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'rgba('+rgbs+','+a+')');g.addColorStop(.55,'rgba('+rgbs+','+(a*.55)+')');g.addColorStop(1,'rgba('+rgbs+',0)');c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,7);c.fill();c.restore()}
function ucFlag(c,x,y,col,wave){var fy=y-24;c.fillStyle='#141824';c.fillRect(x-1.5,y-25,3,26);c.fillStyle='#C9D2E6';c.fillRect(x-.5,y-25,1,25);
  c.save();c.translate(x+1.5,fy);var w=13,h=8,s=wave?1:0;c.beginPath();c.moveTo(0,0);c.lineTo(w*.5,s);c.lineTo(w,0);c.lineTo(w,h);c.lineTo(w*.5,h+s);c.lineTo(0,h);c.closePath();
  if(col){c.fillStyle=col;c.fill();c.strokeStyle='rgba(10,12,20,.75)';c.lineWidth=1;c.stroke()}
  else{c.fillStyle='rgba(238,242,250,.94)';c.fill();c.strokeStyle='rgba(10,12,20,.8)';c.lineWidth=1;c.setLineDash([2,1.5]);c.stroke();c.setLineDash([])}
  c.restore()}
function ucDraw(c){if(!UCN.length)return;var F=UCF[ucSky()],z=cam.z;
  UCN.forEach(function(n){if(!n.ucv)return;var q=ucCorners(n),mx=(q[0].x+q[2].x)/2,my=(q[0].y+q[2].y)/2,hw=Math.max(20,(q[1].x-q[3].x)/2),hh=Math.max(10,(q[2].y-q[0].y)/2),k=hw/88,gx=10*k,gy=5*k;
    var P4=[[q[0].x,q[0].y-gy],[q[1].x+gx,q[1].y],[q[2].x,q[2].y+gy],[q[3].x-gx,q[3].y]];
    if(!UCFULL[n.key]){c.globalAlpha=.5;c.fillStyle=F.col;poly(c,P4);c.fill();c.globalAlpha=1}
    else{ucPuff(c,mx-40*k,my+8*k,62*k,26*k,F.puff,F.pa);ucPuff(c,mx+34*k,my-2*k,56*k,24*k,F.puff,F.pa*.9);ucPuff(c,mx,my+18*k,70*k,24*k,F.puff,F.pa*.8)}
    c.save();c.setLineDash([6/z,5/z]);c.lineWidth=Math.max(1,1.5/z);c.strokeStyle=F.line;poly(c,P4);c.stroke();c.restore();
    var fk=Math.max(1,14/(26*z));c.save();c.translate(q[2].x,q[2].y+gy);c.scale(fk,fk);ucFlag(c,0,0,null,0);c.restore();
    if(n.rep)hits.push({uc:n,d:n.rep.d,x0:q[3].x,x1:q[1].x,y0:q[0].y-Math.max(40,hh),y1:q[2].y+gy})})}
function ucPill(c,x,y,text,font){c.font=font;var w=c.measureText(text).width+14,h=18;c.save();c.fillStyle='rgba(15,16,22,.72)';c.beginPath();
  if(c.roundRect)c.roundRect(x-w/2,y-h+2,w,h,9);else c.rect(x-w/2,y-h+2,w,h);c.fill();c.setLineDash([3,2]);c.strokeStyle='rgba(201,210,230,.7)';c.lineWidth=1;c.stroke();c.setLineDash([]);
  c.fillStyle='#D7DDEA';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+2.5);c.textBaseline='alphabetic';c.restore()}
function ucBase(){var ks=Object.keys(WORLD&&WORLD.m||{});for(var i=0;i<ks.length;i++){var u=WORLD.m[ks[i]].page;if(u&&/^https?:/.test(u)){try{return new URL(u).origin}catch(err){}}}return ''}
var UCGH='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
  UCFL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m0 0h12l-2.5 4 2.5 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 2.5"/></svg>';
function ucCard(b){var key=b.d.nb,lg=key.slice(1),u=(WORLD.uc||{})[key]||{},base=ucBase(),me=worldMe(),mine=!!(me&&u.by&&me===String(u.by).toLowerCase()),n=NBM[key],
  nrep=n?n.ds.reduce(function(s,d){return s+d.repos.length},0):b.d.repos.length,all=u.n||nrep,dt=u.at?new Date(u.at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'',
  claim=base+'/claim/'+encodeURIComponent(lg),arm=typeof window.CALDERA_ARMORY_TARGET==='function'&&window.CALDERA_ARMORY_TARGET(null);sel=null;
  card.classList.remove('is-dir');card.setAttribute('role','dialog');card.setAttribute('aria-labelledby','uc-n');
  card.innerHTML='<button type="button" class="x uc-x" aria-label="Close">&times;</button><span class="uc-tag">'+UCFL+'Unclaimed</span><h2 class="uc-n" id="uc-n">'+e(key)+'</h2>'
    +'<p class="uc-by">'+(u.by?'added by <a href="'+e(base+'/'+u.by+'/')+'">'+e(u.by)+'</a>':'added by Caldera')+(dt?' &middot; '+e(dt):'')+'</p>'
    +(mine?'<p class="uc-p">You added this land. You earn 50 credits when they claim it.</p>':'')
    +'<p class="uc-p">Built from public GitHub data. Not a Caldera member yet.</p>'
    +'<dl class="uc-dl"><dt>City</dt><dd>'+all+' public repo'+(all===1?'':'s')+(all>nrep?', '+nrep+' shown':', 1 building each')+'</dd><dt>Battles</dt><dd>Can be a target. Damage is for show and heals by the next day.</dd></dl>'
    +'<div class="uc-btn"><a class="uc-go" href="'+e(claim)+'">'+UCGH+'Claim this land</a>'+(arm?'<button type="button" class="uc-2" data-uc-arm>Target in the Armory</button>':'')+(mine?'<button type="button" class="uc-2" data-uc-copy>Copy the claim link</button>':'')+'</div>'
    +'<p class="uc-s">Is this your GitHub? Sign in with GitHub to prove it. The lights come on.</p><a class="uc-rm" href="'+e(claim+'/remove')+'">Remove my land</a>';
  card.hidden=false;var x=card.querySelector('.x');x.onclick=function(){WFOCUS=null;show(null)};
  var ab=card.querySelector('[data-uc-arm]');if(ab)ab.onclick=function(){WFOCUS=null;show(null);window.CALDERA_ARMORY_TARGET(key)};
  var cb=card.querySelector('[data-uc-copy]');if(cb)cb.onclick=function(){var done=function(){cb.textContent='Copied';setTimeout(function(){cb.textContent='Copy the claim link'},2000)},
    fail=function(){var i=document.createElement('input');i.readOnly=true;i.value=claim;i.className='uc-url';i.setAttribute('aria-label','Claim link');cb.replaceWith(i);i.focus();i.select()};
    try{navigator.clipboard.writeText(claim).then(done,fail)}catch(err){fail()}};
  draw()}
`;

export const FRONTIER_CSS = String.raw`
.c-card:has(.uc-tag){border-style:dashed;border-color:rgba(201,210,230,.45)}
.c-card .uc-x{position:absolute;right:2px;top:2px;width:44px;height:44px;border:0;background:transparent;color:#C9D2E6;font-size:20px;cursor:pointer;border-radius:50%}
.c-card .uc-x:focus-visible,.c-card .uc-go:focus-visible,.c-card .uc-2:focus-visible,.c-card .uc-rm:focus-visible,.c-card .uc-by a:focus-visible{outline:2px solid #3DF2FF;outline-offset:2px}
.uc-tag{display:inline-flex;align-items:center;gap:5px;font:600 10.5px/1 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:4px 7px;border-radius:5px;border:1px dashed rgba(201,210,230,.6);color:#D7DDEA}
.uc-tag svg{width:11px;height:11px}
.c-card .uc-n{margin:8px 40px 0 0;font:600 16px/1.2 'IBM Plex Sans',Arial,sans-serif;color:#fff;overflow-wrap:anywhere}
.uc-by{margin:2px 0 8px;font:500 11.5px/1.3 'IBM Plex Mono',ui-monospace,monospace;color:#9A9AA5}.uc-by a{color:#B9A6FF}
.uc-p{margin:0 0 8px;color:#C9D2E6}
.uc-dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 10px;margin:0 0 10px;font-size:12.5px}.uc-dl dt{color:#9A9AA5}.uc-dl dd{margin:0;color:#F2F2F5}
.uc-btn{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 4px}
.uc-go{display:inline-flex;align-items:center;justify-content:center;gap:7px;font:600 13px/1 'IBM Plex Sans',Arial,sans-serif;background:#8B6CF6;color:#fff !important;border:0;border-radius:999px;padding:0 14px;min-height:36px;cursor:pointer;text-decoration:none !important}
.uc-go svg{width:15px;height:15px}
.uc-2{display:inline-flex;align-items:center;font:500 13px/1 'IBM Plex Sans',Arial,sans-serif;background:transparent;color:#E8EEF8;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:0 12px;min-height:36px;cursor:pointer;text-decoration:none}
.uc-s{margin:0 0 8px;font-size:11.5px;color:#9A9AA5}
.uc-rm{display:inline-flex;align-items:center;min-height:32px;font-size:12px;color:#C9D2E6 !important;text-decoration:underline;text-underline-offset:2px}
.uc-url{width:100%;box-sizing:border-box;min-height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#161822;color:#E8EEF8;font:12px 'IBM Plex Mono',monospace;padding:0 8px}
.c-card.is-sheet .uc-go,.c-card.is-sheet .uc-2{min-height:44px;flex:1 1 auto}.c-card.is-sheet .uc-rm{min-height:44px}
@media (max-width:520px) and (min-height:600px) and (max-height:720px){.c-card:has(.uc-tag){font-size:12px;padding:10px 12px}.c-card .uc-n{font-size:14.5px;margin-top:6px}.uc-dl{font-size:11.5px;margin-bottom:8px}.uc-s{font-size:11px}}
`;
