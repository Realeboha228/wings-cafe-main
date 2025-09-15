import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// In wings/src/App.js
const API_BASE = process.env.REACT_APP_API_BASE;

function App() {
  const [view, setView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, transactionsRes, dashboardRes] = await Promise.all([
        axios.get(`${API_BASE}/api/products`),
        axios.get(`${API_BASE}/api/transactions`),
        axios.get(`${API_BASE}/api/dashboard`)
      ]);
      
      setProducts(productsRes.data);
      setTransactions(transactionsRes.data);
      setDashboardData(dashboardRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wings Cafe Inventory</h1>
        <nav className="app-nav">
          <button onClick={() => setView('dashboard')}>Dashboard</button>
          <button onClick={() => setView('products')}>Products</button>
          <button onClick={() => setView('sales')}>Sales</button>
          <button onClick={() => setView('inventory')}>Inventory</button>
          <button onClick={() => setView('reporting')}>Reports</button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'dashboard' && <Dashboard data={dashboardData} products={products} transactions={transactions} />}
        {view === 'products' && <Products products={products} onUpdate={fetchData} />}
        {view === 'sales' && <Sales products={products} onUpdate={fetchData} />}
        {view === 'inventory' && <Inventory products={products} onUpdate={fetchData} />}
        {view === 'reporting' && <Reports products={products} transactions={transactions} />}
      </main>
    </div>
  );
}

// Dashboard Component
function Dashboard({ products, transactions }) {
  // Calculate how many items have been sold for each product
  const productSales = {};
  transactions.filter(t => t.type === 'sale').forEach(sale => {
    if (!productSales[sale.productId]) {
      productSales[sale.productId] = 0;
    }
    productSales[sale.productId] += sale.quantityChanged;
  });

  return (
    <div className="dashboard">
      <h2>Current Menu</h2>
      
      <div className="menu-grid">
        {products.map(product => (
          <div key={product.id} className="menu-item">
            <div className="item-name">{product.name}</div>
            <div className="item-description">{product.description}</div>
            <div className="item-category">{product.category}</div>
            
            <div className="item-details">
              <div className="item-price">${product.price.toFixed(2)}</div>
              <div className="item-stock">
                Available: {product.quantity}
                {productSales[product.id] > 0 && (
                  <span className="item-sold"> (Sold: {productSales[product.id]})</span>
                )}
              </div>
            </div>

            {product.quantity < 5 && (
              <div className="low-stock-warning">Low stock - only {product.quantity} left!</div>
            )}
          </div>
        ))}
      </div>

      <div className="low-stock-summary">
        <h3>Low Stock Alert</h3>
        {products.filter(p => p.quantity < 5).length === 0 ? (
          <p>All items are well stocked</p>
        ) : (
          <div className="low-stock-list">
            {products.filter(p => p.quantity < 5).map(product => (
              <div key={product.id} className="low-stock-item">
                {product.name} - Only {product.quantity} remaining
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Products Component
function Products({ products, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', price: '', quantity: ''
  });

  // Set form data when editing a product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      quantity: product.quantity
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update existing product
        await axios.put(`${API_BASE}/api/products/${editingProduct.id}`, formData);
        alert('Product updated successfully!');
      } else {
        // Add new product
        await axios.post(`${API_BASE}/api/products`, formData);
        alert('Product added successfully!');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', category: '', price: '', quantity: '' });
      onUpdate();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', category: '', price: '', quantity: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_BASE}/api/products/${id}`);
        onUpdate();
        alert('Product deleted!');
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div className="products">
      <h2>Product Management</h2>
      
      <button onClick={() => setShowForm(true)} className="add-btn">
        Add New Product
      </button>

      {showForm && (
        <div className="form-container">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="product-form">
            <input type="text" placeholder="Product Name" value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            
            <textarea placeholder="Description" value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})} />
            
            <input type="text" placeholder="Category" value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            
            <input type="number" placeholder="Price" step="0.01" value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
            
            <input type="number" placeholder="Quantity" value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required />
            
            <div className="form-buttons">
              <button type="submit">{editingProduct ? 'Update' : 'Add'} Product</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="products-table">
        <h3>Current Products ({products.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className={product.quantity < 5 ? 'low-stock' : ''}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>R{product.price.toFixed(2)}</td>
                <td>{product.quantity}</td>
                <td>
                  <button onClick={() => handleEdit(product)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sales Component
function Sales({ products, onUpdate }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transactions, setTransactions] = useState([]);

  // Fetch transactions when component loads
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSale = async () => {
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) {
      alert('Please select a product');
      return;
    }

    if (product.quantity < quantity) {
      alert('Not enough stock!');
      return;
    }

    try {
      // Update product quantity
      await axios.put(`${API_BASE}/api/products/${product.id}`, {
        ...product,
        quantity: product.quantity - quantity
      });

      // Record transaction
      await axios.post(`${API_BASE}/api/transactions`, {
        productId: product.id,
        productName: product.name,
        type: 'sale',
        quantityChanged: quantity,
        amount: product.price * quantity
      });

      alert('Sale recorded successfully!');
      setSelectedProduct('');
      setQuantity(1);
      onUpdate();
      fetchTransactions(); // Refresh transactions after sale
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const sales = transactions.filter(t => t.type === 'sale');

  return (
    <div className="sales">
      <h2>Record Sale</h2>
      
      <div className="sale-form">
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
          <option value="">Select Product</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - R{product.price} (Stock: {product.quantity})
            </option>
          ))}
        </select>

        <input type="number" min="1" value={quantity} 
          onChange={(e) => setQuantity(parseInt(e.target.value))} 
          placeholder="Quantity" />

        <button onClick={handleSale} disabled={!selectedProduct}>
          Record Sale
        </button>
      </div>

      <div className="current-stock">
        <h3>Current Stock Levels</h3>
        <div className="stock-list">
          {products.map(product => (
            <div key={product.id} className="stock-item">
              <span>{product.name}</span>
              <span className={product.quantity < 5 ? 'low-stock' : ''}>
                {product.quantity} in stock
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sales History Section */}
      <div className="sales-history">
        <h3>Recent Sales</h3>
        {sales.length === 0 ? (
          <p>No sales recorded yet</p>
        ) : (
          <div className="sales-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .slice(-10) // Show last 10 sales
                  .reverse() // Show most recent first
                  .map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.productName}</td>
                      <td>{sale.quantityChanged}</td>
                      <td>R{sale.amount.toFixed(2)}</td>
                      <td>{new Date(sale.date).toLocaleTimeString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Inventory Component
function Inventory({ products, onUpdate }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [addQuantity, setAddQuantity] = useState('');

  const handleAddStock = async () => {
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product || !addQuantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    try {
      await axios.put(`${API_BASE}/api/products/${product.id}`, {
        ...product,
        quantity: product.quantity + parseInt(addQuantity)
      });

      await axios.post(`${API_BASE}/api/transactions`, {
        productId: product.id,
        productName: product.name,
        type: 'restock',
        quantityChanged: parseInt(addQuantity),
        amount: 0
      });

      alert('Stock added successfully!');
      setSelectedProduct('');
      setAddQuantity('');
      onUpdate();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  return (
    <div className="inventory">
      <h2>Inventory Management</h2>
      
      <div className="add-stock-form">
        <h3>Add Stock</h3>
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
          <option value="">Select Product</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} (Current: {product.quantity})
            </option>
          ))}
        </select>

        <input type="number" min="1" value={addQuantity} 
          onChange={(e) => setAddQuantity(e.target.value)} 
          placeholder="Quantity to add" />

        <button onClick={handleAddStock} disabled={!selectedProduct || !addQuantity}>
          Add Stock
        </button>
      </div>

      <div className="inventory-table">
        <h3>Current Inventory</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.quantity}</td>
                <td>
                  {product.quantity === 0 ? 'Out of Stock' : 
                   product.quantity < 5 ? 'Low Stock' : 'In Stock'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reports Component
function Reports({ products, transactions }) {
  const sales = transactions.filter(t => t.type === 'sale');
  const totalSales = sales.reduce((total, sale) => total + sale.amount, 0);
  const totalItemsSold = sales.reduce((total, sale) => total + sale.quantityChanged, 0);

  return (
    <div className="reports">
      <h2>Sales Reports</h2>
      
      <div className="report-stats">
        <div className="stat-box">
          <h3>Total Sales Value</h3>
          <p>R{totalSales.toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h3>Total Items Sold</h3>
          <p>{totalItemsSold}</p>
        </div>
        <div className="stat-box">
          <h3>Total Transactions</h3>
          <p>{sales.length}</p>
        </div>
      </div>

      <div className="stock-report">
        <h3>Stock Status Report</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td className={product.quantity < 5 ? 'low-stock' : ''}>
                  {product.quantity === 0 ? 'OUT OF STOCK' : 
                   product.quantity < 5 ? 'LOW STOCK' : 'OK'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
