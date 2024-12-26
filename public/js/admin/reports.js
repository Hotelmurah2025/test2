document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupEventListeners();
    initializeDatePickers();
    loadReport('bookings');
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('reportFilters').addEventListener('submit', handleGenerateReport);
    document.getElementById('dateRange').addEventListener('change', toggleCustomDateRange);
    document.getElementById('downloadPDF').addEventListener('click', handleDownloadPDF);
    document.getElementById('downloadCSV').addEventListener('click', handleDownloadCSV);
    
    // Report type selection
    document.querySelectorAll('[data-report]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('[data-report]').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            loadReport(e.target.dataset.report);
        });
    });
}

function initializeDatePickers() {
    flatpickr('#startDate', {
        maxDate: 'today'
    });
    
    flatpickr('#endDate', {
        maxDate: 'today'
    });
}

function toggleCustomDateRange(e) {
    const customDateRange = document.getElementById('customDateRange');
    customDateRange.classList.toggle('d-none', e.target.value !== 'custom');
}

async function loadReport(type) {
    document.getElementById('reportTitle').textContent = getReportTitle(type);
    await generateReport(type);
}

function getReportTitle(type) {
    const titles = {
        bookings: 'Booking Reports',
        revenue: 'Revenue Reports',
        hotels: 'Hotel Performance',
        occupancy: 'Occupancy Rates'
    };
    return titles[type] || 'Report';
}

async function handleGenerateReport(e) {
    e.preventDefault();
    const reportType = document.querySelector('[data-report].active').dataset.report;
    await generateReport(reportType);
}

async function generateReport(type) {
    const filters = getReportFilters();
    
    try {
        const response = await fetch('/api/admin/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                filters: filters
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate report');
        }
        
        const data = await response.json();
        displayReport(type, data);
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report');
    }
}

function getReportFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const filters = {
        group_by: document.getElementById('groupBy').value
    };
    
    if (dateRange === 'custom') {
        filters.start_date = document.getElementById('startDate').value;
        filters.end_date = document.getElementById('endDate').value;
    } else {
        filters.days = parseInt(dateRange);
    }
    
    return filters;
}

function displayReport(type, data) {
    displaySummaryStats(type, data.summary);
    displayChart(type, data.chart);
    displayTable(type, data.details);
}

function displaySummaryStats(type, summary) {
    const container = document.getElementById('summaryStats');
    let html = '';
    
    switch(type) {
        case 'bookings':
            html = `
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Bookings</h6>
                            <h3 class="mb-0">${summary.total_bookings}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Confirmed</h6>
                            <h3 class="mb-0">${summary.confirmed_bookings}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">Pending</h6>
                            <h3 class="mb-0">${summary.pending_bookings}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6 class="card-title">Cancelled</h6>
                            <h3 class="mb-0">${summary.cancelled_bookings}</h3>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'revenue':
            html = `
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Revenue</h6>
                            <h3 class="mb-0">$${summary.total_revenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Average Daily Revenue</h6>
                            <h3 class="mb-0">$${summary.avg_daily_revenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Revenue Growth</h6>
                            <h3 class="mb-0">${summary.revenue_growth}%</h3>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        // Add more cases for other report types
    }
    
    container.innerHTML = html;
}

function displayChart(type, data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (window.reportChart) {
        window.reportChart.destroy();
    }
    
    const config = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: getChartLabel(type),
                data: data.values,
                fill: false,
                borderColor: getChartColor(type),
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (type === 'revenue') {
                                return '$' + value.toLocaleString();
                            }
                            return value;
                        }
                    }
                }
            }
        }
    };
    
    window.reportChart = new Chart(ctx, config);
}

function getChartLabel(type) {
    const labels = {
        bookings: 'Number of Bookings',
        revenue: 'Revenue',
        hotels: 'Hotel Performance',
        occupancy: 'Occupancy Rate'
    };
    return labels[type] || 'Value';
}

function getChartColor(type) {
    const colors = {
        bookings: 'rgb(13, 110, 253)',
        revenue: 'rgb(25, 135, 84)',
        hotels: 'rgb(13, 202, 240)',
        occupancy: 'rgb(255, 193, 7)'
    };
    return colors[type] || 'rgb(13, 110, 253)';
}

function displayTable(type, data) {
    const table = document.getElementById('reportTable');
    
    // Set headers
    table.querySelector('thead').innerHTML = `
        <tr>
            ${Object.keys(data[0] || {}).map(key => `
                <th>${formatColumnHeader(key)}</th>
            `).join('')}
        </tr>
    `;
    
    // Set data
    table.querySelector('tbody').innerHTML = data.map(row => `
        <tr>
            ${Object.values(row).map(value => `
                <td>${formatTableCell(value)}</td>
            `).join('')}
        </tr>
    `).join('');
}

function formatColumnHeader(key) {
    return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatTableCell(value) {
    if (typeof value === 'number') {
        if (String(value).includes('.')) {
            return '$' + value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return value.toLocaleString();
    }
    return value;
}

async function handleDownloadPDF() {
    const reportType = document.querySelector('[data-report].active').dataset.report;
    const filters = getReportFilters();
    
    try {
        const response = await fetch('/api/admin/reports/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: reportType,
                format: 'pdf',
                filters: filters
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to download PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF');
    }
}

async function handleDownloadCSV() {
    const reportType = document.querySelector('[data-report].active').dataset.report;
    const filters = getReportFilters();
    
    try {
        const response = await fetch('/api/admin/reports/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: reportType,
                format: 'csv',
                filters: filters
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to download CSV');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
    } catch (error) {
        console.error('Error downloading CSV:', error);
        alert('Failed to download CSV');
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}
