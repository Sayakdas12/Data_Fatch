const axios = require('axios');
const Transaction = require('../models/Transaction');

// Fetch and initialize data from the third-party API
const initializeDatabase = async () => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;

    // Clear the existing data
    await Transaction.deleteMany({});

    // Insert new data
    await Transaction.insertMany(transactions);
    console.log('Database initialized with seed data.');
  } catch (error) {
    console.error('Error fetching data from the third-party API:', error);
  }
};

// List transactions with pagination and search
const listTransactions = async (req, res) => {
  const { page = 1, perPage = 10, search = '', month } = req.query;
  const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
  const endDate = new Date(`${new Date().getFullYear()}-${parseInt(month) + 1}-01`);
  
  try {
    const query = {
      dateOfSale: { $gte: startDate, $lt: endDate },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } },
      ]
    };
    
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page,
      perPage
    });
  } catch (error) {
    res.status(500).send('Error fetching transactions');
  }
};

// Get statistics for the selected month
const getStatistics = async (req, res) => {
  const { month } = req.query;
  const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
  const endDate = new Date(`${new Date().getFullYear()}-${parseInt(month) + 1}-01`);

  try {
    const totalSales = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: null, totalAmount: { $sum: '$price' }, totalSold: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } }, totalNotSold: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } } } }
    ]);

    res.json(totalSales[0]);
  } catch (error) {
    res.status(500).send('Error fetching statistics');
  }
};

// Get data for the bar chart
const getBarChartData = async (req, res) => {
  const { month } = req.query;
  const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
  const endDate = new Date(`${new Date().getFullYear()}-${parseInt(month) + 1}-01`);

  try {
    const priceRanges = [
      { range: '0-100', min: 0, max: 100 },
      { range: '101-200', min: 101, max: 200 },
      { range: '201-300', min: 201, max: 300 },
      { range: '301-400', min: 301, max: 400 },
      { range: '401-500', min: 401, max: 500 },
      { range: '501-600', min: 501, max: 600 },
      { range: '601-700', min: 601, max: 700 },
      { range: '701-800', min: 701, max: 800 },
      { range: '801-900', min: 801, max: 900 },
      { range: '901-above', min: 901, max: Infinity }
    ];

    const results = await Promise.all(priceRanges.map(async (range) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lt: endDate },
        price: { $gte: range.min, $lte: range.max }
      });
      return { range: range.range, count };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).send('Error fetching bar chart data');
  }
};

// Get pie chart data for categories
const getPieChartData = async (req, res) => {
  const { month } = req.query;
  const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
  const endDate = new Date(`${new Date().getFullYear()}-${parseInt(month) + 1}-01`);

  try {
    const categories = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).send('Error fetching pie chart data');
  }
};

// Get combined data for all charts and statistics
const getCombinedData = async (req, res) => {
  const { month } = req.query;

  try {
    const [statistics, barChartData, pieChartData] = await Promise.all([
      getStatistics(req, res),
      getBarChartData(req, res),
      getPieChartData(req, res),
    ]);

    res.json({ statistics, barChartData, pieChartData });
  } catch (error) {
    res.status(500).send('Error fetching combined data');
  }
};

module.exports = {
  initializeDatabase,
  listTransactions,
  getStatistics,
  getBarChartData,
  getPieChartData,
  getCombinedData
};
