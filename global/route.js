export const Route = {
    getLawId,
    getLawHref,
};

import { Storage } from '/lib/storage.js?v=20260101';

const LAW_ID_PATTERN = /^\d{3}[0-9A-Z_]+$/;

function getLawId() {
    const path = window.location.pathname.slice(1);
    if (LAW_ID_PATTERN.test(path)) {
        return path;
    }
    return new URLSearchParams(window.location.search).get('id') || '';
}

function getLawHref(id) {
    if (Storage.get('dev', false)) {
        return '/law.html?id=' + id;
    }
    return '/' + id;
}
