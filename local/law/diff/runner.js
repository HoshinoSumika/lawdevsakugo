import { computeArticleDiff } from './compare.js?v=20260101';
import { hydrateArticleDiff, prepareArticleDiff } from './extract.js?v=20260101';

const WORKER_TIMEOUT = 60000;

let activeTask = null;

export function buildArticleDiff(oldHtml, newHtml) {
    cancelArticleDiff();

    const prepared = prepareArticleDiff(oldHtml, newHtml);
    const worker = createWorker();
    if (!worker) {
        return Promise.resolve(hydrateArticleDiff(
            computeArticleDiff(prepared.oldInput, prepared.newInput),
            prepared.oldArticles,
            prepared.newArticles,
        ));
    }

    let rejectTask;
    let timer;
    const promise = new Promise((resolve, reject) => {
        rejectTask = reject;

        worker.addEventListener('message', event => {
            try {
                const { rows, error } = event.data || {};
                if (!Array.isArray(rows)) {
                    throw new Error(error || 'Diff worker returned no rows');
                }
                resolve(hydrateArticleDiff(rows, prepared.oldArticles, prepared.newArticles));
            } catch (error) {
                reject(error);
            }
        }, { once: true });

        worker.addEventListener('messageerror', () => {
            reject(new Error('Diff worker sent an unreadable message'));
        }, { once: true });

        worker.addEventListener('error', event => {
            reject(event.error || new Error(event.message || 'Diff worker failed'));
        }, { once: true });

        timer = setTimeout(
            () => reject(new Error('Diff worker timed out')),
            WORKER_TIMEOUT,
        );
    }).finally(() => {
        clearTimeout(timer);
        worker.terminate();
        if (activeTask?.worker === worker) {
            activeTask = null;
        }
    });

    activeTask = { worker, reject: rejectTask };
    worker.postMessage({
        oldArticles: prepared.oldInput,
        newArticles: prepared.newInput,
    });
    return promise;
}

export function cancelArticleDiff() {
    if (!activeTask) return;
    const task = activeTask;
    activeTask = null;
    task.worker.terminate();
    task.reject(new DOMException('Diff calculation was cancelled', 'AbortError'));
}

function createWorker() {
    try {
        const workerUrl = new URL('./worker.js?v=20260101', import.meta.url);
        return new Worker(workerUrl, { type: 'module' });
    } catch (error) {
        console.error(error);
        return null;
    }
}
