import { hydrateArticleDiff, prepareArticleDiff } from './compare.js?v=20260101';

let activeTask = null;

export function buildArticleDiffInWorker(oldHtml, newHtml) {
    cancelArticleDiff();

    const prepared = prepareArticleDiff(oldHtml, newHtml);
    const workerUrl = new URL('./worker.js?v=20260101', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });

    let rejectTask;
    const promise = new Promise((resolve, reject) => {
        rejectTask = reject;
        worker.addEventListener('message', event => {
            if (event.data.error) {
                reject(new Error(event.data.error));
                return;
            }
            resolve(hydrateArticleDiff(
                event.data.rows,
                prepared.oldArticles,
                prepared.newArticles,
            ));
        }, { once: true });
        worker.addEventListener('error', event => {
            reject(event.error || new Error(event.message || 'Diff worker failed'));
        }, { once: true });
    }).finally(() => {
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
