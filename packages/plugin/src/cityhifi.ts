/**
 * High-detail city art (Mike 2026-11-07: "too pixely, too blocky ... increase the fidelity, increase the detail level").
 * Ported from the approved design r-caldera-hifi-5fc89e3d (BUILD-NOTE.md, the NEW.* reference renderers) into CITY_JS.
 * Plain ES5 inside the CITY_JS closure: TW, TH, P, sky, night, T, reduce, cam, dpr, vw, vh, rnd, hash, rgb, hex, poly,
 * dia, iso, palKey are in scope. Every drawing function takes world coordinates and draws with the camera transform set.
 *
 * Parts: prismHi/facadeHi/roofHi (buildings), trees, street furniture, lamps and their pools, AO, houses and house lots,
 * lots in the making (zoned, graded, framed), mid-rise, tower and campus (three variants each), crane, scaffold, crews,
 * cars, water ripples, the battle damage set (scorch, rubble, smoke, tarp, tape), and the sprite atlas with its LOD rules.
 */
import { PIX_JS } from "./citypix";
export const HIFI_JS = String.raw`
// ---- high-detail drawing set (cityhifi.ts)
var NL={x:-.894,y:.447},NR={x:.894,y:.447},LODN=1;
function hn(){return night}
function hmul(h,f){var c=rgb(h);return hex([c[0]*f,c[1]*f,c[2]*f])}
function hto(h,f,t){return mix(h,f,t)}
function hRgba(h,a){var c=rgb(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}
function hline(c,x0,y0,x1,y1){c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}
// a point on a face (side 0 left, 1 right; u along the face, v up from the base) and on the top diamond (ui, vj in -1..1)
function fpt(px,py,hw,hh,side,u,v){if(side===0)return [px-hw+hw*u,py+hh*u-v];return [px+hw*u,py+hh-hh*u-v]}
function tpt(px,ty,hw,hh,ui,vj){return [px+(ui-vj)*hw/2,ty+(ui+vj)*hh/2]}
function pdia(x,y,s){var hw=TW/2*s,hh=TH/2*s;return [[x,y-hh],[x+hw,y],[x,y+hh],[x-hw,y]]}
function prismHi(c,px,py,w,h,col,o){o=o||{};var hw=TW/2*w,hh=TH/2*w,L=P.light,n=hn();if(h<=0)return {hw:hw,hh:hh,top:py};
  var g=c.createLinearGradient(0,py-h,0,py+hh);g.addColorStop(0,hmul(col,1.02*L));g.addColorStop(.82,hmul(col,.9*L));g.addColorStop(1,hmul(col,.72*L));
  poly(c,[[px-hw,py],[px,py+hh],[px,py+hh-h],[px-hw,py-h]],g);
  var g2=c.createLinearGradient(0,py-h,0,py+hh);g2.addColorStop(0,hmul(col,.72*L));g2.addColorStop(.82,hmul(col,.62*L));g2.addColorStop(1,hmul(col,.5*L));
  poly(c,[[px,py+hh],[px+hw,py],[px+hw,py-h],[px,py+hh-h]],g2);
  var g3=c.createLinearGradient(px-hw,py-h-hh,px+hw,py-h+hh);g3.addColorStop(0,hmul(col,1.24*L+(L<1?.14:0)));g3.addColorStop(1,hmul(col,1.08*L+(L<1?.1:0)));
  poly(c,[[px,py-hh-h],[px+hw,py-h],[px,py+hh-h],[px-hw,py-h]],g3);
  if(o.floors&&LODN>0){var fh=o.floorH||7,f0=o.floor0||5;c.strokeStyle='rgba(0,0,0,'+(n?.22:.13)+')';c.lineWidth=.9;c.beginPath();for(var v=f0;v<h-2;v+=fh){var a=fpt(px,py,hw,hh,0,0,v),b=fpt(px,py,hw,hh,0,1,v),d=fpt(px,py,hw,hh,1,1,v);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(d[0],d[1])}c.stroke();
    c.strokeStyle='rgba(255,255,255,'+(n?.04:.1)+')';c.beginPath();for(var v2=f0+1;v2<h-2;v2+=fh){var a2=fpt(px,py,hw,hh,0,0,v2),b2=fpt(px,py,hw,hh,0,1,v2),d2=fpt(px,py,hw,hh,1,1,v2);c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1]);c.lineTo(d2[0],d2[1])}c.stroke()}
  if(o.brick&&LODN>0){c.strokeStyle='rgba(0,0,0,'+(n?.1:.07)+')';c.lineWidth=.5;c.beginPath();for(var v3=2;v3<h-1;v3+=2.2){var a3=fpt(px,py,hw,hh,0,0,v3),b3=fpt(px,py,hw,hh,0,1,v3),d3=fpt(px,py,hw,hh,1,1,v3);c.moveTo(a3[0],a3[1]);c.lineTo(b3[0],b3[1]);c.lineTo(d3[0],d3[1])}c.stroke()}
  c.strokeStyle='rgba(255,255,255,'+(n?.1:.28)+')';c.lineWidth=.8;hline(c,px,py+hh,px,py+hh-h);
  c.strokeStyle='rgba(0,0,0,'+(n?.5:.3)+')';c.lineWidth=.6;c.beginPath();c.moveTo(px-hw,py);c.lineTo(px,py+hh);c.lineTo(px+hw,py);c.lineTo(px+hw,py-h);c.lineTo(px,py-h-hh);c.lineTo(px-hw,py-h);c.closePath();c.stroke();
  if(o.parapet!==false&&w>.2&&LODN>0){c.strokeStyle='rgba(255,255,255,'+(n?.08:.3)+')';c.lineWidth=1;var ty=py-h,s=.86;poly(c,[[px,ty-hh*s],[px+hw*s,ty],[px,ty+hh*s],[px-hw*s,ty]]);c.stroke()}
  return {hw:hw,hh:hh,top:py-h}}
// windows: 'glass' curtain wall, 'punched', 'balcony' (slabs on odd floors), 'escape' (fire escape on the left face);
// o.ground draws the street floor (glazing band, double door, steps, canopy or awning, sign)
function facadeHi(c,px,py,w,h,style,litp,seed,o){o=o||{};if(LODN===0)return;var hw=TW/2*w,hh=TH/2*w,n=hn(),fh=7,f0=5,rows=Math.max(0,Math.floor((h-f0-3)/fh));
  for(var side=0;side<2;side++){var cols=Math.max(2,Math.round(hw/8));
    if(style==='glass'){c.save();poly(c,[fpt(px,py,hw,hh,side,0,1),fpt(px,py,hw,hh,side,1,1),fpt(px,py,hw,hh,side,1,h-1),fpt(px,py,hw,hh,side,0,h-1)]);c.clip();
      var gg=c.createLinearGradient(0,py-h,0,py+hh);gg.addColorStop(0,hRgba(P.glass[0].charAt(0)==='#'?P.glass[0]:'#C9E3F6',side?.35:.55));gg.addColorStop(1,hRgba(P.glass[1].charAt(0)==='#'?P.glass[1]:'#6D9FCF',side?.3:.45));c.fillStyle=gg;c.fillRect(px-hw-2,py-h-hh-2,hw*2+4,h+hh*2+4);
      if(!side&&!n){var gx=c.createLinearGradient(px-hw,py-h,px,py+hh);gx.addColorStop(.28,'rgba(255,255,255,0)');gx.addColorStop(.42,'rgba(255,255,255,.3)');gx.addColorStop(.5,'rgba(255,255,255,.08)');gx.addColorStop(.6,'rgba(255,255,255,0)');c.fillStyle=gx;c.fillRect(px-hw-2,py-h-hh-2,hw+4,h+hh*2+4)}
      for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){if(!(rnd(seed+r*7.3+k*13.1+side*31.7)<litp))continue;var u0=k/cols+.02,u1=(k+1)/cols-.02,v0=f0+r*fh+1.2,v1=v0+fh-2.2,cool=rnd(seed*.7+r+k)<.22,al=.5+rnd(seed+r*3+k*5)*.45;
        poly(c,[fpt(px,py,hw,hh,side,u0,v0),fpt(px,py,hw,hh,side,u1,v0),fpt(px,py,hw,hh,side,u1,v1),fpt(px,py,hw,hh,side,u0,v1)],cool?'rgba(214,232,255,'+al+')':'rgba(255,210,130,'+al+')');
        if(rnd(seed+r*11.9+k*5.3)<(o.people||0)){var wp=fpt(px,py,hw,hh,side,(u0+u1)/2,v0);c.fillStyle='rgba(30,22,16,.8)';c.beginPath();c.arc(wp[0]+(rnd(seed+r+k)-.5)*2,wp[1]-(v1-v0)*.55,.7,0,7);c.fill();c.beginPath();c.ellipse(wp[0],wp[1]-(v1-v0)*.18,1.4,.9,0,Math.PI,0);c.fill()}}
      c.restore();
      c.strokeStyle='rgba(255,255,255,'+(n?.07:.26)+')';c.lineWidth=.6;c.beginPath();for(var m=1;m<cols;m++){var a=fpt(px,py,hw,hh,side,m/cols,2),b=fpt(px,py,hw,hh,side,m/cols,h-2);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke();
      c.strokeStyle='rgba(0,0,0,'+(n?.3:.2)+')';c.lineWidth=1.2;c.beginPath();for(var r2=0;r2<=rows;r2++){var va=f0+r2*fh,a4=fpt(px,py,hw,hh,side,0,va),b4=fpt(px,py,hw,hh,side,1,va);c.moveTo(a4[0],a4[1]);c.lineTo(b4[0],b4[1])}c.stroke()}
    else{for(var r3=0;r3<rows;r3++)for(var k3=0;k3<cols;k3++){var on2=rnd(seed+r3*7.3+k3*13.1+side*31.7)<litp,u2=(k3+.2)/cols,u3=(k3+.8)/cols,v2=f0+r3*fh+1.5,v3=v2+4;
        var q=[fpt(px,py,hw,hh,side,u2,v2),fpt(px,py,hw,hh,side,u3,v2),fpt(px,py,hw,hh,side,u3,v3),fpt(px,py,hw,hh,side,u2,v3)];
        poly(c,[[q[0][0]-.5,q[0][1]+.5],[q[1][0]+.5,q[1][1]+.5],[q[2][0]+.5,q[2][1]-.5],[q[3][0]-.5,q[3][1]-.5]],'rgba(0,0,0,'+(n?.45:.38)+')');
        if(on2)poly(c,q,'rgba(255,208,120,'+(.6+rnd(seed+r3+k3)*.38)+')');else{var wg=c.createLinearGradient(0,q[3][1],0,q[0][1]);wg.addColorStop(0,n?'#101827':'#A9CBE8');wg.addColorStop(1,n?'#1A2338':'#5B86B3');poly(c,q,wg)}
        c.strokeStyle='rgba(255,255,255,'+(n?.08:.35)+')';c.lineWidth=.5;var mm0=fpt(px,py,hw,hh,side,(u2+u3)/2,v2),mm1=fpt(px,py,hw,hh,side,(u2+u3)/2,v3);hline(c,mm0[0],mm0[1],mm1[0],mm1[1]);
        c.strokeStyle='rgba(255,255,255,'+(n?.1:.4)+')';c.lineWidth=.7;hline(c,q[0][0]-.6,q[0][1]+.6,q[1][0]+.6,q[1][1]+.6);
        if(o.shutters){var sc=hRgba(o.shutters,.9);poly(c,[fpt(px,py,hw,hh,side,u2-.07,v2),fpt(px,py,hw,hh,side,u2-.01,v2),fpt(px,py,hw,hh,side,u2-.01,v3),fpt(px,py,hw,hh,side,u2-.07,v3)],sc);poly(c,[fpt(px,py,hw,hh,side,u3+.01,v2),fpt(px,py,hw,hh,side,u3+.07,v2),fpt(px,py,hw,hh,side,u3+.07,v3),fpt(px,py,hw,hh,side,u3+.01,v3)],sc)}}
      if(style==='balcony'){var N=side?NR:NL,d=3.2;for(var r4=1;r4<rows;r4+=2){var vb=f0+r4*fh,p0=fpt(px,py,hw,hh,side,.08,vb),p1=fpt(px,py,hw,hh,side,.92,vb),p2=[p1[0]+N.x*d,p1[1]+N.y*d],p3=[p0[0]+N.x*d,p0[1]+N.y*d];
        poly(c,[p0,p1,p2,p3],n?'#4A4F5C':'#E8E4DA');poly(c,[p3,p2,[p2[0],p2[1]+1.3],[p3[0],p3[1]+1.3]],n?'#2F333D':'#A9A49A');
        c.strokeStyle=n?'rgba(200,205,215,.35)':'rgba(60,64,72,.6)';c.lineWidth=.5;c.beginPath();for(var rr=0;rr<=4;rr++){var rp=[p3[0]+(p2[0]-p3[0])*rr/4,p3[1]+(p2[1]-p3[1])*rr/4];c.moveTo(rp[0],rp[1]);c.lineTo(rp[0],rp[1]-3)}c.moveTo(p3[0],p3[1]-3);c.lineTo(p2[0],p2[1]-3);c.stroke()}}
      if(style==='escape'&&side===0){c.strokeStyle='rgba(40,44,52,'+(n?.9:.75)+')';c.lineWidth=.7;for(var r5=0;r5<rows;r5++){var ve=f0+r5*fh+.5,e0=fpt(px,py,hw,hh,0,.55,ve),e1=fpt(px,py,hw,hh,0,.95,ve),e2=fpt(px,py,hw,hh,0,.95,ve+fh);c.beginPath();c.moveTo(e0[0],e0[1]);c.lineTo(e1[0],e1[1]);c.moveTo(e0[0],e0[1]);c.lineTo(e0[0],e0[1]-3);c.lineTo(e1[0],e1[1]-3);c.lineTo(e1[0],e1[1]);c.moveTo(e1[0]-1,e1[1]);c.lineTo(e2[0]-5,e2[1]-1);c.stroke()}}}}
  if(o.ground===false)return;
  var n0=NL,u0d=.38,u1d=.62,dv=6.5;
  poly(c,[fpt(px,py,hw,hh,0,.03,1),fpt(px,py,hw,hh,0,.97,1),fpt(px,py,hw,hh,0,.97,5),fpt(px,py,hw,hh,0,.03,5)],n?'rgba(255,205,130,.42)':'rgba(40,50,70,.42)');
  poly(c,[fpt(px,py,hw,hh,0,u0d,.4),fpt(px,py,hw,hh,0,u1d,.4),fpt(px,py,hw,hh,0,u1d,dv),fpt(px,py,hw,hh,0,u0d,dv)],n?'rgba(255,220,160,.75)':'rgba(18,24,36,.85)');
  c.strokeStyle=n?'rgba(255,255,255,.2)':'rgba(255,255,255,.55)';c.lineWidth=.5;var dm0=fpt(px,py,hw,hh,0,.5,.4),dm1=fpt(px,py,hw,hh,0,.5,dv);hline(c,dm0[0],dm0[1],dm1[0],dm1[1]);
  for(var st=0;st<2;st++){var d1=1.6+st*1.6,sa=fpt(px,py,hw,hh,0,u0d-.03,0),sb=fpt(px,py,hw,hh,0,u1d+.03,0);poly(c,[[sa[0]+n0.x*(d1-1.6),sa[1]+n0.y*(d1-1.6)],[sb[0]+n0.x*(d1-1.6),sb[1]+n0.y*(d1-1.6)],[sb[0]+n0.x*d1,sb[1]+n0.y*d1],[sa[0]+n0.x*d1,sa[1]+n0.y*d1]],n?'#3C4049':'#CFCBC2')}
  var ca=fpt(px,py,hw,hh,0,u0d-.1,dv+.6),cb=fpt(px,py,hw,hh,0,u1d+.1,dv+.6),cd=4;
  if(o.awning){var segs=6;for(var sg=0;sg<segs;sg++){var ua=(u0d-.1)+(u1d-u0d+.2)*sg/segs,ub=(u0d-.1)+(u1d-u0d+.2)*(sg+1)/segs,a0=fpt(px,py,hw,hh,0,ua,dv+.6),b0=fpt(px,py,hw,hh,0,ub,dv+.6);poly(c,[a0,b0,[b0[0]+n0.x*cd,b0[1]+n0.y*cd+1.4],[a0[0]+n0.x*cd,a0[1]+n0.y*cd+1.4]],sg%2?'#F4F1EA':o.awning)}
    c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.6;hline(c,ca[0]+n0.x*cd,ca[1]+n0.y*cd+1.4,cb[0]+n0.x*cd,cb[1]+n0.y*cd+1.4)}
  else{poly(c,[ca,cb,[cb[0]+n0.x*cd,cb[1]+n0.y*cd],[ca[0]+n0.x*cd,ca[1]+n0.y*cd]],n?'#555B68':'#F2F0EA');poly(c,[[ca[0]+n0.x*cd,ca[1]+n0.y*cd],[cb[0]+n0.x*cd,cb[1]+n0.y*cd],[cb[0]+n0.x*cd,cb[1]+n0.y*cd+1.2],[ca[0]+n0.x*cd,ca[1]+n0.y*cd+1.2]],n?'#2E323B':'#A8A49B')}
  if(o.sign){var sq=[fpt(px,py,hw,hh,0,.12,dv+2.2),fpt(px,py,hw,hh,0,.4,dv+2.2),fpt(px,py,hw,hh,0,.4,dv+5),fpt(px,py,hw,hh,0,.12,dv+5)];if(n){c.save();c.shadowColor=o.sign;c.shadowBlur=6;poly(c,sq,mix(o.sign,1.3));c.restore()}else poly(c,sq,o.sign)}}
// ---- roof plant
function hvacHi(c,x,y){prismHi(c,x,y,.13,3.2,'#9AA1AD',{parapet:false});c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;for(var k=0;k<3;k++)hline(c,x-3+k*1.4,y-4.8+k*.7,x-2.1+k*1.4,y-4.35+k*.7)}
function tankHi(c,x,y){var n=hn();c.strokeStyle=n?'#3E3328':'#5E4630';c.lineWidth=1;hline(c,x-4,y+1,x-4,y-7);hline(c,x+4,y+1,x+4,y-7);hline(c,x,y+2.5,x,y-6);var g=c.createLinearGradient(x-5,0,x+5,0);g.addColorStop(0,n?'#4A3A2A':'#A07A52');g.addColorStop(.55,n?'#3A2C20':'#7D5B3B');g.addColorStop(1,n?'#2A2018':'#5E4630');c.fillStyle=g;c.fillRect(x-5,y-16,10,9);c.beginPath();c.ellipse(x,y-7,5,2,0,0,Math.PI);c.fill();
  c.fillStyle=n?'#3A2C20':'#6F5238';c.beginPath();c.moveTo(x-6,y-16);c.lineTo(x,y-21);c.lineTo(x+6,y-16);c.closePath();c.fill();c.fillStyle=n?'#4A3A2A':'#8A6A48';c.beginPath();c.ellipse(x,y-16,6,2.2,0,Math.PI,0);c.fill();c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.4;hline(c,x-5,y-11,x+5,y-11);hline(c,x-5,y-13.5,x+5,y-13.5)}
function solarHi(c,x,y,rows,w){var n=hn();rows=rows||3;w=w||5;for(var r=0;r<rows;r++){var ox=x-w*1.3+r*w*.9,oy=y-rows*1.2+r*2.2,q=[[ox-w*1.1,oy+.4],[ox+w*.7,oy-w*.55],[ox+w*1.3,oy-w*.3],[ox-w*.5,oy+.95]];poly(c,q,n?'#17213A':'#24467E');
  c.strokeStyle=n?'rgba(120,150,200,.2)':'rgba(190,220,255,.45)';c.lineWidth=.4;for(var k=1;k<4;k++){var f=k/4;hline(c,q[0][0]+(q[1][0]-q[0][0])*f,q[0][1]+(q[1][1]-q[0][1])*f,q[3][0]+(q[2][0]-q[3][0])*f,q[3][1]+(q[2][1]-q[3][1])*f)}
  c.strokeStyle=n?'rgba(255,255,255,.08)':'rgba(255,255,255,.55)';c.lineWidth=.6;hline(c,q[0][0],q[0][1],q[1][0],q[1][1]);c.strokeStyle='rgba(0,0,0,.35)';hline(c,q[3][0],q[3][1],q[2][0],q[2][1])}}
function mastHi(c,x,y,h){c.strokeStyle=hn()?'#8A9099':'#C9CDD4';c.lineWidth=.9;hline(c,x,y,x,y-h);c.lineWidth=.6;hline(c,x-2.5,y-h*.7,x+2.5,y-h*.7);hline(c,x-1.6,y-h*.88,x+1.6,y-h*.88);
  if(hn()){c.save();c.shadowColor='#FF4040';c.shadowBlur=5;c.fillStyle='#FF5A5A';c.beginPath();c.arc(x,y-h-1,1.1,0,7);c.fill();c.restore()}}
function gardenHi(c,px,ty,hw,hh){poly(c,[[px,ty-hh*.78],[px+hw*.78,ty],[px,ty+hh*.78],[px-hw*.78,ty]],hn()?'#1F3A28':'#5DA14E');c.strokeStyle=hn()?'rgba(200,190,170,.15)':'rgba(240,232,210,.7)';c.lineWidth=1.2;c.beginPath();c.moveTo(px-hw*.5,ty);c.quadraticCurveTo(px,ty-2,px+hw*.5,ty);c.stroke();treeHi(c,px-5,ty+1,.5,3);treeHi(c,px+6,ty-1,.42,5)}
function skylightHi(c,x,y){var q=[[x,y-2.6],[x+5,y],[x,y+2.6],[x-5,y]];poly(c,q,hn()?'rgba(255,215,140,.55)':'rgba(205,230,250,.9)');c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.5;hline(c,q[3][0],q[3][1],q[1][0],q[1][1])}
function helipadHi(c,px,ty,hw,hh){c.fillStyle='rgba(40,44,56,.85)';c.beginPath();c.ellipse(px,ty,hw*.55,hh*.55,0,0,7);c.fill();c.strokeStyle='#F2D24A';c.lineWidth=.8;c.beginPath();c.ellipse(px,ty,hw*.42,hh*.42,0,0,7);c.stroke();c.fillStyle='#F2D24A';c.font='bold 6px IBM Plex Sans,Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('H',px,ty+.3);c.textBaseline='alphabetic'}
function roofHi(c,px,ty,w,props){if(LODN===0)return;var hw=TW/2*w,hh=TH/2*w;props.forEach(function(pr){var name=pr[0],p=tpt(px,ty,hw,hh,pr[1]||0,pr[2]||0),n=hn();
  if(name==='hvac')hvacHi(c,p[0],p[1]);else if(name==='tank')tankHi(c,p[0],p[1]);else if(name==='solar')solarHi(c,p[0],p[1],pr[3]||3,pr[4]||4.5);else if(name==='mast')mastHi(c,p[0],p[1],pr[3]||18);
  else if(name==='garden')gardenHi(c,px,ty,hw,hh);else if(name==='skylight')skylightHi(c,p[0],p[1]);else if(name==='helipad')helipadHi(c,px,ty,hw,hh);
  else if(name==='stack'){c.fillStyle=n?'#6B7280':'#C4C9D2';c.fillRect(p[0]-1.6,p[1]-6,3.2,6);c.beginPath();c.ellipse(p[0],p[1]-6,1.6,.8,0,0,7);c.fill();c.fillStyle=n?'#1E2430':'#4A5160';c.beginPath();c.ellipse(p[0],p[1]-6,1,.5,0,0,7);c.fill()}
  else if(name==='dish'){c.strokeStyle=n?'#8A9099':'#C9CDD4';c.lineWidth=.8;hline(c,p[0],p[1],p[0],p[1]-4);c.fillStyle=n?'#B9BEC8':'#F2F2F5';c.beginPath();c.ellipse(p[0]+1.5,p[1]-5.5,3,2,-.6,0,7);c.fill();c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.5;hline(c,p[0]+1.5,p[1]-5.5,p[0]+3.5,p[1]-7.5)}
  else if(name==='crown'){var cw=w*.5,chw=TW/2*cw,chh=TH/2*cw;prismHi(c,px,ty,cw,6,pr[3]||'#9AA1AD',{parapet:false});c.strokeStyle=n?'rgba(255,255,255,.08)':'rgba(255,255,255,.4)';c.lineWidth=.5;poly(c,[[px,ty-6-chh],[px+chw,ty-6],[px,ty-6+chh],[px-chw,ty-6]]);c.stroke();mastHi(c,px,ty-6-chh*.2,22)}})}
// ---- trees and street furniture
function treeHi(c,px,py,s,seed){seed=seed||0;var n=hn();
  if(LODN===0){c.fillStyle=n?'#1E4229':'#4F9A4E';c.beginPath();c.ellipse(px,py-9*s,6.5*s,6*s,0,0,7);c.fill();return}
  c.fillStyle='rgba(0,0,0,'+(n?.3:.2)+')';c.beginPath();c.ellipse(px+4.5*s,py+1.2,7.5*s,3*s,0,0,7);c.fill();
  c.strokeStyle=n?'#3A2C20':'#6B4B2E';c.lineWidth=1.6*s;c.lineCap='round';hline(c,px,py,px+.5*s,py-6.5*s);c.lineWidth=.8*s;hline(c,px+.3*s,py-5*s,px+2.5*s,py-8*s);hline(c,px+.3*s,py-5*s,px-2*s,py-8*s);c.lineCap='butt';
  var r=7.2*s,cy=py-10*s,ox=(rnd(seed+.5)-.5)*s;
  c.fillStyle=n?'#15301F':'#3F8A47';c.beginPath();c.ellipse(px+ox+.6*s,cy+1.5*s,r,r*.8,0,0,7);c.fill();c.fillStyle=n?'#1E4229':'#5DAE55';c.beginPath();c.ellipse(px+ox-.6*s,cy-.4*s,r*.85,r*.75,0,0,7);c.fill();c.fillStyle=n?'#2E5A3C':'#8CCF6E';c.beginPath();c.ellipse(px+ox-2.4*s,cy-2.6*s,r*.5,r*.42,-.5,0,7);c.fill();
  c.fillStyle=n?'rgba(80,140,100,.3)':'rgba(200,245,170,.55)';for(var f=0;f<3;f++){c.beginPath();c.arc(px+ox+(rnd(seed+f*3+.1)-.5)*9*s,cy+(rnd(seed+f*7+.2)-.6)*7*s,.7*s,0,7);c.fill()}}
function pineHi(c,px,py,s){var n=hn();   // world fit (LOD 0): one shape, no shadow
  if(LODN===0){poly(c,[[px,py-18*s],[px+5*s,py-3*s],[px-5*s,py-3*s]],n?'#173126':'#2F7A4A');return}
  c.fillStyle='rgba(0,0,0,'+(n?.3:.2)+')';c.beginPath();c.ellipse(px+3*s,py+1,6*s,2.5*s,0,0,7);c.fill();
  c.strokeStyle=n?'#3A2C20':'#5E4630';c.lineWidth=1.3*s;hline(c,px,py,px,py-5*s);
  for(var k=0;k<4;k++){var ty=py-20*s+k*4.2*s,by=py-7*s+k*2.2*s,hw=(4+k*1.4)*s;poly(c,[[px,ty],[px+hw,by],[px-hw,by]],n?'#173126':'#2F7A4A');poly(c,[[px,ty],[px-hw,by],[px-hw*.25,by-1*s]],n?'#1E3E30':'#4A9A5E')}
  c.fillStyle=n?'rgba(255,255,255,.04)':'rgba(255,255,255,.18)';c.beginPath();c.moveTo(px,py-20*s);c.lineTo(px-1.2*s,py-14*s);c.lineTo(px+.6*s,py-14*s);c.closePath();c.fill()}
function hedgeHi(c,x0,y0,x1,y1){var n=hn();c.strokeStyle=n?'#1A3322':'#4C8F4A';c.lineCap='round';c.lineWidth=3.4;hline(c,x0,y0,x1,y1);c.strokeStyle=n?'#244A30':'#6DB35E';c.lineWidth=1.6;hline(c,x0,y0-1,x1,y1-1);c.lineCap='butt'}
function fenceHi(c,x0,y0,x1,y1,k){c.strokeStyle=hn()?'#8A8578':'#F2EDE2';c.lineWidth=.7;c.beginPath();for(var q=0;q<=k;q++){var f=q/k,x=x0+(x1-x0)*f,y=y0+(y1-y0)*f;c.moveTo(x,y);c.lineTo(x,y-3)}c.moveTo(x0,y0-1.6);c.lineTo(x1,y1-1.6);c.stroke()}
function benchHi(c,x,y){c.fillStyle=hn()?'#5A4634':'#8B6A48';c.fillRect(x-3,y-3,6,1.4);c.fillRect(x-3,y-5,6,1);c.fillStyle='#3A3D47';c.fillRect(x-2.6,y-1.8,.8,1.8);c.fillRect(x+1.8,y-1.8,.8,1.8)}
function hydrantHi(c,x,y){c.fillStyle='#D83A3A';c.fillRect(x-.9,y-3.4,1.8,3.4);c.beginPath();c.arc(x,y-3.6,1,0,7);c.fill();c.fillStyle='#F2F2F5';c.fillRect(x-1.5,y-2.2,3,.7)}
function coneHi(c,x,y){c.fillStyle='#FF7A30';c.beginPath();c.moveTo(x,y-4);c.lineTo(x+1.6,y);c.lineTo(x-1.6,y);c.closePath();c.fill();c.fillStyle='#F4F1EA';c.fillRect(x-.8,y-2.2,1.6,.8)}
function lampHi(c,px,py){var n=hn();c.strokeStyle=n?'#4E5560':'#3C414A';c.lineCap='round';c.lineWidth=1.3;hline(c,px,py,px,py-15);c.lineWidth=1;hline(c,px,py-15,px+3.5,py-16.5);c.lineCap='butt';c.strokeStyle=n?'#6B7280':'#8A9099';c.lineWidth=.5;hline(c,px+.6,py-1,px+.6,py-14);
  c.fillStyle=P.lamp>.3?'#FFE3A0':'#D9DDE4';c.beginPath();c.moveTo(px+2,py-17.6);c.lineTo(px+5.4,py-17.6);c.lineTo(px+4.8,py-15.4);c.lineTo(px+2.6,py-15.4);c.closePath();c.fill();c.fillStyle=n?'#2A2D35':'#4A4F58';c.fillRect(px+2.3,py-18.4,2.8,.9);
  if(P.lamp>.3){c.save();c.globalCompositeOperation='lighter';var g=c.createRadialGradient(px+3.7,py-16.5,0,px+3.7,py-16.5,6);g.addColorStop(0,'rgba(255,225,160,'+(.6*P.lamp)+')');g.addColorStop(1,'rgba(255,225,160,0)');c.fillStyle=g;c.beginPath();c.arc(px+3.7,py-16.5,6,0,7);c.fill();c.restore()}}
/** the warm pool a lamp throws on the road (live layer, only when lamps are on) */
function lampPoolHi(c,px,py){if(!(P.lamp>0))return;var g=c.createRadialGradient(px+4,py+2,0,px+4,py+2,18);g.addColorStop(0,'rgba(255,214,140,'+(.32*P.lamp)+')');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.beginPath();c.ellipse(px+4,py+2,18,9,0,0,7);c.fill();
  var h=c.createRadialGradient(px+3.7,py-16.5,0,px+3.7,py-16.5,14);h.addColorStop(0,'rgba(255,225,160,'+(.3*P.lamp)+')');h.addColorStop(1,'rgba(255,225,160,0)');c.fillStyle=h;c.beginPath();c.arc(px+3.7,py-16.5,14,0,7);c.fill()}
function aoHi(c,px,py,w){var hw=TW/2*w,hh=TH/2*w,g=c.createRadialGradient(px,py,hw*.2,px,py,hw*1.25);g.addColorStop(0,P.ao||'rgba(20,30,50,.28)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(px,py,hw*1.3,hh*1.3,0,0,7);c.fill()}
// ---- houses: 0 gable, 1 hip roof + porch, 2 flat roof + deck + solar
var HROOF=['#B4554F','#8E5A3C','#5B6B8A','#A0503A'];
function houseHi(c,px,py,variant,col,seed){var w=.3,hw=TW/2*w,hh=TH/2*w,h=variant===2?8:9,n=hn(),rc0=HROOF[seed%4],rc=n?hmul(rc0,.45):rc0;
  if(LODN===0){prismHi(c,px,py,w,h,col,{parapet:variant===2});if(variant!==2)poly(c,[[px-hw,py-h],[px,py-h-8],[px+hw,py-h],[px,py-h+hh]],rc);return}
  pxBlock(c,px,py,w,h,'siding',col,{litp:n&&rnd(seed+.3)<.85?.8:0,seed:seed,roof:variant===2?'pavers':'membrane',ao:false});
  var wincol=n&&rnd(seed+.3)<.85?'rgba(255,208,120,.95)':n?'rgba(20,28,44,.9)':null;
  [].forEach(function(wn,k){var side=wn[0],u0=wn[1],u1=wn[2],q=[fpt(px,py,hw,hh,side,u0,3),fpt(px,py,hw,hh,side,u1,3),fpt(px,py,hw,hh,side,u1,6.5),fpt(px,py,hw,hh,side,u0,6.5)];
    poly(c,[[q[0][0]-.4,q[0][1]+.4],[q[1][0]+.4,q[1][1]+.4],[q[2][0]+.4,q[2][1]-.4],[q[3][0]-.4,q[3][1]-.4]],'rgba(0,0,0,.4)');
    if(wincol&&(k!==1||rnd(seed+k+.7)<.6))poly(c,q,wincol);else{var wg=c.createLinearGradient(0,q[3][1],0,q[0][1]);wg.addColorStop(0,n?'#101827':'#A9CBE8');wg.addColorStop(1,n?'#1A2338':'#5B86B3');poly(c,q,wg)}
    c.strokeStyle='rgba(255,255,255,'+(n?.1:.4)+')';c.lineWidth=.4;var m0=fpt(px,py,hw,hh,side,(u0+u1)/2,3),m1=fpt(px,py,hw,hh,side,(u0+u1)/2,6.5);hline(c,m0[0],m0[1],m1[0],m1[1]);
    if(variant!==2){var shc=hmul(rc,.8);poly(c,[fpt(px,py,hw,hh,side,u0-.07,3),fpt(px,py,hw,hh,side,u0-.02,3),fpt(px,py,hw,hh,side,u0-.02,6.5),fpt(px,py,hw,hh,side,u0-.07,6.5)],shc);poly(c,[fpt(px,py,hw,hh,side,u1+.02,3),fpt(px,py,hw,hh,side,u1+.07,3),fpt(px,py,hw,hh,side,u1+.07,6.5),fpt(px,py,hw,hh,side,u1+.02,6.5)],shc)}});
  poly(c,[fpt(px,py,hw,hh,1,.62,.3),fpt(px,py,hw,hh,1,.8,.3),fpt(px,py,hw,hh,1,.8,5.5),fpt(px,py,hw,hh,1,.62,5.5)],n?'#2A1E16':'#5A3E2A');c.fillStyle='#E8C547';var dk=fpt(px,py,hw,hh,1,.76,2.8);c.fillRect(dk[0]-.3,dk[1]-.3,.6,.6);
  var sa=fpt(px,py,hw,hh,1,.58,0),sb=fpt(px,py,hw,hh,1,.84,0);poly(c,[sa,sb,[sb[0]+NR.x*1.6,sb[1]+NR.y*1.6],[sa[0]+NR.x*1.6,sa[1]+NR.y*1.6]],n?'#3C4049':'#CFCBC2');
  var rt=py-h;
  if(variant===0){var o=.1,ra=tpt(px,rt,hw,hh,-1-o,0),rb=tpt(px,rt,hw,hh,1+o,0),ea=tpt(px,rt,hw,hh,-1-o,1+o),eb=tpt(px,rt,hw,hh,1+o,1+o),eb2=tpt(px,rt,hw,hh,1+o,-1-o),R=8;
    poly(c,[ea,eb,[rb[0],rb[1]-R],[ra[0],ra[1]-R]],rc);poly(c,[eb2,eb,[rb[0],rb[1]-R]],hmul(rc,.66));
    c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=.5;c.beginPath();for(var k=1;k<4;k++){var f=k/4;c.moveTo(ea[0]+(ra[0]-ea[0])*f,ea[1]+(ra[1]-R-ea[1])*f);c.lineTo(eb[0]+(rb[0]-eb[0])*f,eb[1]+(rb[1]-R-eb[1])*f)}c.stroke();
    c.strokeStyle='rgba(255,255,255,'+(n?.1:.35)+')';c.lineWidth=.8;hline(c,ra[0],ra[1]-R,rb[0],rb[1]-R);c.strokeStyle=n?'#2A2A2A':'#F2EFE8';c.lineWidth=.6;hline(c,ea[0],ea[1],eb[0],eb[1]);
    prismHi(c,px+hw*.35,rt-R*.55,.06,5,n?'#4A3A30':'#8A6A5A',{parapet:false})}
  else if(variant===1){var o2=.12,B1=tpt(px,rt,hw,hh,1+o2,-1-o2),C1=tpt(px,rt,hw,hh,1+o2,1+o2),D1=tpt(px,rt,hw,hh,-1-o2,1+o2),R2=7,r0=tpt(px,rt,hw,hh,-.4,0),r1=tpt(px,rt,hw,hh,.4,0);
    poly(c,[D1,C1,[r1[0],r1[1]-R2],[r0[0],r0[1]-R2]],rc);poly(c,[C1,B1,[r1[0],r1[1]-R2]],hmul(rc,.66));
    c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=.5;c.beginPath();for(var k2=1;k2<4;k2++){var f2=k2/4;c.moveTo(D1[0]+(r0[0]-D1[0])*f2,D1[1]+(r0[1]-R2-D1[1])*f2);c.lineTo(C1[0]+(r1[0]-C1[0])*f2,C1[1]+(r1[1]-R2-C1[1])*f2)}c.stroke();
    c.strokeStyle='rgba(255,255,255,'+(n?.1:.35)+')';c.lineWidth=.8;hline(c,r0[0],r0[1]-R2,r1[0],r1[1]-R2);c.strokeStyle=n?'#2A2A2A':'#F2EFE8';c.lineWidth=.6;hline(c,D1[0],D1[1],C1[0],C1[1]);hline(c,C1[0],C1[1],B1[0],B1[1]);
    var pa=fpt(px,py,hw,hh,0,.1,6.8),pb=fpt(px,py,hw,hh,0,.9,6.8),pd=4;poly(c,[pa,pb,[pb[0]+NL.x*pd,pb[1]+NL.y*pd],[pa[0]+NL.x*pd,pa[1]+NL.y*pd]],hmul(rc,.85));c.strokeStyle=n?'#C9C3B8':'#F6F2EA';c.lineWidth=.8;hline(c,pa[0]+NL.x*pd,pa[1]+NL.y*pd,pa[0]+NL.x*pd,pa[1]+NL.y*pd+6.8);hline(c,pb[0]+NL.x*pd,pb[1]+NL.y*pd,pb[0]+NL.x*pd,pb[1]+NL.y*pd+6.8);
    prismHi(c,px-hw*.3,rt-R2*.5,.06,4.5,n?'#4A3A30':'#8A6A5A',{parapet:false})}
  else{poly(c,[tpt(px,rt,hw,hh,-.9,-.1),tpt(px,rt,hw,hh,.9,-.1),tpt(px,rt,hw,hh,.9,.9),tpt(px,rt,hw,hh,-.9,.9)],n?'#4A4034':'#C9B48E');
    c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=.4;c.beginPath();for(var k3=0;k3<6;k3++){var f3=-.9+k3*.36,a3=tpt(px,rt,hw,hh,f3,-.1),b3=tpt(px,rt,hw,hh,f3,.9);c.moveTo(a3[0],a3[1]);c.lineTo(b3[0],b3[1])}c.stroke();
    var up=tpt(px,rt,hw,hh,.15,-.5),uw=TW/2*.16,uh=TH/2*.16;prismHi(c,up[0],up[1],.16,6,hmul(col,.92),{});poly(c,[fpt(up[0],up[1],uw,uh,0,.15,1.5),fpt(up[0],up[1],uw,uh,0,.85,1.5),fpt(up[0],up[1],uw,uh,0,.85,4.8),fpt(up[0],up[1],uw,uh,0,.15,4.8)],n?'rgba(255,208,120,.9)':'rgba(70,100,140,.75)');
    solarHi(c,up[0]+1,up[1]-6.5,1,3.4);
    c.strokeStyle=n?'rgba(200,205,215,.3)':'rgba(60,64,72,.5)';c.lineWidth=.5;var d0=tpt(px,rt,hw,hh,-.9,.9),d1=tpt(px,rt,hw,hh,.9,.9);c.beginPath();for(var rr=0;rr<=6;rr++){var rp=[d0[0]+(d1[0]-d0[0])*rr/6,d0[1]+(d1[1]-d0[1])*rr/6];c.moveTo(rp[0],rp[1]);c.lineTo(rp[0],rp[1]-2.6)}c.moveTo(d0[0],d0[1]-2.6);c.lineTo(d1[0],d1[1]-2.6);c.stroke()}}
var HCOLS=['#E8DCC8','#CFD8E6','#EAD2B8','#D2E0CC'];
/** a house lot around (x,y): driveway, path, hedge, picket fence, trees, up to three houses, a parked car most of the time */
function houseLotHi(c,x,y,o){var seed=o.seed,n=hn(),k=Math.max(1,Math.min(3,o.n==null?3:o.n)),dim=o.dim;
  if(LODN>0){poly(c,[[x-4,y+TH*.42],[x+2,y+TH*.45],[x+16,y+TH*.1],[x+10,y+TH*.06]],n?'#3A3D47':'#C7C3BA');
    c.strokeStyle=n?'rgba(230,220,200,.12)':'rgba(255,250,240,.75)';c.lineWidth=1.3;hline(c,x-16,y+6,x-5,y+1);
    hedgeHi(c,x-24,y-1,x-9,y-8);fenceHi(c,x-27,y+2,x-2,y+15,8);treeHi(c,x+19,y-7,.62,seed);if(rnd(seed+2.5)<.6)treeHi(c,x-22,y-10,.5,seed+1)}
  [[0,-9],[-11,-2],[9,-3]].slice(0,k).sort(function(a,b){return a[1]-b[1]}).forEach(function(s,q){var cc=HCOLS[(seed+q)%4];if(dim)cc=mix(cc,.6,'#8A8E96');houseHi(c,x+s[0],y+s[1],(seed+q)%3,n?hmul(cc,.55):cc,seed+q)});
  if(LODN>0&&rnd(seed+5.5)<.7)carHi(c,x+6,y+10,.894,.447,['#F2F2F5','#E85D75','#4FB89A','#7AA7FF'][seed%4],.8,true)}
// ---- lots in the making: 1 zoned, 2 graded, 3 framed (returns where its crane stands, if any)
function stakeHi(c,x,y){c.fillStyle=hn()?'#D9D2C4':'#FFF8E8';c.fillRect(x-.6,y-6,1.2,6);c.fillStyle='#FF7A59';c.beginPath();c.moveTo(x-.6,y-6.5);c.lineTo(x+3,y-5.6);c.lineTo(x-.6,y-4.6);c.closePath();c.fill()}
function boardHi(c,x,y,col){c.fillStyle='#8B6A48';c.fillRect(x-.7,y-12,1.4,12);c.fillRect(x+5.3,y-12,1.4,12);c.fillStyle=hn()?'#D8D2C4':'#FFF8E8';c.fillRect(x-5,y-19,16,8);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.5;c.strokeRect(x-5,y-19,16,8);c.fillStyle=col;c.fillRect(x-3,y-17,12,2);c.fillStyle='#8A8A93';c.fillRect(x-3,y-14,8,1);c.fillRect(x-3,y-12.3,10,1)}
function pileHi(c,x,y,col,rows){for(var r=0;r<rows;r++)for(var k=0;k<rows-r+1;k++){var bx=x-7+k*5+r*2.5,by=y-r*3.2;c.fillStyle=hmul(col,.8);c.fillRect(bx,by-3,4.6,3);c.fillStyle=mix(col,1.15);c.fillRect(bx,by-3.8,4.6,1);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.3;c.strokeRect(bx,by-3.8,4.6,3.8)}}
function lotHi(c,x,y,o){var stage=o.stage,col=o.col,n=hn();
  if(stage===1){var q=pdia(x,y,.84);c.save();c.strokeStyle=col;c.lineWidth=1.2;c.setLineDash([4,3]);poly(c,q);c.stroke();c.restore();poly(c,q,hRgba(col,.12));if(LODN===0)return null;q.forEach(function(s){stakeHi(c,s[0],s[1])});boardHi(c,x+8,y+9,col);return null}
  if(stage===2){var dk=n?['#3A2E22','#2B2219']:['#8A6A4A','#6E5238'];poly(c,pdia(x,y,.92),dk[0]);if(LODN===0)return null;c.strokeStyle=dk[1];c.lineWidth=1.3;c.beginPath();for(var f=-1;f<=1;f++){c.moveTo(x-16+f*6,y-7+f*3);c.lineTo(x+10+f*6,y+6+f*3)}c.stroke();
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.7;c.setLineDash([1.5,1.5]);for(var tr=0;tr<2;tr++)hline(c,x-20+tr*3,y+2+tr*1.5,x+6+tr*3,y-10+tr*1.5);c.setLineDash([]);
    c.fillStyle=dk[1];c.beginPath();c.ellipse(x+13,y+4,7,3.2,0,0,7);c.fill();c.fillStyle=mix(dk[0],1.15);c.beginPath();c.moveTo(x+7,y+4);c.quadraticCurveTo(x+13,y-4,x+19,y+4);c.closePath();c.fill();
    coneHi(c,x-22,y+6);coneHi(c,x-18,y+8);coneHi(c,x+22,y-2);if(o.crew!==false){figHi(c,x-6,y+10,col,o.seed,1);figHi(c,x+2,y-6,col,o.seed+3,0)}return null}
  poly(c,pdia(x,y,.92),n?'#3A2E22':'#8A6A4A');poly(c,pdia(x,y,.74),n?'#5A5D66':'#C9C4B8');
  var hgt=22,w=.62,hw=TW/2*w,hh=TH/2*w,cs=[[x-hw,y+4],[x,y+4+hh],[x+hw,y+4],[x,y+4-hh]];
  if(LODN===0){prismHi(c,x,y+4,w,hgt,'#C9C4B8',{parapet:false});return {x:x+6,y:y+4-hgt}}
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.4;var qa=pdia(x,y,.74);for(var rb=0;rb<5;rb++){var f2=.15+rb*.17;hline(c,qa[3][0]+(qa[0][0]-qa[3][0])*f2,qa[3][1]+(qa[0][1]-qa[3][1])*f2,qa[2][0]+(qa[1][0]-qa[2][0])*f2,qa[2][1]+(qa[1][1]-qa[2][1])*f2)}
  c.strokeStyle=n?'#6B7280':'#8A9099';c.lineWidth=1.1;c.beginPath();cs.forEach(function(k){c.moveTo(k[0],k[1]);c.lineTo(k[0],k[1]-hgt)});for(var lv=1;lv<=2;lv++){var yy=hgt*lv/2;c.moveTo(cs[0][0],cs[0][1]-yy);c.lineTo(cs[1][0],cs[1][1]-yy);c.lineTo(cs[2][0],cs[2][1]-yy);c.lineTo(cs[3][0],cs[3][1]-yy);c.closePath()}c.stroke();
  poly(c,[[cs[0][0],cs[0][1]-hgt/2],[cs[1][0],cs[1][1]-hgt/2],[cs[2][0],cs[2][1]-hgt/2],[cs[3][0],cs[3][1]-hgt/2]],n?'rgba(90,93,102,.8)':'rgba(201,196,184,.9)');
  scaffoldHi(c,x,y+4,w,hgt);pileHi(c,x+20,y+10,col,2);pileHi(c,x-22,y+2,'#C9A96E',1);
  if(o.crew!==false){figHi(c,x-14,y+14,col,o.seed,1);figHi(c,x+10,y+14,col,o.seed+1,2)}
  return {x:x+6,y:y+4-hgt}}
// ---- mid-rise (0 brick walk-up, 1 stucco + balconies + shops, 2 glass office); returns its top
function midHi(c,x,y,o){var v=o.variant,col=o.col,seed=o.seed,base=y+4,litp=o.litp,n=hn(),h;
  var px0=LODN>0;
  if(v===0){h=40;if(px0)pxBlock(c,x,base,.64,h,'brick',mix(col,.5,'#B0583C'),{litp:litp,seed:seed,escape:true,ground:true,roof:'membrane'});else prismHi(c,x,base,.64,h,mix(col,.5,'#B0583C'),{});roofHi(c,x,base-h,.64,[['tank',.3,-.3],['hvac',-.45,.4],['mast',-.5,-.5,10]])}
  else if(v===1){h=34;if(px0)pxBlock(c,x,base,.64,h,'stucco',mix(col,.55,'#E6D8C4'),{litp:litp,seed:seed,balcony:true,ground:true,awning:col,sign:col,roof:'pavers'});else prismHi(c,x,base,.64,h,mix(col,.55,'#E6D8C4'),{});roofHi(c,x,base-h,.64,[['hvac',.3,.3],['hvac',.5,-.1],['skylight',-.4,-.3]])}
  else{h=30;if(px0)pxBlock(c,x,base,.66,h,'glass',mix(col,.75,'#7FA8D8'),{litp:litp,seed:seed,people:n?.3:0,ground:true,roof:'gravel'});else prismHi(c,x,base,.66,h,mix(col,.75,'#7FA8D8'),{});roofHi(c,x,base-h,.66,[['hvac',-.2,.35],['hvac',.25,.35],['solar',.2,-.45,2,4],['mast',-.55,-.5,8]])}
  if(LODN>0){treeHi(c,x-TW*.4,y+TH*.2,.55,seed);if(rnd(seed+9.5)<.5)benchHi(c,x+TW*.34,y+TH*.18)}return base-h}
function towerTiers(h){return h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]]}
/** a tower (0 curtain wall + crown, 1 stepped stone + tank, 2 slab + helipad + mast); o.tiers as today so height = commits.
 *  o.roof false leaves the roof to the caller (padlock, beacon); returns its top */
function towerHi(c,x,y,o){var v=o.variant,col=o.col,seed=o.seed,base=y+4,top=base,tiers=o.tiers||towerTiers(o.h||96),litp=o.litp,n=hn(),pe=o.people||0;
  var tc=v===0?mix(col,.3,'#8EC0EE'):v===1?mix(col,.3,'#C9B9A0'):col;
  var hs=0;tiers.forEach(function(t){hs+=t[1]});var dm=o.dmg&&o.dmg.d>0?{d:o.dmg.d,f:o.dmg.f||0,h:hs,seed:o.dmg.seed||seed,craters:pxCraters(hs,o.dmg.d,o.dmg.seed||seed,TW/2*tiers[0][0])}:null,stand=dm?Math.max(pxBreak(hs,dm.d),dm.f*hs):hs,v0=0,cut=false;
  tiers.forEach(function(t,k){var mat=v===0||(v===2&&k===0)?'glass':v===1?'punched':'concrete';
    if(cut)return;if(dm&&v0>=stand){cut=true;return}
    if(LODN>0){var r=pxBlock(c,x,top,t[0],t[1],mat==='concrete'?'punched':mat,tc,{litp:litp,seed:seed+k*101,people:pe,sign:k===0&&v===0?col:null,ground:k===0,awning:k===0&&v===1&&rnd(seed+.4)<.5?col:null,v0:v0,mask:dm,roof:v===1?'pavers':v===2?'membrane':'gravel'});if(r.cut){cut=true;top=r.top;return}}
    else prismHi(c,x,top,t[0],t[1],tc,{floors:false});
    top-=t[1];v0+=t[1]});
  if(dm&&cut)top=base-stand;
  var tw=tiers[tiers.length-1][0];
  if(o.roof!==false&&!cut){if(v===0)roofHi(c,x,top,tw,[['crown',0,0,hmul(tc,.9)]]);else if(v===1)roofHi(c,x,top,tw,[['tank',.25,-.25],['hvac',-.4,.4],['hvac',-.1,.45],['mast',.4,.4,12]]);else roofHi(c,x,top,tw,[['helipad'],['mast',-.7,-.7,26],['hvac',.7,.7]])}
  if(v===1&&tiers.length>1&&LODN>0&&!cut){var t0=tiers[0],hw0=TW/2*t0[0],hh0=TH/2*t0[0],ty0=base-t0[1],a=tpt(x,ty0,hw0,hh0,-.75,.8),b=tpt(x,ty0,hw0,hh0,.85,.75);hvacHi(c,a[0],a[1]);treeHi(c,b[0],b[1],.4,seed)}
  if(LODN>0&&o.yard!==false){treeHi(c,x-TW*.42,y+TH*.22,.5,seed);hydrantHi(c,x+TW*.36,y+TH*.3)}return top}
function turbineHi(c,x,y,dim){var n=hn();c.strokeStyle=dim?'#8A8E96':n?'#A3A8B3':'#E8EEF4';c.lineWidth=1.4;c.lineCap='round';hline(c,x,y,x,y-30);c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(x+1,y+1,3,1.3,0,0,7);c.fill();var a=reduce||dim?0:T/900;c.lineWidth=1.5;c.beginPath();for(var k=0;k<3;k++){var b=a+k*2.094;c.moveTo(x,y-30);c.lineTo(x+Math.cos(b)*11,y-30+Math.sin(b)*11)}c.stroke();c.lineCap='butt';c.fillStyle=n?'#C9D2E6':'#F6F8FB';c.beginPath();c.arc(x,y-30,1.6,0,7);c.fill()}
/** solar and AI campus: 0 server hall, 1 solar field (its turbine spins live), 2 glass pavilion with a green roof; returns its top */
function campusHi(c,x,y,o){var v=o.variant,col=o.col,seed=o.seed,n=hn(),base=y+4;
  if(v===0){var w=.8,h=14,hw=TW/2*w,hh=TH/2*w;if(LODN===0){prismHi(c,x,base,w,h,mix(col,.6,'#C9D2DC'),{parapet:true});return base-h}
    pxBlock(c,x,base,w,h,'tech',mix(col,.6,'#C9D2DC'),{seed:seed,ground:true,roof:'membrane'});
    roofHi(c,x,base-h,w,[['stack',-.5,-.5],['stack',-.15,-.5],['stack',.2,-.5],['stack',.55,-.5],['hvac',.4,.5],['dish',-.55,.55],['solar',0,.15,2,4]]);
    if(n&&!o.dim){c.save();c.globalCompositeOperation='lighter';c.shadowColor='#3DF2FF';c.shadowBlur=8;c.strokeStyle='rgba(61,242,255,.85)';c.lineWidth=1;var e0=fpt(x,base,hw,hh,0,.03,h-1.5),e1=fpt(x,base,hw,hh,0,.97,h-1.5),e2=fpt(x,base,hw,hh,1,.97,h-1.5);c.beginPath();c.moveTo(e0[0],e0[1]);c.lineTo(e1[0],e1[1]);c.lineTo(e2[0],e2[1]);c.stroke();c.restore()}
    if(o.crew!==false)figHi(c,x-TW*.3,y+TH*.36,col,seed,0);return base-h}
  if(v===1){for(var r=0;r<3;r++){var ox=x-16+r*9,oy=y-8+r*4.5;solarHi(c,ox,oy,1,7);if(LODN>0){c.strokeStyle=n?'#6B7280':'#8A9099';c.lineWidth=.7;hline(c,ox-6,oy+1.5,ox-6,oy+4);hline(c,ox+4,oy-2.5,ox+4,oy+1)}}
    if(LODN>0){prismHi(c,x+16,y+6,.12,4,'#9AA1AD',{parapet:false});c.fillStyle=n?'#3DF2FF':'#2FB5D6';c.fillRect(x+14,y+2.5,1.2,1.2);fenceHi(c,x-28,y-2,x,y+13,9)}
    if(o.turbine!==false)turbineHi(c,x-20,y+8,o.dim);return base-8}
  var w2=.6,h2=11,hw2=TW/2*w2,hh2=TH/2*w2;if(LODN>0)pxBlock(c,x,base,w2,h2,'glass',mix(col,.8,'#BFD8F0'),{litp:o.litp,seed:seed,people:n?.3:0,ground:true,roof:'garden'});else prismHi(c,x,base,w2,h2,mix(col,.8,'#BFD8F0'),{parapet:true});
  poly(c,[tpt(x,base-h2,hw2,hh2,-.85,-.85),tpt(x,base-h2,hw2,hh2,.85,-.85),tpt(x,base-h2,hw2,hh2,.85,.85),tpt(x,base-h2,hw2,hh2,-.85,.85)],n?'#1F3A28':'#5DA14E');
  roofHi(c,x,base-h2,w2,[['skylight',-.3,-.3],['skylight',.3,.3],['dish',.6,-.6]]);
  if(LODN>0){for(var ev=0;ev<2;ev++){c.fillStyle=n?'#C9D2E6':'#F6F8FB';c.fillRect(x+16+ev*5,y+2+ev*2.5-5,1.4,5);c.fillStyle='#4FD1C5';c.fillRect(x+16+ev*5,y+2+ev*2.5-5,1.4,1)}
    treeHi(c,x-TW*.38,y+TH*.2,.6,seed);treeHi(c,x+TW*.1,y+TH*.42,.5,seed+1);carHi(c,x+22,y+5,.894,.447,'#F2F2F5',.8,true)}return base-h2}
// ---- motion: crane, scaffold, crews, cars, water
function craneHi(c,k){var mx=k.x,my=k.y,mh=34,n=hn(),tn=reduce?0:T,sd=k.seed||0,a=tn/5200+(sd%7),f=.45+.3*Math.sin(tn/2600+sd),drop=10+7*Math.sin(tn/3100+sd*2),gr=sky==='grid';
  var yel=gr?(k.col||'#3DF2FF'):'#E9A92C';if(gr){c.save();c.shadowColor=yel;c.shadowBlur=6}
  c.strokeStyle=yel;c.lineWidth=1.1;c.beginPath();c.moveTo(mx-1.8,my);c.lineTo(mx-1.8,my-mh);c.moveTo(mx+1.8,my);c.lineTo(mx+1.8,my-mh);c.stroke();c.lineWidth=.6;c.beginPath();for(var z=0;z<mh;z+=4){c.moveTo(mx-1.8,my-z);c.lineTo(mx+1.8,my-z-4);c.moveTo(mx-1.8,my-z-4);c.lineTo(mx+1.8,my-z-4)}c.stroke();
  var L=38,cx0=Math.cos(a),cy0=Math.sin(a)*.5,tip=[mx+cx0*L,my-mh-2+cy0*L],cj=[mx-cx0*13,my-mh-2-cy0*13],apex=[mx,my-mh-9];
  c.fillStyle=gr?yel:'#D99A22';c.fillRect(mx-2.6,my-mh-3,5.2,3);
  c.strokeStyle=yel;c.lineWidth=1.3;hline(c,cj[0],cj[1],tip[0],tip[1]);c.lineWidth=.5;c.beginPath();for(var s=0;s<L;s+=4){var u=s/L,u2=Math.min(1,(s+4)/L);c.moveTo(mx+cx0*L*u,my-mh-2+cy0*L*u);c.lineTo(mx+cx0*L*u2,my-mh-2+cy0*L*u2-2.2);c.lineTo(mx+cx0*L*u2,my-mh-2+cy0*L*u2)}c.stroke();
  c.fillStyle=n?'#6B7280':'#8A9099';c.fillRect(cj[0]-2.6,cj[1]-.5,5.2,3.2);
  c.strokeStyle=n?'rgba(220,225,235,.55)':'rgba(40,44,52,.7)';c.lineWidth=.5;c.beginPath();c.moveTo(mx-1.8,my-mh);c.lineTo(apex[0],apex[1]);c.lineTo(mx+1.8,my-mh);c.moveTo(apex[0],apex[1]);c.lineTo(tip[0],tip[1]-1);c.moveTo(apex[0],apex[1]);c.lineTo(cj[0],cj[1]);c.stroke();
  var tx=mx+cx0*L*f,ty=my-mh-2+cy0*L*f;c.fillStyle='#3A3D47';c.fillRect(tx-1.4,ty-.3,2.8,1.6);c.strokeStyle=n?'rgba(230,235,245,.7)':'rgba(30,34,42,.85)';c.lineWidth=.6;hline(c,tx,ty+1,tx,ty+drop);
  c.fillStyle='#3A3D47';c.beginPath();c.arc(tx,ty+drop+.8,.9,0,7);c.fill();var sw=Math.sin(tn/900+sd)*1.2;poly(c,[[tx-5+sw,ty+drop+2.6],[tx+5+sw,ty+drop+.4],[tx+5+sw,ty+drop+2.2],[tx-5+sw,ty+drop+4.4]],k.col&&k.col.charAt(0)==='#'?mix(k.col,.95):'#E9A92C');
  if(n){c.fillStyle=Math.floor(tn/650)%2?'#FF5A5A':'#8A2A2A';c.beginPath();c.arc(apex[0],apex[1]-.5,1.1,0,7);c.fill()}if(gr)c.restore()}
function scaffoldHi(c,px,base,w,h,side){var hw=TW/2*w*1.02,hh=TH/2*w*1.02,n=hn();c.save();
  [0,1].forEach(function(sd){if(side!=null&&sd!==side)return;var N=sd?NR:NL,d=2.6;
    poly(c,[fpt(px,base,hw,hh,sd,0,0),fpt(px,base,hw,hh,sd,1,0),fpt(px,base,hw,hh,sd,1,h),fpt(px,base,hw,hh,sd,0,h)],'rgba(70,170,100,'+(n?.16:.22)+')');
    c.strokeStyle='rgba(60,150,90,'+(n?.2:.3)+')';c.lineWidth=.35;c.beginPath();for(var m=0;m<10;m++){var mu=m/10,a=fpt(px,base,hw,hh,sd,mu,0),b=fpt(px,base,hw,hh,sd,Math.min(1,mu+.35),h);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke();
    c.strokeStyle=n?'#9AA1AD':'#4A4F58';c.lineWidth=.6;c.beginPath();var st=Math.max(2,Math.round(hw/6));for(var k=0;k<=st;k++){var u=k/st,p0=fpt(px,base,hw,hh,sd,u,0),p1=fpt(px,base,hw,hh,sd,u,h);c.moveTo(p0[0]+N.x*d,p0[1]+N.y*d);c.lineTo(p1[0]+N.x*d,p1[1]+N.y*d)}
    for(var v=0;v<=h;v+=6){var q0=fpt(px,base,hw,hh,sd,0,v),q1=fpt(px,base,hw,hh,sd,1,v);c.moveTo(q0[0]+N.x*d,q0[1]+N.y*d);c.lineTo(q1[0]+N.x*d,q1[1]+N.y*d);c.moveTo(q0[0],q0[1]);c.lineTo(q0[0]+N.x*d,q0[1]+N.y*d);c.moveTo(q1[0],q1[1]);c.lineTo(q1[0]+N.x*d,q1[1]+N.y*d)}
    for(var v2=0;v2+6<=h;v2+=12){var r0=fpt(px,base,hw,hh,sd,0,v2),r1=fpt(px,base,hw,hh,sd,1,v2+6);c.moveTo(r0[0]+N.x*d,r0[1]+N.y*d);c.lineTo(r1[0]+N.x*d,r1[1]+N.y*d)}c.stroke();
    c.strokeStyle=n?'#7A6648':'#C9A96E';c.lineWidth=1.3;c.beginPath();for(var v3=6;v3<=h;v3+=6){var s0=fpt(px,base,hw,hh,sd,.02,v3),s1=fpt(px,base,hw,hh,sd,.98,v3);c.moveTo(s0[0]+N.x*d*.5,s0[1]+N.y*d*.5+.6);c.lineTo(s1[0]+N.x*d*.5,s1[1]+N.y*d*.5+.6)}c.stroke()});
  var fl=fpt(px,base,hw,hh,0,0,h);c.strokeStyle='#C9CDD4';c.lineWidth=.6;hline(c,fl[0],fl[1],fl[0],fl[1]-6);c.fillStyle='#E8C547';c.beginPath();c.moveTo(fl[0],fl[1]-6);c.lineTo(fl[0]+4,fl[1]-5);c.lineTo(fl[0],fl[1]-3.6);c.closePath();c.fill();c.restore()}
/** a worker: hard hat, hi-vis vest with a reflective band, dark legs; mode 0 clipboard, 1 walking, 2 carrying a beam */
function figHi(c,x,y,col,seed,mode){var s=1.15,tn=reduce?0:T,wf=mode===1?Math.floor(tn/160+seed)%4:0,st=[-1,0,1,0][wf]*1.4*s,bob=mode===1?Math.abs(Math.sin(tn/160+seed))*.5:0,n=hn();
  c.fillStyle='rgba(0,0,0,'+(n?.3:.22)+')';c.beginPath();c.ellipse(x+1,y+.6,3*s,1.3*s,0,0,7);c.fill();
  c.strokeStyle='#2A2D35';c.lineCap='round';c.lineWidth=1.3*s;hline(c,x-.9*s,y-4*s,x-.9*s+st*.5,y);hline(c,x+.9*s,y-4*s,x+.9*s-st*.5,y);c.lineCap='butt';
  c.fillStyle='#FF7A30';c.fillRect(x-2*s,y-9*s-bob,4*s,5.2*s);c.fillStyle='rgba(240,240,200,.9)';c.fillRect(x-2*s,y-7.4*s-bob,4*s,.7*s);
  c.fillStyle='#E8C9A8';c.beginPath();c.arc(x,y-10.6*s-bob,1.7*s,0,7);c.fill();c.fillStyle='#F2D24A';c.beginPath();c.arc(x,y-11.1*s-bob,1.9*s,Math.PI,0);c.fill();c.fillRect(x-2.3*s,y-11.2*s-bob,4.6*s,.7*s);
  if(mode===0){c.fillStyle='#F4F1EA';c.fillRect(x+1.6*s,y-8.2*s,2.2*s,2.8*s);c.strokeStyle='#3A3D47';c.lineWidth=.35;hline(c,x+2*s,y-7.4*s,x+3.4*s,y-7.4*s);hline(c,x+2*s,y-6.6*s,x+3.4*s,y-6.6*s)}
  if(mode===2){c.fillStyle=col&&col.charAt(0)==='#'?col:'#E9A92C';c.fillRect(x-3.4*s,y-9.6*s-bob,6.8*s,1.6*s);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.3;c.strokeRect(x-3.4*s,y-9.6*s-bob,6.8*s,1.6*s)}}
/** a car: shadow, body gradient, cabin, windscreen glint, wheels, head and tail lights (cone after dark); parked = no cone */
function carHi(c,px,py,ux,uy,col,sc,parked){sc=sc||1;var nx=-uy,ny=ux*.5,n=sky!=='day',L=5.2*sc,Wd=2.6*sc,dk=P.light<1;
  c.fillStyle='rgba(0,0,0,'+(n?.35:.28)+')';c.beginPath();c.ellipse(px+1,py+1.6,L*1.1,Wd*.9,Math.atan2(uy,ux),0,7);c.fill();
  if(n&&!parked&&LODN>0){c.save();c.globalCompositeOperation='lighter';var g=c.createRadialGradient(px+ux*L*1.6,py+uy*L*1.6,0,px+ux*L*1.6,py+uy*L*1.6,13*sc);g.addColorStop(0,'rgba(255,240,190,.5)');g.addColorStop(1,'rgba(255,240,190,0)');c.fillStyle=g;c.beginPath();c.ellipse(px+ux*L*1.9,py+uy*L*1.9,13*sc,7*sc,Math.atan2(uy,ux),0,7);c.fill();c.restore()}
  var body=[[px-ux*L-nx*Wd,py-uy*L-ny*Wd-1.6],[px+ux*L-nx*Wd,py+uy*L-ny*Wd-1.6],[px+ux*L+nx*Wd,py+uy*L+ny*Wd-1.6],[px-ux*L+nx*Wd,py-uy*L+ny*Wd-1.6]];
  var bg=c.createLinearGradient(body[0][0],body[0][1],body[3][0],body[3][1]);bg.addColorStop(0,hmul(col,dk?.95:1.1));bg.addColorStop(1,hmul(col,dk?.6:.78));poly(c,body,bg);
  c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=.4;poly(c,body);c.stroke();
  var cab=[[px-ux*L*.35-nx*Wd*.8,py-uy*L*.35-ny*Wd*.8-4],[px+ux*L*.5-nx*Wd*.8,py+uy*L*.5-ny*Wd*.8-4],[px+ux*L*.5+nx*Wd*.8,py+uy*L*.5+ny*Wd*.8-4],[px-ux*L*.35+nx*Wd*.8,py-uy*L*.35+ny*Wd*.8-4]];
  poly(c,[[cab[0][0],cab[0][1]+2.4],[cab[1][0],cab[1][1]+2.4],cab[1],cab[0]],n?'#1A2338':'#6F93C0');poly(c,cab,hmul(col,dk?1.05:1.18));
  c.fillStyle='rgba(255,255,255,'+(n?.1:.5)+')';c.fillRect(cab[1][0]-1.4,cab[1][1]+.6,1.6,1);
  c.fillStyle='#14161C';[[-L*.6,-Wd*.9],[L*.5,-Wd*.9],[-L*.6,Wd*.9],[L*.5,Wd*.9]].forEach(function(w){c.beginPath();c.ellipse(px+ux*w[0]+nx*w[1],py+uy*w[0]+ny*w[1]+.3,1.1*sc,.7*sc,0,0,7);c.fill()});
  if(n&&!parked){c.fillStyle='#FF4A4A';c.fillRect(px-ux*L-1,py-uy*L-2.6,1.6,1);c.fillStyle='#FFF4D0';c.fillRect(px+ux*L-.6,py+uy*L-2.4,1.4,1)}}
/** water ripples and a sparkle by day, on the live layer (3 sine arcs per tile), only for tiles in view */
function waterHi(c){if(sky==='grid'||LODN===0&&cam.z<.25)return;var n=hn(),tn=reduce?0:T/1000,v=hView(TH);c.save();c.lineWidth=1;
  for(var i=0;i<=W;i++)for(var j=0;j<=H;j++){if(!water(i,j))continue;var q=iso(i,j);if(q.x<v[0]||q.x>v[1]||q.y<v[2]||q.y>v[3])continue;
    for(var w=0;w<3;w++){var ph=tn*.9+w*2.1+i*.7+j*1.3,ox=(rnd(i*13+j*7+w)-.5)*TW*.6,oy=(rnd(i*5+j*11+w)-.5)*TH*.6+Math.sin(ph)*2,al=(n?.12:.3)*(.5+.5*Math.sin(ph*1.3));c.strokeStyle='rgba(255,255,255,'+al.toFixed(3)+')';c.beginPath();c.moveTo(q.x+ox-7,q.y+oy);c.quadraticCurveTo(q.x+ox,q.y+oy-1.5,q.x+ox+7,q.y+oy);c.stroke()}
    if(!n){var sp=Math.sin(tn*2+i*3+j)*.5+.5;c.fillStyle='rgba(255,255,255,'+(.25*sp).toFixed(3)+')';c.beginPath();c.arc(q.x+(rnd(i+j*3)-.5)*30,q.y+(rnd(i*3+j)-.5)*14,.9,0,7);c.fill()}}c.restore()}
// ---- battle damage: scorch, rubble, smoke, tarp, tape (no people hurt, ever; launchers, missiles and crews are in citybattle.ts)
function scorchHi(c,x,y,d){var a=Math.min(.65,.3+.3*d),g=c.createRadialGradient(x+3,y+1,1,x+3,y+1,17);g.addColorStop(0,'rgba(20,14,10,'+a+')');g.addColorStop(.7,'rgba(20,14,10,'+(a*.55)+')');g.addColorStop(1,'rgba(20,14,10,0)');c.fillStyle=g;c.beginPath();c.ellipse(x+3,y+1,19,8.5,0,0,7);c.fill();
  c.strokeStyle='rgba(10,8,6,.5)';c.lineWidth=.45;c.beginPath();for(var k=0;k<6;k++){var an=k*1.05+rnd(k+x)*.6,r=6+rnd(k*3+y)*10;c.moveTo(x+3,y+1);c.lineTo(x+3+Math.cos(an)*r,y+1+Math.sin(an)*r*.5);c.lineTo(x+3+Math.cos(an+.3)*r*1.2,y+1+Math.sin(an+.3)*r*.6)}c.stroke()}
function rubbleHi(c,x,y,col){var n=hn();c.fillStyle='rgba(120,110,100,'+(n?.1:.16)+')';c.beginPath();c.ellipse(x,y-1,16,7,0,0,7);c.fill();
  for(var k=0;k<11;k++){var ox=(rnd(k*7+x)-.5)*24,oy=(rnd(k*3+y)-.5)*9,s=1.6+rnd(k+.5)*2.4,base=rnd(k*5+.3)<.4?'#8A8A93':col;
    poly(c,[[x+ox-s,y+oy],[x+ox,y+oy+s*.5],[x+ox+s,y+oy],[x+ox,y+oy-s*.5]],hmul(base,n?.7:1.05));poly(c,[[x+ox-s,y+oy],[x+ox,y+oy+s*.5],[x+ox,y+oy+s*1.2],[x+ox-s,y+oy+s*.7]],hmul(base,n?.4:.72));poly(c,[[x+ox,y+oy+s*.5],[x+ox+s,y+oy],[x+ox+s,y+oy+s*.7],[x+ox,y+oy+s*1.2]],hmul(base,n?.3:.55))}
  c.strokeStyle=n?'#6B5137':'#8B6A48';c.lineWidth=.6;c.beginPath();c.moveTo(x-8,y+2);c.quadraticCurveTo(x-4,y-6,x+1,y-7);c.moveTo(x+6,y+3);c.quadraticCurveTo(x+9,y-2,x+13,y-5);c.stroke()}
function smokeHi(c,x,y,heavy){var tn=reduce?0:T,n=hn(),N=heavy?6:4,cl=n?'90,92,100':'130,130,140';for(var k=0;k<N;k++){var f=((tn/2200)+k/N)%1,dx=Math.sin(k*1.7+tn/1100)*4+f*9,r=3+f*9,al=(n?.42:.5)*(1-f)*(1-f*.3),g=c.createRadialGradient(x+dx,y-f*44,r*.2,x+dx,y-f*44,r);g.addColorStop(0,'rgba('+cl+','+al.toFixed(3)+')');g.addColorStop(1,'rgba('+cl+',0)');c.fillStyle=g;c.beginPath();c.arc(x+dx,y-f*44,r,0,7);c.fill()}
  if(heavy&&n&&!reduce){c.save();c.globalCompositeOperation='lighter';for(var e=0;e<5;e++){var fe=((tn/1500)+e/5)%1;c.fillStyle='rgba(255,'+(120+Math.round(80*(1-fe)))+',40,'+(.9*(1-fe)).toFixed(3)+')';c.beginPath();c.arc(x+Math.sin(e*2+tn/400)*5,y-fe*22,.8,0,7);c.fill()}c.restore()}}
function tarpHi(c,px,ty,w){var hw=TW/2*w,hh=TH/2*w,q=[tpt(px,ty,hw,hh,-.9,-.9),tpt(px,ty,hw,hh,.9,-.9),tpt(px,ty,hw,hh,.9,.9),tpt(px,ty,hw,hh,-.9,.9)],g=c.createLinearGradient(q[0][0],q[0][1],q[2][0],q[2][1]);g.addColorStop(0,hn()?'#2E4A8A':'#3E72D8');g.addColorStop(1,hn()?'#1E305A':'#2A52A8');poly(c,q,g);
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=.5;c.beginPath();for(var k=1;k<4;k++){var f=k/4;c.moveTo(q[0][0]+(q[1][0]-q[0][0])*f,q[0][1]+(q[1][1]-q[0][1])*f);c.lineTo(q[3][0]+(q[2][0]-q[3][0])*f,q[3][1]+(q[2][1]-q[3][1])*f)}c.stroke();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.4;c.beginPath();c.moveTo(q[2][0],q[2][1]);c.lineTo(q[2][0]+2,q[2][1]+6);c.moveTo(q[3][0],q[3][1]);c.lineTo(q[3][0]-2,q[3][1]+6);c.stroke()}
function tapeHi(c,pts){c.save();c.strokeStyle='#F2D24A';c.lineWidth=1.2;c.beginPath();c.moveTo(pts[0][0],pts[0][1]-5);for(var k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]-5);c.stroke();c.strokeStyle='#14161C';c.setLineDash([2,2]);c.stroke();c.setLineDash([]);c.strokeStyle='#8A8A93';c.lineWidth=.8;pts.forEach(function(p){hline(c,p[0],p[1],p[0],p[1]-6)});c.restore()}
// ---- view culling and the sprite atlas (BUILD-NOTE section 3 and 4)
/** the world rectangle in view, with room below for tall things standing just off screen */
function hView(below){return [-cam.x/cam.z-TW,(vw-cam.x)/cam.z+TW,-cam.y/cam.z-TH*1.5,(vh-cam.y)/cam.z+(below==null?TH:below)]}
var ATL=new Map(),ATLB=0,ATLPK='',ATLF=0,ATLNEW=0,ATLN={hit:0,made:0,direct:0};
function atlScale(){return cam.z<.8?.8:1.1}   // cut at the top of the zoom bucket, times the canvas dpr, so a sprite is never upscaled
function atlBudget(){return (dpr>=2.5?24:dpr>=1.5?12:6)*1048576}
function atlFrame(){ATLF++;ATLNEW=0;ATLN={hit:0,made:0,direct:0};var pk=palKey+'|'+sky+'|'+dpr;if(pk!==ATLPK){ATL=new Map();ATLB=0;ATLPK=pk}}
function atlGet(key,w,h,ax,ay,fn){var s=ATL.get(key);if(s){ATL.delete(key);ATL.set(key,s);s.f=ATLF;ATLN.hit++;return s}
  if(ATLNEW>=40)return null;var sc=atlScale()*dpr,cw=Math.ceil(w*sc),ch=Math.ceil(h*sc),b=cw*ch*4;
  while(ATLB+b>atlBudget()&&ATL.size){var k0=ATL.keys().next().value,o=ATL.get(k0);if(o.f===ATLF)return null;ATL.delete(k0);ATLB-=o.b}
  var cv2=document.createElement('canvas');cv2.width=cw;cv2.height=ch;var c=cv2.getContext('2d');if(!c)return null;c.setTransform(sc,0,0,sc,0,0);c.translate(ax,ay);c.lineJoin='round';fn(c);
  s={cv:cv2,w:w,h:h,ax:ax,ay:ay,b:b,f:ATLF};ATL.set(key,s);ATLB+=b;ATLNEW++;ATLN.made++;return s}
/** draw fn at (x,y): from the atlas at LOD 1, else straight vectors (fn draws around the origin) */
function hiDraw(c,key,w,h,ax,ay,x,y,fn){var s=LODN===1&&key?atlGet(key+'|'+atlScale(),w,h,ax,ay,fn):null;
  if(s){c.drawImage(s.cv,x-ax,y-ay,w,h);return}ATLN.direct++;if(typeof window!=='undefined'&&window.CALDERA_PERF){var dk=String(key).split('|')[0];ATLN[dk]=(ATLN[dk]||0)+1}c.save();c.translate(x,y);fn(c);c.restore()}
` + PIX_JS;
