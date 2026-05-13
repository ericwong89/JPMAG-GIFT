// Service Worker - 缓存策略（优化版）
const CACHE_NAME = 'furoku-jp-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/magazines/affinity.html',
  '/manifest.json',
  '/offline.html'
];

// 需要缓存的资源类型
const CACHEABLE_EXTENSIONS = [
  '.html', '.css', '.js',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.woff', '.woff2', '.ttf', '.eot'
];

// 安装时缓存核心资源
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：优先使用缓存（缓存优先策略）
self.addEventListener('fetch', event => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;


  const requestUrl = new URL(event.request.url);

  // 后台页面始终走网络，避免 CMS 登录页被旧缓存卡住
  if (requestUrl.pathname.startsWith('/admin')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // 缓存命中，返回缓存
      if (response) {
        // 后台更新缓存（stale-while-revalidate）
        fetchAndCache(event.request);
        return response;
      }
      
      // 缓存未命中，从网络请求
      return fetchAndCache(event.request).catch(() => {
        // 网络请求失败，尝试返回缓存的离线页面
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// 从网络获取并缓存
function fetchAndCache(request) {
  return fetch(request).then(response => {
    // 检查是否返回有效响应
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }
    
    // 检查是否需要缓存此请求
    const url = new URL(request.url);
    const shouldCache = CACHEABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext)) ||
                       urlsToCache.includes(url.pathname);
    
    if (shouldCache) {
      // 克隆响应（因为响应是流，只能使用一次）
      const responseToCache = response.clone();
      
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
    }
    
    return response;
  });
}
