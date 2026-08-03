export const Diff = {
    init,
    show,
};

import { buildArticleDiff } from './diff/compare.js?v=20260101';
import { loadLawTexts, loadRevisions, orderChronologically } from './diff/data.js?v=20260101';
import { createDiffModal } from './diff/ui.js?v=20260101';

let api;
let diffModal;
let revisions = null;
let revisionsLawId = '';
let loadingPromise = null;
let comparisonVersion = 0;

function init(value) {
    api = value;
    diffModal = createDiffModal({
        onCompare: compareSelected,
        onClose: cancelComparison,
    });
}

async function show() {
    diffModal.show();

    const lawId = api.getLawId();
    const baseLawId = lawId.split('_')[0];
    if (!baseLawId) {
        diffModal.setError('法令IDを取得できませんでした。');
        return;
    }

    if (revisions && revisionsLawId === baseLawId) {
        diffModal.setRevisions(revisions, lawId);
        return;
    }

    if (loadingPromise && revisionsLawId === baseLawId) {
        await loadingPromise;
        return;
    }

    revisionsLawId = baseLawId;
    revisions = null;
    diffModal.setLoading();
    loadingPromise = loadRevisions(baseLawId);

    try {
        const loaded = await loadingPromise;
        if (revisionsLawId !== baseLawId) return;
        revisions = loaded;
        diffModal.setRevisions(revisions, lawId);
    } catch (error) {
        console.error(error);
        diffModal.setError('改正履歴を取得できませんでした。');
    } finally {
        loadingPromise = null;
    }
}

async function compareSelected(selected) {
    if (selected.length !== 2) return;

    const functionVersion = ++comparisonVersion;
    const [oldRevision, newRevision] = orderChronologically(selected);
    diffModal.setBusy(true);

    try {
        await waitForLoadingPaint();
        if (functionVersion !== comparisonVersion) return;
        const [oldHtml, newHtml] = await loadLawTexts(
            [oldRevision, newRevision],
            revisionsLawId,
        );
        if (functionVersion !== comparisonVersion) return;
        const rows = buildArticleDiff(oldHtml, newHtml);
        await waitForNextFrame();
        if (functionVersion !== comparisonVersion) return;
        diffModal.showComparison({ oldRevision, newRevision, rows });
    } catch (error) {
        if (functionVersion !== comparisonVersion) return;
        console.error(error);
        diffModal.setError('比較する法令データを取得できませんでした。');
    } finally {
        if (functionVersion === comparisonVersion) {
            diffModal.setBusy(false);
        }
    }
}

function cancelComparison() {
    comparisonVersion++;
    diffModal.setBusy(false);
}

function waitForLoadingPaint() {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function waitForNextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}
