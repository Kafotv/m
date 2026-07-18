function renderCategoriesDropdown() {
    const currentVal = expCategory.value;
    expCategory.innerHTML = '';
    state.categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat.id; opt.textContent = cat.label; expCategory.appendChild(opt); });
    expCategory.value = currentVal;
}

function setupCategoryManager() {
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const label = newCatLabel.value.trim();
        const color = newCatColor.value;
        const id = 'cat_' + Date.now().toString();
        state.categories.push({ id, label, color });
        await saveCategories();
        SoundEffects.play('add');
        newCatLabel.value = '';
        renderCategoriesDropdown();
        renderCategoriesManagerList();
        render();
    });
}

function renderCategoriesManagerList() {
    categoriesManagerList.innerHTML = '';
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-manager-item';
        item.innerHTML = `<div class="category-meta"><div class="category-color-dot" style="background-color:${cat.color}"></div><span style="font-weight:500;">${escapeHtml(cat.label)}</span></div><button type="button" class="action-btn" onclick="deleteCategory('${cat.id}')" title="حذف"><i class="fa-solid fa-trash-can"></i></button>`;
        categoriesManagerList.appendChild(item);
    });
}

window.deleteCategory = function(catId) {
    if (state.categories.length <= 1) { showCustomAlert('يجب أن يتبقى تصنيف واحد على الأقل في النظام!', 'error'); return; }
    showCustomConfirm({
        title: 'حذف تصنيف مخصص', message: 'تنبيه: هل أنت متأكد من حذف هذا التصنيف؟ سيتم تلقائياً تحويل جميع العمليات المرتبطة به إلى تصنيف احتياطي بديل لضمان سلامة الحسابات.',
        iconClass: 'fa-solid fa-triangle-exclamation', iconColor: 'var(--warning)', yesText: 'نعم، احذفه وانقل العمليات',
        onConfirm: async () => {
            const fallbackCat = state.categories.find(c => c.id !== catId);
            state.expenses.forEach(item => { if (item.category === catId) item.category = fallbackCat.id; });
            state.categories = state.categories.filter(c => c.id !== catId);
            if (window.supabaseClient) { try { await window.supabaseClient.from('expenses').update({ category: fallbackCat.id }).eq('category', catId); await window.supabaseClient.from('categories').delete().eq('id', catId); } catch(e) { console.error(e); } }
            await saveCategories(); await saveState(); render(); SoundEffects.play('delete');
        }
    });
};
