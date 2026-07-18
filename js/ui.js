function showCustomConfirm(options) {
    SoundEffects.play('alert');
    confirmTitle.textContent = options.title || 'تأكيد';
    confirmMessage.textContent = options.message || '';
    confirmIcon.innerHTML = `<i class="${options.iconClass || 'fa-solid fa-triangle-exclamation'}"></i>`;
    confirmIcon.style.color = options.iconColor || 'var(--warning)';
    confirmYesBtn.textContent = options.yesText || 'تأكيد';
    if (options.isAlert) { confirmNoBtn.style.display = 'none'; }
    else { confirmNoBtn.style.display = 'block'; confirmNoBtn.textContent = options.noText || 'إلغاء'; }

    const handleYes = () => { cleanup(); if (options.onConfirm) options.onConfirm(); };
    const handleNo = () => { cleanup(); if (options.onCancel) options.onCancel(); };
    const handleOutside = (e) => { if (e.target === customConfirmModal) { cleanup(); if (options.onCancel) options.onCancel(); } };
    const cleanup = () => { customConfirmModal.classList.remove('active'); confirmYesBtn.removeEventListener('click', handleYes); confirmNoBtn.removeEventListener('click', handleNo); customConfirmModal.removeEventListener('click', handleOutside); };

    confirmYesBtn.addEventListener('click', handleYes);
    confirmNoBtn.addEventListener('click', handleNo);
    customConfirmModal.addEventListener('click', handleOutside);
    customConfirmModal.classList.add('active');
}

function showCustomAlert(message, type = 'info') {
    let iconClass = 'fa-solid fa-circle-info'; let iconColor = 'var(--info)'; let title = 'تنبيه';
    if (type === 'success') { iconClass = 'fa-solid fa-circle-check'; iconColor = 'var(--success)'; title = 'تم بنجاح'; }
    else if (type === 'error' || type === 'danger' || type === 'warning') {
        iconClass = 'fa-solid fa-triangle-exclamation'; iconColor = type === 'warning' ? 'var(--warning)' : 'var(--danger)'; title = type === 'warning' ? 'تنبيه' : 'حدث خطأ';
    }
    showCustomConfirm({ title, message, iconClass, iconColor, yesText: 'حسناً', isAlert: true });
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('theme', theme);
    const icon = themeToggleBtn.querySelector('i');
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function setupNavigation() {
    const allNavs = [...document.querySelectorAll('.nav-btn'), ...document.querySelectorAll('.nav-item')];
    const navigateToHash = () => {
        let tab = window.location.hash.replace('#', '');
        const validTabs = ['stats', 'history', 'suppliers', 'delivery', 'tools'];
        if (!validTabs.includes(tab)) tab = 'stats';
        allNavs.forEach(b => { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
        document.body.className = `show-${tab}`;
    };
    allNavs.forEach(btn => {
        if (btn.classList.contains('center-fab') || btn.id === 'openTxModalBtnMobile') return;
        btn.addEventListener('click', () => { window.location.hash = btn.getAttribute('data-tab'); });
    });
    window.addEventListener('hashchange', navigateToHash);
    navigateToHash();
}

window.openToolModal = function(id) { const modal = document.getElementById(id); if (modal) modal.classList.add('active'); };
window.closeToolModal = function(id) { const modal = document.getElementById(id); if (modal) modal.classList.remove('active'); };

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tx-modal-overlay')) e.target.classList.remove('active');
});

function setupFilterEvents() {
    const resetLimitAndRender = () => { state.displayLimit = 50; render(); };
    searchInput.addEventListener('input', resetLimitAndRender);
    quickDateFilter.addEventListener('change', () => {
        const val = quickDateFilter.value;
        if (val === 'custom') { customDateRangeInputs.style.display = 'flex'; specificMonthInputContainer.style.display = 'none'; }
        else if (val === 'specific-month') { customDateRangeInputs.style.display = 'none'; specificMonthInputContainer.style.display = 'flex'; if (!filterMonth.value) { const now = new Date(); filterMonth.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; } }
        else { customDateRangeInputs.style.display = 'none'; specificMonthInputContainer.style.display = 'none'; }
        resetLimitAndRender();
    });
    filterMonth.addEventListener('change', resetLimitAndRender);
    filterStartDate.addEventListener('change', resetLimitAndRender);
    filterEndDate.addEventListener('change', resetLimitAndRender);
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => { state.displayLimit += 50; render(); SoundEffects.play('click'); });
    }
}
