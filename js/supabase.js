window.supabaseClient = null;

function initSupabase() {
    let url = localStorage.getItem('project_expenses_supabase_url');
    let key = localStorage.getItem('project_expenses_supabase_key');
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
                window.supabaseClient = supabase.createClient(url, key);
                if (statusEl) { statusEl.className = 'tools-badge'; statusEl.style.background = 'var(--success-light)'; statusEl.style.color = 'var(--success)'; statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> متصل بالسحاب (سوبابيز)`; }
                if (syncContainer) syncContainer.style.display = 'block';
                if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
                if (inputUrl) inputUrl.value = url;
                if (inputKey) inputKey.value = key;
                startRealtimeSync();
            } else { throw new Error('Supabase SDK not loaded'); }
        } catch (e) {
            console.error('Failed to init Supabase:', e);
            stopRealtimeSync();
            if (statusEl) { statusEl.className = 'tools-badge'; statusEl.style.background = 'var(--danger-light)'; statusEl.style.color = 'var(--danger)'; statusEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> فشل الاتصال بالسحاب`; }
        }
    } else {
        window.supabaseClient = null;
        stopRealtimeSync();
        if (statusEl) { statusEl.className = 'tools-badge'; statusEl.style.background = 'rgba(100,116,139,0.15)'; statusEl.style.color = 'var(--text-secondary)'; statusEl.innerHTML = `<i class="fa-solid fa-circle-question"></i> غير متصل بالسحاب (يعمل محلياً فقط)`; }
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
            if (!url || !key) { showCustomAlert('الرجاء إدخال الرابط والمفتاح العام بشكل صحيح.', 'error'); return; }
            try {
                const testClient = supabase.createClient(url, key);
                const { data, error } = await testClient.from('categories').select('id').limit(1);
                if (error) throw error;
                localStorage.setItem('project_expenses_supabase_url', url);
                localStorage.setItem('project_expenses_supabase_key', key);
                showCustomAlert('تم الاتصال بقاعدة بيانات Supabase بنجاح!', 'success');
                initSupabase();
                await loadState();
                startRealtimeSync();
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
                title: 'قطع الاتصال السحابي', message: 'هل أنت متأكد من قطع الاتصال بـ Supabase والرجوع للتخزين المحلي فقط؟ (لن يتم مسح أي بيانات سحابية)',
                iconClass: 'fa-solid fa-link-slash', iconColor: 'var(--warning)',
                onConfirm: async () => {
                    localStorage.removeItem('project_expenses_supabase_url'); localStorage.removeItem('project_expenses_supabase_key');
                    stopRealtimeSync(); initSupabase(); await loadState(); render();
                    showCustomAlert('تم قطع الاتصال والتحويل للتخزين المحلي بنجاح.', 'success');
                }
            });
        });
    }
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            if (!window.supabaseClient) return;
            showCustomConfirm({
                title: 'رفع ومزامنة البيانات', message: 'هل تريد رفع كافة الموردين والشركات والعمليات والتصنيفات المخزنة حالياً في هذا الجهاز إلى قاعدة البيانات السحابية؟ (سيتم دمجها مع البيانات السحابية الحالية)',
                iconClass: 'fa-solid fa-cloud-arrow-up', iconColor: 'var(--primary)',
                onConfirm: async () => {
                    try {
                        if (state.categories.length > 0) { const { error: catErr } = await window.supabaseClient.from('categories').upsert(state.categories); if (catErr) throw catErr; }
                        if (state.suppliers.length > 0) { const { error: supErr } = await window.supabaseClient.from('suppliers').upsert(state.suppliers); if (supErr) throw supErr; }
                        if (state.deliveryCompanies.length > 0) { const { error: delErr } = await window.supabaseClient.from('delivery_companies').upsert(state.deliveryCompanies); if (delErr) throw delErr; }
                        if (state.expenses.length > 0) { const { error: expErr } = await window.supabaseClient.from('expenses').upsert(state.expenses); if (expErr) throw expErr; }
                        showCustomAlert('تمت المزامنة ورفع كافة البيانات المحلية إلى السحاب بنجاح!', 'success');
                        await loadState(); render();
                    } catch (e) { console.error('Sync failed:', e); showCustomAlert('حدث خطأ أثناء مزامنة البيانات: ' + e.message, 'error'); }
                }
            });
        });
    }
}

async function syncWithSupabaseBackground() {
    if (!window.supabaseClient) return;
    try {
        const { data: cats, error: catErr } = await window.supabaseClient.from('categories').select('*');
        const { data: sups, error: supErr } = await window.supabaseClient.from('suppliers').select('*');
        const { data: dels, error: delErr } = await window.supabaseClient.from('delivery_companies').select('*');
        const { data: exps, error: expErr } = await window.supabaseClient.from('expenses').select('*').order('date', { ascending: false });
        const hasCloudData = (cats && cats.length > 0) || (sups && sups.length > 0) || (dels && dels.length > 0) || (exps && exps.length > 0);
        if (hasCloudData) {
            if (!catErr && cats && cats.length > 0) { state.categories = cats; localStorage.setItem('project_expenses_categories', JSON.stringify(cats)); }
            if (!supErr && sups && sups.length > 0) { state.suppliers = sups; localStorage.setItem('project_expenses_suppliers', JSON.stringify(sups)); }
            if (!delErr && dels && dels.length > 0) { state.deliveryCompanies = dels; localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(dels)); }
            if (!expErr && exps && exps.length > 0) { state.expenses = exps.map(dbToExpense); localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses)); }
        } else {
            if (state.categories.length > 0) { for (const cat of state.categories) { await window.supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color }); } }
            if (state.suppliers.length > 0) { for (const sup of state.suppliers) { await window.supabaseClient.from('suppliers').upsert({ id: sup.id, name: sup.name, phone: sup.phone || null }); } }
            if (state.deliveryCompanies.length > 0) { for (const del of state.deliveryCompanies) { await window.supabaseClient.from('delivery_companies').upsert({ id: del.id, name: del.name, phone: del.phone || null }); } }
            if (state.expenses.length > 0) { const dbRows = state.expenses.map(expenseToDb); for (const row of dbRows) { await window.supabaseClient.from('expenses').upsert(row); } }
        }
        render();
    } catch (e) { console.error('Background Supabase sync failed:', e); }
}

function startRealtimeSync() {
    if (syncInterval) clearInterval(syncInterval);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && window.supabaseClient) syncWithSupabaseBackground();
    });
    syncInterval = setInterval(() => { if (window.supabaseClient) syncWithSupabaseBackground(); }, 30000);
}

function stopRealtimeSync() {
    if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
}

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
    if (!window.supabaseClient) return;
    try {
        const { data: cats, error: catErr } = await window.supabaseClient.from('categories').select('*');
        const { data: sups, error: supErr } = await window.supabaseClient.from('suppliers').select('*');
        const { data: dels, error: delErr } = await window.supabaseClient.from('delivery_companies').select('*');
        const { data: exps, error: expErr } = await window.supabaseClient.from('expenses').select('*').order('date', { ascending: false });
        const hasCloudData = (cats && cats.length > 0) || (sups && sups.length > 0) || (dels && dels.length > 0) || (exps && exps.length > 0);
        if (hasCloudData) {
            if (!catErr && cats && cats.length > 0) { state.categories = cats; localStorage.setItem('project_expenses_categories', JSON.stringify(cats)); }
            if (!supErr && sups && sups.length > 0) { state.suppliers = sups; localStorage.setItem('project_expenses_suppliers', JSON.stringify(sups)); }
            if (!delErr && dels && dels.length > 0) { state.deliveryCompanies = dels; localStorage.setItem('project_expenses_delivery_companies', JSON.stringify(dels)); }
            if (!expErr && exps && exps.length > 0) { state.expenses = exps.map(dbToExpense); localStorage.setItem('project_expenses_multi_currency_v2', JSON.stringify(state.expenses)); }
        } else if (!catErr && !supErr && !delErr && !expErr) {
            if (state.categories.length > 0) { for (const cat of state.categories) { await window.supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color }); } }
            else { for (const cat of DEFAULT_CATEGORIES) { await window.supabaseClient.from('categories').upsert({ id: cat.id, label: cat.label, color: cat.color }); } state.categories = DEFAULT_CATEGORIES; }
            if (state.suppliers.length > 0) { for (const sup of state.suppliers) { await window.supabaseClient.from('suppliers').upsert({ id: sup.id, name: sup.name, phone: sup.phone || null }); } }
            if (state.deliveryCompanies.length > 0) { for (const del of state.deliveryCompanies) { await window.supabaseClient.from('delivery_companies').upsert({ id: del.id, name: del.name, phone: del.phone || null }); } }
            if (state.expenses.length > 0) { const dbRows = state.expenses.map(expenseToDb); for (const row of dbRows) { await window.supabaseClient.from('expenses').upsert(row); } }
        }
    } catch (e) { console.error('Supabase loadState failed, using localStorage cache:', e); }
}
