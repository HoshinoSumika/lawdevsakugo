export function prepareArticleDiff(oldHtml, newHtml) {
    const oldArticles = extractArticles(oldHtml);
    const newArticles = extractArticles(newHtml);
    return {
        oldArticles,
        newArticles,
        oldInput: serializeArticles(oldArticles),
        newInput: serializeArticles(newArticles),
    };
}

export function hydrateArticleDiff(rows, oldArticles, newArticles) {
    return rows.map(({ oldIndex, newIndex, ...row }) => ({
        ...row,
        oldArticle: detachArticle(oldArticles, oldIndex),
        newArticle: detachArticle(newArticles, newIndex),
    }));
}

function extractArticles(html) {
    const container = document.createElement('div');
    container.innerHTML = html || '';
    const mainProvision = container.querySelector('.MainProvision');
    if (!mainProvision) return [];

    let elements = Array.from(mainProvision.querySelectorAll('.Article'))
        .filter(article => !article.closest('.SupplProvision'));
    let type = 'article';
    if (elements.length === 0) {
        elements = Array.from(mainProvision.querySelectorAll(
            ':scope > .ParagraphContainer, :scope > .Paragraph',
        ));
        type = 'paragraph';
    }

    const occurrences = new Map();
    return elements
        .map((article, index) => {
            const baseKey = getArticleKey(article, index, type);
            const occurrence = (occurrences.get(baseKey) || 0) + 1;
            occurrences.set(baseKey, occurrence);
            return {
                key: baseKey + ':' + occurrence,
                element: article,
            };
        });
}

function serializeArticles(articles) {
    return articles.map(article => ({
        key: article.key,
        text: article.element.textContent,
    }));
}

function getArticleKey(article, index, type) {
    const keyElement = type === 'paragraph' && article.classList.contains('ParagraphContainer')
        ? article.querySelector(':scope > .Paragraph')
        : article;
    const number = keyElement?.getAttribute('data-num');
    if (number) return type + '-num:' + number;

    const titleSelector = type === 'article' ? '.ArticleTitle' : '.ParagraphNum';
    const title = keyElement?.querySelector(titleSelector)?.textContent.trim();
    if (title) return type + '-title:' + title;
    return type + '-index:' + index;
}

function detachArticle(articles, index) {
    const article = Number.isInteger(index) ? articles[index] : null;
    if (!article) return null;
    return {
        key: article.key,
        element: article.element.cloneNode(true),
    };
}
