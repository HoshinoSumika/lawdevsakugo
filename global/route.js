import { Config } from '/global/config.js';

export const Route = {
    getLawId,
    getLawHref,
};

const lawIdPattern = /^\d{3}[0-9A-Z_]+$/;

function getLawId() {
    const path = window.location.pathname.slice(1);
    if (lawIdPattern.test(path)) {
        return path;
    }
    return new URLSearchParams(window.location.search).get('id') || '';
}

function getLawHref(id) {
    if (Config.getDev()) {
        return '/content.html?id=' + id;
    }
    return '/' + id;
}
