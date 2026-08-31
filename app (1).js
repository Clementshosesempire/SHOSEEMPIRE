/* ==========================================================
   SHOES EMPIRE — app.js
   Toute la logique du site : catalogue, panier, checkout,
   fidélité, notifications, panneau admin, PWA.
   Stockage : localStorage (fonctionne une fois le site déployé
   en ligne ; certains aperçus intégrés — comme celui de Claude —
   bloquent localStorage, donc teste toujours sur le lien en ligne).
   ========================================================== */

const STORE_KEYS = {
  products: 'se_products',
  promos: 'se_promos',
  testimonials: 'se_testimonials',
  cart: 'se_cart',
  visits: 'se_stat_visits',
  cartAdds: 'se_stat_cartadds',
  orders: 'se_stat_orders',
  loyaltyPrefix: 'se_loyalty_',
  seenWelcome: 'se_seen_welcome',
  installDismissed: 'se_install_dismissed',
  adminAuth: 'se_admin_auth'
};

const ADMIN_PASSWORD = 'empire2026'; // change-le après déploiement
const WHATSAPP_NUMBER = '22900000000'; // remplace par ton vrai numéro (indicatif inclus, sans le +)
const MOMO_NUMBER = '96 00 00 00';
const MOOV_NUMBER = '95 00 00 00';
const CELTIIS_NUMBER = '90 00 00 00';

/* ---------- Safe storage helpers (fallback to memory if localStorage unavailable) ---------- */
let memoryStore = {};
let storageAvailable = true;
try {
  localStorage.setItem('__test__', '1');
  localStorage.removeItem('__test__');
} catch (e) {
  storageAvailable = false;
}
function lsGet(key, fallback) {
  try {
    if (storageAvailable) {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
  } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try {
    if (storageAvailable) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStore[key] = value;
    }
  } catch (e) { memoryStore[key] = value; }
}

/* ---------- Default data (à remplacer via le panneau admin) ---------- */
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Air Runner 90', cat: 'Homme', price: 28000, oldPrice: 0, stock: 6, sizes: '40,41,42,43,44', desc: "Semelle amortissante, maille respirante. Un classique du quotidien, pensé pour durer.", isNew: true, isBest: true, rating: 0, reviews: 0 },
  { id: 'p2', name: 'Street Low White', cat: 'Unisexe', price: 22000, oldPrice: 26000, stock: 3, sizes: '38,39,40,41,42', desc: "Silhouette basse minimaliste en cuir texturé, facile à assortir à toutes les tenues.", isNew: true, isBest: false, rating: 0, reviews: 0 },
  { id: 'p3', name: 'Trail Grip X', cat: 'Homme', price: 32000, oldPrice: 0, stock: 8, sizes: '41,42,43,44,45', desc: "Crampons profonds, tige renforcée. Pensée pour la ville comme pour les pistes.", isNew: false, isBest: true, rating: 0, reviews: 0 },
  { id: 'p4', name: 'Femme Aura Knit', cat: 'Femme', price: 24000, oldPrice: 0, stock: 5, sizes: '36,37,38,39,40', desc: "Tricot extensible, coupe ajustée, légèreté toute la journée.", isNew: true, isBest: false, rating: 0, reviews: 0 },
  { id: 'p5', name: 'Junior Sprint', cat: 'Enfant', price: 15000, oldPrice: 0, stock: 10, sizes: '30,31,32,33,34', desc: "Fermeture scratch rapide, semelle antidérapante pour la cour de récré.", isNew: false, isBest: false, rating: 0, reviews: 0 },
  { id: 'p6', name: 'Classic Court Black', cat: 'Unisexe', price: 26000, oldPrice: 0, stock: 2, sizes: '39,40,41,42,43,44', desc: "L'intemporelle silhouette basketball, en cuir noir mat.", isNew: false, isBest: true, rating: 0, reviews: 0 }
];
const DEFAULT_PROMOS = [
  { code: 'BIENVENUE10', pct: 10 }
];
const DEFAULT_TESTIMONIALS = [];

let products = lsGet(STORE_KEYS.products, null) || DEFAULT_PRODUCTS;
let promos = lsGet(STORE_KEYS.promos, null) || DEFAULT_PROMOS;
let testimonials = lsGet(STORE_KEYS.testimonials, null) || DEFAULT_TESTIMONIALS;
let cart = lsGet(STORE_KEYS.cart, []);
let appliedPromo = null;
let activeCategory = 'Toutes';
let currentProductId = null;
let selectedSize = null;
let selectedPayMethod = null;

if (!lsGet(STORE_KEYS.products, null)) lsSet(STORE_KEYS.products, products);
if (!lsGet(STORE_KEYS.promos, null)) lsSet(STORE_KEYS.promos, promos);

/* ---------- Utils ---------- */
function fmt(n) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function shoeSVG() {
  return `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 130 C20 115 35 108 50 106 L70 100 C85 92 95 78 110 75 C125 72 138 78 150 88 L165 100 C172 105 178 112 180 122 C182 132 178 142 168 146 L40 146 C28 146 20 140 20 130Z" stroke="#F2EFE9" stroke-width="2.5"/>
    <path d="M70 100 C75 90 78 82 88 78" stroke="#FF4322" stroke-width="2.5"/>
    <path d="M20 130 L180 130" stroke="#2B2B32" stroke-width="2"/>
    <circle cx="60" cy="140" r="4" fill="#FF4322"/><circle cx="90" cy="142" r="4" fill="#FF4322"/><circle cx="120" cy="142" r="4" fill="#FF4322"/>
  </svg>`;
}
function stars(n) {
  n = Math.round(n || 0);
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}
function incStat(key) { lsSet(key, lsGet(key, 0) + 1); }
function showToast(title, text) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<b>${title}</b>${text}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 5200);
}

/* ---------- Rendering: catalogue & new arrivals ---------- */
function categoriesList() {
  const cats = Array.from(new Set(products.map(p => p.cat)));
  return ['Toutes', ...cats];
}
function renderFilters() {
  const row = document.getElementById('filter-row');
  row.innerHTML = categoriesList().map(c =>
    `<button class="filter-btn ${c === activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>`
  ).join('');
}
function setCategory(c) { activeCategory = c; renderFilters(); renderCatalogue(); }

function productCardHTML(p) {
  const lowStock = p.stock > 0 && p.stock <= 3;
  return `
  <div class="card" onclick="openProductModal('${p.id}')">
    <div class="card-media">
      ${p.isNew ? '<span class="badge badge-new">Nouveau</span>' : (p.isBest ? '<span class="badge badge-best">Best-seller</span>' : '')}
      ${lowStock ? `<span class="badge-low">Plus que ${p.stock}</span>` : ''}
      ${shoeSVG()}
    </div>
    <div class="card-body">
      <div class="card-cat">${p.cat}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-stars">${p.reviews > 0 ? stars(p.rating) + `<span class="n">(${p.reviews})</span>` : `<span class="n">Soyez le premier à donner votre avis</span>`}</div>
      <div class="card-price">${fmt(p.price)}${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''}</div>
    </div>
    <div class="card-foot">
      <button class="btn btn-ghost" onclick="event.stopPropagation();openProductModal('${p.id}')">Détails</button>
      <button class="btn btn-primary" onclick="event.stopPropagation();addToCart('${p.id}',null,1)">Ajouter</button>
    </div>
  </div>`;
}

function renderCatalogue() {
  const grid = document.getElementById('catalogue-grid');
  const q = (document.getElementById('search-input').value || '').toLowerCase().trim();
  let list = products.filter(p => (activeCategory === 'Toutes' || p.cat === activeCategory) && p.name.toLowerCase().includes(q));
  grid.innerHTML = list.length ? list.map(productCardHTML).join('') : `<div class="empty-state">Aucun produit ne correspond à ta recherche pour l'instant.</div>`;
}
function renderNewArrivals() {
  const grid = document.getElementById('new-grid');
  const list = products.filter(p => p.isNew);
  grid.innerHTML = list.length ? list.map(productCardHTML).join('') : `<div class="empty-state">Pas de nouveauté pour le moment — reviens bientôt !</div>`;
}
function renderTestimonials() {
  const grid = document.getElementById('testi-grid');
  if (!testimonials.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Les premiers avis clients apparaîtront ici. Ajoute-les depuis l'espace admin au fur et à mesure des retours reçus.</div>`;
    return;
  }
  grid.innerHTML = testimonials.map(t => `
    <div class="testi">
      <div class="stars">${stars(t.stars)}</div>
      <p>"${t.text}"</p>
      <div class="who">${t.name}</div>
    </div>`).join('');
}

/* ---------- Product modal ---------- */
function openProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProductId = id;
  selectedSize = null;
  const sizes = (p.sizes || '').split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('pd-content').innerHTML = `
    <div class="pd-media">${shoeSVG()}</div>
    <div class="pd-info">
      <div class="card-cat">${p.cat}</div>
      <h3>${p.name}</h3>
      <div class="card-stars">${p.reviews > 0 ? stars(p.rating) + `<span class="n">(${p.reviews} avis)</span>` : '<span class="n">Pas encore d\\'avis</span>'}</div>
      <div class="pd-price">${fmt(p.price)}${p.oldPrice ? `<span class="old" style="margin-left:10px;">${fmt(p.oldPrice)}</span>` : ''}</div>
      <p class="pd-desc">${p.desc || ''}</p>
      ${sizes.length ? `<div><label style="font-size:12.5px;color:var(--muted);font-weight:700;">Pointure</label><div class="size-row" id="size-row">
        ${sizes.map(s => `<button class="size-chip" onclick="pickSize(this,'${s}')">${s}</button>`).join('')}
      </div></div>` : ''}
      ${p.stock > 0 ? (p.stock <= 3 ? `<div class="stock-note">Plus que ${p.stock} en stock</div>` : '') : `<div class="stock-note">Rupture de stock — reviens bientôt</div>`}
      <button class="btn btn-primary btn-full" ${p.stock <= 0 ? 'disabled style="opacity:.5"' : ''} onclick="addToCart('${p.id}', selectedSize, 1); closeProductModal();">Ajouter au panier</button>
    </div>`;
  document.getElementById('pd-overlay').classList.add('open');
  document.getElementById('pd-modal').classList.add('open');
}
function pickSize(el, s) {
  document.querySelectorAll('#size-row .size-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  selectedSize = s;
}
function closeProductModal() {
  document.getElementById('pd-overlay').classList.remove('open');
  document.getElementById('pd-modal').classList.remove('open');
}

/* ---------- Cart ---------- */
function addToCart(id, size, qty) {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0) return;
  const existing = cart.find(c => c.id === id && c.size === size);
  if (existing) { existing.qty += qty; } else { cart.push({ id, size, qty }); }
  lsSet(STORE_KEYS.cart, cart);
  incStat(STORE_KEYS.cartAdds);
  updateCartCount();
  showToast('Ajouté au panier', `${p.name}${size ? ' — Taille ' + size : ''}`);
}
function removeFromCart(idx) {
  cart.splice(idx, 1);
  lsSet(STORE_KEYS.cart, cart);
  renderCart(); updateCartCount();
}
function changeQty(idx, delta) {
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  lsSet(STORE_KEYS.cart, cart);
  renderCart();
}
function updateCartCount() {
  const n = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cart-count').textContent = n;
}
function cartSubtotal() {
  return cart.reduce((sum, c) => {
    const p = products.find(x => x.id === c.id);
    return sum + (p ? p.price * c.qty : 0);
  }, 0);
}
function renderCart() {
  const body = document.getElementById('cart-body');
  const foot = document.getElementById('cart-foot');
  if (!cart.length) {
    body.innerHTML = `<div class="empty-state">Ton panier est vide. Va faire un tour dans le catalogue !</div>`;
    foot.innerHTML = `<a href="#catalogue" class="btn btn-primary btn-full" onclick="closeCart()">Voir le catalogue</a>`;
    return;
  }
  body.innerHTML = cart.map((c, idx) => {
    const p = products.find(x => x.id === c.id);
    if (!p) return '';
    return `
    <div class="cart-item">
      <div class="thumb">${shoeSVG()}</div>
      <div class="info">
        <div class="nm">${p.name}</div>
        <div class="meta">${c.size ? 'Taille ' + c.size + ' · ' : ''}${fmt(p.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty(${idx},-1)">−</button>
          <span>${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${idx},1)">+</button>
        </div>
        <a class="rm" onclick="removeFromCart(${idx})">Retirer</a>
      </div>
    </div>`;
  }).join('');

  const subtotal = cartSubtotal();
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct / 100) : 0;
  const total = subtotal - discount;
  const points = lsGet(STORE_KEYS.loyaltyPrefix + 'guest', 0);

  foot.innerHTML = `
    <div class="points-bar"><div class="points-fill" style="width:${Math.min(100, points / 150)}%;"></div></div>
    <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">${points} pts fidélité cumulés sur cet appareil</p>
    <div class="promo-row">
      <input id="promo-input" placeholder="Code promo">
      <button class="btn btn-ghost btn-sm" onclick="applyPromo()">Appliquer</button>
    </div>
    <div class="cart-summary-row"><span>Sous-total</span><span>${fmt(subtotal)}</span></div>
    ${appliedPromo ? `<div class="cart-summary-row" style="color:var(--mint);"><span>Réduction (${appliedPromo.code})</span><span>-${fmt(discount)}</span></div>` : ''}
    <div class="cart-summary-row total"><span>Total</span><span>${fmt(total)}</span></div>
    <button class="btn btn-primary btn-full" style="margin-top:14px;" onclick="openCheckout()">Passer commande</button>`;
}
function applyPromo() {
  const code = document.getElementById('promo-input').value.trim().toUpperCase();
  const found = promos.find(p => p.code.toUpperCase() === code);
  if (found) { appliedPromo = found; showToast('Code appliqué', `-${found.pct}% sur ta commande`); }
  else { showToast('Code invalide', "Ce code n'existe pas ou a expiré."); }
  renderCart();
}
function openCart() { renderCart(); document.getElementById('cart-overlay').classList.add('open'); document.getElementById('cart-drawer').classList.add('open'); }
function closeCart() { document.getElementById('cart-overlay').classList.remove('open'); document.getElementById('cart-drawer').classList.remove('open'); }

/* ---------- Checkout ---------- */
function openCheckout() {
  if (!cart.length) return;
  closeCart();
  selectedPayMethod = null;
  document.getElementById('co-content').innerHTML = `
    <h3 style="font-size:24px;margin-bottom:6px;">Finaliser la commande</h3>
    <p style="color:var(--muted);font-size:13.5px;margin-bottom:20px;">Renseigne tes infos, choisis ton mode de paiement, et confirme.</p>
    <div class="form-field"><label>Nom complet</label><input id="co-name" placeholder="Ton nom"></div>
    <div class="form-field"><label>Téléphone</label><input id="co-phone" placeholder="Ex: 97 00 00 00"></div>
    <div class="form-field"><label>Adresse de livraison</label><textarea id="co-address" rows="2" placeholder="Quartier, repère..."></textarea></div>
    <label style="font-size:12.5px;color:var(--muted);font-weight:700;">Mode de paiement</label>
    <div class="pay-options">
      <button class="pay-opt" onclick="selectPay('whatsapp',this)">WhatsApp<span>Commander puis payer à la livraison</span></button>
      <button class="pay-opt" onclick="selectPay('momo',this)">MTN MoMo<span>Paiement mobile</span></button>
      <button class="pay-opt" onclick="selectPay('moov',this)">Moov Money<span>Paiement mobile</span></button>
      <button class="pay-opt" onclick="selectPay('celtiis',this)">Celtiis Cash<span>Paiement mobile</span></button>
    </div>
    <div class="paycode-box" id="paycode-box"></div>
    <button class="btn btn-primary btn-full" style="margin-top:18px;" onclick="confirmOrder()">Confirmer la commande</button>
  `;
  document.getElementById('co-overlay').classList.add('open');
  document.getElementById('co-modal').classList.add('open');
}
function selectPay(method, el) {
  selectedPayMethod = method;
  document.querySelectorAll('.pay-opt').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  const box = document.getElementById('paycode-box');
  const numbers = { momo: MOMO_NUMBER, moov: MOOV_NUMBER, celtiis: CELTIIS_NUMBER };
  const labels = { momo: 'MTN MoMo', moov: 'Moov Money', celtiis: 'Celtiis Cash' };
  if (method === 'whatsapp') {
    box.classList.remove('show');
  } else {
    box.innerHTML = `Envoie le montant total au <b>${numbers[method]}</b> (${labels[method]}), puis clique sur "Confirmer" : on te contactera sur WhatsApp pour valider ta commande et la référence de paiement.`;
    box.classList.add('show');
  }
}
function confirmOrder() {
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();
  if (!name || !phone || !address) { showToast('Infos manquantes', 'Remplis ton nom, téléphone et adresse.'); return; }
  if (!selectedPayMethod) { showToast('Choisis un paiement', 'Sélectionne un mode de paiement pour continuer.'); return; }

  const subtotal = cartSubtotal();
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.pct / 100) : 0;
  const total = subtotal - discount;

  // Fidélité : on crédite des points réels sur la base du montant dépensé
  const key = STORE_KEYS.loyaltyPrefix + 'guest';
  lsSet(key, lsGet(key, 0) + Math.round(total / 100));

  const methodLabel = { whatsapp: 'WhatsApp (paiement à la livraison)', momo: 'MTN MoMo', moov: 'Moov Money', celtiis: 'Celtiis Cash' }[selectedPayMethod];
  const lines = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    return `- ${p.name}${c.size ? ' (T.' + c.size + ')' : ''} x${c.qty} — ${fmt(p.price * c.qty)}`;
  }).join('\n');
  const msg = `Bonjour Shoes Empire, je souhaite commander :\n${lines}\n${appliedPromo ? `Code promo : ${appliedPromo.code} (-${discount} FCFA)\n` : ''}Total : ${fmt(total)}\nPaiement : ${methodLabel}\nNom : ${name}\nTéléphone : ${phone}\nAdresse : ${address}`;

  incStat(STORE_KEYS.orders);
  cart = []; lsSet(STORE_KEYS.cart, cart); updateCartCount();
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeCheckout();
  showToast('Commande envoyée !', 'On te répond sur WhatsApp très vite.');
}
function closeCheckout() {
  document.getElementById('co-overlay').classList.remove('open');
  document.getElementById('co-modal').classList.remove('open');
}

/* ---------- Welcome offer (réciprocité) ---------- */
function maybeShowWelcome() {
  if (lsGet(STORE_KEYS.seenWelcome, false)) return;
  const bienvenue = promos.find(p => p.code === 'BIENVENUE10') || promos[0];
  if (bienvenue) document.getElementById('welcome-code').textContent = bienvenue.code;
  document.getElementById('welcome-overlay').classList.add('open');
  document.getElementById('welcome-modal').classList.add('open');
  lsSet(STORE_KEYS.seenWelcome, true);
}
function closeWelcome() {
  document.getElementById('welcome-overlay').classList.remove('open');
  document.getElementById('welcome-modal').classList.remove('open');
}

/* ---------- Loyalty display on page ---------- */
function renderLoyaltyDisplay() {
  const points = lsGet(STORE_KEYS.loyaltyPrefix + 'guest', 0);
  document.getElementById('my-points').textContent = points.toLocaleString('fr-FR') + ' pts';
  document.getElementById('savings-amt').textContent = points.toLocaleString('fr-FR') + ' FCFA';
}

/* ---------- Mobile nav ---------- */
function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
}

/* ==========================================================
   ADMIN
   ========================================================== */
function showLoginGate() {
  document.getElementById('site-view').classList.add('hide');
  document.getElementById('admin-view').classList.add('show');
  if (lsGet(STORE_KEYS.adminAuth, false)) {
    document.getElementById('login-gate').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderAdmin();
  } else {
    document.getElementById('login-gate').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
  }
  window.scrollTo(0, 0);
}
function tryLogin() {
  const val = document.getElementById('admin-pass').value;
  if (val === ADMIN_PASSWORD) {
    lsSet(STORE_KEYS.adminAuth, true);
    document.getElementById('login-gate').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderAdmin();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}
function logoutAdmin() { lsSet(STORE_KEYS.adminAuth, false); showLoginGate(); }
function closeAdmin() {
  document.getElementById('site-view').classList.remove('hide');
  document.getElementById('admin-view').classList.remove('show');
  renderAll();
}
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('show', p.id === 'tab-' + tab));
}

function renderAdmin() {
  renderAdminProducts();
  renderAdminPromos();
  renderAdminTestimonials();
  renderAdminStats();
}
function renderAdminProducts() {
  document.getElementById('admin-product-rows').innerHTML = products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${fmt(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        ${p.isNew ? '<span class="toggle-chip on">Nouveau</span>' : ''}
        ${p.isBest ? '<span class="toggle-chip on" style="margin-left:4px;">Best</span>' : ''}
      </td>
      <td class="row-actions">
        <button onclick="editProduct('${p.id}')">Modifier</button>
        <button class="del" onclick="deleteProduct('${p.id}')">Supprimer</button>
      </td>
    </tr>`).join('');
}
function resetProductForm() {
  document.getElementById('p-id').value = '';
  document.getElementById('p-name').value = '';
  document.getElementById('p-cat').value = 'Homme';
  document.getElementById('p-price').value = '';
  document.getElementById('p-oldprice').value = '';
  document.getElementById('p-stock').value = '';
  document.getElementById('p-sizes').value = '';
  document.getElementById('p-desc').value = '';
  document.getElementById('p-new').checked = false;
  document.getElementById('p-best').checked = false;
  document.getElementById('product-form-title').textContent = 'Ajouter un produit';
}
function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-cat').value = p.cat;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-oldprice').value = p.oldPrice || '';
  document.getElementById('p-stock').value = p.stock;
  document.getElementById('p-sizes').value = p.sizes;
  document.getElementById('p-desc').value = p.desc;
  document.getElementById('p-new').checked = p.isNew;
  document.getElementById('p-best').checked = p.isBest;
  document.getElementById('product-form-title').textContent = 'Modifier le produit';
  window.scrollTo(0, 0);
}
function saveProduct() {
  const id = document.getElementById('p-id').value || 'p' + Date.now();
  const name = document.getElementById('p-name').value.trim();
  const price = Number(document.getElementById('p-price').value);
  if (!name || !price) { showToast('Champs requis', 'Nom et prix sont obligatoires.'); return; }
  const data = {
    id, name, cat: document.getElementById('p-cat').value,
    price, oldPrice: Number(document.getElementById('p-oldprice').value) || 0,
    stock: Number(document.getElementById('p-stock').value) || 0,
    sizes: document.getElementById('p-sizes').value.trim(),
    desc: document.getElementById('p-desc').value.trim(),
    isNew: document.getElementById('p-new').checked,
    isBest: document.getElementById('p-best').checked,
    rating: 0, reviews: 0
  };
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) { data.rating = products[idx].rating; data.reviews = products[idx].reviews; products[idx] = data; }
  else { products.push(data); }
  lsSet(STORE_KEYS.products, products);
  resetProductForm();
  renderAdminProducts();
  showToast('Produit enregistré', name);
}
function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  products = products.filter(p => p.id !== id);
  lsSet(STORE_KEYS.products, products);
  renderAdminProducts();
}

function renderAdminPromos() {
  document.getElementById('admin-promo-rows').innerHTML = promos.map((p, i) => `
    <tr><td>${p.code}</td><td>${p.pct}%</td>
    <td class="row-actions"><button class="del" onclick="deletePromo(${i})">Supprimer</button></td></tr>`).join('');
}
function savePromo() {
  const code = document.getElementById('promo-code').value.trim().toUpperCase();
  const pct = Number(document.getElementById('promo-pct').value);
  if (!code || !pct) { showToast('Champs requis', 'Code et pourcentage obligatoires.'); return; }
  promos.push({ code, pct });
  lsSet(STORE_KEYS.promos, promos);
  document.getElementById('promo-code').value = '';
  document.getElementById('promo-pct').value = '';
  renderAdminPromos();
}
function deletePromo(i) { promos.splice(i, 1); lsSet(STORE_KEYS.promos, promos); renderAdminPromos(); }

function renderAdminTestimonials() {
  document.getElementById('admin-testi-rows').innerHTML = testimonials.map((t, i) => `
    <tr><td>${t.name}</td><td>${t.stars}/5</td><td>${t.text}</td>
    <td class="row-actions"><button class="del" onclick="deleteTestimonial(${i})">Supprimer</button></td></tr>`).join('');
}
function saveTestimonial() {
  const name = document.getElementById('t-name').value.trim();
  const st = Number(document.getElementById('t-stars').value) || 5;
  const text = document.getElementById('t-text').value.trim();
  if (!name || !text) { showToast('Champs requis', 'Nom et avis obligatoires.'); return; }
  testimonials.push({ name, stars: st, text });
  lsSet(STORE_KEYS.testimonials, testimonials);
  document.getElementById('t-name').value = '';
  document.getElementById('t-stars').value = '';
  document.getElementById('t-text').value = '';
  renderAdminTestimonials();
}
function deleteTestimonial(i) { testimonials.splice(i, 1); lsSet(STORE_KEYS.testimonials, testimonials); renderAdminTestimonials(); }

function renderAdminStats() {
  document.getElementById('stat-visits').textContent = lsGet(STORE_KEYS.visits, 0);
  document.getElementById('stat-cartadds').textContent = lsGet(STORE_KEYS.cartAdds, 0);
  document.getElementById('stat-orders').textContent = lsGet(STORE_KEYS.orders, 0);
  document.getElementById('stat-products').textContent = products.length;
}

/* ---------- Master render ---------- */
function renderAll() {
  renderFilters();
  renderCatalogue();
  renderNewArrivals();
  renderTestimonials();
  updateCartCount();
  renderLoyaltyDisplay();
}

/* ---------- PWA install ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!lsGet(STORE_KEYS.installDismissed, false)) {
    document.getElementById('install-banner').classList.add('show');
  }
});
document.getElementById('install-yes').addEventListener('click', async () => {
  document.getElementById('install-banner').classList.remove('show');
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
});
function dismissInstall() {
  lsSet(STORE_KEYS.installDismissed, true);
  document.getElementById('install-banner').classList.remove('show');
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ---------- Init ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
incStat(STORE_KEYS.visits);
renderAll();
setTimeout(maybeShowWelcome, 1200);

// Route directly to admin if URL hash is #admin
if (window.location.hash === '#admin') { showLoginGate(); }
