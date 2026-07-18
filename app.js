// Currency Config
const CURRENCY_CONFIG = {
    ILS: { symbol: '₪', decimal: 2 },
    USD: { symbol: '$', decimal: 2 },
    JOD: { symbol: 'د.أ', decimal: 3 }
};

// Default Categories
const DEFAULT_CATEGORIES = [
    { id: 'goods', label: 'بضائع ومشتريات', color: '#f59e0b' },
    { id: 'trans', label: 'مواصلات وشحن', color: '#06b6d4' },
    { id: 'bank', label: 'إيداع بنكي / رأس مال', color: '#10b981' },
    { id: 'other', label: 'مصاريف أخرى', color: '#4f46e5' }
];

// Sound Effects Synthesizer using Web Audio API (Offline & Asset-free)
const SoundEffects = {
    ctx: null,
    
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    play(type) {
        try {
            this.init();
            if (!this.ctx) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            const now = this.ctx.currentTime;
            
            if (type === 'add') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'delete') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(380, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'edit') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                
                setTimeout(() => {
                    if (!this.ctx || this.ctx.state === 'suspended') return;
                    const osc2 = this.ctx.createOscillator();
                    const gain2 = this.ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(this.ctx.destination);
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(560, this.ctx.currentTime);
                    gain2.gain.setValueAtTime(0.1, this.ctx.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                    osc2.start(this.ctx.currentTime);
                    osc2.stop(this.ctx.currentTime + 0.08);
                }, 90);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
            } else if (type === 'alert') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.setValueAtTime(290, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch (e) {
            console.warn('AudioContext not allowed or failed:', e);
        }
    }
};

// Supabase Client Globals
let supabaseClient = null;

function initSupabase() {
    let url = localStorage.getItem('project_expenses_supabase_url');
    let key = localStorage.getItem('project_expenses_supabase_key');
    
    // Default fallback to user's provided project credentials
    if (!url || !key) {
        url = "https://snkpqtvnsglqvkigjwvt.supabase.co";
        key = "sb_publishable_8l4J7jPYWDRARswtNj8HxA_2nzjrLBT";
        localStorage.setItem('project_expenses_supabase_url', url);
        localStorage.setItem('project_expenses_supabase_key', key);
    }

    const statusEl = document.getElementById('supabaseConnectionStatus');
    const syncContainer = document.getElementById('supabaseSyncContainer');
    const disconnectBtn = document.getElementById('disconnectSupabaseBtn');
    const inputUrl = document.getElementById('supabaseUrl');
    const inputKey = document.getElementById('supabaseKey');

    if (url && key) {
        try {
            if (typeof supabase !== 'undefined') {
                supabaseClient = supabase.createClient(url, key);
                if (statusEl) {
                    statusEl.className = 'badge';
                    statusEl.style.background = 'var(--success-light)';
                    statusEl.style.color = 'var(--success)';
                    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> متصل بالسحاب (سوبابيز)`;
                }
                if (syncContainer) syncContainer.style.display = 'block';
                if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
                if (inputUrl) inputUrl.value = url;
                if (inputKey) inputKey.value = key;
            } else {
                throw new Error('Supabase SDK not loaded');
            }
        } catch (e) {
            console.error('Failed to init Supabase:', e);
            if (statusEl) {
                statusEl.className = 'badge';
                statusEl.style.background = 'var(--danger-light)';
                statusEl.style.color = 'var(--danger)';
                statusEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> فشل الاتصال بالسحاب`;
            }
        }
    } else {
        supabaseClient = null;
        if (statusEl) {
            statusEl.className = 'badge';
            statusEl.style.background = 'rgba(100, 116, 139, 0.15)';
            statusEl.style.color = 'var(--text-secondary)';
            statusEl.innerHTML = `<i class="fa-solid fa-circle-question"></i> غير متصل بالسحاب (يعمل محلياً فقط)`;
        }
        if (syncContainer) syncContainer.style.display = 'none';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
        if (inputUrl) inputUrl.value = '';
        if (inputKey) inputKey.value = '';
    }
}

function setupSupabaseConfig() {
    const form = document.getElementById('supabaseConfigForm');
    const disconnectBtn = document.getElementById('disconnectSupabaseBtn');
    const syncBtn = document.getElementById('syncLocalToSupabaseBtn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('supabaseUrl').value.trim();
            const key = document.getElementById('supabaseKey').value.trim();

            if (!url || !key) {
                showCustomAlert('الرجاء إدخال الرابط والمفتاح العام بشكل صحيح.', 'error');
                return;
            }

            try {
                const testClient = supabase.createClient(url, key);
                const { data, error } = await testClient.from('categories').select('id').limit(1);
                if (error) throw error;

                localStorage.setItem('project_expenses_supabase_url', url);
                localStorage.setItem('project_expenses_supabase_key', key);
                
                showCustomAlert('تم الاتصال بقاعدة بيانات Supabase بنجاح!', 'success');
                initSupabase();
                
                await loadState();
                render();
            } catch (err) {
                console.error('Connection test failed:', err);
                showCustomAlert('فشل الاتصال: الرجاء التأكد من صحة الرابط والمفتاح العام، وأن الجداول تم إنشاؤها بشكل سليم.', 'error');
            }
        });
    }

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            showCustomConfirm({
                title: 'قطع الاتصال السحابي',
                message: 'هل أنت متأكد من قطع الاتصال بـ Supabase والرجوع للتخزين المحلي فقط؟ (لن يتم مسح أي بيانات سحابية)',
                iconClass: 'fa-solid fa-link-slash',
                iconColor: 'var(--warning)',
                onConfirm: async () => {
                    localStorage.removeItem('project_expenses_supabase_url');
                    localStorage.removeItem('project_expenses_supabase_key');
                    initSupabase();
                    await loadState();
                    render();
                    showCustomAlert('تم قطع الاتصال والتحويل للتخزين المحلي بنجاح.', 'success');
                }
            });
        });
    }

    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            if (!supabaseClient) return;

            showCustomConfirm({
                title: 'رفع ومزامنة البيانات',
                message: 'هل تريد رفع كافة الموردين والشركات والعمليات والتصنيفات المخزنة حالياً في هذا الجهاز إلى قاعدة البيانات السحابية؟ (سيتم دمجها مع البيانات السحابية الحالية)',
                iconClass: 'fa-solid fa-cloud-arrow-up',
                iconColor: 'var(--primary)',
                onConfirm: async () => {
                    try {
                        if (state.categories.length > 0) {
                            const { error: catErr } = await supabaseClient.from('categories').upsert(state.categories);
                            if (catErr) throw catErr;
                        }
                        if (state.suppliers.length > 0) {
                            const { error: supErr } = await supabaseClient.from('suppliers').upsert(state.suppliers);
                            if (supErr) throw supErr;
                        }
                        if (state.deliveryCompanies.length > 0) {
                            const { error: delErr } = await supabaseClient.from('delivery_companies').upsert(state.deliveryCompanies);
                            if (delErr) throw delErr;
                        }
                        if (state.expenses.length > 0) {
                            const { error: expErr } = await supabaseClient.from('expenses').upsert(state.expenses);
                            if (expErr) throw expErr;
                        }

                        showCustomAlert('تمت المزامنة ورفع كافة البيانات المحلية إلى السحاب بنجاح!', 'success');
                        await loadState();
                        render();
                    } catch (e) {
                        console.error('Sync failed:', e);
                        showCustomAlert('حدث خطأ أثناء مزامنة البيانات: ' + e.message, 'error');
                    }
                }
            });
        });
    }
}

// App State
let state = {
    expenses: [],
    suppliers: [],
    deliveryCompanies: [],
    categories: [],
    theme: 'light',
    formType: 'expense',
    activeCurrency: 'ILS', // Master currency
    editId: null, // Transaction ID being edited
    editSupplierId: null, // Supplier ID being edited
    editDeliveryId: null, // Delivery Company ID being edited
    displayLimit: 50 // Limit of transactions to render at once
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

// Dynamic form relation groups
const expSupplier = document.getElementById('expSupplier');
const expPayMethod = document.getElementById('expPayMethod');
const payMethodGroup = document.getElementById('payMethodGroup');
const supplierRelationGroup = document.getElementById('supplierRelationGroup');

const expDelivery = document.getElementById('expDelivery');
const expCollectMethod = document.getElementById('expCollectMethod');
const collectMethodGroup = document.getElementById('collectMethodGroup');
const deliveryRelationGroup = document.getElementById('deliveryRelationGroup');

// Type Switcher Buttons
const typeExpenseBtn = document.getElementById('typeExpenseBtn');
const typeIncomeBtn = document.getElementById('typeIncomeBtn');

// Consolidated Wallet Card Elements
const walletRemainingEl = document.getElementById('walletRemaining');
const walletExpenseEl = document.getElementById('walletExpense');
const walletGoodsEl = document.getElementById('walletGoods');
const walletTransEl = document.getElementById('walletTrans');

// Wallet Tabs
const statCurIlsBtn = document.getElementById('statCurIls');
const statCurUsdBtn = document.getElementById('statCurUsd');
const statCurJodBtn = document.getElementById('statCurJod');

// Chart & Quick Insights Elements
const goodsPercentEl = document.getElementById('goodsPercent');
const transPercentEl = document.getElementById('transPercent');
const bankPercentEl = document.getElementById('bankPercent');
const totalCountEl = document.getElementById('totalCount');
const chartContainer = document.getElementById('chartContainer');

// Chart Currency Toggles (Sync with wallet)
const chartCurrencyIlsBtn = document.getElementById('chartCurrencyIls');
const chartCurrencyUsdBtn = document.getElementById('chartCurrencyUsd');
const chartCurrencyJodBtn = document.getElementById('chartCurrencyJod');

// Search & Advanced Filters
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

// Suppliers UI & Slide-up Modal
const supplierForm = document.getElementById('supplierForm');
const supName = document.getElementById('supName');
const supPhone = document.getElementById('supPhone');
const suppliersGrid = document.getElementById('suppliersGrid');
const supplierModal = document.getElementById('supplierModal');
const openSupModalBtn = document.getElementById('openSupModalBtn');
const closeSupModalBtn = document.getElementById('closeSupModalBtn');

// Delivery UI & Slide-up Modal
const deliveryForm = document.getElementById('deliveryForm');
const delName = document.getElementById('delName');
const delPhone = document.getElementById('delPhone');
const deliveryGrid = document.getElementById('deliveryGrid');
const deliveryModal = document.getElementById('deliveryModal');
const openDelModalBtn = document.getElementById('openDelModalBtn');
const closeDelModalBtn = document.getElementById('closeDelModalBtn');

// Category Manager UI
const addCategoryForm = document.getElementById('addCategoryForm');
const newCatLabel = document.getElementById('newCatLabel');
const newCatColor = document.getElementById('newCatColor');
const categoriesManagerList = document.getElementById('categoriesManagerList');

// Modal Elements
const statementModal = document.getElementById('statementModal');
const modalTitle = document.getElementById('modalTitle');
const modalTableBody = document.getElementById('modalTableBody');
const closeModalBtn = document.getElementById('closeModalBtn');

// Add Transaction Modal (Slide up sheet / popup)
const transactionModal = document.getElementById('transactionModal');
const openTxModalBtn = document.getElementById('openTxModalBtn');
const openTxModalBtnMobile = document.getElementById('openTxModalBtnMobile');
const closeTxModalBtn = document.getElementById('closeTxModalBtn');

// Transaction Detail Modal DOM Elements
const txDetailModal = document.getElementById('txDetailModal');
const closeTxDetailModalBtn = document.getElementById('closeTxDetailModalBtn');
const editTxFromDetailBtn = document.getElementById('editTxFromDetailBtn');
const printTxInvoiceBtn = document.getElementById('printTxInvoiceBtn');
const txDetailsBody = document.getElementById('txDetailsBody');

// Reset Button
const resetAllDataBtn = document.getElementById('resetAllDataBtn');

// Backup & Tools
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFile');

// Custom Confirm/Alert Modal DOM Elements
const customConfirmModal = document.getElementById('customConfirmModal');
const confirmIcon = document.getElementById('confirmIcon');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    expDate.value = today;

    // 1️⃣ تحميل فوري من localStorage بدون انتظار
    loadStateLocal();

    // 2️⃣ إعداد كل الواجهة فوراً
    initTheme();
    setupFormTypeToggles();
    setupNavigation();
    setupCurrencyToggles();
    setupSupplierForm();
    setupDeliveryForm();
    setupCategoryManager();
    setupModalEvents();
    setupTxModalEvents();
    setupPartnerModalsEvents();
    setupResetButton();
    setupFilterEvents();
    setupTxDetailModalEvents();
    setupStatementFilterEvents();
    setupSupabaseConfig();

    // Listener to show payment mode when supplier is selected
    expSupplier.addEventListener('change', () => {
        if (expSupplier.value) {
            payMethodGroup.style.display = 'block';
            expPayMethod.required = true;
        } else {
            payMethodGroup.style.display = 'none';
            expPayMethod.required = false;
        }
    });

    // Listener to show collection status when delivery company is selected
    expDelivery.addEventListener('change', () => {
        if (expDelivery.value) {
            collectMethodGroup.style.display = 'block';
            expCollectMethod.required = true;
        } else {
            collectMethodGroup.style.display = 'none';
            expCollectMethod.required = false;
        }
    });

    // Setup global interaction sounds
    document.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.nav-item') || e.target.closest('.nav-btn')) {
            const isIgnored = e.target.closest('.action-btn') || 
                              e.target.closest('.delete-sup-btn') || 
                              e.target.closest('.edit-sup-btn') || 
                              e.target.closest('#confirmYesBtn') || 
                              e.target.closest('#confirmNoBtn') ||
                              e.target.closest('form button[type="submit"]');
            if (!isIgnored) {
                SoundEffects.play('click');
            }
        }
    });

    // 3️⃣ رسم فوري من localStorage
    render();

    // 4️⃣ مزامنة Supabase في الخلفية بدون تجميد الواجهة
    initSupabase();
    syncWithSupabaseBackground();
});

// تحميل فوري من localStorage فقط (بدون Supabase)
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

// مزامنة Supabase في الخلفية - السحاب هو المصدر الأساسي
async function syncWithSupabaseBackground() {
    if (!supabaseClient) return;
    try {
        const { data: cats, error: catErr } = await supabaseClient.from('categories').select('*');
        const { data: sups, error: supErr } = await supabaseClient.from('suppliers').select('*');
        const { data: dels, error: delErr } = await supabaseClient.from('delivery_companies').select('*');
        const { data: exps, error: expErr } = await supabaseClient.from('expenses').select('*').order('date', { ascending: false });

        const hasCloudData = (cats && cats.length > 0) || (sups && sups.length > 0) ||
                             (dels && dels.length > 0) || (exps && exps.length > 0);

        if (hasCloudData) {
            // السحاب عنده بيانات → استخدمها
            if (!catErr && cats && cats.length > 0) {
                state.categories = cats;
                localStorage.setItem('project_expenses_categories', JSON.stringify(cats));
            }
            if (!supErr && sups && sups.length > 0) {
                state.suppliers = sups;
                localStorage.setItem('project_expenses_suppliers', JSON.stringify(sups));
            }
            if (!delErr && dels && dels.length > 0) {
                state.deliveryCompanies = dels;
                localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(dels));
            }
            if (!expErr && exps && exps.length > 0) {
                state.expenses = exps.map(dbToExpense);
                localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses));
            }
        } else {
            // السحاب فاضي → ارفع بياناتك المحلية إليه
            if (state.categories.length > 0) {
                for (const cat of state.categories) {
                    await supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color });
                }
            }
            if (state.suppliers.length > 0) {
                for (const sup of state.suppliers) {
                    await supabaseClient.from('suppliers').upsert({ id: sup.id, name: sup.name, phone: sup.phone || null });
                }
            }
            if (state.deliveryCompanies.length > 0) {
                for (const del of state.deliveryCompanies) {
                    await supabaseClient.from('delivery_companies').upsert({ id: del.id, name: del.name, phone: del.phone || null });
                }
            }
            if (state.expenses.length > 0) {
                const dbRows = state.expenses.map(expenseToDb);
                for (const row of dbRows) {
                    await supabaseClient.from('expenses').upsert(row);
                }
            }
        }

        render();
    } catch (e) {
        console.error('Background Supabase sync failed:', e);
    }
}


// Reusable Custom Confirm System
function showCustomConfirm(options) {
    SoundEffects.play('alert');
    confirmTitle.textContent = options.title || 'تأكيد';
    confirmMessage.textContent = options.message || '';
    
    confirmIcon.innerHTML = `<i class="${options.iconClass || 'fa-solid fa-triangle-exclamation'}"></i>`;
    confirmIcon.style.color = options.iconColor || 'var(--warning)';
    
    confirmYesBtn.textContent = options.yesText || 'تأكيد';
    if (options.isAlert) {
        confirmNoBtn.style.display = 'none';
    } else {
        confirmNoBtn.style.display = 'block';
        confirmNoBtn.textContent = options.noText || 'إلغاء';
    }
    
    const handleYes = () => {
        cleanup();
        if (options.onConfirm) options.onConfirm();
    };
    
    const handleNo = () => {
        cleanup();
        if (options.onCancel) options.onCancel();
    };
    
    const handleOutside = (e) => {
        if (e.target === customConfirmModal) {
            cleanup();
            if (options.onCancel) options.onCancel();
        }
    };
    
    const cleanup = () => {
        customConfirmModal.classList.remove('active');
        confirmYesBtn.removeEventListener('click', handleYes);
        confirmNoBtn.removeEventListener('click', handleNo);
        customConfirmModal.removeEventListener('click', handleOutside);
    };
    
    confirmYesBtn.addEventListener('click', handleYes);
    confirmNoBtn.addEventListener('click', handleNo);
    customConfirmModal.addEventListener('click', handleOutside);
    
    customConfirmModal.classList.add('active');
}

// Reusable Custom Alert System
function showCustomAlert(message, type = 'info') {
    let iconClass = 'fa-solid fa-circle-info';
    let iconColor = 'var(--info)';
    let title = 'تنبيه';
    
    if (type === 'success') {
        iconClass = 'fa-solid fa-circle-check';
        iconColor = 'var(--success)';
        title = 'تم بنجاح';
    } else if (type === 'error' || type === 'danger' || type === 'warning') {
        iconClass = 'fa-solid fa-triangle-exclamation';
        iconColor = type === 'warning' ? 'var(--warning)' : 'var(--danger)';
        title = type === 'warning' ? 'تنبيه' : 'حدث خطأ';
    }
    
    showCustomConfirm({
        title: title,
        message: message,
        iconClass: iconClass,
        iconColor: iconColor,
        yesText: 'حسناً',
        isAlert: true
    });
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

// Transaction Detail Modal Events
let currentViewingTxId = null;
function setupTxDetailModalEvents() {
    closeTxDetailModalBtn.addEventListener('click', () => {
        txDetailModal.classList.remove('active');
    });
    txDetailModal.addEventListener('click', (e) => {
        if (e.target === txDetailModal) {
            txDetailModal.classList.remove('active');
        }
    });
    editTxFromDetailBtn.addEventListener('click', () => {
        if (currentViewingTxId) {
            txDetailModal.classList.remove('active');
            editExpense(currentViewingTxId);
        }
    });
    printTxInvoiceBtn.addEventListener('click', () => {
        if (currentViewingTxId) {
            printSingleInvoice();
        }
    });
}

function printSingleInvoice() {
    document.body.classList.add('show-invoice-print');
    window.print();
    document.body.classList.remove('show-invoice-print');
}

window.viewTransactionDetails = function(id, event) {
    if (event) event.stopPropagation();
    
    const tx = state.expenses.find(item => item.id === id);
    if (!tx) return;

    currentViewingTxId = id;
    const cat = state.categories.find(c => c.id === tx.category) || { label: 'مصاريف أخرى', color: '#4f46e5' };
    
    let relationHTML = '';
    if (tx.supplierId) {
        const sup = state.suppliers.find(s => s.id === tx.supplierId);
        relationHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-user-tie"></i> المورد:</span>
                <span style="font-weight:700; color:var(--primary);">${escapeHtml(sup ? sup.name : 'مورد غير معروف')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-credit-card"></i> طريقة الدفع:</span>
                <span style="font-weight:600;">${tx.payMethod === 'cash' ? 'كاش كامل' : tx.payMethod === 'credit' ? 'ذمة / آجل' : 'دفعة سداد'}</span>
            </div>
        `;
    } else if (tx.deliveryCompanyId) {
        const del = state.deliveryCompanies.find(d => d.id === tx.deliveryCompanyId);
        relationHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-truck"></i> شركة التوصيل:</span>
                <span style="font-weight:700; color:var(--info);">${escapeHtml(del ? del.name : 'شركة غير معروفة')}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-money-bill-transfer"></i> حالة الاستلام:</span>
                <span style="font-weight:600;">${tx.collectMethod === 'pending' ? 'ذمة معلقة (لم تستلم)' : 'استلام كاش'}</span>
            </div>
        `;
    }

    const typeHTML = tx.type === 'income'
        ? `<span class="badge" style="background:var(--success-light); color:var(--success); font-size:0.9rem; padding: 0.4rem 0.8rem;"><i class="fa-solid fa-arrow-down-long" style="margin-left:0.25rem;"></i>دخل وإيداع</span>`
        : `<span class="badge" style="background:var(--danger-light); color:var(--danger); font-size:0.9rem; padding: 0.4rem 0.8rem;"><i class="fa-solid fa-arrow-up-long" style="margin-left:0.25rem;"></i>مصروف خارج</span>`;

    txDetailsBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem; border-bottom: 2px dashed var(--border-card); padding-bottom: 1.25rem;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">قيمة العملية المالية</div>
            <div style="font-size: 2.25rem; font-weight: 900; color: ${tx.type === 'income' ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(tx.amount, tx.currency)}</div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-tag"></i> اسم العملية:</span>
                <span style="font-weight:700; color:var(--text-primary);">${escapeHtml(tx.title)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-circle-question"></i> النوع:</span>
                ${typeHTML}
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-calendar-day"></i> التاريخ:</span>
                <span style="font-weight:600;">${tx.date}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem;">
                <span style="color:var(--text-secondary);"><i class="fa-solid fa-bookmark"></i> التصنيف:</span>
                <span class="badge" style="background-color: ${cat.color}20; color: ${cat.color}; font-weight:600;">${escapeHtml(cat.label)}</span>
            </div>
            ${relationHTML}
            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem;">
                <span style="color:var(--text-secondary); font-weight:500;"><i class="fa-solid fa-comment-dots"></i> الملاحظات:</span>
                <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 10px; font-size: 0.85rem; line-height: 1.6; border: 1px solid var(--border-card); white-space: pre-wrap; color:var(--text-primary);">${escapeHtml(tx.notes || 'لا توجد ملاحظات مسجلة لهذه العملية.')}</div>
            </div>
        </div>
    `;

    SoundEffects.play('click');
    txDetailModal.classList.add('active');
};

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('theme', theme);
    const icon = themeToggleBtn.querySelector('i');
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Unified Navigation
function setupNavigation() {
    const allNavs = [...document.querySelectorAll('.nav-btn'), ...document.querySelectorAll('.nav-item')];
    
    const navigateToHash = () => {
        let tab = window.location.hash.replace('#', '');
        const validTabs = ['stats', 'history', 'suppliers', 'delivery', 'tools'];
        if (!validTabs.includes(tab)) {
            tab = 'stats';
        }
        
        allNavs.forEach(b => {
            if (b.getAttribute('data-tab') === tab) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        document.body.className = `show-${tab}`;
    };

    allNavs.forEach(btn => {
        if (btn.classList.contains('center-fab') || btn.id === 'openTxModalBtnMobile') return;

        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            window.location.hash = tab;
        });
    });

    window.addEventListener('hashchange', navigateToHash);
    navigateToHash();
}

// Form Type Switcher
function setupFormTypeToggles() {
    const updateGroups = () => {
        if (state.formType === 'expense') {
            supplierRelationGroup.style.display = 'block';
            deliveryRelationGroup.style.display = 'none';
            collectMethodGroup.style.display = 'none';
            expDelivery.value = '';
            
            if (expSupplier.value) {
                payMethodGroup.style.display = 'block';
            }
        } else {
            supplierRelationGroup.style.display = 'none';
            payMethodGroup.style.display = 'none';
            expSupplier.value = '';
            
            deliveryRelationGroup.style.display = 'block';
            if (expDelivery.value) {
                collectMethodGroup.style.display = 'block';
            }
        }
    };

    typeExpenseBtn.addEventListener('click', () => {
        state.formType = 'expense';
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
        
        if (state.categories.some(c => c.id === 'goods')) {
            expCategory.value = 'goods';
        } else if (state.categories.length > 0) {
            expCategory.value = state.categories[0].id;
        }
        updateGroups();
    });

    typeIncomeBtn.addEventListener('click', () => {
        state.formType = 'income';
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
        
        if (state.categories.some(c => c.id === 'bank')) {
            expCategory.value = 'bank';
        } else if (state.categories.length > 0) {
            expCategory.value = state.categories[0].id;
        }
        updateGroups();
    });
}

// Master Currency Switcher
function setupCurrencyToggles() {
    const switchCurrency = (newCur) => {
        state.activeCurrency = newCur;
        expCurrency.value = newCur;
        updateCurrencyTabStyles();
        render();
    };

    [statCurIlsBtn, chartCurrencyIlsBtn].forEach(b => b.addEventListener('click', () => switchCurrency('ILS')));
    [statCurUsdBtn, chartCurrencyUsdBtn].forEach(b => b.addEventListener('click', () => switchCurrency('USD')));
    [statCurJodBtn, chartCurrencyJodBtn].forEach(b => b.addEventListener('click', () => switchCurrency('JOD')));

    updateCurrencyTabStyles();
}

function updateCurrencyTabStyles() {
    const cur = state.activeCurrency;
    
    [statCurIlsBtn, statCurUsdBtn, statCurJodBtn].forEach(btn => btn.classList.remove('active'));
    if (cur === 'ILS') statCurIlsBtn.classList.add('active');
    if (cur === 'USD') statCurUsdBtn.classList.add('active');
    if (cur === 'JOD') statCurJodBtn.classList.add('active');

    [chartCurrencyIlsBtn, chartCurrencyUsdBtn, chartCurrencyJodBtn].forEach(btn => btn.classList.remove('active'));
    if (cur === 'ILS') chartCurrencyIlsBtn.classList.add('active');
    if (cur === 'USD') chartCurrencyUsdBtn.classList.add('active');
    if (cur === 'JOD') chartCurrencyJodBtn.classList.add('active');
}

// Supplier Form
function setupSupplierForm() {
    supplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (state.editSupplierId) {
            const sup = state.suppliers.find(s => s.id === state.editSupplierId);
            if (sup) {
                sup.name = supName.value.trim();
                sup.phone = supPhone.value.trim();
            }
            state.editSupplierId = null;
            SoundEffects.play('add');
        } else {
            const newSup = {
                id: Date.now().toString(),
                name: supName.value.trim(),
                phone: supPhone.value.trim()
            };
            state.suppliers.push(newSup);
            SoundEffects.play('add');
        }
        
        await saveSuppliers();
        renderSuppliersDropdown();
        renderSuppliersGrid();
        
        supName.value = '';
        supPhone.value = '';
        resetSupModalHeaders();
        supplierModal.classList.remove('active');
    });
}

function resetSupModalHeaders() {
    document.getElementById('supModalTitle').innerHTML = `<i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> إضافة مورد جديد`;
    document.getElementById('supSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ المورد`;
    state.editSupplierId = null;
}

// Delivery Form
function setupDeliveryForm() {
    deliveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (state.editDeliveryId) {
            const del = state.deliveryCompanies.find(d => d.id === state.editDeliveryId);
            if (del) {
                del.name = delName.value.trim();
                del.phone = delPhone.value.trim();
            }
            state.editDeliveryId = null;
            SoundEffects.play('add');
        } else {
            const newDel = {
                id: Date.now().toString(),
                name: delName.value.trim(),
                phone: delPhone.value.trim()
            };
            state.deliveryCompanies.push(newDel);
            SoundEffects.play('add');
        }
        
        await saveDeliveryCompanies();
        renderDeliveryDropdown();
        renderDeliveryGrid();
        
        delName.value = '';
        delPhone.value = '';
        resetDelModalHeaders();
        deliveryModal.classList.remove('active');
    });
}

function resetDelModalHeaders() {
    document.getElementById('delModalTitle').innerHTML = `<i class="fa-solid fa-truck" style="color: var(--primary);"></i> إضافة شركة توصيل جديدة`;
    document.getElementById('delSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ شركة التوصيل`;
    state.editDeliveryId = null;
}

// Category Form
function setupCategoryManager() {
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const label = newCatLabel.value.trim();
        const color = newCatColor.value;
        const id = 'cat_' + Date.now().toString();

        const newCat = { id, label, color };
        state.categories.push(newCat);
        await saveCategories();
        SoundEffects.play('add');
        
        newCatLabel.value = '';
        renderCategoriesDropdown();
        renderCategoriesManagerList();
        render();
    });
}

// Modal closing events
function setupModalEvents() {
    closeModalBtn.addEventListener('click', () => {
        statementModal.classList.remove('active');
    });
    window.addEventListener('click', (e) => {
        if (e.target === statementModal) {
            statementModal.classList.remove('active');
        }
    });
}

// Transaction Modal Events
function setupTxModalEvents() {
    const openModal = () => {
        if (!state.editId) {
            resetTxForm();
        }
        transactionModal.classList.add('active');
    };
    const closeModal = () => {
        transactionModal.classList.remove('active');
        resetTxForm();
    };

    openTxModalBtn.addEventListener('click', openModal);
    openTxModalBtnMobile.addEventListener('click', openModal);
    closeTxModalBtn.addEventListener('click', closeModal);

    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            closeModal();
        }
    });
}

// Partner Modals Events
function setupPartnerModalsEvents() {
    openSupModalBtn.addEventListener('click', () => {
        resetSupModalHeaders();
        supplierModal.classList.add('active');
        supName.focus();
    });
    closeSupModalBtn.addEventListener('click', () => {
        supplierModal.classList.remove('active');
        supName.value = '';
        supPhone.value = '';
        resetSupModalHeaders();
    });
    supplierModal.addEventListener('click', (e) => {
        if (e.target === supplierModal) {
            supplierModal.classList.remove('active');
            resetSupModalHeaders();
        }
    });

    openDelModalBtn.addEventListener('click', () => {
        resetDelModalHeaders();
        deliveryModal.classList.add('active');
        delName.focus();
    });
    closeDelModalBtn.addEventListener('click', () => {
        deliveryModal.classList.remove('active');
        delName.value = '';
        delPhone.value = '';
        resetDelModalHeaders();
    });
    deliveryModal.addEventListener('click', (e) => {
        if (e.target === deliveryModal) {
            deliveryModal.classList.remove('active');
            resetDelModalHeaders();
        }
    });
}

// Advanced Filters Event Observers
function setupFilterEvents() {
    const resetLimitAndRender = () => {
        state.displayLimit = 50;
        render();
    };

    searchInput.addEventListener('input', resetLimitAndRender);
    quickDateFilter.addEventListener('change', () => {
        const val = quickDateFilter.value;
        if (val === 'custom') {
            customDateRangeInputs.style.display = 'flex';
            specificMonthInputContainer.style.display = 'none';
        } else if (val === 'specific-month') {
            customDateRangeInputs.style.display = 'none';
            specificMonthInputContainer.style.display = 'flex';
            if (!filterMonth.value) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                filterMonth.value = `${y}-${m}`;
            }
        } else {
            customDateRangeInputs.style.display = 'none';
            specificMonthInputContainer.style.display = 'none';
        }
        resetLimitAndRender();
    });
    filterMonth.addEventListener('change', resetLimitAndRender);
    filterStartDate.addEventListener('change', resetLimitAndRender);
    filterEndDate.addEventListener('change', resetLimitAndRender);

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            state.displayLimit += 50;
            render();
            SoundEffects.play('click');
        });
    }
}

// Clear and reset transaction form
function resetTxForm() {
    state.editId = null;
    const txModalTitle = document.getElementById('txModalTitle');
    const txSubmitBtn = document.getElementById('txSubmitBtn');
    
    if (txModalTitle) {
        txModalTitle.innerHTML = `<i class="fa-solid fa-circle-plus" style="color: var(--primary);"></i> إضافة عملية جديدة`;
    }
    if (txSubmitBtn) {
        txSubmitBtn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ العملية`;
    }
    
    expenseForm.reset();
    const today = new Date().toISOString().split('T')[0];
    expDate.value = today;
    
    payMethodGroup.style.display = 'none';
    collectMethodGroup.style.display = 'none';
}

// Tool Modals (open/close)
function openToolModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeToolModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Close tool modals on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tx-modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Factory Reset Handler
function setupResetButton() {
    resetAllDataBtn.addEventListener('click', () => {
        showCustomConfirm({
            title: 'تصفير بيانات التطبيق',
            message: 'تحذير هام جداً: هل أنت متأكد من مسح كافة العمليات والديون والموردين وشركات التوصيل نهائياً؟ لا يمكن التراجع عن هذا الإجراء!',
            iconClass: 'fa-solid fa-triangle-exclamation',
            iconColor: 'var(--danger)',
            yesText: 'نعم، امسح كل شيء',
            onConfirm: async () => {
                if (supabaseClient) {
                    try {
                        await supabaseClient.from('expenses').delete().neq('id', '0');
                        await supabaseClient.from('suppliers').delete().neq('id', '0');
                        await supabaseClient.from('delivery_companies').delete().neq('id', '0');
                        await supabaseClient.from('categories').delete().neq('id', '0');
                    } catch (e) {
                        console.error(e);
                    }
                }
                localStorage.clear();
                SoundEffects.play('delete');
                showCustomAlert('تم مسح البيانات بنجاح، سيتم إعادة تشغيل التطبيق الآن.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    });
}

// Click anywhere on Supplier or Delivery cards
window.cardClicked = function(event, id, type) {
    if (event.target.closest('.supplier-card-actions') || 
        event.target.closest('.delete-sup-btn') || 
        event.target.closest('.edit-sup-btn') || 
        event.target.closest('.supplier-phone')) {
        return;
    }
    if (type === 'supplier') {
        viewSupplierStatement(id);
    } else {
        viewDeliveryStatement(id);
    }
};

// Edit Supplier Form Trigger
window.editSupplier = function(supId, event) {
    if (event) event.stopPropagation();
    
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;

    state.editSupplierId = supId;
    supName.value = sup.name;
    supPhone.value = sup.phone || '';

    document.getElementById('supModalTitle').innerHTML = `<i class="fa-solid fa-user-pen" style="color: var(--primary);"></i> تعديل بيانات المورد`;
    document.getElementById('supSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;

    SoundEffects.play('edit');
    supplierModal.classList.add('active');
    supName.focus();
};

// Edit Delivery Company Form Trigger
window.editDelivery = function(delId, event) {
    if (event) event.stopPropagation();
    
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;

    state.editDeliveryId = delId;
    delName.value = del.name;
    delPhone.value = del.phone || '';

    document.getElementById('delModalTitle').innerHTML = `<i class="fa-solid fa-user-pen" style="color: var(--primary);"></i> تعديل بيانات شركة التوصيل`;
    document.getElementById('delSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;

    SoundEffects.play('edit');
    deliveryModal.classList.add('active');
    delName.focus();
};

// Form Add or Edit Transaction
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedSupVal = expSupplier.value;
    const selectedDelVal = expDelivery.value;
    
    const payMethodVal = selectedSupVal ? expPayMethod.value : 'cash';
    const collectMethodVal = selectedDelVal ? expCollectMethod.value : 'received';

    if (state.editId) {
        const tx = state.expenses.find(item => item.id === state.editId);
        if (tx) {
            tx.title = expTitle.value.trim();
            tx.type = state.formType;
            tx.category = expCategory.value;
            tx.supplierId = state.formType === 'expense' ? (selectedSupVal || null) : null;
            tx.payMethod = state.formType === 'expense' ? payMethodVal : null;
            tx.deliveryCompanyId = state.formType === 'income' ? (selectedDelVal || null) : null;
            tx.collectMethod = state.formType === 'income' ? collectMethodVal : null;
            tx.amount = parseFloat(expAmount.value);
            tx.currency = expCurrency.value;
            tx.date = expDate.value;
            tx.notes = expNotes.value.trim();
        }
        state.editId = null;
        SoundEffects.play('add');
    } else {
        const newTx = {
            id: Date.now().toString(),
            title: expTitle.value.trim(),
            type: state.formType,
            category: expCategory.value,
            supplierId: state.formType === 'expense' ? (selectedSupVal || null) : null,
            payMethod: state.formType === 'expense' ? payMethodVal : null,
            deliveryCompanyId: state.formType === 'income' ? (selectedDelVal || null) : null,
            collectMethod: state.formType === 'income' ? collectMethodVal : null,
            amount: parseFloat(expAmount.value),
            currency: expCurrency.value,
            date: expDate.value,
            notes: expNotes.value.trim()
        };
        state.expenses.unshift(newTx);
        SoundEffects.play('add');
    }

    await saveState();
    render();

    transactionModal.classList.remove('active');
    resetTxForm();

    const historyNav = [...document.querySelectorAll('.nav-btn'), ...document.querySelectorAll('.nav-item')].find(n => n.getAttribute('data-tab') === 'history');
    if (historyNav) historyNav.click();
});

window.deleteExpense = function(id) {
    showCustomConfirm({
        title: 'حذف عملية مالية',
        message: 'هل أنت متأكد من حذف هذه العملية بشكل نهائي من السجل؟',
        iconClass: 'fa-solid fa-trash-can',
        iconColor: 'var(--danger)',
        yesText: 'حذف الآن',
        onConfirm: async () => {
            state.expenses = state.expenses.filter(item => item.id !== id);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('expenses').delete().eq('id', id);
                } catch (e) {
                    console.error(e);
                }
            }
            await saveState();
            render();
            SoundEffects.play('delete');
        }
    });
};

// Edit Transaction Trigger
window.editExpense = function(id) {
    const tx = state.expenses.find(item => item.id === id);
    if (!tx) return;

    state.editId = id;
    state.formType = tx.type;

    if (tx.type === 'expense') {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
        supplierRelationGroup.style.display = 'block';
        deliveryRelationGroup.style.display = 'none';
        collectMethodGroup.style.display = 'none';
    } else {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
        supplierRelationGroup.style.display = 'none';
        payMethodGroup.style.display = 'none';
        deliveryRelationGroup.style.display = 'block';
    }

    expTitle.value = tx.title;
    expCategory.value = tx.category;
    
    if (tx.type === 'expense') {
        expSupplier.value = tx.supplierId || '';
        if (tx.supplierId) {
            payMethodGroup.style.display = 'block';
            expPayMethod.value = tx.payMethod || 'cash';
        } else {
            payMethodGroup.style.display = 'none';
        }
    } else {
        expDelivery.value = tx.deliveryCompanyId || '';
        if (tx.deliveryCompanyId) {
            collectMethodGroup.style.display = 'block';
            expCollectMethod.value = tx.collectMethod || 'received';
        } else {
            collectMethodGroup.style.display = 'none';
        }
    }

    expAmount.value = tx.amount;
    expCurrency.value = tx.currency;
    expDate.value = tx.date;
    expNotes.value = tx.notes || '';

    const txModalTitle = document.getElementById('txModalTitle');
    const txSubmitBtn = document.getElementById('txSubmitBtn');
    
    if (txModalTitle) {
        txModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: var(--primary);"></i> تعديل العملية`;
    }
    if (txSubmitBtn) {
        txSubmitBtn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;
    }

    SoundEffects.play('edit');
    transactionModal.classList.add('active');
};

// Render Functions
function render() {
    renderSuppliersDropdown();
    renderDeliveryDropdown();
    renderCategoriesDropdown();
    
    renderSuppliersGrid();
    renderDeliveryGrid();
    renderCategoriesManagerList();

    const dateRange = quickDateFilter.value;
    let startDate = null;
    let endDate = null;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (dateRange === 'today') {
        startDate = todayStr;
        endDate = todayStr;
    } else if (dateRange === 'week') {
        const pastWeek = new Date();
        pastWeek.setDate(now.getDate() - 7);
        startDate = pastWeek.toISOString().split('T')[0];
        endDate = todayStr;
    } else if (dateRange === 'month') {
        const y = now.getFullYear();
        const m = now.getMonth();
        startDate = new Date(y, m, 1).toISOString().split('T')[0];
        endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
    } else if (dateRange === 'specific-month') {
        const selected = filterMonth.value;
        if (selected) {
            const [y, m] = selected.split('-').map(Number);
            startDate = `${selected}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            endDate = `${selected}-${String(lastDay).padStart(2, '0')}`;
        }
    } else if (dateRange === 'custom') {
        startDate = filterStartDate.value || null;
        endDate = filterEndDate.value || null;
    }

    const filterText = searchInput.value.toLowerCase().trim();
    
    const filteredExpenses = state.expenses.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(filterText) || 
                              (item.notes && item.notes.toLowerCase().includes(filterText));
        
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && (item.date >= startDate);
        }
        if (endDate) {
            matchesDate = matchesDate && (item.date <= endDate);
        }
        
        return matchesSearch && matchesDate;
    });

    const totals = {
        ILS: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 },
        USD: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 },
        JOD: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 }
    };

    const activeCur = state.activeCurrency;
    const categoryTotals = {};
    state.categories.forEach(c => {
        categoryTotals[c.id] = 0;
    });

    state.expenses.forEach(item => {
        const cur = item.currency;
        if (!totals[cur]) return;

        if (item.type === 'income') {
            totals[cur].remaining += item.amount;
            if (item.category === 'bank') totals[cur].bank += item.amount;
        } else {
            totals[cur].remaining -= item.amount;
            totals[cur].expense += item.amount;
            if (item.category === 'goods') totals[cur].goods += item.amount;
            else if (item.category === 'trans') totals[cur].trans += item.amount;
            else if (item.category === 'bank') totals[cur].bank += item.amount;
            else totals[cur].other += item.amount;

            if (cur === activeCur) {
                if (categoryTotals[item.category] !== undefined) {
                    categoryTotals[item.category] += item.amount;
                } else {
                    categoryTotals.other = (categoryTotals.other || 0) + item.amount;
                }
            }
        }
    });

    let filteredIncome = 0;
    let filteredExpense = 0;
    
    filteredExpenses.forEach(item => {
        if (item.currency === activeCur) {
            if (item.type === 'income') {
                filteredIncome += item.amount;
            } else {
                filteredExpense += item.amount;
            }
        }
    });
    
    const filteredNet = filteredIncome - filteredExpense;
    
    filteredIncomeTotal.innerText = formatCurrency(filteredIncome, activeCur);
    filteredExpenseTotal.innerText = formatCurrency(filteredExpense, activeCur);
    filteredNetTotal.innerText = formatCurrency(filteredNet, activeCur);
    filteredNetTotal.style.color = filteredNet >= 0 ? 'var(--success)' : 'var(--danger)';

    const activeTotals = totals[activeCur];

    walletRemainingEl.innerText = formatCurrency(activeTotals.remaining, activeCur);
    walletRemainingEl.className = activeTotals.remaining >= 0 ? 'positive' : 'negative';

    // Update mobile floating balance bar
    const mobileBalanceAmount = document.getElementById('mobileBalanceAmount');
    if (mobileBalanceAmount) {
        mobileBalanceAmount.innerText = formatCurrency(activeTotals.remaining, activeCur);
        mobileBalanceAmount.className = 'mobile-balance-amount' + (activeTotals.remaining < 0 ? ' negative' : '');
    }

    walletExpenseEl.innerText = formatCurrency(activeTotals.expense, activeCur);
    walletGoodsEl.innerText = formatCurrency(activeTotals.goods, activeCur);
    walletTransEl.innerText = formatCurrency(activeTotals.trans, activeCur);

    const insightsTitle = document.querySelector('.chart-box:nth-child(2) .chart-title');
    if (insightsTitle) {
        const curLabel = activeCur === 'ILS' ? 'الشيكل ₪' : activeCur === 'USD' ? 'الدولار $' : 'الدينار د.أ';
        insightsTitle.innerHTML = `<i class="fa-solid fa-lightbulb" style="color: var(--warning); margin-left: 0.5rem;"></i>لمحة سريعة (${curLabel})`;
    }

    const totalExp = activeTotals.expense;
    goodsPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.goods / totalExp) * 100)}%` : '0%';
    transPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.trans / totalExp) * 100)}%` : '0%';
    bankPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.bank / totalExp) * 100)}%` : '0%';
    totalCountEl.innerText = state.expenses.length;

    renderTable(filteredExpenses);
    renderChartDynamic(categoryTotals);
}

function formatCurrency(amount, currency) {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.ILS;
    return amount.toLocaleString('en-US', { 
        minimumFractionDigits: config.decimal, 
        maximumFractionDigits: config.decimal 
    }) + ' ' + config.symbol;
}

// Populate Supplier select options
function renderSuppliersDropdown() {
    const currentVal = expSupplier.value;
    expSupplier.innerHTML = '<option value="">-- بدون مورد --</option>';
    state.suppliers.forEach(sup => {
        const opt = document.createElement('option');
        opt.value = sup.id;
        opt.textContent = sup.name;
        expSupplier.appendChild(opt);
    });
    expSupplier.value = currentVal;
}

// Populate Delivery Company select options
function renderDeliveryDropdown() {
    const currentVal = expDelivery.value;
    expDelivery.innerHTML = '<option value="">-- بدون شركة توصيل --</option>';
    state.deliveryCompanies.forEach(del => {
        const opt = document.createElement('option');
        opt.value = del.id;
        opt.textContent = del.name;
        expDelivery.appendChild(opt);
    });
    expDelivery.value = currentVal;
}

// Populate Categories select options
function renderCategoriesDropdown() {
    const currentVal = expCategory.value;
    expCategory.innerHTML = '';
    state.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.label;
        expCategory.appendChild(opt);
    });
    expCategory.value = currentVal;
}

// Render Supplier Cards
function renderSuppliersGrid() {
    suppliersGrid.innerHTML = '';
    
    if (state.suppliers.length === 0) {
        suppliersGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <i class="fa-solid fa-users" style="font-size: 2.5rem; opacity: 0.3; margin-bottom: 0.5rem; display: block;"></i>
                لم تقم بإضافة موردين حتى الآن.
            </div>
        `;
        return;
    }

    state.suppliers.forEach(sup => {
        const debts = { ILS: 0, USD: 0, JOD: 0 };
        
        state.expenses.forEach(item => {
            if (item.supplierId === sup.id) {
                if (item.payMethod === 'credit') {
                    debts[item.currency] += item.amount;
                } else if (item.payMethod === 'payment') {
                    debts[item.currency] -= item.amount;
                }
            }
        });

        const initials = sup.name.trim().charAt(0).toUpperCase();
        const card = document.createElement('div');
        card.className = 'card supplier-card';
        card.setAttribute('onclick', `cardClicked(event, '${sup.id}', 'supplier')`);
        
        const telLink = sup.phone ? `<a href="tel:${sup.phone}" class="supplier-phone"><i class="fa-solid fa-phone"></i> ${sup.phone}</a>` : '<span class="supplier-phone">بدون هاتف</span>';

        card.innerHTML = `
            <div class="supplier-card-header">
                <div class="supplier-avatar">${initials}</div>
                <div class="supplier-info">
                    <span class="supplier-name">${escapeHtml(sup.name)}</span>
                    ${telLink}
                </div>
                <div style="display: flex; gap: 4px;">
                    <button type="button" class="edit-sup-btn" onclick="editSupplier('${sup.id}', event)" title="تعديل بيانات المورد">
                        <i class="fa-solid fa-user-pen"></i>
                    </button>
                    <button type="button" class="delete-sup-btn" onclick="deleteSupplier('${sup.id}')" title="حذف المورد">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="supplier-balances-grid">
                <div class="balance-col ${debts.ILS > 0 ? 'active-debt' : ''}">
                    <span class="balance-currency">شيكل</span>
                    <strong class="balance-amount">${formatCurrency(debts.ILS, 'ILS')}</strong>
                </div>
                <div class="balance-col ${debts.USD > 0 ? 'active-debt' : ''}">
                    <span class="balance-currency">دولار</span>
                    <strong class="balance-amount">${formatCurrency(debts.USD, 'USD')}</strong>
                </div>
                <div class="balance-col ${debts.JOD > 0 ? 'active-debt' : ''}">
                    <span class="balance-currency">دينار</span>
                    <strong class="balance-amount">${formatCurrency(debts.JOD, 'JOD')}</strong>
                </div>
            </div>
            <div class="supplier-card-actions">
                <button type="button" class="btn btn-primary btn-sm" onclick="quickPaySupplier('${sup.id}')">
                    <i class="fa-solid fa-hand-holding-dollar"></i>
                    دفع دفعة
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="viewSupplierStatement('${sup.id}')">
                    <i class="fa-solid fa-receipt"></i>
                    كشف حساب
                </button>
            </div>
        `;
        suppliersGrid.appendChild(card);
    });
}

// Render Delivery Company Cards
function renderDeliveryGrid() {
    deliveryGrid.innerHTML = '';
    
    if (state.deliveryCompanies.length === 0) {
        deliveryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <i class="fa-solid fa-truck-ramp-box" style="font-size: 2.5rem; opacity: 0.3; margin-bottom: 0.5rem; display: block;"></i>
                لم تقم بإضافة شركات توصيل حتى الآن.
            </div>
        `;
        return;
    }

    state.deliveryCompanies.forEach(del => {
        const receivables = { ILS: 0, USD: 0, JOD: 0 };
        
        state.expenses.forEach(item => {
            if (item.deliveryCompanyId === del.id) {
                if (item.collectMethod === 'pending') {
                    receivables[item.currency] += item.amount;
                } else if (item.collectMethod === 'received') {
                    receivables[item.currency] -= item.amount;
                }
            }
        });

        const initials = del.name.trim().charAt(0).toUpperCase();
        const card = document.createElement('div');
        card.className = 'card supplier-card';
        card.setAttribute('onclick', `cardClicked(event, '${del.id}', 'delivery')`);
        
        const telLink = del.phone ? `<a href="tel:${del.phone}" class="supplier-phone"><i class="fa-solid fa-phone"></i> ${del.phone}</a>` : '<span class="supplier-phone">بدون هاتف</span>';

        card.innerHTML = `
            <div class="supplier-card-header">
                <div class="supplier-avatar" style="background: linear-gradient(135deg, var(--success), var(--info));">${initials}</div>
                <div class="supplier-info">
                    <span class="supplier-name">${escapeHtml(del.name)}</span>
                    ${telLink}
                </div>
                <div style="display: flex; gap: 4px;">
                    <button type="button" class="edit-sup-btn" onclick="editDelivery('${del.id}', event)" title="تعديل بيانات شركة التوصيل">
                        <i class="fa-solid fa-user-pen"></i>
                    </button>
                    <button type="button" class="delete-sup-btn" onclick="deleteDelivery('${del.id}')" title="حذف شركة التوصيل">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="supplier-balances-grid">
                <div class="balance-col ${receivables.ILS > 0 ? 'active-collect' : ''}">
                    <span class="balance-currency">شيكل</span>
                    <strong class="balance-amount">${formatCurrency(receivables.ILS, 'ILS')}</strong>
                </div>
                <div class="balance-col ${receivables.USD > 0 ? 'active-collect' : ''}">
                    <span class="balance-currency">دولار</span>
                    <strong class="balance-amount">${formatCurrency(receivables.USD, 'USD')}</strong>
                </div>
                <div class="balance-col ${receivables.JOD > 0 ? 'active-collect' : ''}">
                    <span class="balance-currency">دينار</span>
                    <strong class="balance-amount">${formatCurrency(receivables.JOD, 'JOD')}</strong>
                </div>
            </div>
            <div class="supplier-card-actions">
                <button type="button" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, var(--success), var(--info));" onclick="quickCollectDelivery('${del.id}')">
                    <i class="fa-solid fa-money-bill-pull-card"></i>
                    استلام كاش
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="viewDeliveryStatement('${del.id}')">
                    <i class="fa-solid fa-receipt"></i>
                    كشف حساب
                </button>
            </div>
        `;
        deliveryGrid.appendChild(card);
    });
}

// Render Categories Manager List
function renderCategoriesManagerList() {
    categoriesManagerList.innerHTML = '';
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-manager-item';
        item.innerHTML = `
            <div class="category-meta">
                <div class="category-color-dot" style="background-color: ${cat.color}"></div>
                <span style="font-weight: 500;">${escapeHtml(cat.label)}</span>
            </div>
            <button type="button" class="action-btn" onclick="deleteCategory('${cat.id}')" title="حذف التصنيف">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        categoriesManagerList.appendChild(item);
    });
}

// Quick Payment Actions
window.quickPaySupplier = function(supId) {
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;
    
    state.formType = 'expense';
    typeExpenseBtn.classList.add('active');
    typeIncomeBtn.classList.remove('active');
    
    supplierRelationGroup.style.display = 'block';
    deliveryRelationGroup.style.display = 'none';
    collectMethodGroup.style.display = 'none';
    
    expTitle.value = `دفعة لحساب المورد: ${sup.name}`;
    if (state.categories.some(c => c.id === 'goods')) expCategory.value = 'goods';
    
    expSupplier.value = supId;
    payMethodGroup.style.display = 'block';
    expPayMethod.value = 'payment';
    
    SoundEffects.play('click');
    transactionModal.classList.add('active');
    expAmount.focus();
};

window.quickCollectDelivery = function(delId) {
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;
    
    state.formType = 'income';
    typeIncomeBtn.classList.add('active');
    typeExpenseBtn.classList.remove('active');
    
    supplierRelationGroup.style.display = 'none';
    payMethodGroup.style.display = 'none';
    
    deliveryRelationGroup.style.display = 'block';
    expTitle.value = `استلام دفعة من شركة التوصيل: ${del.name}`;
    if (state.categories.some(c => c.id === 'bank')) expCategory.value = 'bank';
    expDelivery.value = delId;
    
    collectMethodGroup.style.display = 'block';
    expCollectMethod.value = 'received';
    
    SoundEffects.play('click');
    transactionModal.classList.add('active');
    expAmount.focus();
};

window.deleteCategory = function(catId) {
    if (state.categories.length <= 1) {
        showCustomAlert('يجب أن يتبقى تصنيف واحد على الأقل في النظام!', 'error');
        return;
    }

    showCustomConfirm({
        title: 'حذف تصنيف مخصص',
        message: 'تنبيه: هل أنت متأكد من حذف هذا التصنيف؟ سيتم تلقائياً تحويل جميع العمليات المرتبطة به إلى تصنيف احتياطي بديل لضمان سلامة الحسابات.',
        iconClass: 'fa-solid fa-triangle-exclamation',
        iconColor: 'var(--warning)',
        yesText: 'نعم، احذفه وانقل العمليات',
        onConfirm: async () => {
            const fallbackCat = state.categories.find(c => c.id !== catId);
            
            state.expenses.forEach(item => {
                if (item.category === catId) {
                    item.category = fallbackCat.id;
                }
            });
            
            state.categories = state.categories.filter(c => c.id !== catId);
            
            if (supabaseClient) {
                try {
                    await supabaseClient.from('expenses').update({ category: fallbackCat.id }).eq('category', catId);
                    await supabaseClient.from('categories').delete().eq('id', catId);
                } catch(e) {
                    console.error(e);
                }
            }

            await saveCategories();
            await saveState();
            render();
            SoundEffects.play('delete');
        }
    });
};

// Statement Modal Filter Management
let activeStatementPartnerId = null;
let activeStatementPartnerType = null;
let activeStatementStatusFilter = 'all';

function setupStatementFilterEvents() {
    const modalDateFilter = document.getElementById('modalDateFilter');
    const modalFilterMonth = document.getElementById('modalFilterMonth');
    const modalStartDate = document.getElementById('modalStartDate');
    const modalEndDate = document.getElementById('modalEndDate');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const modalCustomDateRange = document.getElementById('modalCustomDateRange');
    const modalSpecificMonthContainer = document.getElementById('modalSpecificMonthContainer');

    const btnAll = document.getElementById('modalStatusAll');
    const btnPaid = document.getElementById('modalStatusPaid');
    const btnDebt = document.getElementById('modalStatusDebt');

    const setStatusTab = (status) => {
        activeStatementStatusFilter = status;
        [btnAll, btnPaid, btnDebt].forEach(b => b.classList.remove('active'));
        if (status === 'all') btnAll.classList.add('active');
        else if (status === 'paid') btnPaid.classList.add('active');
        else if (status === 'debt') btnDebt.classList.add('active');
        
        SoundEffects.play('click');
        renderStatementTable();
    };

    btnAll.addEventListener('click', () => setStatusTab('all'));
    btnPaid.addEventListener('click', () => setStatusTab('paid'));
    btnDebt.addEventListener('click', () => setStatusTab('debt'));

    modalDateFilter.addEventListener('change', () => {
        const val = modalDateFilter.value;
        if (val === 'custom') {
            modalCustomDateRange.style.display = 'flex';
            modalSpecificMonthContainer.style.display = 'none';
        } else if (val === 'specific-month') {
            modalCustomDateRange.style.display = 'none';
            modalSpecificMonthContainer.style.display = 'flex';
            if (!modalFilterMonth.value) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                modalFilterMonth.value = `${y}-${m}`;
            }
        } else {
            modalCustomDateRange.style.display = 'none';
            modalSpecificMonthContainer.style.display = 'none';
        }
        renderStatementTable();
    });

    modalFilterMonth.addEventListener('change', renderStatementTable);
    modalStartDate.addEventListener('change', renderStatementTable);
    modalEndDate.addEventListener('change', renderStatementTable);
    modalSearchInput.addEventListener('input', renderStatementTable);
}

window.renderStatementTable = function() {
    if (!activeStatementPartnerId) return;

    const partnerId = activeStatementPartnerId;
    const type = activeStatementPartnerType;

    const modalDateFilter = document.getElementById('modalDateFilter');
    const modalFilterMonth = document.getElementById('modalFilterMonth');
    const modalStartDate = document.getElementById('modalStartDate');
    const modalEndDate = document.getElementById('modalEndDate');
    const modalSearchInput = document.getElementById('modalSearchInput');

    const dateRange = modalDateFilter.value;
    let startDate = null;
    let endDate = null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateRange === 'today') {
        startDate = todayStr;
        endDate = todayStr;
    } else if (dateRange === 'month') {
        const y = now.getFullYear();
        const m = now.getMonth();
        startDate = new Date(y, m, 1).toISOString().split('T')[0];
        endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
    } else if (dateRange === 'specific-month') {
        const selected = modalFilterMonth.value;
        if (selected) {
            const [y, m] = selected.split('-').map(Number);
            startDate = `${selected}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            endDate = `${selected}-${String(lastDay).padStart(2, '0')}`;
        }
    } else if (dateRange === 'custom') {
        startDate = modalStartDate.value || null;
        endDate = modalEndDate.value || null;
    }

    const searchText = modalSearchInput.value.toLowerCase().trim();
    modalTableBody.innerHTML = '';

    let txs = [];
    if (type === 'supplier') {
        txs = state.expenses.filter(item => item.supplierId === partnerId);
    } else {
        txs = state.expenses.filter(item => item.deliveryCompanyId === partnerId);
    }

    const filteredTxs = txs.filter(item => {
        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && (item.date >= startDate);
        if (endDate) matchesDate = matchesDate && (item.date <= endDate);

        if (!matchesDate) return false;

        const matchesSearch = item.title.toLowerCase().includes(searchText) ||
                              (item.notes && item.notes.toLowerCase().includes(searchText));
        if (!matchesSearch) return false;

        if (activeStatementStatusFilter === 'paid') {
            if (type === 'supplier') {
                return item.payMethod === 'cash' || item.payMethod === 'payment';
            } else {
                return item.collectMethod === 'received';
            }
        } else if (activeStatementStatusFilter === 'debt') {
            if (type === 'supplier') {
                return item.payMethod === 'credit';
            } else {
                return item.collectMethod === 'pending';
            }
        }

        return true;
    });

    if (filteredTxs.length === 0) {
        modalTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1.5rem; color: var(--text-secondary);">لا توجد معاملات مطابقة للفلتر المحدد.</td></tr>`;
    } else {
        filteredTxs.forEach(item => {
            const tr = document.createElement('tr');
            
            let typeLabel = '';
            let statusLabel = '';

            if (type === 'supplier') {
                typeLabel = item.type === 'income' ? 'دخل وإيداع' : 'مصروف';
                if (item.payMethod === 'cash') statusLabel = '<span class="badge other">كاش كامل</span>';
                else if (item.payMethod === 'credit') statusLabel = '<span class="badge" style="background: var(--danger-light); color: var(--danger);">دين / آجل</span>';
                else if (item.payMethod === 'payment') statusLabel = '<span class="badge" style="background: var(--success-light); color: var(--success);">سداد دفعة</span>';
            } else {
                typeLabel = item.type === 'income' ? 'دخل وتحصيل' : 'مصروف';
                if (item.collectMethod === 'pending') statusLabel = '<span class="badge" style="background: var(--warning-light); color: var(--warning);">ذمة معلقة</span>';
                else if (item.collectMethod === 'received') statusLabel = '<span class="badge" style="background: var(--success-light); color: var(--success);">استلام كاش</span>';
            }

            tr.innerHTML = `
                <td>${item.date}</td>
                <td style="font-weight:500;">${escapeHtml(item.title)}</td>
                <td>${typeLabel}</td>
                <td>${statusLabel}</td>
                <td style="font-weight:700;">${formatCurrency(item.amount, item.currency)}</td>
            `;
            modalTableBody.appendChild(tr);
        });
    }
};

window.viewSupplierStatement = function(supId) {
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;

    activeStatementPartnerId = supId;
    activeStatementPartnerType = 'supplier';
    activeStatementStatusFilter = 'all';

    modalTitle.innerHTML = `<i class="fa-solid fa-receipt" style="color: var(--primary); margin-left: 0.5rem;"></i>كشف حساب المورد: ${sup.name}`;
    
    document.getElementById('modalDateFilter').value = 'all';
    document.getElementById('modalCustomDateRange').style.display = 'none';
    document.getElementById('modalSpecificMonthContainer').style.display = 'none';
    document.getElementById('modalStartDate').value = '';
    document.getElementById('modalEndDate').value = '';
    document.getElementById('modalFilterMonth').value = '';
    document.getElementById('modalSearchInput').value = '';

    document.getElementById('modalStatusAll').classList.add('active');
    document.getElementById('modalStatusPaid').classList.remove('active');
    document.getElementById('modalStatusDebt').classList.remove('active');

    SoundEffects.play('click');
    renderStatementTable();
    statementModal.classList.add('active');
};

window.viewDeliveryStatement = function(delId) {
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;

    activeStatementPartnerId = delId;
    activeStatementPartnerType = 'delivery';
    activeStatementStatusFilter = 'all';

    modalTitle.innerHTML = `<i class="fa-solid fa-receipt" style="color: var(--primary); margin-left: 0.5rem;"></i>كشف حساب شركة التوصيل: ${del.name}`;
    
    document.getElementById('modalDateFilter').value = 'all';
    document.getElementById('modalCustomDateRange').style.display = 'none';
    document.getElementById('modalSpecificMonthContainer').style.display = 'none';
    document.getElementById('modalStartDate').value = '';
    document.getElementById('modalEndDate').value = '';
    document.getElementById('modalFilterMonth').value = '';
    document.getElementById('modalSearchInput').value = '';

    document.getElementById('modalStatusAll').classList.add('active');
    document.getElementById('modalStatusPaid').classList.remove('active');
    document.getElementById('modalStatusDebt').classList.remove('active');

    SoundEffects.play('click');
    renderStatementTable();
    statementModal.classList.add('active');
};

window.deleteSupplier = function(supId) {
    const linkedTxs = state.expenses.some(item => item.supplierId === supId);
    if (linkedTxs) {
        showCustomAlert('لا يمكن حذف المورد لأنه يحتوي على عمليات مسجلة باسمه في السجل. لحذفه يجب تعديل أو حذف عملياته أولاً.', 'error');
        return;
    }
    
    showCustomConfirm({
        title: 'حذف مورد',
        message: 'هل أنت متأكد من حذف هذا المورد بشكل نهائي من النظام؟',
        iconClass: 'fa-solid fa-trash-can',
        iconColor: 'var(--danger)',
        yesText: 'نعم، احذفه',
        onConfirm: async () => {
            state.suppliers = state.suppliers.filter(s => s.id !== supId);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('suppliers').delete().eq('id', supId);
                } catch(e) {
                    console.error(e);
                }
            }
            await saveSuppliers();
            render();
            SoundEffects.play('delete');
        }
    });
};

window.deleteDelivery = function(delId) {
    const linkedTxs = state.expenses.some(item => item.deliveryCompanyId === delId);
    if (linkedTxs) {
        showCustomAlert('لا يمكن حذف الشركة لأنها تحتوي على عمليات مسجلة باسمها في السجل. لحذفها يجب تعديل أو حذف عملياتها أولاً.', 'error');
        return;
    }
    
    showCustomConfirm({
        title: 'حذف شركة توصيل',
        message: 'هل أنت متأكد من حذف هذه الشركة نهائياً من النظام؟',
        iconClass: 'fa-solid fa-trash-can',
        iconColor: 'var(--danger)',
        yesText: 'نعم، احذفها',
        onConfirm: async () => {
            state.deliveryCompanies = state.deliveryCompanies.filter(d => d.id !== delId);
            if (supabaseClient) {
                try {
                    await supabaseClient.from('delivery_companies').delete().eq('id', delId);
                } catch(e) {
                    console.error(e);
                }
            }
            await saveDeliveryCompanies();
            render();
            SoundEffects.play('delete');
        }
    });
};

// Render Table Rows
function renderTable(list) {
    expenseTableBody.innerHTML = '';
    const mobileExpensesList = document.getElementById('mobileExpensesList');
    if (mobileExpensesList) mobileExpensesList.innerHTML = '';
    
    if (list.length === 0) {
        emptyState.style.display = 'block';
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    const itemsToRender = list.slice(0, state.displayLimit);

    itemsToRender.forEach(item => {
        const cat = state.categories.find(c => c.id === item.category) || { label: 'مصاريف أخرى', color: '#4f46e5' };
        
        // --- Desktop Table Row ---
        const tr = document.createElement('tr');
        tr.setAttribute('onclick', `viewTransactionDetails('${item.id}', event)`);
        tr.style.cursor = 'pointer';
        
        const typeBadge = item.type === 'income' 
            ? `<span class="badge" style="background: var(--success-light); color: var(--success);"><i class="fa-solid fa-arrow-down-long" style="margin-left: 0.25rem;"></i>دخل</span>`
            : `<span class="badge" style="background: var(--danger-light); color: var(--danger);"><i class="fa-solid fa-arrow-up-long" style="margin-left: 0.25rem;"></i>مصروف</span>`;

        let relationName = '-';
        let mobileRelation = '';
        if (item.supplierId) {
            const sup = state.suppliers.find(s => s.id === item.supplierId);
            if (sup) {
                relationName = `<span style="color: var(--primary); font-weight:500;"><i class="fa-solid fa-user-tie" style="margin-left:0.25rem;"></i>${escapeHtml(sup.name)}</span>`;
                mobileRelation = `<span style="font-size:0.7rem; color:var(--primary); background:rgba(79,70,229,0.08); padding:2px 6px; border-radius:4px; font-weight:500;"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(sup.name)}</span>`;
            }
        } else if (item.deliveryCompanyId) {
            const del = state.deliveryCompanies.find(d => d.id === item.deliveryCompanyId);
            if (del) {
                relationName = `<span style="color: var(--info); font-weight:500;"><i class="fa-solid fa-truck" style="margin-left:0.25rem;"></i>${escapeHtml(del.name)}</span>`;
                mobileRelation = `<span style="font-size:0.7rem; color:var(--info); background:rgba(6,182,212,0.08); padding:2px 6px; border-radius:4px; font-weight:500;"><i class="fa-solid fa-truck"></i> ${escapeHtml(del.name)}</span>`;
            }
        }

        let statusText = '-';
        if (item.type === 'expense' && item.supplierId) {
            if (item.payMethod === 'cash') statusText = 'كاش';
            else if (item.payMethod === 'credit') statusText = 'دين / آجل';
            else if (item.payMethod === 'payment') statusText = 'دفعة مسددة';
        } else if (item.type === 'income' && item.deliveryCompanyId) {
            if (item.collectMethod === 'pending') statusText = 'ذمة معلقة';
            else if (item.collectMethod === 'received') statusText = 'استلام كاش';
        }

        tr.innerHTML = `
            <td>${item.date}</td>
            <td style="font-weight: 500;">${escapeHtml(item.title)}</td>
            <td>${typeBadge}</td>
            <td><span class="badge" style="background-color: ${cat.color}20; color: ${cat.color};">${escapeHtml(cat.label)}</span></td>
            <td style="font-weight: 700;">${formatCurrency(item.amount, item.currency)}</td>
            <td>${relationName}</td>
            <td>${statusText}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);" title="${escapeHtml(item.notes || '')}">
                ${escapeHtml(item.notes || '-')}
            </td>
            <td>
                <button class="action-btn" onclick="event.stopPropagation(); editExpense('${item.id}')" title="تعديل" style="color: var(--primary); margin-left: 0.5rem;">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); deleteExpense('${item.id}')" title="حذف">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        
        expenseTableBody.appendChild(tr);

        // --- Mobile Transaction Card ---
        if (mobileExpensesList) {
            const mCard = document.createElement('div');
            mCard.className = 'mobile-tx-card';
            mCard.setAttribute('onclick', `viewTransactionDetails('${item.id}', event)`);

            const typeIcon = item.type === 'income' 
                ? '<i class="fa-solid fa-arrow-down-long" style="color: var(--success); font-size: 0.95rem;"></i>'
                : '<i class="fa-solid fa-arrow-up-long" style="color: var(--danger); font-size: 0.95rem;"></i>';

            mCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem; width: 100%;">
                    <div style="background: ${cat.color}15; color: ${cat.color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${typeIcon}
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 0.5rem;">
                            <span style="font-weight: 700; font-size: 0.9rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: var(--text-primary);">${escapeHtml(item.title)}</span>
                            <span style="font-weight: 800; font-size: 0.95rem; color: ${item.type === 'income' ? 'var(--success)' : 'var(--danger)'}; white-space: nowrap;">
                                ${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount, item.currency)}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 0.5rem;">
                            <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
                                <span class="badge" style="background-color: ${cat.color}15; color: ${cat.color}; font-size: 0.7rem; padding: 2px 6px;">${escapeHtml(cat.label)}</span>
                                ${mobileRelation}
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap;">${item.date}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 0.4rem;" class="print-hide">
                    <button type="button" class="btn btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 6px; margin: 0; min-height: auto;" onclick="event.stopPropagation(); editExpense('${item.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> تعديل
                    </button>
                    <button type="button" class="btn btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 6px; margin: 0; color: var(--danger); border-color: rgba(239,68,68,0.2); min-height: auto;" onclick="event.stopPropagation(); deleteExpense('${item.id}')">
                        <i class="fa-solid fa-trash-can"></i> حذف
                    </button>
                </div>
            `;
            mobileExpensesList.appendChild(mCard);
        }
    });

    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreContainer && loadMoreBtn) {
        if (list.length > state.displayLimit) {
            loadMoreContainer.style.display = 'block';
            const remaining = list.length - state.displayLimit;
            loadMoreBtn.querySelector('span').textContent = `عرض المزيد (متبقي ${remaining} عمليات)`;
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
}

// Chart dynamic rendering with animations
function renderChartDynamic(categoryTotals) {
    let total = 0;
    const slices = [];

    state.categories.forEach(cat => {
        const val = categoryTotals[cat.id] || 0;
        if (val > 0) {
            total += val;
            slices.push({
                label: cat.label,
                value: val,
                color: cat.color
            });
        }
    });

    if (total === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 2rem 0;">
                <i class="fa-solid fa-chart-pie" style="font-size: 2.5rem; opacity: 0.3; margin-bottom: 0.5rem; display: block;"></i>
                لا توجد مصاريف لهذه العملة لعرضها
            </div>
        `;
        return;
    }

    const activeCur = state.activeCurrency;
    const curSymbol = CURRENCY_CONFIG[activeCur].symbol;

    let cumulativePercent = 0;
    let svgPaths = '';
    
    slices.forEach((slice, i) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice.value / total;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
        const percent = ((slice.value / total) * 100).toFixed(1);
        
        const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`
        ].join(' ');
        
        svgPaths += `<g class="chart-segment" style="--i: ${i};">
            <path d="${pathData}" fill="${slice.color}" class="segment-fill"></path>
            <path d="${pathData}" fill="${slice.color}" class="segment-glow" opacity="0"></path>
            <title>${escapeHtml(slice.label)}: ${percent}% (${formatCurrency(slice.value, activeCur)})</title>
        </g>`;
    });

    const centerColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff';

    chartContainer.innerHTML = `
        <div class="chart-wrapper">
            <div class="chart-svg-container">
                <svg viewBox="-1 -1 2 2" style="transform: rotate(-90deg);" class="svg-chart">
                    ${svgPaths}
                    <circle cx="0" cy="0" r="0.62" fill="${centerColor}" class="chart-center-ring"></circle>
                    <circle cx="0" cy="0" r="0.58" fill="${centerColor}" class="chart-center-dot"></circle>
                </svg>
                <div class="chart-center-total" style="color: var(--text-primary);">
                    <span class="chart-center-label">الإجمالي</span>
                    <span class="chart-center-value">${formatCurrency(total, activeCur)}</span>
                </div>
            </div>
            <div class="chart-legend" id="chartLegend">
                ${slices.map((slice, i) => {
                    const percent = ((slice.value / total) * 100).toFixed(1);
                    return `<div class="legend-item" style="--i: ${i};">
                        <span class="legend-dot" style="background: ${slice.color}; box-shadow: 0 0 6px ${slice.color}66;"></span>
                        <span class="legend-label">${escapeHtml(slice.label)}</span>
                        <span class="legend-percent">${percent}%</span>
                        <span class="legend-value">${formatCurrency(slice.value, activeCur)}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;
}

function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
}

// Backup tools
exportBtn.addEventListener('click', () => {
    if (state.expenses.length === 0 && state.suppliers.length === 0 && state.deliveryCompanies.length === 0) {
        showCustomAlert('لا توجد بيانات لتصديرها!', 'warning');
        return;
    }
    const backupData = {
        expenses: state.expenses,
        suppliers: state.suppliers,
        deliveryCompanies: state.deliveryCompanies,
        categories: state.categories
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `مصاريفي_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

importBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const importedData = JSON.parse(evt.target.result);
            if (importedData && (Array.isArray(importedData.expenses) || Array.isArray(importedData))) {
                
                showCustomConfirm({
                    title: 'استيراد ودمج البيانات',
                    message: 'هل أنت متأكد من استيراد هذه النسخة الاحتياطية؟ سيتم دمج العمليات والموردين والتوصيل مع بياناتك الحالية.',
                    iconClass: 'fa-solid fa-file-import',
                    iconColor: 'var(--primary)',
                    yesText: 'دمج الآن',
                    onConfirm: async () => {
                        let importedExp = [];
                        let importedSup = [];
                        let importedDel = [];
                        let importedCat = [];

                        if (Array.isArray(importedData)) {
                            importedExp = importedData;
                        } else {
                            importedExp = importedData.expenses || [];
                            importedSup = importedData.suppliers || [];
                            importedDel = importedData.deliveryCompanies || [];
                            importedCat = importedData.categories || [];
                        }

                        const existingExpIds = new Set(state.expenses.map(item => item.id));
                        const newExpenses = importedExp.filter(item => !existingExpIds.has(item.id));
                        state.expenses = [...newExpenses, ...state.expenses];

                        const existingSupIds = new Set(state.suppliers.map(s => s.id));
                        const newSuppliers = importedSup.filter(s => !existingSupIds.has(s.id));
                        state.suppliers = [...state.suppliers, ...newSuppliers];

                        const existingDelIds = new Set(state.deliveryCompanies.map(d => d.id));
                        const newDeliveries = importedDel.filter(d => !existingDelIds.has(d.id));
                        state.deliveryCompanies = [...state.deliveryCompanies, ...newDeliveries];

                        importedCat.forEach(newCat => {
                            if (!state.categories.some(c => c.id === newCat.id)) {
                                state.categories.push(newCat);
                            }
                        });

                        await saveState();
                        await saveSuppliers();
                        await saveDeliveryCompanies();
                        await saveCategories();
                        render();
                        showCustomAlert('تم استيراد ودمج البيانات بنجاح!', 'success');
                    }
                });
            } else {
                showCustomAlert('تنسيق ملف النسخة الاحتياطية غير صالح!', 'error');
            }
        } catch (err) {
            showCustomAlert('حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى.', 'error');
        }
    };
    reader.readAsText(file);
});

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

window.printStatement = function() {
    document.body.classList.add('show-statement-print');
    window.print();
    document.body.classList.remove('show-statement-print');
};

window.printGeneralHistory = function() {
    document.body.classList.add('show-history-print');
    window.print();
    document.body.classList.remove('show-history-print');
};


// ---- helper: إظهار خطأ Supabase للمستخدم ----
function showSupabaseError(operation, err) {
    const msg = (err && err.message) ? err.message : JSON.stringify(err);
    console.error(`Supabase [${operation}] failed:`, err);
    showCustomAlert(`⚠️ خطأ في حفظ البيانات على السحاب (${operation}):\n${msg}\n\nتم الحفظ محلياً فقط.`, 'warning');
}

// ---- Suppliers ----
async function saveSuppliers() {
    localStorage.setItem('project_expenses_suppliers', JSON.stringify(state.suppliers));
    if (!supabaseClient) return;
    for (const sup of state.suppliers) {
        const { error } = await supabaseClient.from('suppliers').upsert({
            id: sup.id,
            name: sup.name,
            phone: sup.phone || null
        });
        if (error) { showSupabaseError('saveSuppliers', error); return; }
    }
}

// ---- Delivery Companies ----
async function saveDeliveryCompanies() {
    localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(state.deliveryCompanies));
    if (!supabaseClient) return;
    for (const del of state.deliveryCompanies) {
        const { error } = await supabaseClient.from('delivery_companies').upsert({
            id: del.id,
            name: del.name,
            phone: del.phone || null
        });
        if (error) { showSupabaseError('saveDeliveryCompanies', error); return; }
    }
}

// ---- Categories ----
async function saveCategories() {
    localStorage.setItem('project_expenses_categories', JSON.stringify(state.categories));
    if (!supabaseClient) return;
    for (const cat of state.categories) {
        const { error } = await supabaseClient.from('categories').upsert({
            id: cat.id,
            label: cat.label,
            color: cat.color
        });
        if (error) { showSupabaseError('saveCategories', error); return; }
    }
}

// ---- تحويل بيانات العملية من camelCase إلى snake_case لتوافق Supabase ----
function expenseToDb(item) {
    return {
        id: item.id,
        title: item.title,
        type: item.type,
        category: item.category,
        supplier_id: item.supplierId || null,
        pay_method: item.payMethod || null,
        delivery_company_id: item.deliveryCompanyId || null,
        collect_method: item.collectMethod || null,
        amount: item.amount,
        currency: item.currency,
        date: item.date,
        notes: item.notes || null
    };
}

// ---- تحويل بيانات العملية من snake_case Supabase إلى camelCase للتطبيق ----
function dbToExpense(row) {
    return {
        id: row.id,
        title: row.title,
        type: row.type,
        category: row.category,
        supplierId: row.supplier_id || null,
        payMethod: row.pay_method || null,
        deliveryCompanyId: row.delivery_company_id || null,
        collectMethod: row.collect_method || null,
        amount: parseFloat(row.amount),
        currency: row.currency,
        date: row.date,
        notes: row.notes || ''
    };
}

// ---- Expenses ----
async function saveState() {
    localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses));
    if (!supabaseClient) return;
    const dbRows = state.expenses.map(expenseToDb);
    for (const row of dbRows) {
        const { error } = await supabaseClient.from('expenses').upsert(row);
        if (error) { showSupabaseError('saveState/expenses', error); return; }
    }
}

// ---- Load State (السحاب هو المصدر الأساسي) ----
async function loadState() {
    const savedExp = localStorage.getItem('project_expenses_multi_currency_v2');
    const savedSup = localStorage.getItem('project_expenses_suppliers');
    const savedDel = localStorage.getItem('project_expenses_delivery_companies');
    const savedCat = localStorage.getItem('project_expenses_categories');

    if (savedExp) { try { state.expenses = JSON.parse(savedExp); } catch(e) { state.expenses = []; } }
    if (savedSup) { try { state.suppliers = JSON.parse(savedSup); } catch(e) { state.suppliers = []; } }
    if (savedDel) { try { state.deliveryCompanies = JSON.parse(savedDel); } catch(e) { state.deliveryCompanies = []; } }
    if (savedCat) { try { state.categories = JSON.parse(savedCat); } catch(e) { state.categories = DEFAULT_CATEGORIES; } }
    else { state.categories = DEFAULT_CATEGORIES; }

    if (!supabaseClient) return;

    try {
        const { data: cats, error: catErr } = await supabaseClient.from('categories').select('*');
        const { data: sups, error: supErr } = await supabaseClient.from('suppliers').select('*');
        const { data: dels, error: delErr } = await supabaseClient.from('delivery_companies').select('*');
        const { data: exps, error: expErr } = await supabaseClient.from('expenses').select('*').order('date', { ascending: false });

        const hasCloudData = (cats && cats.length > 0) || (sups && sups.length > 0) ||
                             (dels && dels.length > 0) || (exps && exps.length > 0);

        if (hasCloudData) {
            if (!catErr && cats && cats.length > 0) {
                state.categories = cats;
                localStorage.setItem('project_expenses_categories', JSON.stringify(cats));
            }
            if (!supErr && sups && sups.length > 0) {
                state.suppliers = sups;
                localStorage.setItem('project_expenses_suppliers', JSON.stringify(sups));
            }
            if (!delErr && dels && dels.length > 0) {
                state.deliveryCompanies = dels;
                localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(dels));
            }
            if (!expErr && exps && exps.length > 0) {
                state.expenses = exps.map(dbToExpense);
                localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses));
            }
        } else if (!catErr && !supErr && !delErr && !expErr) {
            if (state.categories.length > 0) {
                for (const cat of state.categories) {
                    await supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color });
                }
            } else {
                for (const cat of DEFAULT_CATEGORIES) {
                    await supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color });
                }
                state.categories = DEFAULT_CATEGORIES;
            }
            if (state.suppliers.length > 0) {
                for (const sup of state.suppliers) {
                    await supabaseClient.from('suppliers').upsert({ id: sup.id, name: sup.name, phone: sup.phone || null });
                }
            }
            if (state.deliveryCompanies.length > 0) {
                for (const del of state.deliveryCompanies) {
                    await supabaseClient.from('delivery_companies').upsert({ id: del.id, name: del.name, phone: del.phone || null });
                }
            }
            if (state.expenses.length > 0) {
                const dbRows = state.expenses.map(expenseToDb);
                for (const row of dbRows) {
                    await supabaseClient.from('expenses').upsert(row);
                }
            }
        }
    } catch (e) {
        console.error('Supabase loadState failed, using localStorage cache:', e);
    }
}

