const fs = require('fs');
const path = require('path');
const Terser = require('terser');
const CleanCSS = require('clean-css');

const dist = path.join(__dirname, 'dist');
if (!fs.existsSync(dist)) fs.mkdirSync(dist);

async function buildJS() {
    const files = [
        'js/core.js', 'js/ui.js', 'js/supabase.js', 'js/transactions.js',
        'js/partners.js', 'js/categories.js', 'js/charts.js', 'js/tools.js', 'js/app.js'
    ];
    let bundle = '';
    for (const f of files) {
        bundle += fs.readFileSync(path.join(__dirname, f), 'utf8') + ';\n';
    }
    const result = await Terser.minify(bundle, {
        compress: { drop_console: false },
        mangle: { toplevel: true },
        output: { comments: false }
    });
    fs.writeFileSync(path.join(dist, 'app.min.js'), result.code, 'utf8');
    console.log('✅ dist/app.min.js (' + (result.code.length / 1024).toFixed(1) + ' KB)');
}

function buildCSS() {
    const files = [
        'css/base.css', 'css/layout.css', 'css/components.css', 'css/partners.css',
        'css/charts.css', 'css/tools.css', 'css/modals.css', 'css/responsive.css'
    ];
    let bundle = '';
    for (const f of files) {
        bundle += fs.readFileSync(path.join(__dirname, f), 'utf8') + '\n';
    }
    const result = new CleanCSS({ level: 2 }).minify(bundle);
    fs.writeFileSync(path.join(dist, 'style.min.css'), result.styles, 'utf8');
    console.log('✅ dist/style.min.css (' + (result.styles.length / 1024).toFixed(1) + ' KB)');
}

buildJS().then(buildCSS);
