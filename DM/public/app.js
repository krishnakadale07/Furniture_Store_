const state = { products: [], cart: JSON.parse(localStorage.getItem('oak-form-cart') || '[]'), authMode: 'login', token: localStorage.getItem('oak-form-token'), language: localStorage.getItem('oak-form-language') || 'en' };
const $ = selector => document.querySelector(selector);
const money = value => `$${value.toLocaleString('en-US')}`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const translations = { en: { cart: 'Cart', searchTitle: 'Find a piece', searchPlaceholder: 'Search chairs, tables, lighting...' }, hi: { cart: 'कार्ट', searchTitle: 'एक वस्तु खोजें', searchPlaceholder: 'कुर्सी, टेबल, लाइटिंग खोजें...' }, mr: { cart: 'कार्ट', searchTitle: 'वस्तू शोधा', searchPlaceholder: 'खुर्च्या, टेबल, दिवे शोधा...' } };

async function loadProducts(category = 'All') {
  const response = await fetch(`/api/products${category === 'All' ? '' : `?category=${category}`}`);
  state.products = await response.json();
  $('#product-grid').innerHTML = state.products.map(product => `<article class="product-card"><div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"><span class="product-badge">${product.badge || product.category}</span><button class="quick-add" data-add="${product.id}" aria-label="Add ${product.name} to cart">+</button></div>${product.imageCredit ? `<a class="product-category image-credit" href="${escapeHtml(product.imageSource)}" target="_blank" rel="noopener noreferrer">Photo: ${escapeHtml(product.imageCredit)} · ${escapeHtml(product.imageLicense)}</a>` : ''}<div class="product-meta"><div><div class="product-name">${product.name}</div><div class="product-category">${product.category}</div><div class="swatches">${product.colors.map(color => `<span style="background:${color}"></span>`).join('')}</div></div><div class="product-price">${product.oldPrice ? `<span class="old-price">${money(product.oldPrice)}</span>` : ''}${money(product.price)}</div></div></article>`).join('');
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addToCart(button.dataset.add)));
}
function saveCart() { localStorage.setItem('oak-form-cart', JSON.stringify(state.cart)); }
function addToCart(id) { const existing = state.cart.find(item => item.id === id); existing ? existing.quantity++ : state.cart.push({ id, quantity: 1 }); saveCart(); renderCart(); showToast('Added to your cart'); }
function renderCart() { const items = state.cart.map(item => ({ ...item, product: state.products.find(product => product.id === item.id) || productsFallback.find(product => product.id === item.id) })).filter(item => item.product); $('#cart-count').textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0); $('#cart-items').innerHTML = items.length ? items.map(({ product, quantity }) => `<div class="cart-item"><img src="${product.image}" alt="${product.name}"><div class="cart-item-info"><div class="cart-item-name">${product.name}</div><div class="cart-item-price">${money(product.price)}</div><div class="quantity"><button data-quantity="${product.id}" data-change="-1">−</button><span>${quantity}</span><button data-quantity="${product.id}" data-change="1">+</button></div><button class="remove" data-remove="${product.id}">Remove</button></div></div>`).join('') : '<p class="empty-cart">Your cart is waiting for something good.</p>'; const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0); $('#cart-total').textContent = money(total); document.querySelectorAll('[data-quantity]').forEach(button => button.addEventListener('click', () => updateQuantity(button.dataset.quantity, Number(button.dataset.change)))); document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => removeFromCart(button.dataset.remove))); }
function updateQuantity(id, change) { const item = state.cart.find(entry => entry.id === id); if (item) item.quantity += change; state.cart = state.cart.filter(entry => entry.quantity > 0); saveCart(); renderCart(); }
function removeFromCart(id) { state.cart = state.cart.filter(item => item.id !== id); saveCart(); renderCart(); }
function openDrawer(selector) { $('.overlay').classList.add('open'); $(selector).classList.add('open'); }
function closeDrawers() { $('.overlay').classList.remove('open'); document.querySelectorAll('.drawer').forEach(drawer => drawer.classList.remove('open')); }
function showToast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2500); }
function setAuthMode(mode) { state.authMode = mode; const drawer = $('.auth-drawer'); drawer.classList.toggle('register', mode === 'register'); $('#auth-title').textContent = mode === 'register' ? 'Create your account' : 'Welcome back'; $('#auth-submit').innerHTML = `${mode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span>`; $('#auth-name').required = mode === 'register'; $('#auth-password').autocomplete = mode === 'register' ? 'new-password' : 'current-password'; document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === mode)); $('#auth-message').textContent = ''; }
function renderSearchResults(query = '') { const normalizedQuery = query.trim().toLowerCase(); const results = normalizedQuery ? state.products.filter(product => `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalizedQuery)) : []; $('#search-results').innerHTML = results.length ? results.map(product => `<button class="search-result" data-search-add="${product.id}"><img src="${product.image}" alt="${product.name}"><span><strong>${product.name}</strong><small>${product.category} · ${money(product.price)}</small></span><b>+</b></button>`).join('') : `<p class="empty-cart">${normalizedQuery ? 'No pieces found. Try another search.' : 'Start typing to search the collection.'}</p>`; document.querySelectorAll('[data-search-add]').forEach(button => button.addEventListener('click', () => { addToCart(button.dataset.searchAdd); closeDrawers(); })); }
function renderProfileOrders() {
  const profile = JSON.parse(localStorage.getItem('oak-form-profile') || '{}');
  const orders = JSON.parse(localStorage.getItem('oak-form-orders') || '[]').filter(order => order.email === profile.email);
  $('#profile-orders').innerHTML = `<div class="profile-label">Order history</div>${orders.length ? orders.slice().reverse().map(order => `<div class="order-row"><div><strong>${escapeHtml(order.id)}</strong><span>${new Date(order.createdAt).toLocaleDateString()} · ${escapeHtml(order.status)}</span></div><b>${money(order.total)}</b></div>`).join('') : '<p class="empty-cart">Your guest orders on this device will appear here.</p>'}`;
}
function openProfile() {
  const profile = JSON.parse(localStorage.getItem('oak-form-profile') || '{}');
  $('#profile-name').value = profile.name || '';
  $('#profile-email').value = profile.email || '';
  $('#profile-message').textContent = '';
  $('[data-signout]').hidden = !state.token;
  renderProfileOrders();
  openDrawer('.profile-drawer');
}
async function openAccount() {
  if (state.token) {
    try {
      const response = await fetch('/api/me', { headers: { Authorization: `Bearer ${state.token}` } });
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('oak-form-profile', JSON.stringify(user));
        openProfile();
        return;
      }
    } catch {}
    state.token = '';
    localStorage.removeItem('oak-form-token');
  }
  setAuthMode('login');
  openDrawer('.auth-drawer');
}
function applyLanguage(language) { state.language = language; localStorage.setItem('oak-form-language', language); document.documentElement.lang = language; const copy = translations[language] || translations.en; document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = copy[element.dataset.i18n] || element.textContent; }); document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = copy[element.dataset.i18nPlaceholder] || element.placeholder; }); }

const productsFallback = [];
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach(item => item.classList.remove('active')); button.classList.add('active'); loadProducts(button.dataset.category); }));
$('[data-open-cart]').addEventListener('click', () => { renderCart(); openDrawer('.cart-drawer'); });
$('[data-open-search]').addEventListener('click', () => { renderSearchResults(); openDrawer('.search-drawer'); $('#search-input').focus(); });
$('[data-open-account]').addEventListener('click', openAccount);
$('#search-input').addEventListener('input', event => renderSearchResults(event.target.value));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', closeDrawers));
$('.overlay').addEventListener('click', closeDrawers);
document.querySelectorAll('[data-auth-mode]').forEach(tab => tab.addEventListener('click', () => setAuthMode(tab.dataset.authMode)));
$('#language-select').value = state.language;
$('#language-select').addEventListener('change', event => { applyLanguage(event.target.value); showToast(`Language: ${event.target.options[event.target.selectedIndex].text}`); });
$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = $('#auth-submit');
  const message = $('#auth-message');
  const endpoint = state.authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  submit.disabled = true;
  message.textContent = '';
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      message.textContent = data.message || `Account request failed (HTTP ${response.status}).`;
      return;
    }
    state.token = data.token;
    localStorage.setItem('oak-form-token', data.token);
    localStorage.setItem('oak-form-profile', JSON.stringify(data.user));
    closeDrawers();
    showToast(`Welcome, ${data.user.name.split(' ')[0]}`);
    form.reset();
  } catch {
    message.textContent = 'Unable to reach the account service. Guest checkout is still available.';
  } finally {
    submit.disabled = false;
  }
});
document.querySelectorAll('[data-continue-guest]').forEach(button => button.addEventListener('click', () => { closeDrawers(); openProfile(); }));
$('#profile-form').addEventListener('submit', event => {
  event.preventDefault();
  const profile = Object.fromEntries(new FormData(event.currentTarget));
  profile.name = profile.name.trim();
  profile.email = profile.email.trim().toLowerCase();
  localStorage.setItem('oak-form-profile', JSON.stringify(profile));
  $('#profile-message').textContent = 'Profile saved on this device.';
  renderProfileOrders();
});
$('[data-signout]').addEventListener('click', () => { state.token = ''; localStorage.removeItem('oak-form-token'); closeDrawers(); showToast('You have been signed out'); });
$('#newsletter-form').addEventListener('submit', async event => { event.preventDefault(); const email = $('#newsletter-email').value; const response = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await response.json(); $('#newsletter-message').textContent = data.message; if (response.ok) event.target.reset(); });
$('[data-checkout]').addEventListener('click', () => { if (!state.cart.length) return showToast('Your cart is empty'); window.location.href = '/checkout'; });
applyLanguage(state.language);
loadProducts().then(renderCart);
