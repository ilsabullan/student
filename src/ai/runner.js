// AI가 만든 시각화 코드를 실행하는 런타임. 워커(격리 실행)와 내보낸 노트 HTML 양쪽에서 같은 소스를 씁니다.
export const RUNNER_SRC = String.raw`
var INK='#1C1D22',MUTE='#8A8D98',ACC='#5B5FE8',GRN='#1F8A5B',RED='#D2383E';
var BX={box:['#FFFFFF','#D5D7DE',1.2],blue:['#F1F1FE','#7C7FF2',1.6],hi:['#FFF4D6','#E0A526',2],green:['#E7F6EE','#2FA876',1.6],red:['#FDECEC','#E5484D',1.6]};
var SUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
function sup(n){return String(n).split('').map(function(c){return SUP[c]||c;}).join('');}
function nf(x){return Number.isInteger(x)?String(x):Number(x).toFixed(1);}
function fmtBytes(x){var u=['B','KB','MB','GB','TB','PB','EB','ZB'],i=0;while(x>=1024&&i<u.length-1){x/=1024;i++;}return nf(x)+u[i];}
function flat(c){var o=[];(function f(x){if(x==null||x===false||x===true||x==='')return;if(Array.isArray(x))x.forEach(f);else o.push(typeof x==='object'?x:String(x));})(c);return o;}
function h(t,a){return {t:String(t),a:a||{},c:flat([].slice.call(arguments,2))};}
function kit(st){
  function R(t,x,y,w,hh,rx){var b=BX[t]||BX.box;return h('rect',{x:x,y:y,width:Math.max(0,w),height:Math.max(0,hh),rx:rx||0,fill:b[0],stroke:b[1],strokeWidth:b[2],style:{transition:'all .3s'}});}
  function T(x,y,str,t,ex){return h('text',Object.assign({x:x,y:y,fontSize:t==='s'?12.5:t==='b'?17:t==='xl'?23:14,fontWeight:(t==='b'||t==='xl')?700:500,fill:t==='s'?MUTE:INK,fontFamily:'inherit'},ex||{}),String(str));}
  function A(d,o){o=o||{};return h('path',{d:d,fill:'none',stroke:o.red?'#E5484D':'#4B4E58',strokeWidth:1.6,markerEnd:o.red?'url(#vzahr)':'url(#vzah)',strokeDasharray:o.flow?'6 5':undefined,style:{animation:o.flow?'vzdash 1s linear infinite':undefined,opacity:o.op==null?1:o.op,transition:'opacity .3s'}});}
  function L(x1,y1,x2,y2,c,w){return h('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:c||'#C9CBD3',strokeWidth:w||1.2});}
  function C(cx,cy,r,t){var b=BX[t]||BX.box;return h('circle',{cx:cx,cy:cy,r:Math.max(0,r),fill:b[0],stroke:b[1],strokeWidth:b[2],style:{transition:'all .3s'}});}
  function P(d,fill,stroke){return h('path',{d:d,fill:fill||'none',stroke:stroke||INK,strokeWidth:1.4});}
  function G(s){return h('g',{style:{opacity:st>=s?1:0,transition:'opacity .5s ease'}},[].slice.call(arguments,1));}
  function mk(id,c){return h('marker',{id:id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'},h('path',{d:'M0,0L10,5L0,10z',fill:c}));}
  function SVG(vb){return h('svg',{viewBox:vb,style:{width:'100%',minWidth:500,height:'auto',display:'block',overflow:'visible'}},h('defs',{},mk('vzah','#4B4E58'),mk('vzahr','#E5484D')),[].slice.call(arguments,1));}
  return {R:R,T:T,A:A,L:L,C:C,P:P,G:G,SVG:SVG,h:h};
}
function buildSim(code){
  var f=new Function('kit','h','sup','nf','fmtBytes','INK','MUTE','ACC','GRN','RED','"use strict";return ('+code+');');
  var sim=f(kit,h,sup,nf,fmtBytes,INK,MUTE,ACC,GRN,RED);
  if(!sim||typeof sim.run!=='function'||typeof sim.draw!=='function'||!Array.isArray(sim.sliders))throw new Error('sliders/run/draw가 필요합니다');
  return sim;
}
function simMeta(sim){
  return {vizTitle:String(sim.vizTitle||''),steps:(sim.steps||[]).map(String),defaults:sim.defaults||{},
    sliders:sim.sliders.map(function(s){return {key:String(s.key),label:String(s.label||s.key),min:+s.min,max:+s.max,step:+s.step||1};})};
}
function evalSim(sim,p,st){
  var r=sim.run(p)||{},tree=sim.draw(p,st),fm={};
  if(!tree||tree.t!=='svg')throw new Error('draw()는 SVG(...)를 반환해야 합니다');
  sim.sliders.forEach(function(s){fm[s.key]=typeof s.fmt==='function'?String(s.fmt(p[s.key])):String(p[s.key]);});
  return {r:{formulaLabel:String(r.formulaLabel||''),formula:String(r.formula||''),explain:String(r.explain||''),warn:!!r.warn},tree:tree,fm:fm};
}
var JKEEP={viewBox:1,refX:1,refY:1,markerWidth:1,markerHeight:1};
var NOPX={opacity:1,fontWeight:1,lineHeight:1,zIndex:1,flex:1};
function jesc(x){return String(x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function jkeb(k){return k.replace(/[A-Z]/g,function(m){return '-'+m.toLowerCase();});}
function jmk(n){
  if(typeof n!=='object')return jesc(n);
  var a='';for(var k in n.a){var v=n.a[k];if(v==null||/^on/i.test(k)||/href/i.test(k))continue;
    if(k==='style'){var css='';for(var sk in v){if(v[sk]==null)continue;css+=jkeb(sk)+':'+(typeof v[sk]==='number'&&!NOPX[sk]?v[sk]+'px':v[sk])+';';}a+=' style="'+jesc(css)+'"';continue;}
    a+=' '+(JKEEP[k]?k:jkeb(k))+'="'+jesc(v)+'"';}
  return '<'+n.t+a+'>'+n.c.map(jmk).join('')+'</'+n.t+'>';
}
`;
