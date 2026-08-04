export const Service = {
    search,
    getLawRevisions,
    getLawFullText,
};

import { Storage } from '/lib/storage.js?v=20260101';

import { Cache } from '/global/cache.js?v=20260101';
import { Convert } from '/global/convert.js?v=20260101';

const CACHE_NAME_FULL_TEXT = 'LawFullTextBeta';
const CACHE_NAME_REVISIONS = 'LawRevisionsBeta';

async function search(title) {
    try {
        const url = '/ignore/' + title + '.json';
        const res = await fetch(url);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/laws';
        const queryParams = '?response_format=json' + '&limit=9999' + '&law_title=' + title;
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function getLawRevisions(id) {
    const revisions = await loadCached(
        CACHE_NAME_REVISIONS,
        id,
        async () => {
            const data = await fetchLawRevisions(id);
            return data ? data.revisions : null;
        },
        value => Array.isArray(value),
    );
    return revisions ? normalizeCurrentRevision(revisions) : null;
}

function getLawFullText(id) {
    return loadCached(
        CACHE_NAME_FULL_TEXT,
        id,
        () => fetchLawFullText(id),
        value => typeof value === 'string' && value.length > 0,
    );
}

async function fetchLawRevisions(id) {
    try {
        const url = '/ignore/' + id + '.json';
        const res = await fetch(url);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_revisions/';
        const queryParams = '?response_format=json';
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + id + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function fetchLawFullText(id) {
    try {
        const url = '/ignore/' + id + '.xml';
        const res = await fetch(url);
        if (res.ok) {
            let result = await res.text();
            result = Convert.henkan(result);
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_data/';
        const queryParams = '?law_full_text_format=xml&response_format=xml';
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + id + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            let result = await res.text();
            result = Convert.henkan(result);
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

function normalizeCurrentRevision(revisions) {
    const normalized = revisions.map(revision => ({ ...revision }));
    if (normalized.some(revision => revision.current_revision_status === 'CurrentEnforced')) {
        return normalized;
    }

    for (const revision of normalized) {
        if (revision.current_revision_status === 'UnEnforced') {
            continue;
        }
        if (revision.current_revision_status === 'PreviousEnforced') {
            revision.current_revision_status = 'CurrentEnforced';
        }
        break;
    }
    return normalized;
}

async function loadCached(name, key, fetchValue, isValid) {
    const cache = await openCache(name);

    try {
        if (cache && isCacheEnabled()) {
            const cached = await getCachedItem(cache, key);
            if (isValid(cached)) return cached;
        }

        const value = await fetchValue();
        if (!isValid(value)) return null;
        if (cache) {
            await setCachedItem(cache, key, value);
        }
        return value;
    } finally {
        await closeCache(cache);
    }
}

async function openCache(name) {
    try {
        const cache = await Cache.open(name);
        try {
            await cache.cleanup();
        } catch (error) {
            console.error(error);
        }
        return cache;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function closeCache(cache) {
    if (!cache) return;
    try {
        await cache.cleanup();
    } catch (error) {
        console.error(error);
    } finally {
        cache.close();
    }
}

async function getCachedItem(cache, key) {
    try {
        return await cache.getItem(key);
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function setCachedItem(cache, key, value) {
    try {
        await cache.setItem(key, value);
    } catch (error) {
        console.error(error);
    }
}

function isCacheEnabled() {
    try {
        return !Storage.get('dev', false);
    } catch (error) {
        console.error(error);
        return false;
    }
}
