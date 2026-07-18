function setupFormTypeToggles() {
    const updateGroups = () => {
        if (state.formType === 'expense') {
            supplierRelationGroup.style.display = 'block'; deliveryRelationGroup.style.display = 'none'; collectMethodGroup.style.display = 'none'; expDelivery.value = '';
            if (expSupplier.value) payMethodGroup.style.display = 'block';
        } else {
            supplierRelationGroup.style.display = 'none'; payMethodGroup.style.display = 'none'; expSupplier.value = '';
            deliveryRelationGroup.style.display = 'block';
            if (expDelivery.value) collectMethodGroup.style.display = 'block';
        }
    };
    typeExpenseBtn.addEventListener('click', () => {
        state.formType = 'expense'; typeExpenseBtn.classList.add('active'); typeIncomeBtn.classList.remove('active');
        if (state.categories.some(c => c.id === 'goods')) expCategory.value = 'goods';
        else if (state.categories.length > 0) expCategory.value = state.categories[0].id;
        updateGroups();
    });
    typeIncomeBtn.addEventListener('click', () => {
        state.formType = 'income'; typeIncomeBtn.classList.add('active'); typeExpenseBtn.classList.remove('active');
        if (state.categories.some(c => c.id === 'bank')) expCategory.value = 'bank';
        else if (state.categories.length > 0) expCategory.value = state.categories[0].id;
        updateGroups();
    });
}

function setupCurrencyToggles() {
    const switchCurrency = (newCur) => { state.activeCurrency = newCur; expCurrency.value = newCur; updateCurrencyTabStyles(); render(); };
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

function setupTxModalEvents() {
    const openModal = () => { if (!state.editId) resetTxForm(); transactionModal.classList.add('active'); };
    const closeModal = () => { transactionModal.classList.remove('active'); resetTxForm(); };
    openTxModalBtn.addEventListener('click', openModal);
    openTxModalBtnMobile.addEventListener('click', openModal);
    closeTxModalBtn.addEventListener('click', closeModal);
    transactionModal.addEventListener('click', (e) => { if (e.target === transactionModal) closeModal(); });
}

function resetTxForm() {
    state.editId = null;
    const txModalTitle = document.getElementById('txModalTitle');
    const txSubmitBtn = document.getElementById('txSubmitBtn');
    if (txModalTitle) txModalTitle.innerHTML = `<i class="fa-solid fa-circle-plus" style="color: var(--primary);"></i> إضافة عملية جديدة`;
    if (txSubmitBtn) txSubmitBtn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ العملية`;
    expenseForm.reset();
    expDate.value = new Date().toISOString().split('T')[0];
    payMethodGroup.style.display = 'none';
    collectMethodGroup.style.display = 'none';
}

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedSupVal = expSupplier.value;
    const selectedDelVal = expDelivery.value;
    const payMethodVal = selectedSupVal ? expPayMethod.value : 'cash';
    const collectMethodVal = selectedDelVal ? expCollectMethod.value : 'received';
    if (state.editId) {
        const tx = state.expenses.find(item => item.id === state.editId);
        if (tx) {
            tx.title = expTitle.value.trim(); tx.type = state.formType; tx.category = expCategory.value;
            tx.supplierId = state.formType === 'expense' ? (selectedSupVal || null) : null;
            tx.payMethod = state.formType === 'expense' ? payMethodVal : null;
            tx.deliveryCompanyId = state.formType === 'income' ? (selectedDelVal || null) : null;
            tx.collectMethod = state.formType === 'income' ? collectMethodVal : null;
            tx.amount = parseFloat(expAmount.value); tx.currency = expCurrency.value; tx.date = expDate.value; tx.notes = expNotes.value.trim();
        }
        state.editId = null; SoundEffects.play('add');
    } else {
        const newTx = {
            id: Date.now().toString(), title: expTitle.value.trim(), type: state.formType, category: expCategory.value,
            supplierId: state.formType === 'expense' ? (selectedSupVal || null) : null,
            payMethod: state.formType === 'expense' ? payMethodVal : null,
            deliveryCompanyId: state.formType === 'income' ? (selectedDelVal || null) : null,
            collectMethod: state.formType === 'income' ? collectMethodVal : null,
            amount: parseFloat(expAmount.value), currency: expCurrency.value, date: expDate.value, notes: expNotes.value.trim()
        };
        state.expenses.unshift(newTx); SoundEffects.play('add');
    }
    await saveState(); render();
    transactionModal.classList.remove('active'); resetTxForm();
    const historyNav = [...document.querySelectorAll('.nav-btn'), ...document.querySelectorAll('.nav-item')].find(n => n.getAttribute('data-tab') === 'history');
    if (historyNav) historyNav.click();
});

window.deleteExpense = function(id) {
    showCustomConfirm({
        title: 'حذف عملية مالية', message: 'هل أنت متأكد من حذف هذه العملية بشكل نهائي من السجل؟',
        iconClass: 'fa-solid fa-trash-can', iconColor: 'var(--danger)', yesText: 'حذف الآن',
        onConfirm: async () => {
            state.expenses = state.expenses.filter(item => item.id !== id);
            if (window.supabaseClient) { try { await window.supabaseClient.from('expenses').delete().eq('id', id); } catch(e) { console.error(e); } }
            await saveState(); render(); SoundEffects.play('delete');
        }
    });
};

window.editExpense = function(id) {
    const tx = state.expenses.find(item => item.id === id);
    if (!tx) return;
    state.editId = id; state.formType = tx.type;
    if (tx.type === 'expense') {
        typeExpenseBtn.classList.add('active'); typeIncomeBtn.classList.remove('active');
        supplierRelationGroup.style.display = 'block'; deliveryRelationGroup.style.display = 'none'; collectMethodGroup.style.display = 'none';
    } else {
        typeIncomeBtn.classList.add('active'); typeExpenseBtn.classList.remove('active');
        supplierRelationGroup.style.display = 'none'; payMethodGroup.style.display = 'none'; deliveryRelationGroup.style.display = 'block';
    }
    expTitle.value = tx.title; expCategory.value = tx.category;
    if (tx.type === 'expense') {
        expSupplier.value = tx.supplierId || '';
        if (tx.supplierId) { payMethodGroup.style.display = 'block'; expPayMethod.value = tx.payMethod || 'cash'; }
        else payMethodGroup.style.display = 'none';
    } else {
        expDelivery.value = tx.deliveryCompanyId || '';
        if (tx.deliveryCompanyId) { collectMethodGroup.style.display = 'block'; expCollectMethod.value = tx.collectMethod || 'received'; }
        else collectMethodGroup.style.display = 'none';
    }
    expAmount.value = tx.amount; expCurrency.value = tx.currency; expDate.value = tx.date; expNotes.value = tx.notes || '';
    document.getElementById('txModalTitle').innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: var(--primary);"></i> تعديل العملية`;
    document.getElementById('txSubmitBtn').innerHTML = `<i class="fa-solid fa-check"></i> حفظ التعديل`;
    SoundEffects.play('edit'); transactionModal.classList.add('active');
};

let currentViewingTxId = null;

function setupTxDetailModalEvents() {
    closeTxDetailModalBtn.addEventListener('click', () => txDetailModal.classList.remove('active'));
    txDetailModal.addEventListener('click', (e) => { if (e.target === txDetailModal) txDetailModal.classList.remove('active'); });
    editTxFromDetailBtn.addEventListener('click', () => { if (currentViewingTxId) { txDetailModal.classList.remove('active'); editExpense(currentViewingTxId); } });
    printTxInvoiceBtn.addEventListener('click', () => { if (currentViewingTxId) printSingleInvoice(); });
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
        relationHTML = `<div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-user-tie"></i> المورد:</span><span style="font-weight:700; color:var(--primary);">${escapeHtml(sup ? sup.name : 'مورد غير معروف')}</span></div><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-credit-card"></i> طريقة الدفع:</span><span style="font-weight:600;">${tx.payMethod === 'cash' ? 'كاش كامل' : tx.payMethod === 'credit' ? 'ذمة / آجل' : 'دفعة سداد'}</span></div>`;
    } else if (tx.deliveryCompanyId) {
        const del = state.deliveryCompanies.find(d => d.id === tx.deliveryCompanyId);
        relationHTML = `<div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-truck"></i> شركة التوصيل:</span><span style="font-weight:700; color:var(--info);">${escapeHtml(del ? del.name : 'شركة غير معروفة')}</span></div><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-money-bill-transfer"></i> حالة الاستلام:</span><span style="font-weight:600;">${tx.collectMethod === 'pending' ? 'ذمة معلقة (لم تستلم)' : 'استلام كاش'}</span></div>`;
    }
    const typeHTML = tx.type === 'income' ? `<span class="badge" style="background:var(--success-light); color:var(--success); font-size:0.9rem; padding:0.4rem 0.8rem;"><i class="fa-solid fa-arrow-down-long" style="margin-left:0.25rem;"></i>دخل وإيداع</span>` : `<span class="badge" style="background:var(--danger-light); color:var(--danger); font-size:0.9rem; padding:0.4rem 0.8rem;"><i class="fa-solid fa-arrow-up-long" style="margin-left:0.25rem;"></i>مصروف خارج</span>`;
    txDetailsBody.innerHTML = `<div style="text-align:center; margin-bottom:1rem; border-bottom:2px dashed var(--border-card); padding-bottom:1.25rem;"><div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">قيمة العملية المالية</div><div style="font-size:2.25rem; font-weight:900; color:${tx.type === 'income' ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(tx.amount, tx.currency)}</div></div><div style="display:flex; flex-direction:column; gap:0.75rem;"><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-tag"></i> اسم العملية:</span><span style="font-weight:700; color:var(--text-primary);">${escapeHtml(tx.title)}</span></div><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-circle-question"></i> النوع:</span>${typeHTML}</div><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-calendar-day"></i> التاريخ:</span><span style="font-weight:600;">${tx.date}</span></div><div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:0.5rem;"><span style="color:var(--text-secondary);"><i class="fa-solid fa-bookmark"></i> التصنيف:</span><span class="badge" style="background-color:${cat.color}20; color:${cat.color}; font-weight:600;">${escapeHtml(cat.label)}</span></div>${relationHTML}<div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.25rem;"><span style="color:var(--text-secondary); font-weight:500;"><i class="fa-solid fa-comment-dots"></i> الملاحظات:</span><div style="background:rgba(0,0,0,0.02); padding:0.75rem; border-radius:10px; font-size:0.85rem; line-height:1.6; border:1px solid var(--border-card); white-space:pre-wrap; color:var(--text-primary);">${escapeHtml(tx.notes || 'لا توجد ملاحظات مسجلة لهذه العملية.')}</div></div></div>`;
    SoundEffects.play('click');
    txDetailModal.classList.add('active');
};

function renderTable(list) {
    expenseTableBody.innerHTML = '';
    const mobileExpensesList = document.getElementById('mobileExpensesList');
    if (mobileExpensesList) mobileExpensesList.innerHTML = '';
    if (list.length === 0) {
        emptyState.style.display = 'block';
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    } else emptyState.style.display = 'none';

    const itemsToRender = list.slice(0, state.displayLimit);
    itemsToRender.forEach(item => {
        const cat = state.categories.find(c => c.id === item.category) || { label: 'مصاريف أخرى', color: '#4f46e5' };
        const tr = document.createElement('tr');
        tr.setAttribute('onclick', `viewTransactionDetails('${item.id}', event)`);
        tr.style.cursor = 'pointer';
        const typeBadge = item.type === 'income' ? `<span class="badge" style="background:var(--success-light); color:var(--success);"><i class="fa-solid fa-arrow-down-long" style="margin-left:0.25rem;"></i>دخل</span>` : `<span class="badge" style="background:var(--danger-light); color:var(--danger);"><i class="fa-solid fa-arrow-up-long" style="margin-left:0.25rem;"></i>مصروف</span>`;
        let relationName = '-'; let mobileRelation = '';
        if (item.supplierId) { const sup = state.suppliers.find(s => s.id === item.supplierId); if (sup) { relationName = `<span style="color:var(--primary); font-weight:500;"><i class="fa-solid fa-user-tie" style="margin-left:0.25rem;"></i>${escapeHtml(sup.name)}</span>`; mobileRelation = `<span style="font-size:0.7rem; color:var(--primary); background:rgba(79,70,229,0.08); padding:2px 6px; border-radius:4px; font-weight:500;"><i class="fa-solid fa-user-tie"></i> ${escapeHtml(sup.name)}</span>`; } }
        else if (item.deliveryCompanyId) { const del = state.deliveryCompanies.find(d => d.id === item.deliveryCompanyId); if (del) { relationName = `<span style="color:var(--info); font-weight:500;"><i class="fa-solid fa-truck" style="margin-left:0.25rem;"></i>${escapeHtml(del.name)}</span>`; mobileRelation = `<span style="font-size:0.7rem; color:var(--info); background:rgba(6,182,212,0.08); padding:2px 6px; border-radius:4px; font-weight:500;"><i class="fa-solid fa-truck"></i> ${escapeHtml(del.name)}</span>`; } }
        let statusText = '-';
        if (item.type === 'expense' && item.supplierId) { if (item.payMethod === 'cash') statusText = 'كاش'; else if (item.payMethod === 'credit') statusText = 'دين / آجل'; else if (item.payMethod === 'payment') statusText = 'دفعة مسددة'; }
        else if (item.type === 'income' && item.deliveryCompanyId) { if (item.collectMethod === 'pending') statusText = 'ذمة معلقة'; else if (item.collectMethod === 'received') statusText = 'استلام كاش'; }
        tr.innerHTML = `<td>${item.date}</td><td style="font-weight:500;">${escapeHtml(item.title)}</td><td>${typeBadge}</td><td><span class="badge" style="background-color:${cat.color}20; color:${cat.color};">${escapeHtml(cat.label)}</span></td><td style="font-weight:700;">${formatCurrency(item.amount, item.currency)}</td><td>${relationName}</td><td>${statusText}</td><td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-secondary);" title="${escapeHtml(item.notes || '')}">${escapeHtml(item.notes || '-')}</td><td><button class="action-btn" onclick="event.stopPropagation(); editExpense('${item.id}')" title="تعديل" style="color:var(--primary); margin-left:0.5rem;"><i class="fa-solid fa-pen-to-square"></i></button><button class="action-btn" onclick="event.stopPropagation(); deleteExpense('${item.id}')" title="حذف"><i class="fa-solid fa-trash-can"></i></button></td>`;
        expenseTableBody.appendChild(tr);
        if (mobileExpensesList) {
            const mCard = document.createElement('div'); mCard.className = 'mobile-tx-card'; mCard.setAttribute('onclick', `viewTransactionDetails('${item.id}', event)`);
            const typeIcon = item.type === 'income' ? '<i class="fa-solid fa-arrow-down-long" style="color:var(--success); font-size:0.95rem;"></i>' : '<i class="fa-solid fa-arrow-up-long" style="color:var(--danger); font-size:0.95rem;"></i>';
            mCard.innerHTML = `<div style="display:flex; align-items:center; gap:0.75rem; width:100%;"><div style="background:${cat.color}15; color:${cat.color}; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${typeIcon}</div><div style="flex:1; display:flex; flex-direction:column; gap:0.2rem; min-width:0;"><div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem;"><span style="font-weight:700; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${escapeHtml(item.title)}</span><span style="font-weight:800; font-size:0.95rem; color:${item.type === 'income' ? 'var(--success)' : 'var(--danger)'}; white-space:nowrap;">${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount, item.currency)}</span></div><div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem;"><div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;"><span class="badge" style="background-color:${cat.color}15; color:${cat.color}; font-size:0.7rem; padding:2px 6px;">${escapeHtml(cat.label)}</span>${mobileRelation}</div><span style="font-size:0.75rem; color:var(--text-secondary); white-space:nowrap;">${item.date}</span></div></div></div><div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem; border-top:1px dashed rgba(0,0,0,0.05); padding-top:0.4rem;" class="print-hide"><button type="button" class="btn btn-outline" style="padding:0.25rem 0.6rem; font-size:0.75rem; border-radius:6px; margin:0; min-height:auto;" onclick="event.stopPropagation(); editExpense('${item.id}')"><i class="fa-solid fa-pen-to-square"></i> تعديل</button><button type="button" class="btn btn-outline" style="padding:0.25rem 0.6rem; font-size:0.75rem; border-radius:6px; margin:0; color:var(--danger); border-color:rgba(239,68,68,0.2); min-height:auto;" onclick="event.stopPropagation(); deleteExpense('${item.id}')"><i class="fa-solid fa-trash-can"></i> حذف</button></div>`;
            mobileExpensesList.appendChild(mCard);
        }
    });
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreContainer && loadMoreBtn) {
        if (list.length > state.displayLimit) { loadMoreContainer.style.display = 'block'; const remaining = list.length - state.displayLimit; loadMoreBtn.querySelector('span').textContent = `عرض المزيد (متبقي ${remaining} عمليات)`; }
        else loadMoreContainer.style.display = 'none';
    }
}

window.openPickerModal = function(type) {
    const modal = document.getElementById('pickerModal');
    const title = document.getElementById('pickerModalTitle');
    const body = document.getElementById('pickerModalBody');
    document.getElementById('pickerSearchInput').value = '';
    if (type === 'supplier') {
        title.innerHTML = '<i class="fa-solid fa-user-tie" style="color:var(--primary); margin-left:0.5rem;"></i> اختر المورد';
        body.innerHTML = state.suppliers.length === 0
            ? '<div style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding:2rem;">لا يوجد موردين</div>'
            : state.suppliers.map(sup => `<div class="picker-item" onclick="selectPickerItem('${sup.id}','supplier')"><div class="picker-item-avatar">${escapeHtml(sup.name.charAt(0))}</div><div class="picker-item-name">${escapeHtml(sup.name)}${sup.phone ? '<br><span class="picker-item-phone">' + escapeHtml(sup.phone) + '</span>' : ''}</div></div>`).join('');
    } else if (type === 'delivery') {
        title.innerHTML = '<i class="fa-solid fa-truck-fast" style="color:var(--primary); margin-left:0.5rem;"></i> اختر شركة التوصيل';
        body.innerHTML = state.deliveryCompanies.length === 0
            ? '<div style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding:2rem;">لا يوجد شركات توصيل</div>'
            : state.deliveryCompanies.map(del => `<div class="picker-item" onclick="selectPickerItem('${del.id}','delivery')"><div class="picker-item-avatar" style="background:linear-gradient(135deg,var(--success),var(--info));">${escapeHtml(del.name.charAt(0))}</div><div class="picker-item-name">${escapeHtml(del.name)}${del.phone ? '<br><span class="picker-item-phone">' + escapeHtml(del.phone) + '</span>' : ''}</div></div>`).join('');
    } else {
        title.innerHTML = '<i class="fa-solid fa-tags" style="color:var(--primary); margin-left:0.5rem;"></i> اختر التصنيف';
        body.innerHTML = state.categories.map(cat => `<div class="picker-item" onclick="selectPickerItem('${cat.id}','category')"><div class="picker-item-dot" style="background:${cat.color}"></div><div class="picker-item-name">${escapeHtml(cat.label)}</div></div>`).join('');
    }
    modal.classList.add('active');
};

window.closePickerModal = function() { document.getElementById('pickerModal').classList.remove('active'); };

window.filterPickerItems = function(query) {
    const items = document.querySelectorAll('#pickerModalBody .picker-item');
    const q = query.toLowerCase().trim();
    items.forEach(item => {
        item.style.display = !q || item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
};

window.selectPickerItem = function(id, type) {
    if (type === 'supplier') { expSupplier.value = id; expSupplier.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (type === 'delivery') { expDelivery.value = id; expDelivery.dispatchEvent(new Event('change', { bubbles: true })); }
    else expCategory.value = id;
    closePickerModal();
};
