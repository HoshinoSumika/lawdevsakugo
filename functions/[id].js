export function onRequest(context) {
    const url = new URL(context.request.url);
    if (!/^\/\d{3}[0-9A-Z_]+$/.test(url.pathname)) {
        return context.next();
    }
    url.pathname = '/law';
    return context.next(new Request(url, context.request));
}
