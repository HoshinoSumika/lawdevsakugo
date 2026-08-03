import { Storage } from '/lib/storage.js?v=20260101';
import { Cache } from '/global/cache.js?v=20260101';
import { Service } from '/global/service.js?v=20260101';

export async function loadRevisions(lawId) {
    const cache = await openCache('LawRevisionsBeta');

    try {
        let revisions = null;
        if (cache && shouldUseCache()) {
            revisions = await getCachedItem(cache, lawId);
        }

        if (!Array.isArray(revisions)) {
            const data = await Service.getLawRevisions(lawId);
            revisions = data?.revisions;
            if (Array.isArray(revisions) && cache) {
                await setCachedItem(cache, lawId, revisions);
            }
        }

        if (!Array.isArray(revisions)) {
            throw new Error('Law revisions are unavailable');
        }

        const normalizedRevisions = normalizeCurrentRevision(revisions);
        return normalizedRevisions.map((revision, historyIndex) => ({
            ...revision,
            _diffHistoryIndex: historyIndex,
        }));
    } finally {
        await closeCache(cache);
    }
}

export async function loadLawTexts(revisions, baseLawId) {
    const cache = await openCache('LawFullTextBeta');

    try {
        const settled = await Promise.allSettled(revisions.map(async revision => {
            const requestId = getRequestId(revision, baseLawId);
            let html = null;

            if (cache && shouldUseCache()) {
                html = await getCachedItem(cache, requestId);
            }

            if (!html) {
                html = await Service.getLawFullText(requestId);
                if (html && cache) {
                    await setCachedItem(cache, requestId, html);
                }
            }

            if (!html) {
                throw new Error('Law full text is unavailable: ' + requestId);
            }
            return html;
        }));

        const failed = settled.find(result => result.status === 'rejected');
        if (failed) {
            throw failed.reason;
        }
        return settled.map(result => result.value);
    } finally {
        await closeCache(cache);
    }
}

export function orderChronologically(revisions) {
    return [...revisions].sort((a, b) => {
        const indexA = Number(a._diffHistoryIndex);
        const indexB = Number(b._diffHistoryIndex);
        if (Number.isFinite(indexA) && Number.isFinite(indexB) && indexA !== indexB) {
            return indexB - indexA;
        }

        const dateA = a.amendment_enforcement_date || '';
        const dateB = b.amendment_enforcement_date || '';
        return dateA.localeCompare(dateB);
    });
}

function getRequestId(revision, baseLawId) {
    if (revision.current_revision_status === 'CurrentEnforced') {
        return baseLawId;
    }
    return revision.law_revision_id;
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

function shouldUseCache() {
    try {
        return !Storage.get('dev', false);
    } catch (error) {
        console.error(error);
        return false;
    }
}
