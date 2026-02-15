import { Device } from '/global/device.js?v=20260213';
import { Service } from '/global/service.js?v=20260213';
import { Storage } from '/global/storage.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    const url = new URL(window.location.href);
    url.searchParams.set('l', '129AC0000000089_20250606_507AC0000000057');
    url.searchParams.set('r', '129AC0000000089');
    window.history.replaceState(null, '', url);
    update().then(() => {});
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

window.addEventListener('popstate', () => {
});

let contentVersion = 0;

async function update() {
    contentVersion = contentVersion + 1;
    const functionVersion = contentVersion;

    const info = document.querySelector('#diff-info');
    const content = document.querySelector('#diff-content');

    content.querySelector('.left').innerHTML = '';
    content.querySelector('.right').innerHTML = '';

    const left = await getLawFullText(new URLSearchParams(window.location.search).get('l'));
    const right = await getLawFullText(new URLSearchParams(window.location.search).get('r'));

    if (functionVersion < contentVersion) {
        return;
    }

    content.style.visibility = 'hidden';

    content.querySelector('.left').innerHTML = left;
    content.querySelector('.right').innerHTML = right;

    compare(content);

    content.style.visibility = '';
}

async function getLawFullText(id) {
    let result;
    await Storage.init('LawFullTextBeta');
    await Storage.cleanup();

    try {
        result = await Storage.getItem(id);
    } catch (e) {
    }
    if (!result) {
        result = await Service.getLawFullText(id);
        if (result) {
            await Storage.setItem(id, result);
        }
    }
    if (!result) {
        return null;
    }
    await Storage.cleanup();

    return result;
}

function compare(content) {
    const leftMainProvision = content.querySelector('.left .MainProvision');
    const rightMainProvision = content.querySelector('.right .MainProvision');

    if (!leftMainProvision || !rightMainProvision) {
        return;
    }

    const leftArticles = leftMainProvision.querySelectorAll('.Article[data-num]');
    const rightArticles = rightMainProvision.querySelectorAll('.Article[data-num]');

    const leftMap = new Map();
    const rightMap = new Map();

    for (const article of leftArticles) {
        leftMap.set(article.dataset.num, article);
    }

    for (const article of rightArticles) {
        rightMap.set(article.dataset.num, article);
    }

    const fragment = document.createDocumentFragment();

    const nums = [];

    for (const num of leftMap.keys()) {
        nums.push(num);
    }

    for (const num of rightMap.keys()) {
        if (!nums.includes(num)) {
            nums.push(num);
        }
    }

    for (const num of nums) {
        const leftArticle = leftMap.get(num) || null;
        const rightArticle = rightMap.get(num) || null;

        let diff;

        if (leftArticle && !rightArticle) {
            diff = 'deleted';
        } else if (!leftArticle && rightArticle) {
            diff = 'added';
        } else if (leftArticle.textContent !== rightArticle.textContent) {
            diff = 'changed';
        } else {
            continue;
        }

        const item = document.createElement('div');
        item.className = 'diff-item';
        item.dataset.diff = diff;

        const left = document.createElement('div');
        left.className = 'left';

        const right = document.createElement('div');
        right.className = 'right';

        if (leftArticle) {
            left.append(leftArticle.cloneNode(true));
        }

        if (rightArticle) {
            right.append(rightArticle.cloneNode(true));
        }

        item.append(left, right);
        fragment.append(item);
    }

    content.innerHTML = '';
    content.append(fragment);
}
