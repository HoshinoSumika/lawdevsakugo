export async function onRequest(context) {
    const url = new URL(context.request.url);
    const target = url.searchParams.get("url");

    if (!target) {
        return new Response("", { status: 400 });
    }

    const response = await fetch(target);
    const contentType = response.headers.get("Content-Type") || "text/plain";
    const body = await response.text();

    return new Response(body, {
        status: response.status,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": contentType
        }
    });
}
