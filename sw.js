const CACHE_NAME = "coach-resources-v1";

// App shell + known tool pages, so the first launch after install
// can prime the cache. Safe to leave entries in here even if a
// filename ever changes — a failed fetch is just skipped.
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./block-dice-trainer.html",
    "./bloodbowl-skills-quiz.html",
    "./blood-bowl-odds-caller.html",
    "./bloodbowl-turn-clock.html",
    "./bloodbowl-team-comparator.html",
    "./bb-injury-calc.html"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.all(
                PRECACHE_URLS.map(url =>
                    cache.add(url).catch(() => {
                        // Ignore individual failures (e.g. a renamed/missing file)
                        // so one bad entry doesn't block the whole install.
                    })
                )
            )
        )
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Network-first for same-origin GET requests, falling back to the
// cache when offline, and refreshing the cache on every successful
// fetch so tool updates show up next time you're online.
self.addEventListener("fetch", event => {
    const req = event.request;

    if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin){
        return;
    }

    event.respondWith(
        fetch(req)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return response;
            })
            .catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
    );
});
