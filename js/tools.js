function setupResetButton() {
    resetAllDataBtn.addEventListener('click', () => {
        showCustomConfirm({
            title: 'تصفير بيانات التطبيق', message: 'تحذير هام جداً: هل أنت متأكد من مسح كافة العمليات والديون والموردين وشركات التوصيل نهائياً؟ لا يمكن التراجع عن هذا الإجراء!',
            iconClass: 'fa-solid fa-triangle-exclamation', iconColor: 'var(--danger)', yesText: 'نعم، امسح كل شيء',
            onConfirm: async () => {
                if (window.supabaseClient) { try { await window.supabaseClient.from('expenses').delete().neq('id', '0'); await window.supabaseClient.from('suppliers').delete().neq('id', '0'); await window.supabaseClient.from('delivery_companies').delete().neq('id', '0'); await window.supabaseClient.from('categories').delete().neq('id', '0'); } catch(e) { console.error(e); } }
                localStorage.clear();
                SoundEffects.play('delete');
                showCustomAlert('تم مسح البيانات بنجاح، سيتم إعادة تشغيل التطبيق الآن.', 'success');
                setTimeout(() => window.location.reload(), 1500);
            }
        });
    });
}

exportBtn.addEventListener('click', () => {
    if (state.expenses.length === 0 && state.suppliers.length === 0 && state.deliveryCompanies.length === 0) { showCustomAlert('لا توجد بيانات لتصديرها!', 'warning'); return; }
    const backupData = { expenses: state.expenses, suppliers: state.suppliers, deliveryCompanies: state.deliveryCompanies, categories: state.categories };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `مصاريفي_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove();
});

importBtn.addEventListener('click', () => { importFileInput.click(); });

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const importedData = JSON.parse(evt.target.result);
            if (importedData && (Array.isArray(importedData.expenses) || Array.isArray(importedData))) {
                showCustomConfirm({
                    title: 'استيراد ودمج البيانات', message: 'هل أنت متأكد من استيراد هذه النسخة الاحتياطية؟ سيتم دمج العمليات والموردين والتوصيل مع بياناتك الحالية.',
                    iconClass: 'fa-solid fa-file-import', iconColor: 'var(--primary)', yesText: 'دمج الآن',
                    onConfirm: async () => {
                        let importedExp = []; let importedSup = []; let importedDel = []; let importedCat = [];
                        if (Array.isArray(importedData)) { importedExp = importedData; }
                        else { importedExp = importedData.expenses || []; importedSup = importedData.suppliers || []; importedDel = importedData.deliveryCompanies || []; importedCat = importedData.categories || []; }
                        const existingExpIds = new Set(state.expenses.map(item => item.id));
                        state.expenses = [...importedExp.filter(item => !existingExpIds.has(item.id)), ...state.expenses];
                        const existingSupIds = new Set(state.suppliers.map(s => s.id));
                        state.suppliers = [...state.suppliers, ...importedSup.filter(s => !existingSupIds.has(s.id))];
                        const existingDelIds = new Set(state.deliveryCompanies.map(d => d.id));
                        state.deliveryCompanies = [...state.deliveryCompanies, ...importedDel.filter(d => !existingDelIds.has(d.id))];
                        importedCat.forEach(newCat => { if (!state.categories.some(c => c.id === newCat.id)) state.categories.push(newCat); });
                        await saveState(); await saveSuppliers(); await saveDeliveryCompanies(); await saveCategories();
                        render(); showCustomAlert('تم استيراد ودمج البيانات بنجاح!', 'success');
                    }
                });
            } else showCustomAlert('تنسيق ملف النسخة الاحتياطية غير صالح!', 'error');
        } catch (err) { showCustomAlert('حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى.', 'error'); }
    };
    reader.readAsText(file);
});
