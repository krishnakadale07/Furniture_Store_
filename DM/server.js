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

const productCatalog = {
  Seating: {
    names: ['Cove Modular Sofa', 'Aster Accent Chair', 'Rowan Dining Chair', 'Marlow Loveseat'],
    basePrice: 249,
    priceStep: 65,
    description: 'Comfortable, considered seating with enduring materials and a thoughtful silhouette.',
    colors: ['#d9cfc2', '#33423c', '#ae7b55']
  },
  Tables: {
    names: ['Rowan Dining Table', 'Forma Side Table', 'Morrow Console Table', 'Cove Nesting Tables'],
    basePrice: 149,
    priceStep: 55,
    description: 'A practical, beautifully proportioned table made for everyday rituals and gatherings.',
    colors: ['#a9784f', '#513b2a', '#d4c6ad']
  },
  Bedroom: {
    names: ['Rest Quilt Cover Set', 'Aster Bedside Bench', 'Dawn Upholstered Headboard', 'Cloud Nine Nightstand'],
    basePrice: 279,
    priceStep: 75,
    description: 'Soft textures and restful forms, thoughtfully chosen to make winding down feel natural.',
    colors: ['#ded6c9', '#8b8171', '#a47761']
  },
  Storage: {
    names: ['Cove Bookcase', 'Rowan Media Console', 'Alder Shoe Cabinet', 'Forma Wall Shelf'],
    basePrice: 199,
    priceStep: 62,
    description: 'Useful, well-made storage that brings order to a room without asking for attention.',
    colors: ['#33423c', '#c1a373', '#d8d0c3']
  },
  Lighting: {
    names: ['Arc Floor Lamp', 'Mira Table Lamp', 'Sol Pendant'],
    basePrice: 89,
    priceStep: 32,
    description: 'Warm, considered light with a sculptural shape for reading, working, or unwinding.',
    colors: ['#ede8dc', '#c49a5c', '#59675b']
  }
};

const productPhotos = {
  'Cove Modular Sofa': { image: 'https://live.staticflickr.com/2445/3997737478_6ac2eb5e8d.jpg', credit: 'homedesignss', license: 'CC BY-SA 2.0', source: 'https://www.flickr.com/photos/43489128@N08/3997737478' },
  'Aster Accent Chair': { image: 'https://live.staticflickr.com/8085/8587307253_cc43c88081_b.jpg', credit: 'Tigist Sapphire', license: 'CC BY-SA 2.0', source: 'https://www.flickr.com/photos/73159597@N03/8587307253' },
  'Rowan Dining Chair': { image: 'https://live.staticflickr.com/6094/6240666973_c1aff0b3d5_b.jpg', credit: 'frenchfinds.co.uk', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/23717595@N05/6240666973' },
  'Marlow Loveseat': { image: 'https://live.staticflickr.com/4017/4302461915_88d6642a7f_b.jpg', credit: 'crackdog', license: 'Public Domain Mark 1.0', source: 'https://www.flickr.com/photos/88645472@N00/4302461915' },
  'Rowan Dining Table': { image: 'https://live.staticflickr.com/7299/16240417660_239401de58_b.jpg', credit: 'IndoGemstone', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/47544036@N03/16240417660' },
  'Forma Side Table': { image: 'https://live.staticflickr.com/5229/5591040959_98fb397355_b.jpg', credit: 'AngryJulieMonday', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/33731571@N07/5591040959' },
  'Morrow Console Table': { image: 'https://live.staticflickr.com/2715/4054973902_f4cc73cd68_b.jpg', credit: 'TheLivingRoominKenmore', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/36910487@N07/4054973902' },
  'Cove Nesting Tables': { image: 'https://live.staticflickr.com/2488/4207166260_2704fb52be.jpg', credit: 'that simple', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/68811069@N00/4207166260' },
  'Rest Quilt Cover Set': { image: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Francis_Law_Durand%2C_Infant%27s_Quilt_%28Bed_Covering%29%2C_c._1937%2C_NGA_12607.jpg', credit: 'Francis Law Durand', license: 'CC0 1.0', source: 'https://commons.wikimedia.org/w/index.php?curid=82064578' },
  'Aster Bedside Bench': { image: 'https://live.staticflickr.com/4118/4778863344_5299a19a5c_b.jpg', credit: 'DesignFolly.com', license: 'CC BY-SA 2.0', source: 'https://www.flickr.com/photos/9243453@N02/4778863344' },
  'Dawn Upholstered Headboard': { image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/1950s_upholstered_headboard_in_Paris_trash.jpg', credit: 'Danielclauzier', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/w/index.php?curid=56770074' },
  'Cloud Nine Nightstand': { image: 'https://live.staticflickr.com/1548/25620203250_b589b44350_b.jpg', credit: 'benjaflynn', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/8687249@N03/25620203250' },
  'Cove Bookcase': { image: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Office%2C_typewriter%2C_bookcase%2C_furniture%2C_lady%2C_interior_Fortepan_20491.jpg', credit: 'Fortepan', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/w/index.php?curid=49606338' },
  'Rowan Media Console': { image: 'https://live.staticflickr.com/6057/6430374335_0407e0194f_b.jpg', credit: 'BeckyF', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/81757835@N00/6430374335' },
  'Alder Shoe Cabinet': { image: 'https://live.staticflickr.com/32/42905597_33d13f8a5f_b.jpg', credit: 'Juanjo+Willow', license: 'CC BY-SA 2.0', source: 'https://www.flickr.com/photos/97691634@N00/42905597' },
  'Forma Wall Shelf': { image: 'https://live.staticflickr.com/7158/6586035597_f86f36e7c2_b.jpg', credit: 'Slacker Mark', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/10347263@N05/6586035597' },
  'Arc Floor Lamp': { image: 'https://live.staticflickr.com/4060/4517123728_7daed44868_b.jpg', credit: 'TheLivingRoominKenmore', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/36910487@N07/4517123728' },
  'Mira Table Lamp': { image: 'https://live.staticflickr.com/3637/5771792573_6daf7dd020_b.jpg', credit: 'Artdecodude', license: 'CC BY 2.0', source: 'https://www.flickr.com/photos/62920259@N03/5771792573' },
  'Sol Pendant': { image: 'https://pd.w.org/2026/05/2616a0c0631e70327.79740517-1536x2048.jpeg', credit: 'Tilak Bahadur Karki', license: 'CC0 1.0', source: 'https://wordpress.org/photos/photo/2616a0c063/' }
};

for (const [category, catalog] of Object.entries(productCatalog)) {
  catalog.names.forEach((name, index) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const photo = productPhotos[name];
    products.push({
      id: `catalog-${slug}`,
      name,
      category,
      price: catalog.basePrice + index * catalog.priceStep,
      description: catalog.description,
      image: photo.image,
      imageCredit: photo.credit,
      imageLicense: photo.license,
      imageSource: photo.source,
      colors: catalog.colors
    });
  });
}

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
