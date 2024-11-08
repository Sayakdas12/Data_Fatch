const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const transactionController = require('./controllers/transactioncontroller');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactions', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Initialize the database
transactionController.initializeDatabase();

// Routes
app.get('/api/transactions', transactionController.listTransactions);
app.get('/api/statistics', transactionController.getStatistics);
app.get('/api/bar-chart', transactionController.getBarChartData);
app.get('/api/pie-chart', transactionController.getPieChartData);
app.get('/api/combined', transactionController.getCombinedData);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
