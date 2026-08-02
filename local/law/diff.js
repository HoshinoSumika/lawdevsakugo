export const Diff = {
    init,
    show,
};

import { buildArticleDiff } from './diff/compare.js?v=20260101';
import { loadLawTexts, loadRevisions, orderChronologically } from './diff/data.js?v=20260101';
import { createComparisonModal, createSelectionModal } from './diff/ui.js?v=20260101';

let api;
let selectionModal;
let comparisonModal;
let revisions = null;
let revisionsLawId = '';
let loadingPromise = null;

function init(value) {
    api = value;
    comparisonModal = createComparisonModal({
        onBack: () => {
            comparisonModal.hide();
            selectionModal.show();
        },
    });
    selectionModal = createSelectionModal({
        onCompare: compareSelected,
    });
}

async function show() {
    selectionModal.show();

    const lawId = api.getLawId();
    const baseLawId = lawId.split('_')[0];
    if (!baseLawId) {
        selectionModal.setError('法令IDを取得できませんでした。');
        return;
    }

    if (revisions && revisionsLawId === baseLawId) {
        selectionModal.setRevisions(revisions);
        return;
    }

    if (loadingPromise && revisionsLawId === baseLawId) {
        await loadingPromise;
        return;
    }

    revisionsLawId = baseLawId;
    revisions = null;
    selectionModal.setLoading();
    loadingPromise = loadRevisions(baseLawId);

    try {
        const loaded = await loadingPromise;
        if (revisionsLawId !== baseLawId) return;
        revisions = loaded;
        selectionModal.setRevisions(revisions);
    } catch (error) {
        console.error(error);
        selectionModal.setError('改正履歴を取得できませんでした。');
    } finally {
        loadingPromise = null;
    }
}

async function compareSelected(selected) {
    if (selected.length !== 2) return;

    const [oldRevision, newRevision] = orderChronologically(selected);
    selectionModal.setBusy(true);

    try {
        const [oldHtml, newHtml] = await loadLawTexts(
            [oldRevision, newRevision],
            revisionsLawId,
        );
        const rows = buildArticleDiff(oldHtml, newHtml);
        comparisonModal.render({ oldRevision, newRevision, rows });
        selectionModal.hide();
        comparisonModal.show();
    } catch (error) {
        console.error(error);
        selectionModal.setError('比較する法令データを取得できませんでした。');
    } finally {
        selectionModal.setBusy(false);
    }
}
