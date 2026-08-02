import { Storage } from '/lib/storage.js?v=20260101';
import { Cache } from '/global/cache.js?v=20260101';
import { Service } from '/global/service.js?v=20260101';

export async function loadRevisions(lawId) {
    await Cache.init('LawRevisionsBeta');
    await Cache.cleanup();

    let revisions = null;
    try {
        if (!Storage.get('dev', false)) {
            revisions = await Cache.getItem(lawId);
        }
    } catch (error) {
        console.error(error);
    }

    if (!Array.isArray(revisions)) {
        const data = await Service.getLawRevisions(lawId);
        revisions = data?.revisions;
        if (Array.isArray(revisions)) {
            await Cache.setItem(lawId, revisions);
        }
    }

    await Cache.cleanup();

    if (!Array.isArray(revisions)) {
        throw new Error('Law revisions are unavailable');
    }

    const normalizedRevisions = normalizeCurrentRevision(revisions);
    return normalizedRevisions.map((revision, historyIndex) => ({
        ...revision,
        _diffHistoryIndex: historyIndex,
    }));
}

export async function loadLawTexts(revisions, baseLawId) {
    await Cache.init('LawFullTextBeta');
    await Cache.cleanup();

    const results = [];
    for (const revision of revisions) {
        const requestId = getRequestId(revision, baseLawId);
        let html = null;

        try {
            if (!Storage.get('dev', false)) {
                html = await Cache.getItem(requestId);
            }
        } catch (error) {
            console.error(error);
        }

        if (!html) {
            html = await Service.getLawFullText(requestId);
            if (html) {
                await Cache.setItem(requestId, html);
            }
        }

        if (!html) {
            throw new Error('Law full text is unavailable: ' + requestId);
        }
        results.push(html);
    }

    await Cache.cleanup();
    return results;
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
