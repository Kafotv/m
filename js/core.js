const CURRENCY_CONFIG = {
    ILS: { symbol: '₪', decimal: 2 },
    USD: { symbol: '$', decimal: 2 },
    JOD: { symbol: 'د.أ', decimal: 3 }
};

const DEFAULT_CATEGORIES = [
    { id: 'goods', label: 'بضائع ومشتريات', color: '#f59e0b' },
    { id: 'trans', label: 'مواصلات وشحن', color: '#06b6d4' },
    { id: 'bank', label: 'إيداع بنكي / رأس مال', color: '#10b981' },
    { id: 'other', label: 'مصاريف أخرى', color: '#4f46e5' }
];

let state = {
    expenses: [], suppliers: [], deliveryCompanies: [], categories: [],
    theme: 'light', formType: 'expense', activeCurrency: 'ILS',
    editId: null, editSupplierId: null, editDeliveryId: null, displayLimit: 50
};

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggle');
const expenseForm = document.getElementById('expenseForm');
const expTitle = document.getElementById('expTitle');
const expCategory = document.getElementById('expCategory');
const expAmount = document.getElementById('expAmount');
const expCurrency = document.getElementById('expCurrency');
const expDate = document.getElementById('expDate');
const expNotes = document.getElementById('expNotes');
const expSupplier = document.getElementById('expSupplier');
const expPayMethod = document.getElementById('expPayMethod');
const payMethodGroup = document.getElementById('payMethodGroup');
const supplierRelationGroup = document.getElementById('supplierRelationGroup');
const expDelivery = document.getElementById('expDelivery');
const expCollectMethod = document.getElementById('expCollectMethod');
const collectMethodGroup = document.getElementById('collectMethodGroup');
const deliveryRelationGroup = document.getElementById('deliveryRelationGroup');
const typeExpenseBtn = document.getElementById('typeExpenseBtn');
const typeIncomeBtn = document.getElementById('typeIncomeBtn');
const walletRemainingEl = document.getElementById('walletRemaining');
const walletExpenseEl = document.getElementById('walletExpense');
const walletGoodsEl = document.getElementById('walletGoods');
const walletTransEl = document.getElementById('walletTrans');
const statCurIlsBtn = document.getElementById('statCurIls');
const statCurUsdBtn = document.getElementById('statCurUsd');
const statCurJodBtn = document.getElementById('statCurJod');
const goodsPercentEl = document.getElementById('goodsPercent');
const transPercentEl = document.getElementById('transPercent');
const bankPercentEl = document.getElementById('bankPercent');
const totalCountEl = document.getElementById('totalCount');
const chartContainer = document.getElementById('chartContainer');
const chartCurrencyIlsBtn = document.getElementById('chartCurrencyIls');
const chartCurrencyUsdBtn = document.getElementById('chartCurrencyUsd');
const chartCurrencyJodBtn = document.getElementById('chartCurrencyJod');
const searchInput = document.getElementById('searchInput');
const quickDateFilter = document.getElementById('quickDateFilter');
const specificMonthInputContainer = document.getElementById('specificMonthInputContainer');
const filterMonth = document.getElementById('filterMonth');
const customDateRangeInputs = document.getElementById('customDateRangeInputs');
const filterStartDate = document.getElementById('filterStartDate');
const filterEndDate = document.getElementById('filterEndDate');
const filteredIncomeTotal = document.getElementById('filteredIncomeTotal');
const filteredExpenseTotal = document.getElementById('filteredExpenseTotal');
const filteredNetTotal = document.getElementById('filteredNetTotal');
const expenseTableBody = document.getElementById('expenseTableBody');
const emptyState = document.getElementById('emptyState');
const supplierForm = document.getElementById('supplierForm');
const supName = document.getElementById('supName');
const supPhone = document.getElementById('supPhone');
const suppliersGrid = document.getElementById('suppliersGrid');
const supplierModal = document.getElementById('supplierModal');
const openSupModalBtn = document.getElementById('openSupModalBtn');
const closeSupModalBtn = document.getElementById('closeSupModalBtn');
const deliveryForm = document.getElementById('deliveryForm');
const delName = document.getElementById('delName');
const delPhone = document.getElementById('delPhone');
const deliveryGrid = document.getElementById('deliveryGrid');
const deliveryModal = document.getElementById('deliveryModal');
const openDelModalBtn = document.getElementById('openDelModalBtn');
const closeDelModalBtn = document.getElementById('closeDelModalBtn');
const addCategoryForm = document.getElementById('addCategoryForm');
const newCatLabel = document.getElementById('newCatLabel');
const newCatColor = document.getElementById('newCatColor');
const categoriesManagerList = document.getElementById('categoriesManagerList');
const statementModal = document.getElementById('statementModal');
const modalTitle = document.getElementById('modalTitle');
const modalTableBody = document.getElementById('modalTableBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const transactionModal = document.getElementById('transactionModal');
const openTxModalBtn = document.getElementById('openTxModalBtn');
const openTxModalBtnMobile = document.getElementById('openTxModalBtnMobile');
const closeTxModalBtn = document.getElementById('closeTxModalBtn');
const txDetailModal = document.getElementById('txDetailModal');
const closeTxDetailModalBtn = document.getElementById('closeTxDetailModalBtn');
const editTxFromDetailBtn = document.getElementById('editTxFromDetailBtn');
const printTxInvoiceBtn = document.getElementById('printTxInvoiceBtn');
const txDetailsBody = document.getElementById('txDetailsBody');
const resetAllDataBtn = document.getElementById('resetAllDataBtn');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFile');
const customConfirmModal = document.getElementById('customConfirmModal');
const confirmIcon = document.getElementById('confirmIcon');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

function formatCurrency(amount, currency) {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.ILS;
    return amount.toLocaleString('en-US', { minimumFractionDigits: config.decimal, maximumFractionDigits: config.decimal }) + ' ' + config.symbol;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function loadStateLocal() {
    const savedExp = localStorage.getItem('project_expenses_multi_currency_v2');
    const savedSup = localStorage.getItem('project_expenses_suppliers');
    const savedDel = localStorage.getItem('project_expenses_delivery_companies');
    const savedCat = localStorage.getItem('project_expenses_categories');
    if (savedExp) { try { state.expenses = JSON.parse(savedExp); } catch(e) { state.expenses = []; } }
    if (savedSup) { try { state.suppliers = JSON.parse(savedSup); } catch(e) { state.suppliers = []; } }
    if (savedDel) { try { state.deliveryCompanies = JSON.parse(savedDel); } catch(e) { state.deliveryCompanies = []; } }
    if (savedCat) { try { state.categories = JSON.parse(savedCat); } catch(e) { state.categories = DEFAULT_CATEGORIES; } }
    else { state.categories = DEFAULT_CATEGORIES; }
}

function expenseToDb(item) {
    return { id: item.id, title: item.title, type: item.type, category: item.category,
        supplier_id: item.supplierId || null, pay_method: item.payMethod || null,
        delivery_company_id: item.deliveryCompanyId || null, collect_method: item.collectMethod || null,
        amount: item.amount, currency: item.currency, date: item.date, notes: item.notes || null };
}

function dbToExpense(row) {
    return { id: row.id, title: row.title, type: row.type, category: row.category,
        supplierId: row.supplier_id || null, payMethod: row.pay_method || null,
        deliveryCompanyId: row.delivery_company_id || null, collectMethod: row.collect_method || null,
        amount: parseFloat(row.amount), currency: row.currency, date: row.date, notes: row.notes || '' };
}

async function saveSuppliers() {
    localStorage.setItem('project_expenses_suppliers', JSON.stringify(state.suppliers));
    if (!window.supabaseClient) return;
    for (const sup of state.suppliers) {
        const { error } = await window.supabaseClient.from('suppliers').upsert({ id: sup.id, name: sup.name, phone: sup.phone || null });
        if (error) { showSupabaseError('saveSuppliers', error); return; }
    }
}

async function saveDeliveryCompanies() {
    localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(state.deliveryCompanies));
    if (!window.supabaseClient) return;
    for (const del of state.deliveryCompanies) {
        const { error } = await window.supabaseClient.from('delivery_companies').upsert({ id: del.id, name: del.name, phone: del.phone || null });
        if (error) { showSupabaseError('saveDeliveryCompanies', error); return; }
    }
}

async function saveCategories() {
    localStorage.setItem('project_expenses_categories', JSON.stringify(state.categories));
    if (!window.supabaseClient) return;
    for (const cat of state.categories) {
        const { error } = await window.supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color });
        if (error) { showSupabaseError('saveCategories', error); return; }
    }
}

async function saveState() {
    localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses));
    if (!window.supabaseClient) return;
    const dbRows = state.expenses.map(expenseToDb);
    for (const row of dbRows) {
        const { error } = await window.supabaseClient.from('expenses').upsert(row);
        if (error) { showSupabaseError('saveState/expenses', error); return; }
    }
}

function showSupabaseError(operation, err) {
    const msg = (err && err.message) ? err.message : JSON.stringify(err);
    console.error(`Supabase [${operation}] failed:`, err);
    showCustomAlert(`⚠️ خطأ في حفظ البيانات على السحاب (${operation}):\n${msg}\n\nتم الحفظ محلياً فقط.`, 'warning');
}

const SoundEffects = {
    ctx: null,
    init() {
        if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        if (this.ctx && this.ctx.state === 'suspended') { this.ctx.resume(); }
    },
    play(type) {
        try {
            this.init(); if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;
            if (type === 'add') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(320, now); osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
                gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
            } else if (type === 'delete') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(380, now); osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
                gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
            } else if (type === 'edit') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(450, now); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
                setTimeout(() => {
                    if (!this.ctx || this.ctx.state === 'suspended') return;
                    const osc2 = this.ctx.createOscillator(); const gain2 = this.ctx.createGain();
                    osc2.connect(gain2); gain2.connect(this.ctx.destination);
                    osc2.type = 'sine'; osc2.frequency.setValueAtTime(560, this.ctx.currentTime);
                    gain2.gain.setValueAtTime(0.1, this.ctx.currentTime); gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                    osc2.start(this.ctx.currentTime); osc2.stop(this.ctx.currentTime + 0.08);
                }, 90);
            } else if (type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now); osc.stop(now + 0.04);
            } else if (type === 'alert') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(240, now); osc.frequency.setValueAtTime(290, now + 0.08);
                gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
            }
        } catch (e) { console.warn('AudioContext not allowed or failed:', e); }
    }
};
