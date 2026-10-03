import { Device } from '/lib/device.js';
import { Message } from '/lib/message.js';

import { Convert } from '/global/convert.js';
import { Route } from '/global/route.js';
import { Service } from '/global/service.js';
import { Theme } from '/global/theme.js';

import { History } from './history.js';
import { Info } from './info.js';
import { Menu } from './menu.js';
import { Mokuji } from './mokuji.js';
import { Preference } from './preference.js';
import { Sabun } from './sabun.js';
import { Search } from './search.js';

const PAREN = {
    pair: ['（', '）'],
    quote: ['「', '」'],
    className: 'tag-paren',
    dataName: 'depth',
};

const contentEl = document.querySelector('#content');
const scrollEl = contentEl.parentElement;

const api = {
    getContent: () => contentEl,
    getContainer: () => scrollEl,
    getLawId: () => Route.getLawId(),
    restoreScroll: () => restoreScrollPosition(),
    onDisplayChange: () => Mokuji.update(),
    onWordsChange: () => applyWords(),
    onRevisionSelect: (id) => moveToLaw(id),
    onPreferenceSelect: () => Preference.show(),
    onDiffSelect: () => Sabun.show(),
    onHistorySelect: () => History.show(),
    onInfoSelect: () => Info.show(),
    onMokujiSelect: () => Mokuji.toggle(),
};

window.addEventListener('DOMContentLoaded', () => {
    Theme.init(api);

    Preference.init(api);
    History.init(api);
    Info.init(api);
    Menu.init(api);
    Mokuji.init(api);
    Sabun.init(api);
    Search.init(api);

    initMenuButton();
    initSearchButton();
    initContent().then(() => {});
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();

    scrollEl.addEventListener('scroll', () => {
        recordScrollPosition();
    });
});

window.addEventListener('popstate', () => {
    initContent().then(() => {});
});

let scrollReference;

function recordScrollPosition() {
    const elements = Array.from(contentEl.querySelectorAll('section'));
    const topVisibleEl = elements.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && rect.top >= 0 && rect.bottom > 0;
    });
    if (!topVisibleEl) return null;
    scrollReference = { element: topVisibleEl, offset: topVisibleEl.getBoundingClientRect().top };
}

function restoreScrollPosition() {
    if (!scrollReference || !scrollReference.element || !scrollReference.element.isConnected) return;
    const currentRect = scrollReference.element.getBoundingClientRect();
    const diff = currentRect.top - scrollReference.offset;
    if (Math.abs(diff) >= 1) {
        scrollEl.scrollBy(0, diff);
    }
}

function initMenuButton() {
    const button = document.querySelector('#header-menu');
    button.addEventListener('click', () => Menu.show());
}

function initSearchButton() {
    const button = document.querySelector('#header-search');
    button.addEventListener('click', () => Search.show());
}

function moveToLaw(id) {
    window.history.pushState(null, '', Route.getLawHref(id));
    initContent().then(() => {});
}

let contentVersion = 0;

async function initContent() {
    contentVersion = contentVersion + 1;
    const functionVersion = contentVersion;

    const content = document.querySelector('#content');
    const message = document.querySelector('#message');

    content.innerHTML = '';
    content.style.minHeight = content.parentElement.offsetHeight + 'px';
    message.innerHTML = 'Loading...';

    Info.clear();
    Mokuji.clear();

    const id = Route.getLawId();

    if (!id) {
        content.style.minHeight = '';
        message.innerHTML = '法令IDが指定されていません。';
        return;
    }

    const result = await Service.getLawFullText(id);
    if (!result) {
        message.innerHTML = 'データを取得できませんでした。';
        return;
    }

    if (functionVersion < contentVersion) {
        return;
    }

    const source = document.createElement('div');
    source.innerHTML = result;

    let law = source.firstElementChild;
    if (!law) {
        message.innerHTML = 'データを取得できませんでした。';
        return;
    }

    law = Convert.nest(law, PAREN);
    law = Convert.term(law, buildWordTerms());

    content.innerHTML = '';
    content.appendChild(law);
    content.style.minHeight = '';
    message.innerHTML = '';

    Info.update();
    Mokuji.update();

    const lawTitle = content.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
    if (lawTitle) {
        document.title = lawTitle;
        document.querySelector('#header-title').innerHTML = '<span>' + lawTitle + '</span>';
    }

    notifyLawEffectivenessStatus(content);
}

function buildWordTerms() {
    const terms = {};
    Preference.getWords().forEach((word, index) => {
        terms[word] = 'tag-word tag-word-' + index;
    });
    return terms;
}

function applyWords() {
    const law = contentEl.firstElementChild;
    if (!law) {
        return;
    }

    law.querySelectorAll('.tag-word').forEach((span) => {
        span.replaceWith(span.textContent);
    });
    law.normalize();
    Convert.term(law, buildWordTerms());
}

function notifyLawEffectivenessStatus(content) {
    const status = content.querySelector('.Law')?.dataset.revision_info_repeal_status;
    const statusLabels = {
        Repeal: '廃止',
        Expire: '失効',
        Suspend: '停止',
        LossOfEffectiveness: '実効性喪失',
    };

    if (statusLabels[status]) {
        Message.alert('この法令は「' + statusLabels[status] + '」となっています。');
    }
}
