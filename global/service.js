export const Service = {
    search,
    getLawRevisionList,
    getLawFullText,
};

import { Cache } from '/global/cache.js';
import { Config } from '/global/config.js';
import { Convert } from '/global/convert.js';

const CACHE_NAME_FULL_TEXT = 'LawFullTextBeta';
const CACHE_NAME_REVISION_LIST = 'LawRevisionListBeta';

async function search(title, limit) {
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/laws';
        const query = '?response_format=json' + '&limit=' + limit + '&law_title=' + encodeURIComponent(title);
        const res = await fetch(apiBaseUrl + query);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function getLawRevisionList(id) {
    const revisionList = await loadCached(
        CACHE_NAME_REVISION_LIST,
        id,
        async () => {
            const data = await fetchLawRevisionList(id);
            return data ? data.revisions : null;
        },
        value => Array.isArray(value),
    );
    return revisionList ? normalizeCurrentRevision(revisionList) : null;
}

function getLawFullText(id) {
    return loadCached(
        CACHE_NAME_FULL_TEXT,
        id,
        () => fetchLawFullText(id),
        value => typeof value === 'string',
    );
}

async function fetchLawRevisionList(id) {
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_revisions/';
        const query = '?response_format=json';
        const res = await fetch(apiBaseUrl + id + query);
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
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_data/';
        const query = '?law_full_text_format=xml&response_format=xml';
        const res = await fetch(apiBaseUrl + id + query);
        if (res.ok) {
            let result = await res.text();
            result = Convert.encode(result);
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

function normalizeCurrentRevision(revisionList) {
    if (revisionList.some(revision => revision.current_revision_status === 'CurrentEnforced')) {
        return revisionList;
    }

    for (const revision of revisionList) {
        if (revision.current_revision_status === 'UnEnforced') {
            continue;
        }
        if (revision.current_revision_status === 'PreviousEnforced') {
            revision.current_revision_status = 'CurrentEnforced';
        }
        break;
    }
    return revisionList;
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
        await cache.cleanup();
        return cache;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function closeCache(cache) {
    if (!cache) return;
    try {
        await cache.cleanup();
    } catch (e) {
        console.error(e);
    }
    cache.close();
}

async function getCachedItem(cache, key) {
    try {
        return await cache.getItem(key);
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function setCachedItem(cache, key, value) {
    try {
        await cache.setItem(key, value);
    } catch (e) {
        console.error(e);
    }
}

function isCacheEnabled() {
    return !Config.getDev();
}
