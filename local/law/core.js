import { Device } from '/global/device.js?v=20260213';
import { Kaiseki } from '/global/kaiseki.js?v=20260213';
import { Service } from '/global/service.js?v=20260213';
import { Storage } from '/global/storage.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

import { Config } from './config.js?v=20260213';
import { History } from './history.js?v=20260213';
import { Info } from './info.js?v=20260213';
import { Menu } from './menu.js?v=20260213';
import { Mokuji } from './mokuji.js?v=20260213';
import { Search } from './search.js?v=20260213';

const contentEl = document.querySelector('#content');
const scrollEl = contentEl.parentElement;

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    Config.init(contentEl);
    Config.register('restoreScrollPosition', restoreScrollPosition);

    History.init();
    History.register('initContent', initContent);

    Info.init(contentEl);

    Menu.init();

    Mokuji.init(contentEl);
    Mokuji.register('restoreScrollPosition', restoreScrollPosition);

    Search.init(contentEl);

    initMenuButton();
    initSearchButton();
    initContent().then(() => {});
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();

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

    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
        content.style.minHeight = '';
        message.innerHTML = '法令IDが指定されていません。';
        return;
    }

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
        message.innerHTML = 'データを取得できませんでした。';
        return;
    }
    await Storage.cleanup();

    if (functionVersion < contentVersion) {
        return;
    }

    content.innerHTML = result;
    content.style.minHeight = '';
    message.innerHTML = '';

    Kaiseki.tagParen(content);
    Kaiseki.tagTerm(content);

    Info.update();
    Mokuji.update();

    const lawTitle = content.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
    if (lawTitle) {
        document.title = lawTitle;
        document.querySelector('#header-title').innerHTML = '<span>' + lawTitle + '</span>';
    }
}
