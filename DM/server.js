import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const users = new Map();
const sessions = new Map();
const orders = [];

const products = [
  { id: 'arc-lounge', name: 'Arc Lounge Chair', category: 'Seating', price: 289, oldPrice: 340, badge: 'Bestseller', description: 'A low, sculptural lounge chair with a generous seat and boucle-like texture.', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1000&q=85', colors: ['#d9cfc2', '#33423c', '#ae7b55'] },
  { id: 'marlow-sofa', name: 'Marlow 3-Seater Sofa', category: 'Seating', price: 1190, badge: 'New arrival', description: 'Deep comfort, clean lines, and a warm oat weave made for slow Sundays.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85', colors: ['#d9cfc2', '#b8aa91'] },
  { id: 'sora-table', name: 'Sora Coffee Table', category: 'Tables', price: 420, description: 'Solid oak and a softly rounded profile bring a grounded centre to your room.', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1000&q=85', colors: ['#a9784f', '#513b2a'] },
  { id: 'linen-bed', name: 'Linen Cloud Bed', category: 'Bedroom', price: 980, badge: 'Editor pick', description: 'A quiet, upholstered bed frame designed for restful rooms and early nights.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85', colors: ['#ded6c9', '#8b8171'] },
  { id: 'moss-sideboard', name: 'Moss Sideboard', category: 'Storage', price: 760, description: 'Fluted doors, hidden storage, and a deep green finish that grows on you.', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=85', colors: ['#33423c', '#c1a373'] },
  { id: 'halo-pendant', name: 'Halo Pendant Light', category: 'Lighting', price: 180, description: 'A paper-soft glow with a slim brass stem for tables, nooks, and bedside corners.', image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=85', colors: ['#ede8dc', '#c49a5c'] }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}
function userFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token ? sessions.get(token) : null;
}
function validCardNumber(card) {
  const digits = String(card || '').replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let total = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index]);
    if (doubleDigit) value *= 2;
    if (value > 9) value -= 9;
    total += value;
    doubleDigit = !doubleDigit;
  }
  return total % 10 === 0;
}

app.get('/api/products', (req, res) => {
  const category = req.query.category;
  const result = category && category !== 'All' ? products.filter(product => product.category === category) : products;
  res.json(result);
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Please provide a name, email, and password of at least 6 characters.' });
  const normalizedEmail = email.trim().toLowerCase();
  if (users.has(normalizedEmail)) return res.status(409).json({ message: 'An account with that email already exists.' });
  const user = { name: name.trim(), email: normalizedEmail, password: hashPassword(password) };
  users.set(normalizedEmail, user);
  const token = crypto.randomUUID();
  sessions.set(token, { name: user.name, email: user.email });
  res.status(201).json({ token, user: { name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email?.trim().toLowerCase());
  if (!user || !verifyPassword(password || '', user.password)) return res.status(401).json({ message: 'Email or password is incorrect.' });
  const token = crypto.randomUUID();
  sessions.set(token, { name: user.name, email: user.email });
  res.json({ token, user: { name: user.name, email: user.email } });
});

app.get('/api/me', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Not signed in.' });
  res.json(user);
});

app.get('/api/orders', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Not signed in.' });
  res.json(orders.filter(order => order.user === user.email).map(order => ({ ...order, shipping: { city: order.shipping.city, state: order.shipping.state, zip: order.shipping.zip } })));
});

app.post('/api/orders', (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Sign in before placing an order.' });
  const { items, shipping } = req.body;
  if (!Array.isArray(items) || !items.length || !shipping?.address || !shipping?.name || !shipping?.city || !shipping?.state || !shipping?.zip || !shipping?.phone) return res.status(400).json({ message: 'Complete your contact and delivery details before placing the order.' });
  if (!validCardNumber(shipping.card)) return res.status(400).json({ message: 'Enter a valid card number to continue.' });
  if (!/^\d{3,4}$/.test(String(shipping.cvv || '')) || !/^\d{2}\s*\/\s*\d{2}$/.test(String(shipping.expiry || ''))) return res.status(400).json({ message: 'Check your card expiry and security code.' });
  const { card, cvv, expiry, ...safeShipping } = shipping;
  const order = { id: `OF-${Date.now().toString().slice(-6)}`, user: user.email, items, shipping: safeShipping, createdAt: new Date().toISOString(), status: 'Confirmed' };
  orders.push(order);
  res.status(201).json(order);
});

app.post('/api/newsletter', (req, res) => {
  if (!req.body.email?.includes('@')) return res.status(400).json({ message: 'Enter a valid email address.' });
  res.status(201).json({ message: 'You are on the list. Welcome to the good stuff.' });
});

app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Oak & Form is running at http://localhost:${PORT}`));
}

export default app;
