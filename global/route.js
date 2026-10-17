export const Route = {
    getLawId,
    getLawHref,
};

import { Config } from '/global/config.js';

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
        return '/detail.html?id=' + id;
    }
    return '/' + id;
}
