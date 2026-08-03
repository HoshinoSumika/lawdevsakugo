import { computeArticleDiff } from './compare.js?v=20260101';

self.addEventListener('message', event => {
    const { oldArticles, newArticles } = event.data;
    try {
        const rows = computeArticleDiff(oldArticles, newArticles);
        self.postMessage({ rows });
    } catch (error) {
        self.postMessage({
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
