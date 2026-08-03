import { computeArticleDiff } from './compare.js?v=20260101';

self.addEventListener('message', event => {
    try {
        const { oldArticles, newArticles } = event.data;
        const rows = computeArticleDiff(oldArticles, newArticles);
        self.postMessage({ rows });
    } catch (error) {
        self.postMessage({
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
