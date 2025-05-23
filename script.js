let salesData = [];
let filteredData = [];

async function loadData() {
    const response = await fetch("data.csv");
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

    filteredData.forEach(row => {
        repSet.add(row['Rep']);
        stateSet.add(row['State']);
        citySet.add(row['City']);
        distributorSet.add(row['Distributor']);
    });

    setOptions('repFilter', repSet);
    setOptions('stateFilter', stateSet);
    setOptions('cityFilter', citySet);
    setOptions('distributorFilter', distributorSet);

    ['repFilter', 'stateFilter', 'cityFilter', 'distributorFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
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

    filteredData = salesData.filter(row => 
        (!rep || row['Rep'] === rep) &&
        (!state || row['State'] === state) &&
        (!city || row['City'] === city) &&
        (!dist || row['Distributor'] === dist)
    );

    updateDashboard();
}

function updateDashboard() {
    const amounts = filteredData.map(r => +r['Bill Amount']);
    document.getElementById('total-bills').textContent = "Total Bills: " + filteredData.length;
    document.getElementById('total-sale').textContent = "Total Sale: " + sum(amounts);
    document.getElementById('avg-sale').textContent = "Average Sale: " + avg(amounts);
    document.getElementById('max-sale').textContent = "Max Sale: " + Math.max(...amounts);

    drawChart('repChart', 'Sales by Reps', countBy(filteredData, 'Rep'));
    drawChart('stateChart', 'State-wise Sale', sumBy(filteredData, 'State'));
    drawChart('distributorChart', 'Distributor-wise Sale', sumBy(filteredData, 'Distributor'));
}

function countBy(data, key) {
    return data.reduce((acc, row) => {
        acc[row[key]] = (acc[row[key]] || 0) + 1;
        return acc;
    }, {});
}

function sumBy(data, key) {
    return data.reduce((acc, row) => {
        acc[row[key]] = (acc[row[key]] || 0) + (+row['Bill Amount']);
        return acc;
    }, {});
}

function drawChart(canvasId, title, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (window[canvasId]) window[canvasId].destroy();
    window[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: title }
            }
        }
    });
}

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function avg(arr) {
    return arr.length ? (sum(arr) / arr.length).toFixed(2) : 0;
}

window.onload = loadData;
