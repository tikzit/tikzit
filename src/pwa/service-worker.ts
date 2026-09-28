/**
 * TikZiT Web PWA Offline Service Worker
 * Provides offline application shell caching and graceful offline fallbacks
 * for TikZiT diagram editing sessions.
 */

export interface SWExtendableEvent {
  waitUntil(promise: Promise<any>): void;
}

export interface SWFetchEvent {
  request: Request;
  respondWith(promise: Promise<Response>): void;
}

export const CACHE_NAME = 'tikzit-shell-v1';

export const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

export function handleInstall(event: SWExtendableEvent, assets = SHELL_ASSETS): void {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
}

export function handleActivate(event: SWExtendableEvent): void {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
}

export function handleFetch(event: SWFetchEvent): void {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/') as Promise<Response>;
        }
        return new Response('Network unavailable', { status: 503, statusText: 'Offline' });
      });
    })
  );
}
