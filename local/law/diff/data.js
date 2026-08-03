import { Service } from '/global/service.js?v=20260101';

export async function loadRevisions(lawId) {
    const revisions = await Service.getLawRevisions(lawId);
    if (!revisions) {
        throw new Error('Law revisions are unavailable');
    }
    return revisions;
}

export async function loadLawTexts(revisions, baseLawId) {
    const settled = await Promise.allSettled(revisions.map(async revision => {
        const requestId = getRequestId(revision, baseLawId);
        const html = await Service.getLawFullText(requestId);
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
}

export function orderChronologically(selected, revisions) {
    return [...selected].sort((a, b) => revisions.indexOf(b) - revisions.indexOf(a));
}

function getRequestId(revision, baseLawId) {
    if (revision.current_revision_status === 'CurrentEnforced') {
        return baseLawId;
    }
    return revision.law_revision_id;
}
