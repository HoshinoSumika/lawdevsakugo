const lawIdPattern = /^\/\d{3}[0-9A-Z_]+$/;

export function onRequest(context) {
    const url = new URL(context.request.url);
    if (!lawIdPattern.test(url.pathname)) {
        return context.next();
    }
    url.pathname = '/detail';
    return context.next(new Request(url, context.request));
}
