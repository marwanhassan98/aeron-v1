/* AERON Sportswear — Global JS v2.0 */
(function(){
'use strict';

/* CURSOR: decorative trailing ring for fine pointers (system cursor stays visible) */
var crng=document.getElementById('aeron-crng');
if(crng&&window.matchMedia('(hover:hover) and (pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
  var mx=-100,my=-100,rx=-100,ry=-100,raf=0;
  function loop(){
    rx+=(mx-rx)*.18;ry+=(my-ry)*.18;
    crng.style.left=rx+'px';crng.style.top=ry+'px';
    raf=(Math.abs(mx-rx)>.1||Math.abs(my-ry)>.1)?requestAnimationFrame(loop):0;
  }
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;crng.classList.add('on');if(!raf)raf=requestAnimationFrame(loop);},{passive:true});
  document.addEventListener('mouseleave',function(){crng.classList.remove('on');});
  document.addEventListener('mouseover',function(e){crng.classList.toggle('big',!!e.target.closest('a,button,.opt-card,.prod-card,.gallery-cell,label'));});
}

/* NAV SCROLL */
var nav=document.getElementById('main-nav');
if(nav){
  function onScroll(){nav.classList.toggle('scrolled',window.scrollY>50);}
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
}

/* MOBILE MENU */
function setMenu(open){
  var btn=document.getElementById('burgerBtn'),menu=document.getElementById('mobile-menu');
  if(!btn||!menu)return;
  btn.classList.toggle('open',open);menu.classList.toggle('open',open);
  btn.setAttribute('aria-expanded',open?'true':'false');
  menu.setAttribute('aria-hidden',open?'false':'true');
  if(open)menu.removeAttribute('inert');else menu.setAttribute('inert','');
  document.body.style.overflow=open?'hidden':'';
  if(open){var f=menu.querySelector('a');if(f)f.focus();}
}
window.toggleMenu=function(){var m=document.getElementById('mobile-menu');setMenu(!(m&&m.classList.contains('open')));};
window.closeMenu=function(){setMenu(false);};
var burger=document.getElementById('burgerBtn'),mmenu=document.getElementById('mobile-menu');
if(burger)burger.addEventListener('click',window.toggleMenu);
if(mmenu)mmenu.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&mmenu&&mmenu.classList.contains('open')){setMenu(false);if(burger)burger.focus();}
});
window.addEventListener('resize',function(){if(window.innerWidth>900&&mmenu&&mmenu.classList.contains('open'))setMenu(false);});

/* SCROLL REVEAL */
var ro=new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('vis');});
},{threshold:.07});
document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(function(el){ro.observe(el);});

/* PAUSE LOOPING STRIPS WHILE OFF-SCREEN */
var po=new IntersectionObserver(function(entries){
  entries.forEach(function(e){e.target.classList.toggle('paused',!e.isIntersecting);});
});
document.querySelectorAll('.mq-track,.photo-track').forEach(function(el){po.observe(el);});

/* POPUP: dialog with focus trap; opens after a delay plus scroll/exit intent */
var overlay=document.getElementById('popup-overlay'),lastFocus=null;
function seen(){try{return sessionStorage.getItem('aeronPopupSeen');}catch(e){return '1';}}
function markSeen(){try{sessionStorage.setItem('aeronPopupSeen','1');}catch(e){}}
function focusables(){return [].slice.call(overlay.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea')).filter(function(el){return !el.disabled&&el.offsetParent!==null;});}
window.openPopup=function(){
  if(!overlay||overlay.classList.contains('open'))return;
  lastFocus=document.activeElement;
  overlay.hidden=false;
  setTimeout(function(){overlay.classList.add('open');},20);
  document.body.style.overflow='hidden';
  var f=overlay.querySelector('input[type=email]')||focusables()[0];
  if(f)setTimeout(function(){f.focus();},50);
};
window.closePopup=function(){
  if(!overlay)return;
  overlay.classList.remove('open');
  document.body.style.overflow='';
  markSeen();
  setTimeout(function(){overlay.hidden=true;},400);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
};
if(overlay){
  overlay.addEventListener('click',function(e){if(e.target===overlay||e.target.closest('#popup-close,[data-popup-dismiss]'))closePopup();});
  overlay.addEventListener('keydown',function(e){
    if(e.key==='Escape'){closePopup();return;}
    if(e.key!=='Tab')return;
    var f=focusables();if(!f.length)return;
    if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus();}
    else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus();}
  });
  if(overlay.querySelector('[data-popup-autoopen]')){
    if(overlay.querySelector('#pu-success'))markSeen();
    openPopup();
  }else if(!seen()){
    var ready=false,wanted=false;
    function maybe(){wanted=true;if(ready)openPopup();}
    setTimeout(function(){ready=true;if(wanted)openPopup();},(parseInt(overlay.getAttribute('data-delay'),10)||8)*1000);
    window.addEventListener('scroll',function onS(){
      if(window.scrollY>(document.documentElement.scrollHeight-window.innerHeight)*.5){window.removeEventListener('scroll',onS);maybe();}
    },{passive:true});
    document.addEventListener('mouseout',function onM(e){if(!e.relatedTarget&&e.clientY<=0){document.removeEventListener('mouseout',onM);maybe();}});
  }
}

/* ── KIT CONFIGURATOR (kits page only) ── */
if(!document.getElementById('build'))return;

/* Option cards are divs with inline onclick: make them keyboard operable and expose state */
function syncPressed(){document.querySelectorAll('.opt-card').forEach(function(c){c.setAttribute('aria-pressed',c.classList.contains('on')?'true':'false');});}
document.querySelectorAll('.opt-card').forEach(function(c){c.setAttribute('role','button');c.setAttribute('tabindex','0');});
document.addEventListener('keydown',function(e){
  var c=e.target.closest&&e.target.closest('.opt-card');
  if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();c.click();}
});
document.addEventListener('click',function(e){if(e.target.closest('.opt-card'))syncPressed();});
syncPressed();

/* Prices come from Theme settings → Kit pricing, rendered as JSON by page-kits */
var P=JSON.parse(document.getElementById('kitPricing').textContent);
var jMOQ=P.jersey,sMOQ=P.set;
var PR={names:P.names,spon:P.sponsor,emb:P.emb,socks:P.socks};
var SH=P.ship;
var S=JSON.parse(document.getElementById('kitStrings').textContent);

function apexBase(q,kit){
  var t=kit==='shorts'?sMOQ:jMOQ;
  if(q>=500)return t[500];if(q>=200)return t[200];
  if(q>=100)return t[100];if(q>=50)return t[50];return t[10];
}
function fmt(n){return'$'+n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function getShip(q){return q>=SH.free?0:q>=50?SH['50']:q>=30?SH['30']:SH.small;}

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
  if(jc)jc.textContent='$'+apexBase(qty,'jersey')+' '+S.per_jersey;
  if(sc)sc.textContent='$'+apexBase(qty,'shorts')+' '+S.per_set;
  var lb=document.getElementById('lBase'),pb=document.getElementById('pBase');
  if(lb)lb.textContent=(selKit==='shorts'?S.base_set:S.base_jersey)+' x'+qty;
  if(pb)pb.textContent=fmt(base*qty);
  total+=toggleLine('lCollar','pCollar',collarUp>0,collarUp*qty);
  total+=toggleLine('lNames','pNames',addons.names,PR.names*qty);
  total+=toggleLine('lSpon','pSpon',addons.spon,PR.spon*sponCount*qty);
  total+=toggleLine('lEmb','pEmb',addons.emb,PR.emb*qty);
  total+=toggleLine('lSocks','pSocks',addons.socks,PR.socks*qty);
  var ship=getShip(qty),ps=document.getElementById('pShip');
  if(ps){if(ship===0){ps.textContent=S.free;ps.style.color='#28C76F';}else{ps.textContent=fmt(ship);ps.style.color='';}}
  total+=ship;
  var pt=document.getElementById('pTotal'),un=document.getElementById('unitNote');
  if(pt)pt.textContent=fmt(total);
  if(un)un.textContent=S.unit_note.replace('[price]',fmt(total/qty));
  var sf=document.getElementById('shipFree'),sp=document.getElementById('shipPaid'),sm=document.getElementById('shipMsg');
  if(sf)sf.classList.toggle('show',ship===0);
  if(sp)sp.classList.toggle('show',ship>0);
  if(sm&&ship>0)sm.textContent=S.ship_msg.replace('[price]',fmt(ship)).replace('[qty]',SH.free);
}
updatePrice();

/* FORM SUBMIT: copy the configurator into the contact form, then let it post */
window.submitProject=function(){
  var kitType=selKit==='shorts'?'APEX Jersey + Shorts':'APEX Jersey Only';
  var lines=['Kit: '+kitType,'Quantity: '+qty,'Collar: '+collarName+(collarUp>0?' (+$'+collarUp+'/jersey)':''),'Add-Ons:'];
  if(addons.names)lines.push('  - Player Names & Numbers (+$'+PR.names+'/jersey)');
  if(addons.spon)lines.push('  - Sponsor Logo: '+sponCount+' logo(s) (+$'+(PR.spon*sponCount)+'/jersey)');
  if(addons.emb)lines.push('  - Embroidered Crest (+$'+PR.emb+'/jersey)');
  if(addons.socks)lines.push('  - Launch Pads Socks (+$'+PR.socks+'/pair)');
  if(!addons.names&&!addons.spon&&!addons.emb&&!addons.socks)lines.push('  - None');
  var pt=document.getElementById('pTotal');
  lines.push('Estimated Total: '+(pt?pt.textContent:'N/A'));
  var sf=document.getElementById('supplierSummary');if(sf)sf.value=lines.join('\n');
  var btn=document.getElementById('payBtn');
  if(btn){btn.disabled=true;btn.textContent=S.sending;}
};
var projForm=document.getElementById('projForm');
if(projForm)projForm.addEventListener('submit',window.submitProject);

})();