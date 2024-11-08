// Define constants for pagination and API URLs
const perPage = 10;
let currentPage = 1;
const apiBaseURL = 'http://localhost:5000/api';

const transactionsTable = document.getElementById('transactions-table').getElementsByTagName('tbody')[0];
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const monthDropdown = document.getElementById('month-dropdown');
const searchBox = document.getElementById('search-box');
const totalAmountElement = document.getElementById('total-amount');
const totalSoldElement = document.getElementById('total-sold');
const totalNotSoldElement = document.getElementById('total-not-sold');
const barChartCanvas = document.getElementById('bar-chart');
const pieChartCanvas = document.getElementById('pie-chart');

const barChart = new Chart(barChartCanvas, {
  type: 'bar',
  data: {
    labels: ['0-100', '101-200', '201-300', '301-400', '401-500', '501-600', '601-700', '701-800', '801-900', '901-above'],
    datasets: [{
      label: 'Number of Items',
      data: [],
      backgroundColor: '#4caf50',
    }]
  },
  options: {
    scales: {
      x: { title: { display: true, text: 'Price Range' } },
      y: { title: { display: true, text: 'Number of Items' }, beginAtZero: true }
    }
  }
});

const pieChart = new Chart(pieChartCanvas, {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
    }]
  }
});

async function fetchTransactions() {
  const month = monthDropdown.value;
  const search = searchBox.value.trim();

  try {
    const response = await fetch(`${apiBaseURL}/transactions?month=${month}&page=${currentPage}&perPage=${perPage}&search=${search}`);
    const data = await response.json();

    transactionsTable.innerHTML = '';
    data.transactions.forEach(transaction => {
      const row = transactionsTable.insertRow();
      row.innerHTML = `
        <td>${transaction.title}</td>
        <td>${transaction.description}</td>
        <td>${transaction.price}</td>
        <td>${transaction.sold ? 'Sold' : 'Not Sold'}</td>
        <td>${transaction.category}</td>
      `;
    });

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage * perPage >= data.total;

    const statistics = await fetchStatistics(month);
    totalAmountElement.textContent = statistics.totalAmount.toFixed(2);
    totalSoldElement.textContent = statistics.totalSold;
    totalNotSoldElement.textContent = statistics.totalNotSold;

    const barChartData = await fetchBarChartData(month);
    barChart.data.datasets[0].data = barChartData.map(item => item.count);
    barChart.update();

    const pieChartData = await fetchPieChartData(month);
    pieChart.data.labels = pieChartData.map(item => item._id);
    pieChart.data.datasets[0].data = pieChartData.map(item => item.count);
    pieChart.update();
  } catch (error) {
    console.error('Error fetching data', error);
  }
}

async function fetchStatistics(month) {
  const response = await fetch(`${apiBaseURL}/statistics?month=${month}`);
  return await response.json();
}

async function fetchBarChartData(month) {
  const response = await fetch(`${apiBaseURL}/bar-chart?month=${month}`);
  return await response.json();
}

async function fetchPieChartData(month) {
  const response = await fetch(`${apiBaseURL}/pie-chart?month=${month}`);
  return await response.json();
}

monthDropdown.addEventListener('change', fetchTransactions);
searchBox.addEventListener('input', fetchTransactions);
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchTransactions();
  }
});
nextButton.addEventListener('click', () => {
  currentPage++;
  fetchTransactions();
});

fetchTransactions();
