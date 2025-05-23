let salesData = [];
let filteredData = [];

async function loadData() {
    const response = await fetch(DATA_URL);
    const text = await response.text();
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();

    salesData = rows.map(row => Object.fromEntries(row.map((val, i) => [headers[i], val])));
    filteredData = salesData;
    populateFilters();
    updateDashboard();
}

function populateFilters() {
    const repSet = new Set();
    const stateSet = new Set();
    const citySet = new Set();
    const distributorSet = new Set();

    salesData.forEach(row => {
        repSet.add(row['Rep']);
        stateSet.add(row['State']);
        citySet.add(row['City']);
        distributorSet.add(row['Distributor']);
    });

    setOptions('repFilter', repSet);
    setOptions('stateFilter', stateSet);
    setOptions('cityFilter', citySet);
    setOptions('distributorFilter', distributorSet);

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
}

function setOptions(id, set) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">All</option>';
    Array.from(set).sort().forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
    });
}

function applyFilters() {
    const rep = document.getElementById('repFilter').value;
    const state = document.getElementById('stateFilter').value;
    const city = document.getElementById('cityFilter').value;
    const dist = document.getElementById('distributorFilter').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    filteredData = salesData.filter(row => {
        const date = new Date(row['Bill Date'].split('/').reverse().join('-'));
        return (!rep || row['Rep'] === rep) &&
               (!state || row['State'] === state) &&
               (!city || row['City'] === city) &&
               (!dist || row['Distributor'] === dist) &&
               (!fromDate || date >= new Date(fromDate)) &&
               (!toDate || date <= new Date(toDate));
    });

    updateDashboard();
}

function updateDashboard() {
    const amounts = filteredData.map(r => parseFloat(r['Bill Amount']) || 0);
    document.getElementById('total-bills').textContent = "Total Bills: " + filteredData.length;
    document.getElementById('total-sale').textContent = "Total Sale: ₹" + sum(amounts).toLocaleString();
    document.getElementById('avg-sale').textContent = "Average Sale: ₹" + avg(amounts).toLocaleString();
    document.getElementById('max-sale').textContent = "Max Sale: ₹" + Math.max(...amounts).toLocaleString();

    drawChart('repChart', 'Sales by Reps', sumBy(filteredData, 'Rep'), 'pie');
    drawChart('stateChart', 'State-wise Sale', sumBy(filteredData, 'State'), 'pie');
    drawChart('distributorChart', 'Distributor-wise Sale', sumBy(filteredData, 'Distributor'), 'pie');
}

function sumBy(data, key) {
    return data.reduce((acc, row) => {
        acc[row[key]] = (acc[row[key]] || 0) + (parseFloat(row['Bill Amount']) || 0);
        return acc;
    }, {});
}

function drawChart(canvasId, title, data, type = 'bar') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (window[canvasId]) window[canvasId].destroy();
    window[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                backgroundColor: generateColors(Object.keys(data).length)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'bottom' },
                title: { display: true, text: title }
            }
        }
    });
}

function generateColors(n) {
    const colors = [];
    for (let i = 0; i < n; i++) {
        colors.push(`hsl(${(i * 360 / n)}, 70%, 60%)`);
    }
    return colors;
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function avg(arr) {
    return arr.length ? (sum(arr) / arr.length).toFixed(2) : 0;
}

window.onload = loadData;
