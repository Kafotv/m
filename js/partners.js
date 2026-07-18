function renderSuppliersDropdown() {
    const currentVal = expSupplier.value;
    expSupplier.innerHTML = '<option value="">-- بدون مورد --</option>';
    state.suppliers.forEach(sup => { const opt = document.createElement('option'); opt.value = sup.id; opt.textContent = sup.name; expSupplier.appendChild(opt); });
    expSupplier.value = currentVal;
}

function renderDeliveryDropdown() {
    const currentVal = expDelivery.value;
    expDelivery.innerHTML = '<option value="">-- بدون شركة توصيل --</option>';
    state.deliveryCompanies.forEach(del => { const opt = document.createElement('option'); opt.value = del.id; opt.textContent = del.name; expDelivery.appendChild(opt); });
    expDelivery.value = currentVal;
}

function setupSupplierForm() {
    supplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state.editSupplierId) {
            const sup = state.suppliers.find(s => s.id === state.editSupplierId);
            if (sup) { sup.name = supName.value.trim(); sup.phone = supPhone.value.trim(); }
            state.editSupplierId = null; SoundEffects.play('add');
        } else {
            state.suppliers.push({ id: Date.now().toString(), name: supName.value.trim(), phone: supPhone.value.trim() });
            SoundEffects.play('add');
        }
        await saveSuppliers();
        renderSuppliersDropdown(); renderSuppliersGrid();
        supName.value = ''; supPhone.value = ''; resetSupModalHeaders();
        supplierModal.classList.remove('active');
    });
}

function resetSupModalHeaders() {
    document.getElementById('supModalTitle').innerHTML = `<i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> إضافة مورد جديد`;
    document.getElementById('supSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ المورد`;
    state.editSupplierId = null;
}

function setupDeliveryForm() {
    deliveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state.editDeliveryId) {
            const del = state.deliveryCompanies.find(d => d.id === state.editDeliveryId);
            if (del) { del.name = delName.value.trim(); del.phone = delPhone.value.trim(); }
            state.editDeliveryId = null; SoundEffects.play('add');
        } else {
            state.deliveryCompanies.push({ id: Date.now().toString(), name: delName.value.trim(), phone: delPhone.value.trim() });
            SoundEffects.play('add');
        }
        await saveDeliveryCompanies();
        renderDeliveryDropdown(); renderDeliveryGrid();
        delName.value = ''; delPhone.value = ''; resetDelModalHeaders();
        deliveryModal.classList.remove('active');
    });
}

function resetDelModalHeaders() {
    document.getElementById('delModalTitle').innerHTML = `<i class="fa-solid fa-truck" style="color: var(--primary);"></i> إضافة شركة توصيل جديدة`;
    document.getElementById('delSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ شركة التوصيل`;
    state.editDeliveryId = null;
}

function renderSuppliersGrid() {
    suppliersGrid.innerHTML = '';
    if (state.suppliers.length === 0) {
        suppliersGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding:2rem;"><i class="fa-solid fa-users" style="font-size:2.5rem; opacity:0.3; margin-bottom:0.5rem; display:block;"></i> لم تقم بإضافة موردين حتى الآن.</div>`;
        return;
    }
    state.suppliers.forEach(sup => {
        const debts = { ILS: 0, USD: 0, JOD: 0 };
        state.expenses.forEach(item => {
            if (item.supplierId === sup.id) {
                if (item.payMethod === 'credit') debts[item.currency] += item.amount;
                else if (item.payMethod === 'payment') debts[item.currency] -= item.amount;
            }
        });
        const initials = sup.name.trim().charAt(0).toUpperCase();
        const card = document.createElement('div');
        card.className = 'card supplier-card';
        card.setAttribute('onclick', `cardClicked(event, '${sup.id}', 'supplier')`);
        const telLink = sup.phone ? `<a href="tel:${sup.phone}" class="supplier-phone"><i class="fa-solid fa-phone"></i> ${sup.phone}</a>` : '<span class="supplier-phone">بدون هاتف</span>';
        card.innerHTML = `<div class="supplier-card-header"><div class="supplier-avatar">${initials}</div><div class="supplier-info"><span class="supplier-name">${escapeHtml(sup.name)}</span>${telLink}</div></div><div class="supplier-balances-grid"><div class="balance-col ${debts.ILS > 0 ? 'active-debt' : ''}"><span class="balance-currency">شيكل</span><strong class="balance-amount">${formatCurrency(debts.ILS, 'ILS')}</strong></div><div class="balance-col ${debts.USD > 0 ? 'active-debt' : ''}"><span class="balance-currency">دولار</span><strong class="balance-amount">${formatCurrency(debts.USD, 'USD')}</strong></div><div class="balance-col ${debts.JOD > 0 ? 'active-debt' : ''}"><span class="balance-currency">دينار</span><strong class="balance-amount">${formatCurrency(debts.JOD, 'JOD')}</strong></div></div><div class="supplier-card-actions"><button type="button" class="btn btn-primary btn-sm" onclick="quickPaySupplier('${sup.id}')"><i class="fa-solid fa-hand-holding-dollar"></i> دفع دفعة</button><button type="button" class="btn btn-outline btn-sm" onclick="viewSupplierStatement('${sup.id}')"><i class="fa-solid fa-receipt"></i> كشف حساب</button></div><div class="supplier-card-top-actions"><button type="button" class="edit-sup-btn" onclick="editSupplier('${sup.id}', event)" title="تعديل"><i class="fa-solid fa-user-pen"></i></button><button type="button" class="delete-sup-btn" onclick="deleteSupplier('${sup.id}')" title="حذف"><i class="fa-solid fa-trash-can"></i></button></div>`;
        suppliersGrid.appendChild(card);
    });
}

function renderDeliveryGrid() {
    deliveryGrid.innerHTML = '';
    if (state.deliveryCompanies.length === 0) {
        deliveryGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding:2rem;"><i class="fa-solid fa-truck-ramp-box" style="font-size:2.5rem; opacity:0.3; margin-bottom:0.5rem; display:block;"></i> لم تقم بإضافة شركات توصيل حتى الآن.</div>`;
        return;
    }
    state.deliveryCompanies.forEach(del => {
        const receivables = { ILS: 0, USD: 0, JOD: 0 };
        state.expenses.forEach(item => {
            if (item.deliveryCompanyId === del.id) {
                if (item.collectMethod === 'pending') receivables[item.currency] += item.amount;
                else if (item.collectMethod === 'received') receivables[item.currency] -= item.amount;
            }
        });
        const initials = del.name.trim().charAt(0).toUpperCase();
        const card = document.createElement('div');
        card.className = 'card supplier-card';
        card.setAttribute('onclick', `cardClicked(event, '${del.id}', 'delivery')`);
        const telLink = del.phone ? `<a href="tel:${del.phone}" class="supplier-phone"><i class="fa-solid fa-phone"></i> ${del.phone}</a>` : '<span class="supplier-phone">بدون هاتف</span>';
        card.innerHTML = `<div class="supplier-card-header"><div class="supplier-avatar" style="background:linear-gradient(135deg,var(--success),var(--info));">${initials}</div><div class="supplier-info"><span class="supplier-name">${escapeHtml(del.name)}</span>${telLink}</div></div><div class="supplier-balances-grid"><div class="balance-col ${receivables.ILS > 0 ? 'active-collect' : ''}"><span class="balance-currency">شيكل</span><strong class="balance-amount">${formatCurrency(receivables.ILS, 'ILS')}</strong></div><div class="balance-col ${receivables.USD > 0 ? 'active-collect' : ''}"><span class="balance-currency">دولار</span><strong class="balance-amount">${formatCurrency(receivables.USD, 'USD')}</strong></div><div class="balance-col ${receivables.JOD > 0 ? 'active-collect' : ''}"><span class="balance-currency">دينار</span><strong class="balance-amount">${formatCurrency(receivables.JOD, 'JOD')}</strong></div></div><div class="supplier-card-actions"><button type="button" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,var(--success),var(--info));" onclick="quickCollectDelivery('${del.id}')"><i class="fa-solid fa-money-bill-pull-card"></i> استلام كاش</button><button type="button" class="btn btn-outline btn-sm" onclick="viewDeliveryStatement('${del.id}')"><i class="fa-solid fa-receipt"></i> كشف حساب</button></div><div class="supplier-card-top-actions"><button type="button" class="edit-sup-btn" onclick="editDelivery('${del.id}', event)" title="تعديل"><i class="fa-solid fa-user-pen"></i></button><button type="button" class="delete-sup-btn" onclick="deleteDelivery('${del.id}')" title="حذف"><i class="fa-solid fa-trash-can"></i></button></div>`;
        deliveryGrid.appendChild(card);
    });
}

window.cardClicked = function(event, id, type) {
    if (event.target.closest('.supplier-card-actions') || event.target.closest('.supplier-card-top-actions') || event.target.closest('.delete-sup-btn') || event.target.closest('.edit-sup-btn') || event.target.closest('.supplier-phone')) return;
    if (type === 'supplier') viewSupplierStatement(id);
    else viewDeliveryStatement(id);
};

window.editSupplier = function(supId, event) {
    if (event) event.stopPropagation();
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;
    state.editSupplierId = supId; supName.value = sup.name; supPhone.value = sup.phone || '';
    document.getElementById('supModalTitle').innerHTML = `<i class="fa-solid fa-user-pen" style="color: var(--primary);"></i> تعديل بيانات المورد`;
    document.getElementById('supSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;
    SoundEffects.play('edit'); supplierModal.classList.add('active'); supName.focus();
};

window.editDelivery = function(delId, event) {
    if (event) event.stopPropagation();
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;
    state.editDeliveryId = delId; delName.value = del.name; delPhone.value = del.phone || '';
    document.getElementById('delModalTitle').innerHTML = `<i class="fa-solid fa-user-pen" style="color: var(--primary);"></i> تعديل بيانات شركة التوصيل`;
    document.getElementById('delSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;
    SoundEffects.play('edit'); deliveryModal.classList.add('active'); delName.focus();
};

window.quickPaySupplier = function(supId) {
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;
    state.formType = 'expense'; typeExpenseBtn.classList.add('active'); typeIncomeBtn.classList.remove('active');
    supplierRelationGroup.style.display = 'block'; deliveryRelationGroup.style.display = 'none'; collectMethodGroup.style.display = 'none';
    expTitle.value = `دفعة لحساب المورد: ${sup.name}`;
    if (state.categories.some(c => c.id === 'goods')) expCategory.value = 'goods';
    expSupplier.value = supId; payMethodGroup.style.display = 'block'; expPayMethod.value = 'payment';
    SoundEffects.play('click'); transactionModal.classList.add('active'); expAmount.focus();
};

window.quickCollectDelivery = function(delId) {
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;
    state.formType = 'income'; typeIncomeBtn.classList.add('active'); typeExpenseBtn.classList.remove('active');
    supplierRelationGroup.style.display = 'none'; payMethodGroup.style.display = 'none';
    deliveryRelationGroup.style.display = 'block';
    expTitle.value = `استلام دفعة من شركة التوصيل: ${del.name}`;
    if (state.categories.some(c => c.id === 'bank')) expCategory.value = 'bank';
    expDelivery.value = delId; collectMethodGroup.style.display = 'block'; expCollectMethod.value = 'received';
    SoundEffects.play('click'); transactionModal.classList.add('active'); expAmount.focus();
};

window.deleteSupplier = function(supId) {
    const linkedTxs = state.expenses.some(item => item.supplierId === supId);
    if (linkedTxs) { showCustomAlert('لا يمكن حذف المورد لأنه يحتوي على عمليات مسجلة باسمه في السجل. لحذفه يجب تعديل أو حذف عملياته أولاً.', 'error'); return; }
    showCustomConfirm({
        title: 'حذف مورد', message: 'هل أنت متأكد من حذف هذا المورد بشكل نهائي من النظام؟',
        iconClass: 'fa-solid fa-trash-can', iconColor: 'var(--danger)', yesText: 'نعم، احذفه',
        onConfirm: async () => {
            state.suppliers = state.suppliers.filter(s => s.id !== supId);
            if (window.supabaseClient) { try { await window.supabaseClient.from('suppliers').delete().eq('id', supId); } catch(e) { console.error(e); } }
            await saveSuppliers(); render(); SoundEffects.play('delete');
        }
    });
};

window.deleteDelivery = function(delId) {
    const linkedTxs = state.expenses.some(item => item.deliveryCompanyId === delId);
    if (linkedTxs) { showCustomAlert('لا يمكن حذف الشركة لأنها تحتوي على عمليات مسجلة باسمها في السجل. لحذفها يجب تعديل أو حذف عملياتها أولاً.', 'error'); return; }
    showCustomConfirm({
        title: 'حذف شركة توصيل', message: 'هل أنت متأكد من حذف هذه الشركة نهائياً من النظام؟',
        iconClass: 'fa-solid fa-trash-can', iconColor: 'var(--danger)', yesText: 'نعم، احذفها',
        onConfirm: async () => {
            state.deliveryCompanies = state.deliveryCompanies.filter(d => d.id !== delId);
            if (window.supabaseClient) { try { await window.supabaseClient.from('delivery_companies').delete().eq('id', delId); } catch(e) { console.error(e); } }
            await saveDeliveryCompanies(); render(); SoundEffects.play('delete');
        }
    });
};

function setupPartnerModalsEvents() {
    openSupModalBtn.addEventListener('click', () => { resetSupModalHeaders(); supplierModal.classList.add('active'); supName.focus(); });
    closeSupModalBtn.addEventListener('click', () => { supplierModal.classList.remove('active'); supName.value = ''; supPhone.value = ''; resetSupModalHeaders(); });
    supplierModal.addEventListener('click', (e) => { if (e.target === supplierModal) { supplierModal.classList.remove('active'); resetSupModalHeaders(); } });
    openDelModalBtn.addEventListener('click', () => { resetDelModalHeaders(); deliveryModal.classList.add('active'); delName.focus(); });
    closeDelModalBtn.addEventListener('click', () => { deliveryModal.classList.remove('active'); delName.value = ''; delPhone.value = ''; resetDelModalHeaders(); });
    deliveryModal.addEventListener('click', (e) => { if (e.target === deliveryModal) { deliveryModal.classList.remove('active'); resetDelModalHeaders(); } });
    closeModalBtn.addEventListener('click', () => statementModal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === statementModal) statementModal.classList.remove('active'); });
}

// Statement modal
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
        SoundEffects.play('click'); renderStatementTable();
    };
    btnAll.addEventListener('click', () => setStatusTab('all'));
    btnPaid.addEventListener('click', () => setStatusTab('paid'));
    btnDebt.addEventListener('click', () => setStatusTab('debt'));
    modalDateFilter.addEventListener('change', () => {
        const val = modalDateFilter.value;
        if (val === 'custom') { modalCustomDateRange.style.display = 'flex'; modalSpecificMonthContainer.style.display = 'none'; }
        else if (val === 'specific-month') { modalCustomDateRange.style.display = 'none'; modalSpecificMonthContainer.style.display = 'flex'; if (!modalFilterMonth.value) { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth()+1).padStart(2,'0'); modalFilterMonth.value = `${y}-${m}`; } }
        else { modalCustomDateRange.style.display = 'none'; modalSpecificMonthContainer.style.display = 'none'; }
        renderStatementTable();
    });
    modalFilterMonth.addEventListener('change', renderStatementTable);
    modalStartDate.addEventListener('change', renderStatementTable);
    modalEndDate.addEventListener('change', renderStatementTable);
    modalSearchInput.addEventListener('input', renderStatementTable);
}

function renderStatementTable() {
    if (!activeStatementPartnerId) return;
    const partnerId = activeStatementPartnerId;
    const type = activeStatementPartnerType;
    const modalDateFilter = document.getElementById('modalDateFilter');
    const modalFilterMonth = document.getElementById('modalFilterMonth');
    const modalStartDate = document.getElementById('modalStartDate');
    const modalEndDate = document.getElementById('modalEndDate');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const dateRange = modalDateFilter.value;
    let startDate = null; let endDate = null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateRange === 'today') { startDate = todayStr; endDate = todayStr; }
    else if (dateRange === 'month') { const y = now.getFullYear(); const m = now.getMonth(); startDate = new Date(y,m,1).toISOString().split('T')[0]; endDate = new Date(y,m+1,0).toISOString().split('T')[0]; }
    else if (dateRange === 'specific-month') { const selected = modalFilterMonth.value; if (selected) { const [y,m] = selected.split('-').map(Number); startDate = `${selected}-01`; endDate = `${selected}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`; } }
    else if (dateRange === 'custom') { startDate = modalStartDate.value || null; endDate = modalEndDate.value || null; }
    const searchText = modalSearchInput.value.toLowerCase().trim();
    modalTableBody.innerHTML = '';
    let txs = type === 'supplier' ? state.expenses.filter(item => item.supplierId === partnerId) : state.expenses.filter(item => item.deliveryCompanyId === partnerId);
    const filteredTxs = txs.filter(item => {
        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && (item.date >= startDate);
        if (endDate) matchesDate = matchesDate && (item.date <= endDate);
        if (!matchesDate) return false;
        const matchesSearch = item.title.toLowerCase().includes(searchText) || (item.notes && item.notes.toLowerCase().includes(searchText));
        if (!matchesSearch) return false;
        if (activeStatementStatusFilter === 'paid') { if (type === 'supplier') return item.payMethod === 'cash' || item.payMethod === 'payment'; else return item.collectMethod === 'received'; }
        else if (activeStatementStatusFilter === 'debt') { if (type === 'supplier') return item.payMethod === 'credit'; else return item.collectMethod === 'pending'; }
        return true;
    });
    if (filteredTxs.length === 0) { modalTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">لا توجد معاملات مطابقة للفلتر المحدد.</td></tr>`; }
    else {
        filteredTxs.forEach(item => {
            const tr = document.createElement('tr');
            let typeLabel = ''; let statusLabel = '';
            if (type === 'supplier') {
                typeLabel = item.type === 'income' ? 'دخل وإيداع' : 'مصروف';
                if (item.payMethod === 'cash') statusLabel = '<span class="badge other">كاش كامل</span>';
                else if (item.payMethod === 'credit') statusLabel = '<span class="badge" style="background:var(--danger-light); color:var(--danger);">دين / آجل</span>';
                else if (item.payMethod === 'payment') statusLabel = '<span class="badge" style="background:var(--success-light); color:var(--success);">سداد دفعة</span>';
            } else {
                typeLabel = item.type === 'income' ? 'دخل وتحصيل' : 'مصروف';
                if (item.collectMethod === 'pending') statusLabel = '<span class="badge" style="background:var(--warning-light); color:var(--warning);">ذمة معلقة</span>';
                else if (item.collectMethod === 'received') statusLabel = '<span class="badge" style="background:var(--success-light); color:var(--success);">استلام كاش</span>';
            }
            tr.innerHTML = `<td>${item.date}</td><td style="font-weight:500;">${escapeHtml(item.title)}</td><td>${typeLabel}</td><td>${statusLabel}</td><td style="font-weight:700;">${formatCurrency(item.amount, item.currency)}</td>`;
            modalTableBody.appendChild(tr);
        });
    }
}

window.viewSupplierStatement = function(supId) {
    const sup = state.suppliers.find(s => s.id === supId);
    if (!sup) return;
    activeStatementPartnerId = supId; activeStatementPartnerType = 'supplier'; activeStatementStatusFilter = 'all';
    modalTitle.innerHTML = `<i class="fa-solid fa-receipt" style="color: var(--primary); margin-left: 0.5rem;"></i>كشف حساب المورد: ${sup.name}`;
    document.getElementById('modalDateFilter').value = 'all';
    document.getElementById('modalCustomDateRange').style.display = 'none';
    document.getElementById('modalSpecificMonthContainer').style.display = 'none';
    document.getElementById('modalStartDate').value = ''; document.getElementById('modalEndDate').value = '';
    document.getElementById('modalFilterMonth').value = ''; document.getElementById('modalSearchInput').value = '';
    document.getElementById('modalStatusAll').classList.add('active');
    document.getElementById('modalStatusPaid').classList.remove('active');
    document.getElementById('modalStatusDebt').classList.remove('active');
    SoundEffects.play('click'); renderStatementTable(); statementModal.classList.add('active');
};

window.viewDeliveryStatement = function(delId) {
    const del = state.deliveryCompanies.find(d => d.id === delId);
    if (!del) return;
    activeStatementPartnerId = delId; activeStatementPartnerType = 'delivery'; activeStatementStatusFilter = 'all';
    modalTitle.innerHTML = `<i class="fa-solid fa-receipt" style="color: var(--primary); margin-left: 0.5rem;"></i>كشف حساب شركة التوصيل: ${del.name}`;
    document.getElementById('modalDateFilter').value = 'all';
    document.getElementById('modalCustomDateRange').style.display = 'none';
    document.getElementById('modalSpecificMonthContainer').style.display = 'none';
    document.getElementById('modalStartDate').value = ''; document.getElementById('modalEndDate').value = '';
    document.getElementById('modalFilterMonth').value = ''; document.getElementById('modalSearchInput').value = '';
    document.getElementById('modalStatusAll').classList.add('active');
    document.getElementById('modalStatusPaid').classList.remove('active');
    document.getElementById('modalStatusDebt').classList.remove('active');
    SoundEffects.play('click'); renderStatementTable(); statementModal.classList.add('active');
};

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
