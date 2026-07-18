function renderChartDynamic(categoryTotals) {
    let total = 0;
    const slices = [];
    state.categories.forEach(cat => {
        const val = categoryTotals[cat.id] || 0;
        if (val > 0) { total += val; slices.push({ label: cat.label, value: val, color: cat.color }); }
    });
    if (total === 0) {
        chartContainer.innerHTML = `<div style="text-align:center; color:var(--text-secondary); font-size:0.9rem; padding:2rem 0;"><i class="fa-solid fa-chart-pie" style="font-size:2.5rem; opacity:0.3; margin-bottom:0.5rem; display:block;"></i> لا توجد مصاريف لهذه العملة لعرضها</div>`;
        return;
    }
    const activeCur = state.activeCurrency;
    let cumulativePercent = 0;
    let svgPaths = '';
    slices.forEach((slice, i) => {
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += slice.value / total;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
        const percent = ((slice.value / total) * 100).toFixed(1);
        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
        svgPaths += `<g class="chart-segment" style="--i: ${i};"><path d="${pathData}" fill="${slice.color}" class="segment-fill"></path><path d="${pathData}" fill="${slice.color}" class="segment-glow" opacity="0"></path><title>${escapeHtml(slice.label)}: ${percent}% (${formatCurrency(slice.value, activeCur)})</title></g>`;
    });
    const centerColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff';
    chartContainer.innerHTML = `<div class="chart-wrapper"><div class="chart-svg-container"><svg viewBox="-1 -1 2 2" style="transform:rotate(-90deg);" class="svg-chart">${svgPaths}<circle cx="0" cy="0" r="0.62" fill="${centerColor}" class="chart-center-ring"></circle><circle cx="0" cy="0" r="0.58" fill="${centerColor}" class="chart-center-dot"></circle></svg><div class="chart-center-total" style="color:var(--text-primary);"><span class="chart-center-label">الإجمالي</span><span class="chart-center-value">${formatCurrency(total, activeCur)}</span></div></div><div class="chart-legend">${slices.map((slice, i) => { const percent = ((slice.value/total)*100).toFixed(1); return `<div class="legend-item" style="--i:${i};"><span class="legend-dot" style="background:${slice.color}; box-shadow:0 0 6px ${slice.color}66;"></span><span class="legend-label">${escapeHtml(slice.label)}</span><span class="legend-percent">${percent}%</span><span class="legend-value">${formatCurrency(slice.value, activeCur)}</span></div>`; }).join('')}</div></div>`;
}

function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
}
