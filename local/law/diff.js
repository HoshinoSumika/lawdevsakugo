export const Diff = {
    init,
    show,
};

import { loadLawTexts, loadRevisions, orderChronologically } from './diff/data.js?v=20260101';
import { createDiffModal } from './diff/ui.js?v=20260101';
import { buildArticleDiffInWorker, cancelArticleDiff } from './diff/worker-client.js?v=20260101';

let api;
let diffModal;
let revisions = null;
let revisionsLawId = '';
let loadingTask = null;
let displayVersion = 0;
let comparisonVersion = 0;

function init(value) {
    api = value;
    diffModal = createDiffModal({
        onCompare: compareSelected,
        onClose: cancelDiff,
    });
}

async function show() {
    const functionVersion = ++displayVersion;
    diffModal.show();

    const lawId = api.getLawId() || '';
    const baseLawId = lawId.split('_')[0];
    if (!baseLawId) {
        diffModal.setError('法令IDを取得できませんでした。');
        return;
    }

    if (revisions && revisionsLawId === baseLawId) {
        diffModal.setRevisions(revisions, lawId);
        return;
    }

    diffModal.setLoading();
    let task = loadingTask;
    if (!task || task.lawId !== baseLawId) {
        revisionsLawId = baseLawId;
        revisions = null;
        task = {
            lawId: baseLawId,
            promise: loadRevisions(baseLawId),
        };
        loadingTask = task;
    }

    try {
        const loaded = await task.promise;
        if (functionVersion !== displayVersion || revisionsLawId !== baseLawId) return;
        revisions = loaded;
        diffModal.setRevisions(revisions, lawId);
    } catch (error) {
        if (functionVersion !== displayVersion || revisionsLawId !== baseLawId) return;
        console.error(error);
        diffModal.setError('改正履歴を取得できませんでした。');
    } finally {
        if (loadingTask === task) {
            loadingTask = null;
        }
    }
}

async function compareSelected(selected) {
    if (selected.length !== 2) return;

    const functionVersion = ++comparisonVersion;
    const baseLawId = revisionsLawId;
    const [oldRevision, newRevision] = orderChronologically(selected);
    cancelArticleDiff();
    diffModal.setBusy(true);

    try {
        await waitForLoadingPaint();
        if (functionVersion !== comparisonVersion) return;
        const [oldHtml, newHtml] = await loadLawTexts(
            [oldRevision, newRevision],
            baseLawId,
        );
        if (functionVersion !== comparisonVersion) return;
        const rows = await buildArticleDiffInWorker(oldHtml, newHtml);
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
    cancelArticleDiff();
    diffModal.setBusy(false);
}

function cancelDiff() {
    displayVersion++;
    cancelComparison();
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
