/* AERON Sportswear — Global JS v2.0 */
(function(){
'use strict';

/* CURSOR */
var cur=document.getElementById('aeron-cur'),crng=document.getElementById('aeron-crng');
if(cur&&crng&&window.matchMedia('(hover:hover)').matches){
  var mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px';});
  (function loop(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;crng.style.left=rx+'px';crng.style.top=ry+'px';requestAnimationFrame(loop);})();
  document.querySelectorAll('a,button,.opt-card,.prod-card,.gallery-cell').forEach(function(el){
    el.addEventListener('mouseenter',function(){cur.style.width='18px';cur.style.height='18px';crng.style.width='54px';crng.style.height='54px';});
    el.addEventListener('mouseleave',function(){cur.style.width='10px';cur.style.height='10px';crng.style.width='36px';crng.style.height='36px';});
  });
}

/* NAV SCROLL */
var nav=document.getElementById('main-nav');
if(nav){
  function onScroll(){nav.classList.toggle('scrolled',window.scrollY>50);}
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
}

/* MOBILE MENU */
window.toggleMenu=function(){
  var btn=document.getElementById('burgerBtn'),menu=document.getElementById('mobile-menu');
  if(!btn||!menu)return;
  btn.classList.toggle('open');menu.classList.toggle('open');
  document.body.style.overflow=menu.classList.contains('open')?'hidden':'';
};
window.closeMenu=function(){
  var btn=document.getElementById('burgerBtn'),menu=document.getElementById('mobile-menu');
  if(!btn||!menu)return;
  btn.classList.remove('open');menu.classList.remove('open');
  document.body.style.overflow='';
};

/* SCROLL REVEAL */
var ro=new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('vis');});
},{threshold:.07});
document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(function(el){ro.observe(el);});

/* STAT COUNTERS */
var sro=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(!e.isIntersecting)return;
    var el=e.target,target=+el.dataset.target,suffix=el.dataset.suffix||'',dur=1400,start=null;
    function run(ts){
      if(!start)start=ts;
      var p=Math.min((ts-start)/dur,1),eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(eased*target)+suffix;
      if(p<1)requestAnimationFrame(run);
    }
    requestAnimationFrame(run);
    sro.unobserve(el);
  });
},{threshold:.5});
document.querySelectorAll('[data-target]').forEach(function(el){sro.observe(el);});

/* POPUP */
window.openPopup=function(){
  var o=document.getElementById('popup-overlay');
  if(o){o.classList.add('open');document.body.style.overflow='hidden';}
};
window.closePopup=function(){
  var o=document.getElementById('popup-overlay');
  if(o){o.classList.remove('open');document.body.style.overflow='';}
  sessionStorage.setItem('aeronPopupSeen','1');
};
window.submitPopup=function(e){
  e.preventDefault();
  var em=document.getElementById('popupEmail');
  if(!em)return;
  fetch('https://byaeron.us16.list-manage.com/subscribe/post?u=127a1aaaebdf6e84a527057d2&id=c85ecbfeb2&f_id=00ce1ee1f0',{method:'POST',body:new URLSearchParams({EMAIL:em.value}),mode:'no-cors'});
  var wrap=document.getElementById('pu-form-wrap'),succ=document.getElementById('pu-success');
  if(wrap)wrap.style.display='none';
  if(succ)succ.style.display='block';
};
var overlay=document.getElementById('popup-overlay');
if(overlay){
  overlay.addEventListener('click',function(e){if(e.target===overlay)closePopup();});
  if(!sessionStorage.getItem('aeronPopupSeen'))setTimeout(openPopup,2200);
}

/* ── KIT CONFIGURATOR (kits page only) ── */
if(!document.getElementById('build'))return;

var jMOQ={10:45,50:40,100:37,200:34,500:31};
var sMOQ={10:55,50:50,100:46,200:42,500:38};

function apexBase(q,kit){
  var t=kit==='shorts'?sMOQ:jMOQ;
  if(q>=500)return t[500];if(q>=200)return t[200];
  if(q>=100)return t[100];if(q>=50)return t[50];return t[10];
}
function fmt(n){return'$'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function getShip(q){return q>=100?0:q>=50?150:q>=30?100:75;}

var selKit='jersey',addons={names:false,spon:false,emb:false,socks:false};
var sponCount=1,collarUp=0,collarName='Round',qty=20;

window.setKit=function(el,type){
  selKit=type;
  document.querySelectorAll('[data-kit]').forEach(function(c){c.classList.remove('on');});
  el.classList.add('on');updatePrice();
};
window.toggleAddon=function(el,key){
  addons[key]=!addons[key];el.classList.toggle('on',addons[key]);
  var wrap=document.getElementById('spon-count-wrap');
  if(key==='spon'&&wrap)wrap.style.display=addons[key]?'flex':'none';
  updatePrice();
};
window.adjSpon=function(d){
  sponCount=Math.max(1,Math.min(3,sponCount+d));
  var el=document.getElementById('spon-count');if(el)el.textContent=sponCount;updatePrice();
};
window.setCollar=function(el,name,up){
  collarUp=up;collarName=name;
  document.querySelectorAll('[data-collar]').forEach(function(c){c.classList.remove('on');});
  el.classList.add('on');updatePrice();
};
window.setQty=function(v){
  qty=parseInt(v,10);
  var el=document.getElementById('qtyDisplay');if(el)el.textContent=qty>=500?'500+':v;updatePrice();
};

function toggleLine(lid,pid,show,amount){
  var l=document.getElementById(lid),p=document.getElementById(pid);
  if(show){if(l)l.style.display='flex';if(p)p.textContent=fmt(amount);return amount;}
  if(l)l.style.display='none';return 0;
}

function updatePrice(){
  var base=apexBase(qty,selKit),total=base*qty;
  var jc=document.getElementById('priceJerseyCard'),sc=document.getElementById('priceShortsCard');
  if(jc)jc.textContent='$'+apexBase(qty,'jersey')+' / jersey';
  if(sc)sc.textContent='$'+apexBase(qty,'shorts')+' / set';
  var lb=document.getElementById('lBase'),pb=document.getElementById('pBase');
  if(lb)lb.textContent=(selKit==='shorts'?'APEX + Shorts':'APEX Jersey')+' x'+qty;
  if(pb)pb.textContent=fmt(base*qty);
  total+=toggleLine('lCollar','pCollar',collarUp>0,collarUp*qty);
  total+=toggleLine('lNames','pNames',addons.names,5*qty);
  total+=toggleLine('lSpon','pSpon',addons.spon,3*sponCount*qty);
  total+=toggleLine('lEmb','pEmb',addons.emb,4*qty);
  total+=toggleLine('lSocks','pSocks',addons.socks,18*qty);
  var ship=getShip(qty),ps=document.getElementById('pShip');
  if(ps){if(ship===0){ps.textContent='Free';ps.style.color='#28C76F';}else{ps.textContent=fmt(ship);ps.style.color='';}}
  total+=ship;
  var pt=document.getElementById('pTotal'),un=document.getElementById('unitNote');
  if(pt)pt.textContent=fmt(total);
  if(un)un.textContent='approx. '+fmt(total/qty)+' per jersey';
  var sf=document.getElementById('shipFree'),sp=document.getElementById('shipPaid'),sm=document.getElementById('shipMsg');
  if(sf)sf.classList.toggle('show',ship===0);
  if(sp)sp.classList.toggle('show',ship>0);
  if(sm&&ship>0)sm.textContent=fmt(ship)+' shipping — free on 100+';
}
updatePrice();

/* FORM SUBMIT: copy the configurator into the contact form, then let it post */
window.submitProject=function(){
  var kitType=selKit==='shorts'?'APEX Jersey + Shorts':'APEX Jersey Only';
  var lines=['Kit: '+kitType,'Quantity: '+qty,'Collar: '+collarName+(collarUp>0?' (+$'+collarUp+'/jersey)':''),'Add-Ons:'];
  if(addons.names)lines.push('  - Player Names & Numbers (+$5/jersey)');
  if(addons.spon)lines.push('  - Sponsor Logo: '+sponCount+' logo(s) (+$'+(3*sponCount)+'/jersey)');
  if(addons.emb)lines.push('  - Embroidered Crest (+$4/jersey)');
  if(addons.socks)lines.push('  - Launch Pads Socks (+$18/pair)');
  if(!addons.names&&!addons.spon&&!addons.emb&&!addons.socks)lines.push('  - None');
  var pt=document.getElementById('pTotal');
  lines.push('Estimated Total: '+(pt?pt.textContent:'N/A'));
  var sf=document.getElementById('supplierSummary');if(sf)sf.value=lines.join('\n');
  var btn=document.getElementById('payBtn');
  if(btn){btn.disabled=true;btn.textContent='Sending...';}
};
var projForm=document.getElementById('projForm');
if(projForm)projForm.addEventListener('submit',window.submitProject);

})();