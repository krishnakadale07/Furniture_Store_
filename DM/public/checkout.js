const cart = JSON.parse(localStorage.getItem('oak-form-cart') || '[]');
const money = value => `$${value.toLocaleString('en-US')}`;
const $ = selector => document.querySelector(selector);
let products = [];

function showMessage(message, success = false) { const element = $('#checkout-message'); element.textContent = message; element.classList.toggle('success-message', success); }
function showToast(message) { $('#checkout-toast').textContent = message; $('#checkout-toast').classList.add('show'); setTimeout(() => $('#checkout-toast').classList.remove('show'), 3000); }
function validCardNumber(card) { const digits = card.replace(/\D/g, ''); if (digits.length < 12 || digits.length > 19) return false; let total = 0; let doubleDigit = false; for (let index = digits.length - 1; index >= 0; index -= 1) { let value = Number(digits[index]); if (doubleDigit) value *= 2; if (value > 9) value -= 9; total += value; doubleDigit = !doubleDigit; } return total % 10 === 0; }
function renderSummary() { const items = cart.map(item => ({ ...item, product: products.find(product => product.id === item.id) })).filter(item => item.product); const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0); $('#checkout-items').innerHTML = items.map(({ product, quantity }) => `<div class="summary-item"><img src="${product.image}" alt="${product.name}"><div><strong>${product.name}</strong><span>${quantity} × ${money(product.price)}</span></div><b>${money(product.price * quantity)}</b></div>`).join(''); $('#checkout-subtotal').textContent = money(subtotal); $('#checkout-total').textContent = money(subtotal); }
if (!cart.length) { window.location.href = '/'; } else {
  const profile = JSON.parse(localStorage.getItem('oak-form-profile') || '{}');
  $('#checkout-email').value = profile.email || '';
  $('#checkout-name').value = profile.name || '';
  fetch('/api/products').then(response => response.json()).then(catalog => { products = catalog; renderSummary(); });
  $('#checkout-form').addEventListener('submit', async event => {
    event.preventDefault();
    showMessage('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (!event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    if (!validCardNumber(form.card)) return showMessage('Enter a valid card number to continue.');
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(form.expiry) || !/^\d{3,4}$/.test(form.cvv)) return showMessage('Check your card expiry and security code.');
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart, shipping: { ...form, address: `${form.address}, ${form.city}, ${form.state} ${form.zip}` } }) });
    const data = await response.json();
    if (!response.ok) return showMessage(data.message);
    const normalizedProfile = { name: form.name.trim(), email: form.email.trim().toLowerCase() };
    localStorage.setItem('oak-form-profile', JSON.stringify(normalizedProfile));
    const orderHistory = JSON.parse(localStorage.getItem('oak-form-orders') || '[]');
    const total = cart.reduce((sum, item) => sum + (products.find(product => product.id === item.id)?.price || 0) * item.quantity, 0);
    orderHistory.push({ id: data.id, email: normalizedProfile.email, total, createdAt: data.createdAt, status: data.status });
    localStorage.setItem('oak-form-orders', JSON.stringify(orderHistory));
    localStorage.removeItem('oak-form-cart');
    showMessage(`Order ${data.id} confirmed. Thank you for choosing Oak & Form.`, true);
    showToast('Order placed successfully');
    event.currentTarget.reset();
    setTimeout(() => { window.location.href = '/'; }, 1600);
  });
}
