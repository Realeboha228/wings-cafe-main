const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database.json');

const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { products: [], transactions: [] };
  }
};

const writeDatabase = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Routes
app.get('/api/products', (req, res) => {
  const db = readDatabase();
  res.json(db.products);
});

app.post('/api/products', (req, res) => {
  try {
    const db = readDatabase();
    const newProduct = { id: Date.now(), ...req.body };
    db.products.push(newProduct);
    writeDatabase(db);
    res.json(newProduct);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const productIndex = db.products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products[productIndex] = { ...db.products[productIndex], ...req.body };
  writeDatabase(db);
  res.json(db.products[productIndex]);
});

app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const productIndex = db.products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products.splice(productIndex, 1);
  writeDatabase(db);
  res.json({ message: 'Product deleted' });
});

app.post('/api/transactions', (req, res) => {
  try {
    const db = readDatabase();
    const newTransaction = {
      id: Date.now(),
      ...req.body,
      date: new Date().toISOString()
    };
    db.transactions.push(newTransaction);
    writeDatabase(db);
    res.json(newTransaction);
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
  }
});

app.get('/api/transactions', (req, res) => {
  const db = readDatabase();
  res.json(db.transactions);
});

app.get('/api/dashboard', (req, res) => {
  const db = readDatabase();
  const totalProducts = db.products.length;
  const lowStockItems = db.products.filter(p => p.quantity < 5).length;
  res.json({ totalProducts, lowStockItems });
});

// Catch favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
