/**
 * Pixel-art building set (citypix.ts). Mike 2026-11-11: "way greater pixelization of objects, video game level of quality
 * ... no small vectors, no big vectors, much smaller vectors, more specific pixelization."
 *
 * Every building face is a texel grid, two texels per world pixel (PXS), painted into a small canvas once (cached, LRU by
 * bytes) and drawn under the isometric skew with nearest-neighbour sampling, so at any zoom the walls read as crisp
 * hand-placed pixels: floor ledges, window frames and sills, mullions, lit rooms with blinds and people, brick courses,
 * cornices, lobbies with doors, steps, canopies and signs, air-conditioners, grime streaks.
 *
 * The same texels carry the battle: a hit building keeps its full height in the data but its texture loses everything
 * above a jagged break line (standing wall spikes, charred edge) and inside craters at the hit points (exposed slabs and
 * rebar, soot running down); the rebuild raises a ragged build line pixel by pixel from the ground up, fresh concrete just
 * below it. Removed texels are what the shatter particles are made of (citybattle.ts bShatterFx).
 *
 * Plain ES5 inside the CITY_JS closure, appended to HIFI_JS: TW, TH, P, night, dpr, rnd, rgb, hex, mix, hn, hmul, fpt,
 * tpt, LODN, document are in scope. Sizes in world px unless a name says texels.
 */
export const PIX_JS = String.raw`
// ---- pixel textures (citypix.ts)
var PXS=2,PXT=new Map(),PXTB=0,PXTN={made:0,hit:0};
function pxBudget(){return (dpr>=2.5?28:dpr>=1.5?24:14)*1048576}
/** a texel canvas by key (row 0 is the top); fill(buf,w,h) paints RGBA into a Uint8ClampedArray */
function pxTex(key,w,h,fill){var s=PXT.get(key);if(s){PXT.delete(key);PXT.set(key,s);PXTN.hit++;return s}
  w=Math.max(1,w|0);h=Math.max(1,h|0);var b=w*h*4;while(PXTB+b>pxBudget()&&PXT.size){var k0=PXT.keys().next().value;PXTB-=PXT.get(k0).b;PXT.delete(k0)}
  var cv=document.createElement('canvas');cv.width=w;cv.height=h;var c=cv.getContext('2d'),buf=new Uint8ClampedArray(b);fill(buf,w,h);
  var ok=false;try{var id=c&&c.createImageData?c.createImageData(w,h):null;if(id&&id.data){id.data.set(buf);c.putImageData(id,0,0);ok=true}}catch(err){}
  s={cv:cv,w:w,h:h,b:b,ok:ok};PXT.set(key,s);PXTB+=b;PXTN.made++;return s}
function pxClear(){PXT=new Map();PXTB=0}
function cmul(c,f){return [c[0]*f,c[1]*f,c[2]*f]}
function cmix(a,b,f){return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f]}
function pxN(s,x,y){var v=Math.sin(s*12.9898+x*78.233+y*37.719)*43758.5453;return v-Math.floor(v)}
/** the painter over a buffer: v counts texels up from the bottom */
function pxPainter(buf,w,h){return {w:w,h:h,
  set:function(x,v,c,a){if(x<0||x>=w||v<0||v>=h)return;var i=((h-1-v)*w+x)*4;buf[i]=c[0];buf[i+1]=c[1];buf[i+2]=c[2];buf[i+3]=a==null?255:a},
  get:function(x,v){if(x<0||x>=w||v<0||v>=h)return null;var i=((h-1-v)*w+x)*4;return [buf[i],buf[i+1],buf[i+2],buf[i+3]]},
  rect:function(x,v,rw,rh,c,a){for(var j=0;j<rh;j++)for(var i=0;i<rw;i++)this.set(x+i,v+j,c,a)},
  mul:function(x,v,f){if(x<0||x>=w||v<0||v>=h)return;var i=((h-1-v)*w+x)*4;buf[i]*=f;buf[i+1]*=f;buf[i+2]*=f},
  tint:function(x,v,c,f){if(x<0||x>=w||v<0||v>=h)return;var i=((h-1-v)*w+x)*4;buf[i]+=(c[0]-buf[i])*f;buf[i+1]+=(c[1]-buf[i+1])*f;buf[i+2]+=(c[2]-buf[i+2])*f},
  cut:function(x,v){if(x<0||x>=w||v<0||v>=h)return;buf[((h-1-v)*w+x)*4+3]=0},
  has:function(x,v){if(x<0||x>=w||v<0||v>=h)return false;return buf[((h-1-v)*w+x)*4+3]>0}}}
// ---- the damage mask. d = damage 0..1 (sixths), f = rebuild 0..1; heights in world px from the ground of the whole building
/** the break height: how much of a building stands after damage d (its top floors are gone) */
function pxBreak(h,d){return d<=0?h:Math.max(8,h*(1-.58*d))}
/** the hit points on the faces below the break: deterministic by seed and damage step (more craters as damage grows) */
function pxCraters(h,d,seed,hw){var out=[],n=Math.round(d*6);for(var k=0;k<n;k++){var side=k%2,u=.2+rnd(seed*1.7+k*3.3)*.6,hb=pxBreak(h,d),v=6+rnd(seed*.9+k*5.1)*Math.max(4,hb-14),r=2.2+rnd(seed+k*7.7)*2.6+d*1.5;out.push({side:side,u:u,v:v,r:Math.min(r,hw*.45)})}return out}
/** the mask of one face: tells whether a texel at (x texels, vt world px from the ground) is still there, and how it looks */
function pxMask(m,side,hwTex){if(!m||!(m.d>0))return null;var hb=pxBreak(m.h,m.d),yb=(m.f||0)*m.h,cr=[];(m.craters||[]).forEach(function(q){if(q.side===side)cr.push(q)});
  return {hb:hb,yb:yb,cr:cr,seed:m.seed||0,
    top:function(x){var s=this.seed,t=hb+(rnd(s+x*.731)-.5)*3+(rnd(s+(x>>2)*1.9)-.5)*7+(rnd(s+(x>>4)*.7)-.5)*6;if(rnd(s+(x>>1)*1.37)<.09)t+=3+rnd(s+(x>>1)*2.2)*6;return t},   // jagged in steps, with stubs of standing wall two texels wide
    build:function(x){return yb<=0?0:yb+(rnd(this.seed+x*.53)-.5)*1.5+(x%3===0?.5:0)},   // the ragged build line, pixel by pixel
    crater:function(x,vt){var u=x/hwTex;for(var k=0;k<cr.length;k++){var q=cr[k],du=(u-q.u)*hwTex/PXS,dv=vt-q.v,e=(du*du)/(q.r*q.r)+(dv*dv)/(q.r*q.r*1.4);if(e<1)return {q:q,e:e}}return null},
    rim:function(x,vt){var u=x/hwTex,best=9;for(var k=0;k<cr.length;k++){var q=cr[k],du=(u-q.u)*hwTex/PXS,dv=vt-q.v,e=(du*du)/(q.r*q.r)+(dv*dv)/(q.r*q.r*1.4);if(e<best)best=e}return best}}}
// ---- the face shader: material, windows, lobby, weathering, then damage. o: side, mat, col [r,g,b], L (P.light), n, litp, seed,
// people, ground, sign, awning, escape, balcony, v0 (height of this block's base above the ground), mask
function pxFace(p,o){var w=p.w,h=p.h,side=o.side,sf=side?.74:1,L=o.L,n=o.n,base=cmul(o.col,L*sf),seed=o.seed||0,mat=o.mat,FH=14,F0=10,litp=o.litp||0,
  glassD=rgb(P.glass&&P.glass[0].charAt(0)==='#'?P.glass[0]:'#C9E3F6'),glassK=rgb(P.glass&&P.glass[1].charAt(0)==='#'?P.glass[1]:'#6D9FCF'),warm=[255,206,128],cool=[214,232,255],dark=[22,26,36],
  pitch=w<26?7:12,ww=pitch-4,x0w=w<26?2:3,mask=o.mask,v0=o.v0||0,fresh=cmix(cmul([205,205,198],L),base,.35),soot=[26,22,20];
  function wall(x,v){var g=1-.09*(1-v/h),nz=1+(pxN(seed,x>>1,v>>1)-.5)*(mat==='brick'?.02:.06);return cmul(base,g*nz)}
  function brick(x,v){var course=Math.floor(v/2),off=course%2?3:0,bx=Math.floor((x+off)/7),mortar=(x+off)%7===6||v%2===1&&pxN(seed,bx,course)<.25;
    if(mortar&&v%2===1)return cmix(base,cmul([210,204,192],L*sf),.45);var f=.9+pxN(seed+2,bx,course)*.18;return cmul(base,f*(1-.08*(1-v/h)))}
  var lit={},litNow=function(r,k){var id=r*17+k*3+side*71;if(lit[id]==null)lit[id]=rnd(seed+r*7.3+k*13.1+side*31.7)<litp?(rnd(seed*.7+r+k)<.22?2:1):0;return lit[id]};
  var rows=Math.max(0,Math.floor((h-F0-4)/FH)),cols=Math.max(1,Math.floor((w-x0w*2+4)/pitch));
  // 1. the wall
  for(var v=0;v<h;v++)for(var x=0;x<w;x++){var c=mat==='brick'?brick(x,v):wall(x,v);
    if(mat==='siding'&&v%2===0)c=cmul(c,.9);if(mat==='tech'&&v%3===0)c=cmul(c,.82);if(mat==='stucco')c=cmul(c,1+(pxN(seed+5,x,v)-.5)*.03);
    p.set(x,v,c)}
  // 2. floors: ledge (light over dark) on punched/brick/stucco, spandrel band on glass; cornice at the very top
  for(var r=0;r<=rows;r++){var fv=F0+r*FH;if(fv>=h-2)break;for(var x1=0;x1<w;x1++){if(mat==='glass'){for(var b=0;b<3;b++)p.set(x1,fv+b,cmul(base,.78))}else if(mat!=='tech'&&mat!=='siding'){p.set(x1,fv,cmul(base,1.16));p.mul(x1,fv-1,.8)}}}
  if(mat!=='siding'){for(var xc=0;xc<w;xc++){p.set(xc,h-1,cmul(base,1.22));p.set(xc,h-2,cmul(base,.72));p.set(xc,h-3,cmul(base,1.1))}}
  // 3. windows
  if(mat==='glass'){var mull=6;for(var r2=0;r2<rows;r2++){var fv2=F0+r2*FH;for(var x2=0;x2<w;x2++){var k=Math.floor(x2/mull),on=litNow(r2,k),pane;
      for(var vv=fv2+3;vv<fv2+FH&&vv<h-3;vv++){var t=(vv-fv2-3)/(FH-3),gl=cmix(glassK,glassD,t*.8+.1);gl=cmul(gl,1+(pxN(seed+9,k,r2)-.5)*.08);
        if(!side&&!n&&((x2+vv)%40)<6)gl=cmix(gl,[255,255,255],.14);   // the sky streak across the lit face
        if(n&&on){var al=.55+rnd(seed+r2*3+k*5)*.45;pane=cmix(gl,on===2?cool:warm,al);if(rnd(seed+r2+k*.3)<.25&&vv%2===0)pane=cmul(pane,.72)}else pane=n?cmul(gl,.9):gl;   // blinds on a quarter of the lit rooms
        if(x2%mull===0)pane=side?cmul(pane,.7):cmix(pane,[255,255,255],.32);p.set(x2,vv,pane)}
      if(on&&o.people>0&&x2%mull===3&&rnd(seed+r2*11.9+k*5.3)<o.people){p.set(x2,fv2+4,dark);p.set(x2,fv2+5,dark);p.set(x2,fv2+6,dark);p.set(x2+1,fv2+5,dark)}}}}
  else if(mat!=='tech'){for(var r3=0;r3<rows;r3++){var fv3=F0+r3*FH;for(var k3=0;k3<cols;k3++){var wx=x0w+k3*pitch,on3=litNow(r3,k3);if(wx+ww>w-1)break;
      var frame=cmul(base,.42),wh=w<26?7:8;p.rect(wx,fv3+3,ww,wh,frame);   // frame
      for(var jy=1;jy<wh-1;jy++)for(var ix=1;ix<ww-1;ix++){var tt=jy/wh,g2=cmix(glassK,glassD,tt);if(n)g2=on3?cmix(g2,on3===2?cool:warm,.6+rnd(seed+r3+k3)*.38):cmul(g2,.8);
        if(n&&on3&&rnd(seed+r3*2+k3)<.3&&jy%2===0)g2=cmul(g2,.7);if(!n&&ix===1)g2=cmix(g2,[255,255,255],.35);p.set(wx+ix,fv3+3+jy,g2)}
      if(ww>4){for(var jm=1;jm<wh-1;jm++)p.set(wx+(ww>>1),fv3+3+jm,cmix(frame,[255,255,255],.5))}   // the mullion
      for(var sx=-1;sx<=ww;sx++)p.set(wx+sx,fv3+2,cmul(base,1.2));   // the sill
      if(mat==='brick'){for(var lx=-1;lx<=ww;lx++)p.set(wx+lx,fv3+3+wh,cmul([200,190,170],L*sf))}   // the stone lintel
      if(on3&&o.people>0&&rnd(seed+r3*5.9+k3*7.1)<o.people){p.set(wx+2,fv3+5,dark);p.set(wx+2,fv3+6,dark);p.set(wx+3,fv3+5,dark)}
      if(side===1&&mat!=='siding'&&rnd(seed+r3*4.1+k3*2.7)<.16)p.rect(wx+1,fv3+3,4,3,cmul([150,155,160],L));   // an air-conditioner in the window
      if(rnd(seed+r3*9.1+k3*3.3)<.13)for(var gy=1;gy<7;gy++)p.mul(wx+2+(k3%3),fv3+2-gy,.86)}}   // grime streak under a window
    if(o.balcony){for(var r4=1;r4<rows;r4+=2){var vb=F0+r4*FH;for(var xb=2;xb<w-2;xb++){p.set(xb,vb+1,cmul([232,228,218],L));p.set(xb,vb,cmul([160,156,148],L));if(xb%3===0)for(var ry=2;ry<6;ry++)p.set(xb,vb+ry,cmul([70,74,82],L))}for(var xr=2;xr<w-2;xr++)p.set(xr,vb+6,cmul([70,74,82],L))}}
    if(o.escape&&side===0){var ek=[30,32,38];for(var r5=0;r5<rows;r5++){var ve=F0+r5*FH+1,xs=Math.floor(w*.5),xe=w-2;for(var xx=xs;xx<=xe;xx++){p.set(xx,ve,ek);if(xx%3===0)for(var ry2=1;ry2<5;ry2++)p.set(xx,ve+ry2,ek)}for(var xx2=xs;xx2<=xe;xx2++)p.set(xx2,ve+5,ek);for(var lz=0;lz<FH-6&&r5<rows-1;lz++)p.set(xe-3-Math.floor(lz*.5),ve+6+lz,ek)}}}
  if(mat==='tech'&&n){for(var xt=1;xt<w-1;xt++)p.set(xt,h-5,[61,242,255])}
  // 4. the lobby on the street face: glazing band, double door with its split, steps, canopy, sign
  if(o.ground&&side===0&&w>12){var gl0=n?cmix(warm,[255,255,255],.1):[40,52,74];for(var xg=1;xg<w-1;xg++)for(var vg=2;vg<F0;vg++)p.set(xg,vg,cmix(wall(xg,vg),gl0,n?.75:.6));
    for(var xm=1;xm<w-1;xm+=5)for(var vm=2;vm<F0;vm++)p.set(xm,vm,cmul(base,.6));   // storefront mullions
    var dx=Math.floor(w/2)-4;p.rect(dx,0,8,F0+1,n?cmix(warm,[255,255,255],.3):[20,26,38]);for(var vd=0;vd<=F0;vd++)p.set(dx+4,vd,n?[255,255,255]:[120,140,170]);p.rect(dx-1,0,10,1,cmul([205,200,190],L));p.rect(dx-2,0,12,1,cmul([170,166,158],L));
    for(var xcn=dx-3;xcn<dx+11;xcn++){p.set(xcn,F0+1,o.awning?(xcn%4<2?o.awning:[240,238,232]):cmul([235,233,226],L));p.set(xcn,F0+2,cmul([160,156,148],L))}
    if(o.sign){var sgc=cmul(o.sign,n?1.25:1);p.rect(2,F0+4,Math.min(14,w-4),5,sgc);for(var xs2=3;xs2<Math.min(15,w-5);xs2++)if(xs2%2===(seed%2))p.set(xs2,F0+6,n?[255,255,255]:cmul(sgc,1.6))}
    if(n){p.set(dx-2,F0-1,[255,230,170]);p.set(dx+9,F0-1,[255,230,170])}}   // sconces by the door
  // 5. edges: the corner between the two faces catches light, the outer edges and the foot are dark
  for(var ve2=0;ve2<h;ve2++){if(side===0){p.tint(w-1,ve2,[255,255,255],.3);p.mul(0,ve2,.72)}else{p.mul(0,ve2,.78);p.mul(w-1,ve2,.6)}}
  for(var xf=0;xf<w;xf++){p.mul(xf,0,.6);p.mul(xf,1,.85)}
  // 6. damage: the break line, standing spikes, craters with their slabs and rebar, soot; then the rebuild line from the ground up
  if(mask){var hwT=w,TBS=[],YBS=[];for(var xp=0;xp<w;xp++){TBS.push(mask.top(xp));YBS.push(mask.build(xp))}
    for(var vd2=0;vd2<h;vd2++){var vt=v0+vd2/PXS;for(var xd=0;xd<w;xd++){var tb=TBS[xd],yb=YBS[xd];
      if(vt<=yb){if(yb-vt<3)p.tint(xd,vd2,fresh,.6);continue}   // rebuilt: as new, the last rows still raw concrete
      if(vt>tb){p.cut(xd,vd2);continue}
      var crt=mask.crater(xd,vt);if(crt){var slab=((vt*PXS)|0)%FH<2&&rnd(seed+xd*.3+vd2*.7)<.75,bar=xd%5===2&&rnd(seed+xd*1.1+(vd2>>2))<.45;
        if(slab)p.set(xd,vd2,cmul([72,68,64],L+.2));else if(bar&&crt.e>.35)p.set(xd,vd2,cmul([70,52,44],L+.3));else p.cut(xd,vd2);continue}
      var rim=mask.rim(xd,vt);if(rim<1.5)p.tint(xd,vd2,soot,.75*(1.5-rim)/.5);
      if(tb-vt<2.5)p.tint(xd,vd2,soot,.7);else if(tb-vt<5&&rnd(seed+xd+vd2)<.5)p.tint(xd,vd2,soot,.35);
      if(mask.cr.length&&rnd(seed+xd*.37)<.5){for(var kq=0;kq<mask.cr.length;kq++){var q=mask.cr[kq],cu=q.u*hwT,below=q.v-vt;if(below>0&&below<q.r*4&&Math.abs(xd-cu)<q.r*PXS*(.4+below/(q.r*4)))p.tint(xd,vd2,soot,.5*(1-below/(q.r*4)))}}}}}}
/** the roof surface (a square texture mapped onto the top diamond): parapet rim, gravel, pavers or a membrane with seams; rubble on a cut */
function pxTop(p,o){var S=p.w,L=o.L,base=cmul(o.col,L*1.18),kind=o.kind||'gravel',seed=o.seed||0,n=o.n;
  for(var t=0;t<S;t++)for(var s=0;s<S;s++){var c;
    if(o.cut==='rubble'){var z=pxN(seed+3,s,t);c=z<.3?cmul(o.col,L*.5):z<.55?cmul([120,112,104],L):z<.7?[30,26,24]:cmul(o.col,L*.95);if(pxN(seed+4,s>>1,t>>1)<.12)c=cmul([200,190,170],L)}
    else if(o.cut==='fresh'){c=cmul([190,190,184],L);if(s%6===0||t%6===0)c=cmul(c,.85);if(pxN(seed,s,t)<.06)c=cmul([230,120,60],L)}
    else if(kind==='pavers'){c=cmul([170,166,158],L);if(s%6===0||t%6===0)c=cmul(c,.8);c=cmul(c,1+(pxN(seed,s>>1,t>>1)-.5)*.06)}
    else if(kind==='membrane'){c=cmul([150,154,160],L);if(s%10===0||t%10===0)c=cmul(c,.78)}
    else if(kind==='garden'){var g=pxN(seed+1,s,t);c=cmul(g<.5?[93,161,78]:g<.8?[76,140,66]:[120,180,90],L);if(n)c=cmul(c,.45)}
    else{var z2=pxN(seed+2,s,t);c=cmul(z2<.5?[142,140,134]:z2<.8?[156,152,144]:[128,126,122],L*(1+(pxN(seed,s>>2,t>>2)-.5)*.1))}
    if(s<2||t<2||s>=S-2||t>=S-2)c=o.cut?cmul(c,.8):(s<2||t<2)?cmix(base,[255,255,255],.25):cmul(base,.85);   // the parapet, lit at the back, in shade at the front
    if(!o.cut&&(s===2||t===2))c=cmul(c,.7);p.set(s,S-1-t,c)}}
// ---- a textured block: left face, right face, top. Returns {hw,hh,top,cutTop (world px above the base where the texture ends)}
var PXMAT={glass:1,punched:1,brick:1,stucco:1,tech:1,siding:1,concrete:1};
function pxBlock(c,px,py,w,h,mat,col,o){o=o||{};var hw=TW/2*w,hh=TH/2*w,L=P.light,n=hn(),cr=rgb(col),wT=Math.max(2,Math.round(hw*PXS)),hT=Math.max(2,Math.round(h*PXS)),seed=o.seed||0,v0=o.v0||0,m=o.mask||null;
  if(h<=0)return {hw:hw,hh:hh,top:py};
  var mk=m?'|m'+m.d+'/'+(Math.round((m.f||0)*m.h*2)/2)+'/'+m.seed+'/'+Math.round(m.h):'',litq=Math.round((o.litp||0)*8)/8,
    kb=mat+'|'+col+'|'+wT+'|'+hT+'|'+litq+'|'+seed+'|'+(o.people||0)+'|'+(o.sign||'')+'|'+(o.awning||'')+'|'+(o.escape?1:0)+(o.balcony?1:0)+(o.ground?1:0)+'|'+palKey+'|'+v0+mk;
  var faces=[0,1].map(function(side){return pxTex('f'+side+'|'+kb,wT,hT,function(buf,W2,H2){pxFace(pxPainter(buf,W2,H2),{side:side,mat:mat,col:cr,L:L,n:n,litp:o.litp,seed:seed+side*3,people:o.people,ground:o.ground,sign:o.sign?rgb(o.sign):null,awning:o.awning?rgb(o.awning):null,escape:o.escape,balcony:o.balcony,v0:v0,mask:pxMask(m,side,W2)})})});
  // where the block ends: whole, or cut by the break (rubble on the cut) or the build line (a fresh slab)
  var cut=null,hTop=h;if(m&&m.d>0){var hb=pxBreak(m.h,m.d),yb=(m.f||0)*m.h,top=Math.max(hb,yb);if(top<v0+h){hTop=Math.max(1,top-v0);cut=yb>hb?'fresh':'rubble'}}
  var S=Math.max(4,Math.round(hw*PXS*.9)),topTex=pxTex('t|'+col+'|'+S+'|'+(o.roof||'gravel')+'|'+seed+'|'+palKey+'|'+(cut||''),S,S,function(buf,W3){pxTop(pxPainter(buf,W3,W3),{col:cr,L:L,n:n,kind:o.roof,seed:seed,cut:cut})});
  c.save();c.imageSmoothingEnabled=false;
  c.save();c.transform(1,hh/hw,0,1,px-hw,py-h);c.drawImage(faces[0].cv,0,0,hw,h);c.restore();
  c.save();c.transform(1,-hh/hw,0,1,px,py+hh-h);c.drawImage(faces[1].cv,0,0,hw,h);c.restore();
  var ty=py-hTop;c.save();c.transform(hw/S,hh/S,-hw/S,hh/S,px,ty-hh);c.drawImage(topTex.cv,0,0);c.restore();
  c.restore();
  if(o.ao!==false&&LODN>0){var g=c.createLinearGradient(0,py-Math.min(h,10),0,py+hh);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(n?.35:.22)+')');poly(c,[[px-hw,py],[px,py+hh],[px+hw,py],[px+hw,py-Math.min(h,10)],[px,py+hh-Math.min(h,10)],[px-hw,py-Math.min(h,10)]],g)}
  return {hw:hw,hh:hh,top:ty,cut:cut,hTop:hTop}}
/** the texel-sized squares a building's lost part is made of: sampled across the removed volume, in its own colours.
 *  Returns [{x,y,col,g}] in world px (g = where it lands), at most max of them */
function pxShards(px,py,w,h,col,d,seed,max){var hw=TW/2*w,hh=TH/2*w,hb=pxBreak(h,d),n=hn(),L=P.light,out=[],cr=rgb(col),pal=[hex(cmul(cr,L)),hex(cmul(cr,L*.8)),hex(cmul(cr,L*.6)),n?'#F5D28A':'#C9E3F6','#8A8A93','#3A3D47',hex(cmul(cr,L*1.1))];
  var lost=Math.max(3,h-hb),N=Math.min(max,Math.round(lost*hw*.5));for(var k=0;k<N;k++){var s=seed+k*1.618,side=rnd(s)<.5?0:1,u=rnd(s+1.1),v=hb+rnd(s+2.2)*lost,q=fpt(px,py,hw,hh,side,u,v);
    if(rnd(s+3.3)<.18){var tq=tpt(px,py-h,hw,hh,rnd(s+4)*2-1,rnd(s+5)*2-1);q=tq}
    out.push({x:q[0],y:q[1],col:pal[Math.floor(rnd(s+6.6)*pal.length)],g:py+(rnd(s+7.7)-.5)*hh*1.6,side:side,u:u})}return out}
/** the rubble heap at a hit building's foot: a deterministic mound of texel squares in the building's colours (cached layer).
 *  d = damage, f = rebuild progress (the heap is carted away as the floors come back) */
function pxHeap(c,px,py,w,col,d,f,seed){if(d<=0||f>=1)return;var hw=TW/2*w,hh=TH/2*w,L=P.light,cr=rgb(col),keep=1-f,N=Math.round((60+d*220)*keep),n=hn(),
  pal=[hex(cmul(cr,L*.95)),hex(cmul(cr,L*.75)),hex(cmul(cr,L*.55)),hex(cmul([120,112,104],L)),hex(cmul([150,146,140],L)),'#2A2624',hex(cmul([200,190,170],L))];
  c.save();c.fillStyle='rgba(0,0,0,'+(n?.3:.18)+')';c.beginPath();c.ellipse(px,py+2,hw*1.2*(.6+d*.4),hh*1.2*(.6+d*.4),0,0,7);c.fill();
  for(var k=0;k<N;k++){var s=seed*.37+k*2.399,a=rnd(s)*6.283,r=Math.sqrt(rnd(s+1))*(.55+d*.5),ex=Math.cos(a)*(hw*1.15)*r,ey=Math.sin(a)*(hh*1.15)*r,ht=(1-r)*(3+d*5)*keep+rnd(s+2)*1.5,sz=.5+rnd(s+3)*1.2;
    c.fillStyle=pal[Math.floor(rnd(s+4)*pal.length)];c.fillRect(px+ex-sz/2,py+ey-ht-sz/2,sz,sz);if(rnd(s+5)<.3){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(px+ex-sz/2,py+ey-ht-sz/2,sz,sz*.4)}}
  c.restore()}
`;
