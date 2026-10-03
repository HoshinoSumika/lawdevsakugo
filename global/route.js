export const Route = {
    getLawId,
    getLawHref,
};

import { Config } from '/global/config.js';

const LAW_ID_PATTERN = /^\d{3}[0-9A-Z_]+$/;

function getLawId() {
    const path = window.location.pathname.slice(1);
    if (LAW_ID_PATTERN.test(path)) {
        return path;
    }
    return new URLSearchParams(window.location.search).get('id') || '';
}

function getLawHref(id) {
    if (Config.getDev()) {
        return '/law.html?id=' + id;
    }
    return '/' + id;
}
