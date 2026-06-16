/**
 * ════════════════════════════════════════════════════════
 * FreshMart Manager — Core Engine & Datasets (app.js)
 * IMS566 Individual Project · UiTM Sarawak
 * ════════════════════════════════════════════════════════
 */

// ── SYSTEM DUMMY DATA POOLS ──
let stockData = [
  { id: 1, sku: 'RAW-CHKF-01', name: 'Fresh Whole Chicken', cat: 'Poultry', unit: 'kg', qty: 4, cost: 7.20, sell: 11.50, date: '2024-06-10' },
  { id: 2, sku: 'SEA-SLMN-02', name: 'Frozen Salmon Fillet', cat: 'Seafood', unit: 'pack', qty: 15, cost: 22.00, sell: 35.00, date: '2024-06-08' },
  { id: 3, sku: 'VEG-BRCL-03', name: 'Organic Broccoli', cat: 'Vegetables', unit: 'kg', qty: 3, cost: 4.50, sell: 7.90, date: '2024-06-12' },
  { id: 4, sku: 'DRY-BRWN-04', name: 'Brown Rice Premium', cat: 'Dry Goods', unit: 'bag', qty: 25, cost: 14.00, sell: 19.90, date: '2024-06-01' },
  { id: 5, sku: 'BEV-OAKM-05', name: 'Oat Milk Barista Edition', cat: 'Beverages', unit: 'carton', qty: 2, cost: 8.50, sell: 14.50, date: '2024-06-11' },
  { id: 6, sku: 'DY-CHSE-06', name: 'Cheddar Cheese Slices', cat: 'Dairy', unit: 'pack', qty: 0, cost: 6.20, sell: 9.90, date: '2024-05-28' }
];

const sampleStatements = [
  { id: 's1', type: 'Grab', name: 'GrabFood_Weekly_Statement_W23.pdf', date: '2024-06-07', size: '1.2 MB', gross: 'RM 12,450.00', commission: 'RM 3,735.00', payout: 'RM 8,715.00', topItem: 'Nasi Lemak Ayam Goreng' },
  { id: 's2', type: 'foodpanda', name: 'foodpanda_Invoicing_May2024.pdf', date: '2024-06-01', size: '840 KB', gross: 'RM 18,920.00', commission: 'RM 4,730.00', payout: 'RM 14,190.00', topItem: 'Crispy Chicken Burger' },
  { id: 's3', type: 'Shopee Food', name: 'ShopeeFood_Payout_05-06-2024.pdf', date: '2024-06-05', size: '2.1 MB', gross: 'RM 5,680.00', commission: 'RM 1,420.00', payout: 'RM 4,260.00', topItem: 'Iced Latte XL' }
];

let uploadedDocs = [];

// Chart instances
let dashWeekChart, dashCatChart, salesChart;

document.addEventListener('DOMContentLoaded', () => {
  initDateTimeUtility();
  initEventBindings();
  renderAllDataLayers();
  initCharts();
});

// ── CORE NAVIGATION ROUTER ──
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));

  const targetPage = document.getElementById(`page-${pageId}`);
  const targetLink = document.querySelector(`.sb-link[data-page="${pageId}"]`);
  
  if (targetPage) targetPage.classList.add('active');
  if (targetLink) targetLink.classList.add('active');

  const titles = { dashboard: 'Dashboard', stock: 'Stock Items', sales: 'Sales & Pricing', statements: 'Statements' };
  document.getElementById('topbar-title').textContent = titles[pageId] || 'System';

  closeMobileSidebar();
  if (pageId === 'sales') setTimeout(updateSalesChartLayout, 50);
}

// ── INTERFACE AND DRAWER LAYOUT TOGGLES ──
function toggleMobileSidebar() {
  const appShell = document.getElementById('app');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen = appShell.classList.toggle('sidebar-open');
  if (isOpen) {
    overlay.style.display = 'block';
    setTimeout(() => overlay.style.opacity = '1', 10);
  } else {
    closeMobileSidebar();
  }
}

function closeMobileSidebar() {
  const appShell = document.getElementById('app');
  const overlay = document.getElementById('sidebar-overlay');
  appShell.classList.remove('sidebar-open');
  overlay.style.opacity = '0';
  setTimeout(() => {
    if (!appShell.classList.contains('sidebar-open')) overlay.style.display = 'none';
  }, 250);
}

// ── AUTH LOGIC ENGINE ──
function doLogin() {
  const user = document.getElementById('inp-user').value.trim();
  const pass = document.getElementById('inp-pass').value.trim();
  const banner = document.getElementById('auth-error');

  if (user === 'admin' && pass === 'admin123') {
    banner.style.display = 'none';
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    setTimeout(initCharts, 100);
  } else {
    banner.style.display = 'flex';
  }
}

function doLogout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('inp-user').value = '';
  document.getElementById('inp-pass').value = '';
}

// ── DATA VIEW INJECTION LAYERS ──
function renderAllDataLayers() {
  renderStockTable();
  renderLowStockAlerts();
  renderPricingTable();
  renderSampleStatements();
  renderUploadedDocuments();
}

function renderStockTable(filtered = stockData) {
  const tbody = document.getElementById('stock-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  filtered.forEach(item => {
    let statusClass = 'status-tag status-ok';
    let statusTxt = 'In Stock';
    if (item.qty === 0) { statusClass = 'status-tag status-out'; statusTxt = 'Out of Stock'; }
    else if (item.qty <= 5) { statusClass = 'status-tag status-low'; statusTxt = 'Low Stock'; }

    tbody.innerHTML += `
      <tr>
        <td><span class="sku-lbl">${item.sku || 'N/A'}</span></td>
        <td><span class="fw-med">${item.name}</span></td>
        <td>${item.cat}</td>
        <td>${item.unit}</td>
        <td class="tar ${item.qty <= 5 ? 'clr-red fw-bold' : ''}">${item.qty}</td>
        <td class="tar">RM ${item.cost.toFixed(2)}</td>
        <td class="tar fw-med">RM ${item.sell.toFixed(2)}</td>
        <td>${item.date || '—'}</td>
        <td class="tac"><span class="${statusClass}">${statusTxt}</span></td>
        <td class="tac">
          <div class="row-actions">
            <button class="btn-icon-action" onclick="openStockModal(${item.id})" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="btn-icon-action text-red" onclick="deleteStockItem(${item.id})" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </td>
      </tr>`;
  });

  document.getElementById('stock-count-label').textContent = `Showing ${filtered.length} of ${stockData.length} items`;
}

function renderLowStockAlerts() {
  const container = document.getElementById('low-stock-alerts');
  if (!container) return;
  container.innerHTML = '';

  const lowItems = stockData.filter(i => i.qty <= 5);
  if (lowItems.length === 0) {
    container.innerHTML = '<p class="page-sub">All products are healthy and adequately stocked.</p>';
    return;
  }

  lowItems.forEach(item => {
    container.innerHTML += `
      <div class="alert-item">
        <div class="alert-item-left">
          <div class="alert-dot"></div>
          <div><p class="alert-item-title">${item.name} <span class="sku-lbl">${item.sku}</span></p><p class="card-sub">${item.cat} · Last restocked ${item.date}</p></div>
        </div>
        <div class="alert-item-right"><span class="alert-qty-badge">${item.qty} ${item.unit} left</span></div>
      </div>`;
  });
}

function renderPricingTable() {
  const tbody = document.getElementById('pricing-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  stockData.forEach(item => {
    const margin = item.sell - item.cost;
    const marginPct = item.sell > 0 ? ((margin / item.sell) * 100).toFixed(1) : 0;
    const itemsSoldFake = Math.floor(Math.random() * 80) + 10;
    const revFake = itemsSoldFake * item.sell;

    tbody.innerHTML += `
      <tr>
        <td><span class="fw-med">${item.name}</span></td>
        <td>${item.cat}</td>
        <td class="tar">RM ${item.cost.toFixed(2)}</td>
        <td class="tar fw-med clr-blue">RM ${item.sell.toFixed(2)}</td>
        <td class="tar text-green fw-bold">RM ${margin.toFixed(2)} (${marginPct}%)</td>
        <td class="tar">${itemsSoldFake}</td>
        <td class="tar fw-med">RM ${revFake.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      </tr>`;
  });
}

// ── FILTER ACTIONS ──
function filterStock() {
  const search = document.getElementById('stock-search').value.toLowerCase();
  const cat = document.getElementById('stock-cat-filter').value;
  const status = document.getElementById('stock-status-filter').value;

  const res = stockData.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search) || item.sku.toLowerCase().includes(search);
    const matchCat = cat === '' || item.cat === cat;
    
    let matchStatus = true;
    if (status === 'In Stock') matchStatus = item.qty > 5;
    else if (status === 'Low Stock') matchStatus = item.qty > 0 && item.qty <= 5;
    else if (status === 'Out of Stock') matchStatus = item.qty === 0;

    return matchSearch && matchCat && matchStatus;
  });

  renderStockTable(res);
}

// ── STOCK OPERATION MODALS ──
function openStockModal(id = null) {
  const modal = document.getElementById('stock-modal');
  const mTitle = document.getElementById('modal-title');
  modal.style.display = 'flex';

  if (id) {
    mTitle.textContent = 'Edit Stock Item';
    const item = stockData.find(i => i.id === id);
    document.getElementById('modal-edit-id').value = id;
    document.getElementById('m-name').value = item.name;
    document.getElementById('m-sku').value = item.sku;
    document.getElementById('m-cat').value = item.cat;
    document.getElementById('m-unit').value = item.unit;
    document.getElementById('m-qty').value = item.qty;
    document.getElementById('m-cost').value = item.cost;
    document.getElementById('m-sell').value = item.sell;
    document.getElementById('m-date').value = item.date;
  } else {
    mTitle.textContent = 'Add Stock Item';
    document.getElementById('modal-edit-id').value = '';
    document.getElementById('m-name').value = '';
    document.getElementById('m-sku').value = 'SKU-' + Math.floor(Math.random() * 900 + 100);
    document.getElementById('m-cat').value = '';
    document.getElementById('m-unit').value = 'kg';
    document.getElementById('m-qty').value = '';
    document.getElementById('m-cost').value = '';
    document.getElementById('m-sell').value = '';
    document.getElementById('m-date').value = new Date().toISOString().split('T')[0];
  }
}

function closeStockModal() {
  document.getElementById('stock-modal').style.display = 'none';
}

function saveStockItem() {
  const id = document.getElementById('modal-edit-id').value;
  const name = document.getElementById('m-name').value.trim();
  const sku = document.getElementById('m-sku').value.trim();
  const cat = document.getElementById('m-cat').value;
  const unit = document.getElementById('m-unit').value.trim();
  const qty = parseInt(document.getElementById('m-qty').value);
  const cost = parseFloat(document.getElementById('m-cost').value);
  const sell = parseFloat(document.getElementById('m-sell').value);
  const date = document.getElementById('m-date').value;

  if (!name || !cat || isNaN(qty) || isNaN(cost) || isNaN(sell)) {
    showToast('Please fulfill all parameters marked with *', 'warn');
    return;
  }

  if (id) {
    let item = stockData.find(i => i.id == id);
    Object.assign(item, { name, sku, cat, unit, qty, cost, sell, date });
    showToast('Inventory database updated successfully');
  } else {
    const newId = stockData.length > 0 ? Math.max(...stockData.map(i => i.id)) + 1 : 1;
    stockData.push({ id: newId, sku, name, cat, unit, qty, cost, sell, date });
    showToast('New dynamic retail item added');
  }

  closeStockModal();
  renderAllDataLayers();
  updateCharts();
}

function deleteStockItem(id) {
  if (confirm('Are you sure you want to delete this inventory record?')) {
    stockData = stockData.filter(i => i.id !== id);
    showToast('Inventory entry removed');
    renderAllDataLayers();
    updateCharts();
  }
}

// ── STATEMENTS PROCESSING AREA ──
function renderSampleStatements() {
  const container = document.getElementById('sample-docs');
  if (!container) return;
  container.innerHTML = '';

  sampleStatements.forEach(doc => {
    container.innerHTML += `
      <div class="doc-card" onclick="viewStatementSummary('${doc.id}', true)">
        <div class="doc-card-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <div class="doc-card-info">
          <p class="doc-card-name">${doc.name}</p>
          <p class="card-sub">${doc.type} · ${doc.date} · ${doc.size}</p>
        </div>
      </div>`;
  });
}

function renderUploadedDocuments() {
  const container = document.getElementById('docs-list');
  if (!container) return;
  
  if (uploadedDocs.length === 0) {
    container.innerHTML = '<p class="page-sub" style="grid-column: 1/-1;text-align:center;padding:2rem;background:#f8fafc;border-radius:0.75rem;border:1px dashed #e2e8f0">No custom vendor receipts uploaded yet.</p>';
    return;
  }
  
  container.innerHTML = '';
  uploadedDocs.forEach(doc => {
    container.innerHTML += `
      <div class="doc-card animated-fade" onclick="viewStatementSummary('${doc.id}', false)">
        <div class="doc-card-icon style-custom-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <div class="doc-card-info">
          <p class="doc-card-name">${doc.name}</p>
          <p class="card-sub">Parsed Invoice · ${doc.date} · ${doc.size}</p>
        </div>
      </div>`;
  });
}

function viewStatementSummary(id, isSample = true) {
  const doc = isSample ? sampleStatements.find(s => s.id === id) : uploadedDocs.find(u => u.id === id);
  if (!doc) return;

  const body = `
    <div class="summary-grid">
      <div class="summary-item"><p class="summary-lbl">Gross Sales</p><p class="summary-val clr-blue">${doc.gross}</p></div>
      <div class="summary-item"><p class="summary-lbl">Platform Commission</p><p class="summary-val clr-red">${doc.commission}</p></div>
      <div class="summary-item"><p class="summary-lbl">Net Payout</p><p class="summary-val clr-green fw-med">${doc.payout}</p></div>
      <div class="summary-item"><p class="summary-lbl">Top Selling Item</p><p class="summary-val">${doc.topItem}</p></div>
    </div>`;

  document.getElementById('summary-title').textContent = doc.name + ' — Summary';
  document.getElementById('summary-body').innerHTML = body;
  
  const target = document.getElementById('statement-summary');
  target.style.display = 'block';
  target.scrollIntoView({ behavior: 'smooth' });
}

function handleFileUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  const file = files[0];
  const fakeDoc = {
    id: 'u_' + Date.now(),
    name: file.name,
    date: new Date().toISOString().split('T')[0],
    size: (file.size / 1024).toFixed(0) + ' KB',
    gross: 'RM ' + (Math.random() * 8000 + 1000).toFixed(2),
    commission: 'RM ' + (Math.random() * 1500 + 200).toFixed(2),
    payout: 'RM ' + (Math.random() * 6000 + 800).toFixed(2),
    topItem: 'Assorted Local Food Orders'
  };

  uploadedDocs.push(fakeDoc);
  showToast('Document statement parsed and imported');
  renderUploadedDocuments();
}

// ── ANALYTICS CHART ENGINE ──
function initCharts() {
  const ctxWeek = document.getElementById('dashWeekChart');
  const ctxCat = document.getElementById('dashCatChart');
  const ctxSales = document.getElementById('salesChart');

  if (!ctxWeek || !ctxCat || !ctxSales) return;

  // Week Chart
  dashWeekChart = new Chart(ctxWeek, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Revenue (RM)', data: [1850, 2100, 1980, 2340, 2800, 3400, 3100], borderColor: '#0ea5e9', tension: 0.3, fill: true, backgroundColor: 'rgba(14,165,233,0.05)' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Category Chart
  const categories = [...new Set(stockData.map(i => i.cat))];
  const catCounts = categories.map(c => stockData.filter(i => i.cat === c).length);

  dashCatChart = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{ data: catCounts, backgroundColor: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Sales Page Chart
  salesChart = new Chart(ctxSales, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ label: 'Revenue', data: [1850, 2100, 1980, 2340, 2800, 3400, 3100], backgroundColor: '#3b82f6' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function updateCharts() {
  if (!dashCatChart) return;
  const categories = [...new Set(stockData.map(i => i.cat))];
  const catCounts = categories.map(c => stockData.filter(i => i.cat === c).length);
  dashCatChart.data.labels = categories;
  dashCatChart.data.datasets[0].data = catCounts;
  dashCatChart.update();
}

function switchPeriod(period, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (!salesChart) return;
  if (period === 'today') {
    salesChart.data.labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    salesChart.data.datasets[0].data = [200, 450, 610, 320, 210, 400, 150];
  } else if (period === 'weekly') {
    salesChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    salesChart.data.datasets[0].data = [1850, 2100, 1980, 2340, 2800, 3400, 3100];
  } else if (period === 'monthly') {
    salesChart.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    salesChart.data.datasets[0].data = [12400, 14100, 11800, 14820];
  }
  salesChart.update();
}

function updateSalesChartLayout() { if (salesChart) salesChart.resize(); }

// ── UTILITIES AND TOWEL BINDINGS ──
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function initDateTimeUtility() {
  const container = document.getElementById('topbar-date');
  if (container) container.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function initEventBindings() {
  // Navigation Links
  document.querySelectorAll('.sb-link').forEach(link => {
    link.addEventListener('click', () => goTo(link.getAttribute('data-page')));
  });

  // Action Binds
  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('logout-btn').addEventListener('click', doLogout);
  document.getElementById('hamburger-btn').addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);
  document.getElementById('pw-toggle-btn').addEventListener('click', function() {
    const field = this.previousElementSibling;
    field.type = field.type === 'password' ? 'text' : 'password';
  });

  // Modals & Forms
  document.getElementById('dash-manage-btn').addEventListener('click', () => goTo('stock'));
  document.getElementById('add-item-btn').addEventListener('click', () => openStockModal());
  document.getElementById('modal-close-btn').addEventListener('click', closeStockModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeStockModal);
  document.getElementById('modal-save-btn').addEventListener('click', saveStockItem);
  document.getElementById('close-summary-btn').addEventListener('click', () => { document.getElementById('statement-summary').style.display = 'none'; });

  // Input Listeners
  document.getElementById('stock-search').addEventListener('input', filterStock);
  document.getElementById('stock-cat-filter').addEventListener('change', filterStock);
  document.getElementById('stock-status-filter').addEventListener('change', filterStock);
  document.getElementById('pdf-input').addEventListener('change', handleFileUpload);
  document.getElementById('upload-zone').addEventListener('click', () => document.getElementById('pdf-input').click());

  // Sales switcher
  document.getElementById('period-switcher-wrap').addEventListener('click', (e) => {
    if (e.target.classList.contains('period-btn')) {
      switchPeriod(e.target.getAttribute('data-period'), e.target);
    }
  });
}