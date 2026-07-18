const CACHE_NAME = 'masawyid-v3';
const ASSETS = [
    './',
    './index.html',
    './dist/style.min.css',
    './dist/app.min.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// تثبيت: تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// تفعيل: حذف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// استراتيجية: Network First (شبكة أولاً، ثم كاش احتياطي)
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات Supabase - تعمل على الشبكة دائماً
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // تخزين الاستجابة الجديدة في الكاش
                if (response.ok && event.request.method === 'GET') {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() => {
                // بدون إنترنت: ارجع من الكاش
                return caches.match(event.request);
            })
    );
});
