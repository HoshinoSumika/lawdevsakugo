import { Device } from '/lib/device.js';
import { Flex } from '/lib/flex.js';
import { Message } from '/lib/message.js';

import { Route } from '/global/route.js';
import { Service } from '/global/service.js';

import { Nav } from './view/nav.js';
import { Search } from './view/search.js';

const contentEl = document.querySelector('#content');
const scrollEl = contentEl.parentElement;

const api = {
    getContent: () => contentEl,
    getContainer: () => scrollEl,
    onMenuSelect: () => {},
    onSearchSelect: () => Search.show(),
};

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

async function init() {
    Flex.setColor('var(--color-black)', 'var(--color-white)');

    Nav.init(api);
    Search.init(api);

    const id = Route.getLawId();
    if (!id) {
        Message.error('法令IDが指定されていません。');
        return;
    }

    const law = await Service.getLawFullText(id);
    if (!law) {
        Message.error('データを取得できませんでした。');
        return;
    }

    contentEl.innerHTML = law;

    const title = contentEl.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
    document.title = title;
    Nav.setTitle(title);
}
