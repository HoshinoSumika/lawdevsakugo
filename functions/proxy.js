const apiOrigin = 'https://laws.e-gov.go.jp';
const apiPath = '/api/2/';

export async function onRequest(context) {
    const target = parseTarget(new URL(context.request.url).searchParams.get('url'));
    if (!target) {
        return new Response('', { status: 400 });
    }

    const response = await fetch(target);
    return new Response(response.body, {
        status: response.status,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        },
    });
}

function parseTarget(value) {
    if (!value) {
        return null;
    }
    try {
        const url = new URL(value);
        if (url.origin !== apiOrigin || !url.pathname.startsWith(apiPath)) {
            return null;
        }
        return url;
    } catch (e) {
        return null;
    }
}
