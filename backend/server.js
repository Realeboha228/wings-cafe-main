const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

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
    if (req.method === 'GET' && req.url === '/api/products') {
        const db = readDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.products));
    }
    else if (req.method === 'POST' && req.url === '/api/products') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const db = readDatabase();
                const newProduct = {
                    id: Date.now(),
                    ...JSON.parse(body)
                };
                db.products.push(newProduct);
                writeDatabase(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newProduct));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (req.method === 'PUT' && req.url.startsWith('/api/products/')) {
        const id = parseInt(req.url.split('/').pop());
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const db = readDatabase();
                const productIndex = db.products.findIndex(p => p.id === id);
                
                if (productIndex === -1) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Product not found' }));
                    return;
                }
                
                db.products[productIndex] = { ...db.products[productIndex], ...JSON.parse(body) };
                writeDatabase(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(db.products[productIndex]));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (req.method === 'DELETE' && req.url.startsWith('/api/products/')) {
        const id = parseInt(req.url.split('/').pop());
        const db = readDatabase();
        const productIndex = db.products.findIndex(p => p.id === id);
        
        if (productIndex === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Product not found' }));
            return;
        }
        
        db.products.splice(productIndex, 1);
        writeDatabase(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Product deleted' }));
    }
    else if (req.method === 'POST' && req.url === '/api/transactions') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const db = readDatabase();
                const newTransaction = {
                    id: Date.now(),
                    ...JSON.parse(body),
                    date: new Date().toISOString()
                };
                db.transactions.push(newTransaction);
                writeDatabase(db);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newTransaction));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (req.method === 'GET' && req.url === '/api/transactions') {
        const db = readDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.transactions));
    }
    else if (req.method === 'GET' && req.url === '/api/dashboard') {
        const db = readDatabase();
        const totalProducts = db.products.length;
        const lowStockItems = db.products.filter(p => p.quantity < 5).length;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProducts,
            lowStockItems
        }));
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('  GET    /api/products');
    console.log('  POST   /api/products');
    console.log('  PUT    /api/products/:id');
    console.log('  DELETE /api/products/:id');
    console.log('  GET    /api/transactions');
    console.log('  POST   /api/transactions');
    console.log('  GET    /api/dashboard');
});