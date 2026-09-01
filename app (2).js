/* ============================================================
   SHOES EMPIRE — app.js
   Logique complète : catalogue, panier, paiement, nouveautés,
   liste d'envies, notifications, compte à rebours, quiz,
   fidélité, admin, PWA.
   ============================================================ */

const DEFAULT_PRODUCTS = [
  {id:"p1", name:"Nike Air Force 1 — Grey/Black/Orange Sole", cat:"af1", tag:"AF1", price:12000, img:"images/af1-orange-sole.jpg", pick:true, stock:null, isNew:false},
  {id:"p2", name:"Nike Air Force 1 — Grey Suede", cat:"af1", tag:"AF1", price:12000, img:"images/af1-grey-hand.jpg", stock:null, isNew:false},
  {id:"p3", name:"Nike Air Force 1 — Cream/Brown/Red", cat:"af1", tag:"AF1", price:12000, img:"images/af1-cream-red.jpg", pick:true, stock:null, isNew:false},
  {id:"p4", name:"Nike Air Force 1 — Undefeated Grey", cat:"af1", tag:"AF1", price:12000, img:"images/af1-undefeated.jpg", stock:null, isNew:false},
  {id:"p5", name:"New Balance 9060 — Noir", cat:"nb", tag:"NEW BALANCE", price:14000, img:"images/nb-9060-black.jpg", stock:null, isNew:false},
  {id:"p6", name:"New Balance 9060 — Bleu Dégradé", cat:"nb", tag:"NEW BALANCE", price:14000, img:"images/nb-9060-blue.jpg", pick:true, stock:null, isNew:false},
  {id:"p7", name:"New Balance 9060 — Blanc/Bleu/Orange", cat:"nb", tag:"NEW BALANCE", price:14000, img:"images/nb-9060-orange.jpg", stock:null, isNew:false},
  {id:"p8", name:"New Balance 9060 — Gris/Jaune", cat:"nb", tag:"NEW BALANCE", price:14000, img:"images/nb-9060-yellow.jpg", stock:null, isNew:false},
  {id:"p9", name:"New Balance 530 — Blanc/Argenté", cat:"nb", tag:"NEW BALANCE", price:14000, img:"images/nb-530-white.jpg", pick:true, stock:null, isNew:false},
  {id:"p10", name:"Adidas Campus — Noir/Blanc", cat:"autres", tag:"ADIDAS", price:13000, img:"images/adidas-campus-black.jpg", stock:null, isNew:false},
  {id:"p11", name:"Air Jordan 4 — Blanc/Bleu Marine", cat:"aj", tag:"AIR JORDAN", price:null, img:"images/aj4-white-navy.jpg", stock:5, isNew:true},
  {id:"p12", name:"Air Jordan 6 Rings — Bleu/Gris", cat:"aj", tag:"AIR JORDAN", price:null, img:"images/aj-6rings-blue.jpg", stock:5, isNew:true},
  {id:"p13", name:"Asics Gel-NYC — Rose/Blanc", cat:"autres", tag:"ASICS", price:null, img:"images/asics-gel-pink.jpg", stock:3, isNew:true},
  {id:"p14", name:"Nike Air Max Style — Noir", cat:"autres", tag:"NIKE", price:null, img:"images/nike-airmax-black.jpg", stock:3, isNew:true},
];

const DEFAULT_REVIEWS = [];

const DEFAULT_SETTINGS = {
  adminPassword:"empire2026",
  wa:"22942924984",
  momo:"96 00 00 00",
  moov:"95 00 00 00",
  celtiis:"90 00 00 00",
};

const DEFAULT_MARKETING = {
  promoText:"Livraison offerte dès 2 paires achetées, partout au Bénin",
  promoEnd:null, // ISO datetime string, set in admin for a real countdown
  giftText:"Sur votre première commande, un petit cadeau vous attend — dites simplement \"première commande\" en écrivant sur WhatsApp.",
};

/* ---------- storage helpers ---------- */
function load(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch(e){ return fallback; }
}
function save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

let PRODUCTS = load("se_products", DEFAULT_PRODUCTS);
let REVIEWS = load("se_reviews", DEFAULT_REVIEWS);
let SETTINGS = Object.assign({}, DEFAULT_SETTINGS, load("se_settings", {}));
let MARKETING = Object.assign({}, DEFAULT_MARKETING, load("se_marketing", {}));
let STATS = load("se_stats", {visits:0, addToCart:0, orders:0});
let CART = load("se_cart", []);
let WISHLIST = load("se_wishlist", []); // array of product ids
let LOYALTY = load("se_loyalty", {points:0});
let NOTIFICATIONS = load("se_notifications", []); // {id, text, time}

STATS.visits = (STATS.visits || 0) + 1;
save("se_stats", STATS);

/* ============================================================
   FIREBASE — base de données partagée (optionnelle)
   Si firebase-config.js est vide, tout fonctionne comme avant,
   en local sur cet appareil uniquement. Dès qu'il est rempli
   (voir README.md), l'admin se synchronise entre tous les
   appareils en temps réel.
   ============================================================ */
let USE_FIREBASE = false;
let fbDb = null;
let fbAuth = null;

(function initFirebase(){
  try{
    if(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.firebase){
      firebase.initializeApp(window.FIREBASE_CONFIG);
      fbDb = firebase.firestore();
      fbAuth = firebase.auth();
      USE_FIREBASE = true;
    }
  }catch(e){
    console.warn("Firebase non initialisé — le site fonctionne en mode local.", e);
    USE_FIREBASE = false;
  }
})();

function syncStatusText(){
  return USE_FIREBASE
    ? "🟢 Synchronisé — base de données partagée active"
    : "⚪ Mode local — données stockées sur cet appareil uniquement";
}

function seedFirestoreOnce(){
  fbDb.collection("products").get().then(snap=>{
    if(snap.empty){
      const batch = fbDb.batch();
      PRODUCTS.forEach(p=>batch.set(fbDb.collection("products").doc(p.id), p));
      batch.commit().catch(e=>console.warn(e));
    }
  });
  fbDb.collection("config").doc("settings").get().then(doc=>{
    if(!doc.exists) fbDb.collection("config").doc("settings").set(SETTINGS);
  });
  fbDb.collection("config").doc("marketing").get().then(doc=>{
    if(!doc.exists) fbDb.collection("config").doc("marketing").set(MARKETING);
  });
}

function startFirebaseSync(){
  if(!USE_FIREBASE) return;
  seedFirestoreOnce();

  fbDb.collection("products").onSnapshot(snap=>{
    if(snap.empty) return;
    PRODUCTS = snap.docs.map(d=>d.data());
    render(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
    if(document.getElementById("admin-dashboard").style.display !== "none") renderAdminProducts();
  }, err=>console.warn("Firestore products:", err));

  fbDb.collection("reviews").orderBy("createdAt","desc").onSnapshot(snap=>{
    REVIEWS = snap.docs.map(d=>({fid:d.id, ...d.data()}));
    renderExtraReviews();
    if(document.getElementById("admin-dashboard").style.display !== "none") renderAdminReviews();
  }, err=>console.warn("Firestore reviews:", err));

  fbDb.collection("config").doc("settings").onSnapshot(doc=>{
    if(doc.exists){
      SETTINGS = Object.assign({}, DEFAULT_SETTINGS, doc.data());
      render(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
    }
  }, err=>console.warn("Firestore settings:", err));

  fbDb.collection("config").doc("marketing").onSnapshot(doc=>{
    if(doc.exists){
      MARKETING = Object.assign({}, DEFAULT_MARKETING, doc.data());
      renderPromoBar();
      document.getElementById("gift-text").textContent = MARKETING.giftText;
    }
  }, err=>console.warn("Firestore marketing:", err));

  fbDb.collection("config").doc("stats").onSnapshot(doc=>{
    if(doc.exists){
      STATS = doc.data();
      renderTrustStrip();
      if(document.getElementById("admin-dashboard").style.display !== "none"){
        document.getElementById("stat-visits").textContent = STATS.visits||0;
        document.getElementById("stat-cart").textContent = STATS.addToCart||0;
        document.getElementById("stat-orders").textContent = STATS.orders||0;
      }
    }
  }, err=>console.warn("Firestore stats:", err));
}

function bumpStat(field){
  if(USE_FIREBASE){
    fbDb.collection("config").doc("stats").set(
      {[field]: firebase.firestore.FieldValue.increment(1)}, {merge:true}
    ).catch(e=>console.warn(e));
  }else{
    STATS[field] = (STATS[field]||0) + 1;
    save("se_stats", STATS);
  }
}
if(USE_FIREBASE) bumpStat("visits");

function fmtPrice(n){ return n.toLocaleString("fr-FR").replace(/,/g," ") + " FCFA"; }
function waLink(text){ return `https://wa.me/${SETTINGS.wa}?text=${encodeURIComponent(text)}`; }

function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ============================================================
   NOTIFICATIONS — uniquement des évènements réels
   (pas de fausse activité client fabriquée)
   ============================================================ */
function pushNotification(text){
  NOTIFICATIONS.unshift({text, time: new Date().toISOString()});
  NOTIFICATIONS = NOTIFICATIONS.slice(0, 20);
  save("se_notifications", NOTIFICATIONS);
  renderNotifications();
}
function relativeTime(iso){
  const diff = Math.round((Date.now() - new Date(iso).getTime())/60000);
  if(diff < 1) return "à l'instant";
  if(diff < 60) return `il y a ${diff} min`;
  const h = Math.round(diff/60);
  if(h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h/24)} j`;
}
function renderNotifications(){
  const list = document.getElementById("notif-list");
  const countEl = document.getElementById("notif-count");
  if(!NOTIFICATIONS.length){
    list.innerHTML = `<div class="notif-empty">Rien pour l'instant.</div>`;
    countEl.style.display = "none";
    return;
  }
  list.innerHTML = NOTIFICATIONS.map(n=>`<div class="notif-item">${n.text}<span class="t">${relativeTime(n.time)}</span></div>`).join("");
  const unseen = Number(localStorage.getItem("se_notif_unseen")||0);
  if(unseen > 0){ countEl.style.display="flex"; countEl.textContent = unseen; }
  else countEl.style.display = "none";
}
const notifBtn = document.getElementById("notif-btn");
const notifPanel = document.getElementById("notif-panel");
notifBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  notifPanel.classList.toggle("open");
  if(notifPanel.classList.contains("open")){
    localStorage.setItem("se_notif_unseen","0");
    document.getElementById("notif-count").style.display="none";
  }
});
document.addEventListener("click", ()=> notifPanel.classList.remove("open"));
notifPanel.addEventListener("click", e=>e.stopPropagation());

/* ---------- Bienvenue (première visite) — vrai avantage, pas un faux minuteur ---------- */
(function welcomeOnce(){
  if(!localStorage.getItem("se_seen_welcome")){
    localStorage.setItem("se_seen_welcome","1");
    setTimeout(()=>{
      pushNotification("Bienvenue chez Shoes Empire — un cadeau vous attend sur votre première commande.");
      localStorage.setItem("se_notif_unseen", "1");
      document.getElementById("notif-count").style.display="flex";
      document.getElementById("notif-count").textContent="1";
      toast("Bienvenue ! Voir vos notifications 🔔");
    }, 1400);
  }
})();

/* ============================================================
   PROMO BAR + COMPTE À REBOURS RÉEL (basé sur une date admin)
   ============================================================ */
function renderPromoBar(){
  const bar = document.getElementById("promo-bar");
  if(!MARKETING.promoEnd){
    bar.innerHTML = `${MARKETING.promoText}`;
    return;
  }
  const end = new Date(MARKETING.promoEnd).getTime();
  function tick(){
    const now = Date.now();
    const diff = end - now;
    if(diff <= 0){
      bar.innerHTML = `${MARKETING.promoText}`;
      clearInterval(window._promoTimer);
      return;
    }
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    bar.innerHTML = `${MARKETING.promoText} <span class="countdown mono">${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}</span>`;
  }
  tick();
  clearInterval(window._promoTimer);
  window._promoTimer = setInterval(tick, 1000);
}

/* ============================================================
   TRUST STRIP — chiffres réels (stats), pas inventés
   ============================================================ */
function renderTrustStrip(){
  const strip = document.getElementById("trust-strip");
  const modelCount = PRODUCTS.length;
  strip.innerHTML = `
    <div><div class="big">${modelCount}+</div><div class="small">Modèles en stock</div></div>
    <div><div class="big">24-72h</div><div class="small">Livraison Bénin</div></div>
    <div><div class="big">100%</div><div class="small">Vérifiées avant envoi</div></div>
    <div><div class="big">${STATS.orders||0}</div><div class="small">Commandes honorées</div></div>
  `;
}

/* ============================================================
   CATALOGUE
   ============================================================ */
const grid = document.getElementById("grid");
const newGrid = document.getElementById("new-grid");

function stockBadge(p){
  if(p.stock === null || p.stock === undefined || p.stock === "") return `<div class="card-sizes">Pointures : nous consulter</div>`;
  const n = Number(p.stock);
  if(isNaN(n)) return `<div class="card-sizes">Pointures : nous consulter</div>`;
  if(n <= 0) return `<div class="card-sizes low">Rupture de stock</div>`;
  if(n <= 5) return `<div class="card-sizes low">Plus que ${n} en stock</div>`;
  return `<div class="card-sizes">Pointures : nous consulter</div>`;
}

function renderCard(p, {isNewCard}={}){
  const waMsgOrder = `Bonjour Shoes Empire, je suis intéressé(e) par : ${p.name}. Est-elle disponible ?`;
  const waMsgReserve = `Bonjour Shoes Empire, je souhaite RÉSERVER cette nouveauté avant sa mise en vente : ${p.name}. Merci de me tenir informé(e) dès qu'elle est disponible.`;
  const priceHtml = p.price ? `<span class="price-tag">${fmtPrice(p.price)}</span>` : `<span class="price-tag tbd">Prix sur demande</span>`;
  const isWished = WISHLIST.includes(p.id);

  const actionsHtml = isNewCard
    ? `<div class="card-actions">
        <a class="order-btn" href="${waLink(waMsgOrder)}" target="_blank" rel="noopener">Commander</a>
        <a class="reserve-btn" href="${waLink(waMsgReserve)}" target="_blank" rel="noopener">Réserver</a>
       </div>`
    : `<div class="card-actions">
        <button class="add-cart-btn" data-id="${p.id}" title="Ajouter au panier" aria-label="Ajouter au panier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="17" cy="21" r="1"/></svg>
        </button>
        <a class="order-btn" href="${waLink(waMsgOrder)}" target="_blank" rel="noopener">Commander</a>
       </div>`;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-img">
      <span class="card-cat">${p.tag}</span>
      ${p.pick ? `<span class="card-pick">Coup de cœur</span>` : ""}
      ${isNewCard ? `<span class="card-new">Nouveau</span>` : ""}
      <button class="wish-btn ${isWished?'active':''}" data-id="${p.id}" aria-label="Ajouter à ma liste">
        <svg viewBox="0 0 24 24" fill="${isWished?'currentColor':'none'}" stroke="currentColor" stroke-width="1.6"><path d="M20.8 8.6c0 4.5-4.8 7.9-8.8 11-4-3.1-8.8-6.5-8.8-11a5 5 0 0 1 8.8-3.2 5 5 0 0 1 8.8 3.2z"/></svg>
      </button>
      <img src="${p.img}" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      ${stockBadge(p)}
      <div class="card-foot">${priceHtml}</div>
      ${actionsHtml}
    </div>
  `;
  card.querySelector(".wish-btn").addEventListener("click", (e)=>{
    e.preventDefault();
    toggleWishlist(p.id);
  });
  return card;
}

function render(filter){
  grid.innerHTML = "";
  PRODUCTS.filter(p=>!p.isNew).filter(p=>filter==="all"||p.cat===filter).forEach(p=>grid.appendChild(renderCard(p,{isNewCard:false})));

  newGrid.innerHTML = "";
  const news = PRODUCTS.filter(p=>p.isNew);
  document.getElementById("nouveautes").style.display = news.length ? "" : "none";
  news.forEach(p=>newGrid.appendChild(renderCard(p,{isNewCard:true})));

  grid.querySelectorAll(".add-cart-btn").forEach(btn=>btn.addEventListener("click", ()=>addToCart(btn.dataset.id)));
  renderTrustStrip();
}

document.getElementById("filters").addEventListener("click", (e)=>{
  if(!e.target.classList.contains("filter-btn")) return;
  setActiveFilter(e.target.dataset.filter);
});
function setActiveFilter(filter){
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active", b.dataset.filter===filter));
  render(filter);
}

/* ============================================================
   WISHLIST — sert de déclencheur d'alerte "retour en stock"
   ============================================================ */
function toggleWishlist(id){
  if(WISHLIST.includes(id)){
    WISHLIST = WISHLIST.filter(x=>x!==id);
    toast("Retiré de votre liste");
  }else{
    WISHLIST.push(id);
    toast("Ajouté à votre liste ♥");
  }
  save("se_wishlist", WISHLIST);
  updateWishBadge();
  render(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
}
function updateWishBadge(){
  const n = WISHLIST.length;
  const el = document.getElementById("wish-count");
  el.style.display = n>0 ? "flex" : "none";
  el.textContent = n;
}
function renderWishDrawer(){
  const body = document.getElementById("wish-body");
  const items = PRODUCTS.filter(p=>WISHLIST.includes(p.id));
  if(!items.length){ body.innerHTML = `<div class="cart-empty">Votre liste est vide.<br>Touchez le cœur sur un produit pour le garder de côté.</div>`; return; }
  body.innerHTML = items.map(p=>`
    <div class="cart-item">
      <img src="${p.img}" alt="${p.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-row">
          <span class="mono" style="font-size:13px;">${p.price? fmtPrice(p.price) : "Prix sur demande"}</span>
          <button class="cart-remove" data-id="${p.id}">Retirer</button>
        </div>
      </div>
    </div>
  `).join("");
  body.querySelectorAll(".cart-remove").forEach(btn=>btn.addEventListener("click", ()=>toggleWishlist(btn.dataset.id)));
}
const wishOverlay = document.getElementById("wish-overlay");
const wishDrawer = document.getElementById("wish-drawer");
document.getElementById("wish-btn").addEventListener("click", ()=>{ wishOverlay.classList.add("open"); wishDrawer.classList.add("open"); renderWishDrawer(); });
document.getElementById("wish-close").addEventListener("click", ()=>{ wishOverlay.classList.remove("open"); wishDrawer.classList.remove("open"); });
wishOverlay.addEventListener("click", ()=>{ wishOverlay.classList.remove("open"); wishDrawer.classList.remove("open"); });

/* Alerte honnête de retour en stock : si un produit de la liste
   d'envies a un stock > 0 au chargement, on informe le client
   (aucune activité d'autres clients n'est inventée). */
(function checkBackInStock(){
  const seenKey = "se_stock_notified";
  let notifiedIds = load(seenKey, []);
  PRODUCTS.filter(p=>WISHLIST.includes(p.id)).forEach(p=>{
    const inStock = p.stock === null || p.stock === undefined || Number(p.stock) > 0;
    if(inStock && !notifiedIds.includes(p.id)){
      pushNotification(`Bonne nouvelle : "${p.name}" de votre liste est disponible.`);
      notifiedIds.push(p.id);
    }
  });
  save(seenKey, notifiedIds);
})();

/* ============================================================
   CART
   ============================================================ */
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const cartBody = document.getElementById("cart-body");
const cartFoot = document.getElementById("cart-foot");
const cartCount = document.getElementById("cart-count");
const cartTotalEl = document.getElementById("cart-total");
const GIFT_THRESHOLD = 20000; // seuil honnête et fixe pour le cadeau de bienvenue

function openCart(){ cartOverlay.classList.add("open"); cartDrawer.classList.add("open"); renderCart(); }
function closeCart(){ cartOverlay.classList.remove("open"); cartDrawer.classList.remove("open"); }
document.getElementById("cart-btn").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", ()=>{ closeCart(); closePay(); });

function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const existing = CART.find(c=>c.id===id);
  if(existing) existing.qty++;
  else CART.push({id:p.id, name:p.name, price:p.price||0, img:p.img, qty:1});
  save("se_cart", CART);
  bumpStat("addToCart");
  updateCartBadge();
  toast("Ajouté au panier");
}
function updateCartBadge(){
  const n = CART.reduce((s,c)=>s+c.qty,0);
  cartCount.style.display = n>0 ? "flex" : "none";
  cartCount.textContent = n;
}
function renderCart(){
  cartBody.innerHTML = "";
  if(!CART.length){
    cartBody.innerHTML = `<div class="cart-empty">Votre panier est vide.<br>Ajoutez des paires depuis la collection.</div>`;
    cartFoot.style.display = "none";
    return;
  }
  cartFoot.style.display = "block";
  let total = 0;
  CART.forEach(c=>{
    total += c.price * c.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${c.img}" alt="${c.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${c.name}</div>
        <div class="cart-item-row">
          <div class="qty-ctrl">
            <button data-act="dec" data-id="${c.id}">−</button><span>${c.qty}</span><button data-act="inc" data-id="${c.id}">+</button>
          </div>
          <span class="mono" style="font-size:13px;">${c.price? fmtPrice(c.price*c.qty) : "Prix sur demande"}</span>
        </div>
        <button class="cart-remove" data-act="rm" data-id="${c.id}">Retirer</button>
      </div>
    `;
    cartBody.appendChild(row);
  });
  cartTotalEl.textContent = fmtPrice(total);
  const hint = document.getElementById("cart-gift-hint");
  if(total < GIFT_THRESHOLD){
    hint.textContent = `Encore ${fmtPrice(GIFT_THRESHOLD-total)} et votre cadeau de bienvenue est inclus.`;
  }else{
    hint.textContent = `🎁 Cadeau de bienvenue inclus sur cette commande.`;
  }
  cartBody.querySelectorAll("button[data-act]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id, act = btn.dataset.act;
      const item = CART.find(c=>c.id===id);
      if(!item) return;
      if(act==="inc") item.qty++;
      if(act==="dec"){ item.qty--; if(item.qty<=0) CART = CART.filter(c=>c.id!==id); }
      if(act==="rm") CART = CART.filter(c=>c.id!==id);
      save("se_cart", CART);
      updateCartBadge();
      renderCart();
    });
  });
}

/* ============================================================
   CHECKOUT
   ============================================================ */
const payOverlay = document.getElementById("pay-overlay");
const payDrawer = document.getElementById("pay-drawer");
function openPay(){ closeCart(); payOverlay.classList.add("open"); payDrawer.classList.add("open"); renderPaymentOptions(); }
function closePay(){ payOverlay.classList.remove("open"); payDrawer.classList.remove("open"); }
document.getElementById("cart-checkout").addEventListener("click", openPay);
document.getElementById("pay-close").addEventListener("click", closePay);
payOverlay.addEventListener("click", closePay);

function renderPaymentOptions(){
  const wrap = document.getElementById("payment-opts");
  const opts = [
    {id:"wa", label:"Paiement à la livraison (espèces)", detail:""},
    {id:"momo", label:"MTN MoMo", detail:`Envoyer le montant au ${SETTINGS.momo}, puis confirmer sur WhatsApp.`},
    {id:"moov", label:"Moov Money", detail:`Envoyer le montant au ${SETTINGS.moov}, puis confirmer sur WhatsApp.`},
    {id:"celtiis", label:"Celtiis Cash", detail:`Envoyer le montant au ${SETTINGS.celtiis}, puis confirmer sur WhatsApp.`},
  ];
  wrap.innerHTML = opts.map((o,i)=>`<label class="pay-opt ${i===0?'active':''}" data-detail="${o.detail}"><input type="radio" name="pay" value="${o.id}" ${i===0?'checked':''}>${o.label}</label>`).join("");
  const detailBox = document.getElementById("pay-detail-box");
  function refreshDetail(){
    const active = wrap.querySelector(".pay-opt input:checked").parentElement;
    const detail = active.dataset.detail;
    if(detail){ detailBox.textContent = detail; detailBox.classList.add("show"); } else detailBox.classList.remove("show");
  }
  wrap.querySelectorAll(".pay-opt").forEach(el=>{
    el.addEventListener("click", ()=>{
      wrap.querySelectorAll(".pay-opt").forEach(x=>x.classList.remove("active"));
      el.classList.add("active"); el.querySelector("input").checked = true; refreshDetail();
    });
  });
  refreshDetail();
}

document.getElementById("pay-confirm").addEventListener("click", ()=>{
  if(!CART.length){ toast("Votre panier est vide"); return; }
  const name = document.getElementById("pay-name").value.trim() || "(non renseigné)";
  const city = document.getElementById("pay-city").value.trim() || "(non renseignée)";
  const payMethod = document.querySelector('input[name="pay"]:checked').value;
  const payLabel = {wa:"Paiement à la livraison", momo:"MTN MoMo", moov:"Moov Money", celtiis:"Celtiis Cash"}[payMethod];
  let total = 0;
  const lines = CART.map(c=>{ total += c.price*c.qty; return `- ${c.name} x${c.qty}${c.price? " ("+fmtPrice(c.price*c.qty)+")" : " (prix sur demande)"}`; }).join("\n");
  const giftLine = total >= GIFT_THRESHOLD ? "\nCadeau de bienvenue à inclure (seuil atteint)." : "";
  const msg = `Bonjour Shoes Empire, je souhaite passer commande :\n${lines}\n\nTotal : ${fmtPrice(total)}\nNom : ${name}\nVille : ${city}\nMode de paiement : ${payLabel}${giftLine}`;

  LOYALTY.points = (LOYALTY.points||0) + total;
  save("se_loyalty", LOYALTY);
  bumpStat("orders");
  pushNotification(`Commande envoyée — ${fmtPrice(total)}. Vous avez gagné ${total.toLocaleString('fr-FR')} points fidélité.`);
  CART = []; save("se_cart", CART); updateCartBadge();
  updateLoyaltyUI(); renderTrustStrip();
  closePay();
  window.open(waLink(msg), "_blank");
});

/* ============================================================
   LOYALTY
   ============================================================ */
function updateLoyaltyUI(){
  const pts = LOYALTY.points||0;
  document.getElementById("loyalty-points").textContent = pts.toLocaleString("fr-FR") + " pts";
  const tierLabel = pts >= 30000 ? "Palier Or" : pts >= 10000 ? "Palier Argent" : "Palier Bronze";
  document.getElementById("loyalty-tier-label").textContent = tierLabel;
  document.getElementById("tier-bar-1").classList.toggle("reached", pts >= 0);
  document.getElementById("tier-bar-2").classList.toggle("reached", pts >= 10000);
  document.getElementById("tier-bar-3").classList.toggle("reached", pts >= 30000);
}

/* ============================================================
   QUIZ — dispositif d'engagement progressif
   ============================================================ */
let quizAnswers = {};
function quizProgress(step){ [1,2,3].forEach(i=>{ document.getElementById("qp"+i).style.width = i<=step ? "100%":"0%"; }); }
document.querySelectorAll("#q-step-1 .quiz-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    quizAnswers.cat = btn.dataset.cat;
    document.getElementById("q-step-1").classList.add("hide");
    document.getElementById("q-step-2").classList.remove("hide");
    quizProgress(1);
  });
});
document.querySelectorAll("#q-step-2 .quiz-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    quizAnswers.usage = btn.dataset.usage;
    document.getElementById("q-step-2").classList.add("hide");
    document.getElementById("q-step-3").classList.remove("hide");
    quizProgress(2);
  });
});
document.querySelectorAll("#q-step-3 .quiz-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    quizAnswers.budget = btn.dataset.budget;
    document.getElementById("q-step-3").classList.add("hide");
    document.getElementById("quiz-result").classList.add("show");
    quizProgress(3);
    document.getElementById("quiz-cta").addEventListener("click", (e)=>{
      e.preventDefault();
      setActiveFilter(quizAnswers.cat);
      document.getElementById("collection").scrollIntoView({behavior:"smooth"});
    }, {once:true});
  });
});

/* ============================================================
   FAQ
   ============================================================ */
document.querySelectorAll(".faq-q").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const item = btn.closest(".faq-item");
    const answer = item.querySelector(".faq-a");
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(i=>{ i.classList.remove("open"); i.querySelector(".faq-a").style.maxHeight = null; });
    if(!isOpen){ item.classList.add("open"); answer.style.maxHeight = answer.scrollHeight + "px"; }
  });
});

/* ============================================================
   ADMIN
   ============================================================ */
const adminScreen = document.getElementById("admin-screen");
function openAdmin(){
  adminScreen.classList.add("open");
  document.getElementById("admin-email-field").style.display = USE_FIREBASE ? "block" : "none";
  document.getElementById("admin-sync-status").textContent = syncStatusText();
  if(sessionStorage.getItem("se_admin_ok")==="1") showDashboard();
}
function closeAdminScreen(){ adminScreen.classList.remove("open"); history.replaceState(null,"",location.pathname+location.search); }
document.getElementById("admin-close").addEventListener("click", closeAdminScreen);
window.addEventListener("hashchange", checkAdminHash);
function checkAdminHash(){ if(location.hash === "#admin") openAdmin(); }
checkAdminHash();

document.getElementById("admin-login-btn").addEventListener("click", tryAdminLogin);
document.getElementById("admin-pass").addEventListener("keydown", e=>{ if(e.key==="Enter") tryAdminLogin(); });

function tryAdminLogin(){
  const errorEl = document.getElementById("admin-login-error");
  if(USE_FIREBASE){
    const email = document.getElementById("admin-email").value.trim();
    const pass = document.getElementById("admin-pass").value;
    fbAuth.signInWithEmailAndPassword(email, pass)
      .then(()=>{
        sessionStorage.setItem("se_admin_ok","1");
        errorEl.style.display = "none";
        showDashboard();
      })
      .catch(()=>{ errorEl.textContent = "Email ou mot de passe incorrect."; errorEl.style.display="block"; });
  }else{
    const val = document.getElementById("admin-pass").value;
    if(val === SETTINGS.adminPassword){
      sessionStorage.setItem("se_admin_ok","1");
      errorEl.style.display="none";
      showDashboard();
    }else{ errorEl.textContent = "Mot de passe incorrect."; errorEl.style.display="block"; }
  }
}
function showDashboard(){
  document.getElementById("admin-login").style.display="none";
  document.getElementById("admin-dashboard").style.display="block";
  document.getElementById("admin-sync-badge").textContent = syncStatusText();
  document.getElementById("stat-visits").textContent = STATS.visits||0;
  document.getElementById("stat-cart").textContent = STATS.addToCart||0;
  document.getElementById("stat-orders").textContent = STATS.orders||0;
  renderAdminProducts(); renderAdminReviews();
  document.getElementById("s-wa").value = SETTINGS.wa;
  document.getElementById("s-momo").value = SETTINGS.momo;
  document.getElementById("s-moov").value = SETTINGS.moov;
  document.getElementById("s-celtiis").value = SETTINGS.celtiis;
  document.getElementById("m-promo-text").value = MARKETING.promoText;
  document.getElementById("m-promo-end").value = MARKETING.promoEnd ? MARKETING.promoEnd.slice(0,16) : "";
  document.getElementById("m-gift-text").value = MARKETING.giftText;
}
document.querySelectorAll(".admin-tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".admin-tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p=>p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-"+tab.dataset.tab).classList.add("active");
  });
});

function renderAdminProducts(){
  const list = document.getElementById("admin-products-list");
  list.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <img src="${p.img}" alt="">
      <div class="admin-row-info">
        <div class="admin-row-name">${p.name}</div>
        <div class="admin-row-meta">${p.price? fmtPrice(p.price) : "Prix sur demande"} · Stock : ${p.stock ?? "illimité"}</div>
      </div>
      <div class="admin-row-actions">
        <button class="icon-link" data-act="toggle-new" data-id="${p.id}">${p.isNew? "Retirer des nouveautés" : "Marquer nouveauté"}</button>
        <button class="icon-link danger" data-act="delete" data-id="${p.id}">Supprimer</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("button[data-act]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      if(btn.dataset.act==="delete"){
        PRODUCTS = PRODUCTS.filter(p=>p.id!==id);
        if(USE_FIREBASE) fbDb.collection("products").doc(id).delete().catch(e=>console.warn(e));
      } else if(btn.dataset.act==="toggle-new"){
        const p = PRODUCTS.find(p=>p.id===id);
        if(p){
          p.isNew = !p.isNew;
          if(USE_FIREBASE) fbDb.collection("products").doc(id).set(p).catch(e=>console.warn(e));
        }
      }
      if(!USE_FIREBASE) save("se_products", PRODUCTS);
      renderAdminProducts();
      render(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
    });
  });
}
document.getElementById("p-add-btn").addEventListener("click", ()=>{
  const name = document.getElementById("p-name").value.trim();
  if(!name){ toast("Donnez un nom au produit"); return; }
  const priceRaw = document.getElementById("p-price").value.trim();
  const stockRaw = document.getElementById("p-stock").value.trim();
  const newProduct = {
    id:"p"+Date.now(), name,
    tag: document.getElementById("p-tag").value.trim() || "SHOES EMPIRE",
    cat: document.getElementById("p-cat").value,
    price: priceRaw ? Number(priceRaw.replace(/\D/g,"")) : null,
    stock: stockRaw ? Number(stockRaw) : null,
    img: document.getElementById("p-img").value.trim() || "images/af1-orange-sole.jpg",
    isNew: document.getElementById("p-new").value === "yes",
  };
  PRODUCTS.push(newProduct);
  if(USE_FIREBASE) fbDb.collection("products").doc(newProduct.id).set(newProduct).catch(e=>console.warn(e));
  else save("se_products", PRODUCTS);
  renderAdminProducts(); render("all"); toast("Produit ajouté");
  ["p-name","p-tag","p-price","p-stock","p-img"].forEach(id=>document.getElementById(id).value="");
});

document.getElementById("m-promo-save").addEventListener("click", ()=>{
  MARKETING.promoText = document.getElementById("m-promo-text").value.trim() || MARKETING.promoText;
  const endVal = document.getElementById("m-promo-end").value;
  MARKETING.promoEnd = endVal ? new Date(endVal).toISOString() : null;
  if(USE_FIREBASE) fbDb.collection("config").doc("marketing").set(MARKETING, {merge:true}).catch(e=>console.warn(e));
  else save("se_marketing", MARKETING);
  renderPromoBar();
  toast("Offre mise à jour");
});
document.getElementById("m-gift-save").addEventListener("click", ()=>{
  MARKETING.giftText = document.getElementById("m-gift-text").value.trim() || MARKETING.giftText;
  if(USE_FIREBASE) fbDb.collection("config").doc("marketing").set(MARKETING, {merge:true}).catch(e=>console.warn(e));
  else save("se_marketing", MARKETING);
  document.getElementById("gift-text").textContent = MARKETING.giftText;
  toast("Message cadeau mis à jour");
});

function renderAdminReviews(){
  const list = document.getElementById("admin-reviews-list");
  list.innerHTML = "";
  REVIEWS.forEach((rv,idx)=>{
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `<div class="admin-row-info"><div class="admin-row-name">${rv.who} — ${"★".repeat(rv.stars||5)}</div><div class="admin-row-meta">${rv.quote}</div></div><div class="admin-row-actions"><button class="icon-link danger" data-idx="${idx}">Supprimer</button></div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("button[data-idx]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.idx);
      const rv = REVIEWS[idx];
      if(USE_FIREBASE && rv.fid) fbDb.collection("reviews").doc(rv.fid).delete().catch(e=>console.warn(e));
      REVIEWS.splice(idx,1);
      if(!USE_FIREBASE) save("se_reviews", REVIEWS);
      renderAdminReviews(); renderExtraReviews();
    });
  });
}
document.getElementById("rv-add-btn").addEventListener("click", ()=>{
  const who = document.getElementById("rv-who").value.trim() || "Client vérifié";
  const stars = Math.min(5, Math.max(1, Number(document.getElementById("rv-stars").value)||5));
  const quote = document.getElementById("rv-quote").value.trim();
  if(!quote){ toast("Écrivez l'avis du client"); return; }
  const newReview = {who, stars, quote};
  if(USE_FIREBASE){
    fbDb.collection("reviews").add(Object.assign({}, newReview, {createdAt: firebase.firestore.FieldValue.serverTimestamp()})).catch(e=>console.warn(e));
  }else{
    REVIEWS.push(newReview);
    save("se_reviews", REVIEWS);
  }
  renderAdminReviews(); renderExtraReviews();
  ["rv-who","rv-stars","rv-quote"].forEach(id=>document.getElementById(id).value="");
  toast("Avis ajouté");
});
function renderExtraReviews(){
  document.querySelectorAll(".review-extra").forEach(el=>el.remove());
  const rgrid = document.querySelector(".review-grid");
  const cta = document.querySelector(".review-card-cta");
  REVIEWS.forEach(rv=>{
    const div = document.createElement("div");
    div.className = "review-card review-extra";
    div.innerHTML = `<div class="review-stars">${"★".repeat(rv.stars)}</div><p class="review-quote">"${rv.quote}"</p><div class="review-who">${rv.who}</div>`;
    rgrid.insertBefore(div, cta);
  });
}
renderExtraReviews();

document.getElementById("s-save-btn").addEventListener("click", ()=>{
  SETTINGS.wa = document.getElementById("s-wa").value.trim() || SETTINGS.wa;
  SETTINGS.momo = document.getElementById("s-momo").value.trim();
  SETTINGS.moov = document.getElementById("s-moov").value.trim();
  SETTINGS.celtiis = document.getElementById("s-celtiis").value.trim();
  if(USE_FIREBASE) fbDb.collection("config").doc("settings").set(SETTINGS, {merge:true}).catch(e=>console.warn(e));
  else save("se_settings", SETTINGS);
  render(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
  toast("Réglages enregistrés");
});
document.getElementById("s-pass-btn").addEventListener("click", ()=>{
  const np = document.getElementById("s-newpass").value.trim();
  if(!np){ toast("Entrez un nouveau mot de passe"); return; }
  if(USE_FIREBASE){
    if(!fbAuth.currentUser){ toast("Reconnectez-vous puis réessayez"); return; }
    fbAuth.currentUser.updatePassword(np)
      .then(()=>{ document.getElementById("s-newpass").value=""; toast("Mot de passe mis à jour"); })
      .catch(()=>{ toast("Reconnexion récente nécessaire — reconnectez-vous puis réessayez"); });
  }else{
    SETTINGS.adminPassword = np; save("se_settings", SETTINGS);
    document.getElementById("s-newpass").value=""; toast("Mot de passe mis à jour");
  }
});

/* ============================================================
   PWA
   ============================================================ */
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
}
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(!localStorage.getItem("se_install_dismissed")) document.getElementById("install-banner").classList.add("show");
});
document.getElementById("install-btn").addEventListener("click", async ()=>{
  document.getElementById("install-banner").classList.remove("show");
  if(deferredInstallPrompt){ deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; }
});
document.getElementById("install-close").addEventListener("click", ()=>{
  document.getElementById("install-banner").classList.remove("show");
  localStorage.setItem("se_install_dismissed","1");
});

/* ---------- INIT ---------- */
document.getElementById("gift-text").textContent = MARKETING.giftText;
renderPromoBar();
render("all");
updateCartBadge();
updateWishBadge();
updateLoyaltyUI();
renderNotifications();
startFirebaseSync();
