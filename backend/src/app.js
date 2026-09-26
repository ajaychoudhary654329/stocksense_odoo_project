const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const locationRoutes = require('./routes/locationRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const moveRoutes = require('./routes/moveRoutes');

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoints
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'stocksense-api',
      timestamp: new Date().toISOString(),
    },
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/moves', moveRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
