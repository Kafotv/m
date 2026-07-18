function render() {
    renderSuppliersDropdown();
    renderDeliveryDropdown();
    renderCategoriesDropdown();
    renderSuppliersGrid();
    renderDeliveryGrid();
    renderCategoriesManagerList();

    const dateRange = quickDateFilter.value;
    let startDate = null; let endDate = null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateRange === 'today') { startDate = todayStr; endDate = todayStr; }
    else if (dateRange === 'week') { const pastWeek = new Date(); pastWeek.setDate(now.getDate() - 7); startDate = pastWeek.toISOString().split('T')[0]; endDate = todayStr; }
    else if (dateRange === 'month') { const y = now.getFullYear(); const m = now.getMonth(); startDate = new Date(y,m,1).toISOString().split('T')[0]; endDate = new Date(y,m+1,0).toISOString().split('T')[0]; }
    else if (dateRange === 'specific-month') { const selected = filterMonth.value; if (selected) { const [y,m] = selected.split('-').map(Number); startDate = `${selected}-01`; endDate = `${selected}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`; } }
    else if (dateRange === 'custom') { startDate = filterStartDate.value || null; endDate = filterEndDate.value || null; }

    const filterText = searchInput.value.toLowerCase().trim();
    const filteredExpenses = state.expenses.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(filterText) || (item.notes && item.notes.toLowerCase().includes(filterText));
        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && (item.date >= startDate);
        if (endDate) matchesDate = matchesDate && (item.date <= endDate);
        return matchesSearch && matchesDate;
    });

    const totals = { ILS: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 }, USD: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 }, JOD: { remaining: 0, expense: 0, goods: 0, trans: 0, other: 0, bank: 0 } };
    const activeCur = state.activeCurrency;
    const categoryTotals = {};
    state.categories.forEach(c => { categoryTotals[c.id] = 0; });

    state.expenses.forEach(item => {
        const cur = item.currency;
        if (!totals[cur]) return;
        if (item.type === 'income') { totals[cur].remaining += item.amount; if (item.category === 'bank') totals[cur].bank += item.amount; }
        else {
            totals[cur].remaining -= item.amount; totals[cur].expense += item.amount;
            if (item.category === 'goods') totals[cur].goods += item.amount;
            else if (item.category === 'trans') totals[cur].trans += item.amount;
            else if (item.category === 'bank') totals[cur].bank += item.amount;
            else totals[cur].other += item.amount;
            if (cur === activeCur) { if (categoryTotals[item.category] !== undefined) categoryTotals[item.category] += item.amount; else categoryTotals.other = (categoryTotals.other || 0) + item.amount; }
        }
    });

    let filteredIncome = 0; let filteredExpense = 0;
    filteredExpenses.forEach(item => {
        if (item.currency === activeCur) { if (item.type === 'income') filteredIncome += item.amount; else filteredExpense += item.amount; }
    });
    const filteredNet = filteredIncome - filteredExpense;
    filteredIncomeTotal.innerText = formatCurrency(filteredIncome, activeCur);
    filteredExpenseTotal.innerText = formatCurrency(filteredExpense, activeCur);
    filteredNetTotal.innerText = formatCurrency(filteredNet, activeCur);
    filteredNetTotal.style.color = filteredNet >= 0 ? 'var(--success)' : 'var(--danger)';

    const activeTotals = totals[activeCur];
    walletRemainingEl.innerText = formatCurrency(activeTotals.remaining, activeCur);
    walletRemainingEl.className = activeTotals.remaining >= 0 ? 'positive' : 'negative';
    const mobileBalanceAmount = document.getElementById('mobileBalanceAmount');
    if (mobileBalanceAmount) { mobileBalanceAmount.innerText = formatCurrency(activeTotals.remaining, activeCur); mobileBalanceAmount.className = 'mobile-balance-amount' + (activeTotals.remaining < 0 ? ' negative' : ''); }
    walletExpenseEl.innerText = formatCurrency(activeTotals.expense, activeCur);
    walletGoodsEl.innerText = formatCurrency(activeTotals.goods, activeCur);
    walletTransEl.innerText = formatCurrency(activeTotals.trans, activeCur);

    const insightsTitle = document.querySelector('.chart-box:nth-child(2) .chart-title');
    if (insightsTitle) { const curLabel = activeCur === 'ILS' ? 'الشيكل ₪' : activeCur === 'USD' ? 'الدولار $' : 'الدينار د.أ'; insightsTitle.innerHTML = `<i class="fa-solid fa-lightbulb" style="color:var(--warning); margin-left:0.5rem;"></i>لمحة سريعة (${curLabel})`; }

    const totalExp = activeTotals.expense;
    goodsPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.goods/totalExp)*100)}%` : '0%';
    transPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.trans/totalExp)*100)}%` : '0%';
    bankPercentEl.innerText = totalExp > 0 ? `${Math.round((activeTotals.bank/totalExp)*100)}%` : '0%';
    totalCountEl.innerText = state.expenses.length;

    renderTable(filteredExpenses);
    renderChartDynamic(categoryTotals);
}

document.addEventListener('DOMContentLoaded', async () => {
    expDate.value = new Date().toISOString().split('T')[0];
    initSupabase();
    await loadState();
    initTheme();
    setupFormTypeToggles();
    setupNavigation();
    setupCurrencyToggles();
    setupSupplierForm();
    setupDeliveryForm();
    setupCategoryManager();
    setupPartnerModalsEvents();
    setupTxModalEvents();
    setupTxDetailModalEvents();
    setupFilterEvents();
    setupStatementFilterEvents();
    setupResetButton();
    setupSupabaseConfig();

    expSupplier.addEventListener('change', () => {
        if (expSupplier.value) { payMethodGroup.style.display = 'block'; expPayMethod.required = true; }
        else { payMethodGroup.style.display = 'none'; expPayMethod.required = false; }
    });
    expDelivery.addEventListener('change', () => {
        if (expDelivery.value) { collectMethodGroup.style.display = 'block'; expCollectMethod.required = true; }
        else { collectMethodGroup.style.display = 'none'; expCollectMethod.required = false; }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.nav-item') || e.target.closest('.nav-btn')) {
            const isIgnored = e.target.closest('.action-btn') || e.target.closest('.delete-sup-btn') || e.target.closest('.edit-sup-btn') || e.target.closest('#confirmYesBtn') || e.target.closest('#confirmNoBtn') || e.target.closest('form button[type="submit"]');
            if (!isIgnored) SoundEffects.play('click');
        }
    });

    render();
});
