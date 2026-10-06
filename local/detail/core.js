import { Device } from '/lib/device.js';
import { Dialog } from '/lib/dialog.js';
import { Flex } from '/lib/flex.js';
import { Message } from '/lib/message.js';

import { Route } from '/global/route.js';
import { Service } from '/global/service.js';

import { History } from './view/history.js';
import { Info } from './view/info.js';
import { Menu } from './view/menu.js';
import { Nav } from './view/nav.js';
import { Search } from './view/search.js';

const contentEl = document.querySelector('#content');
const scrollEl = contentEl.parentElement;

const api = {
    getContent: () => contentEl,
    getContainer: () => scrollEl,
    getLawId: () => Route.getLawId(),
    onHistorySelect: () => History.show(),
    onInfoSelect: () => Info.show(),
    onMenuSelect: () => Menu.show(),
    onRevisionSelect: (id) => move(id),
    onSearchSelect: () => Search.show(),
};

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

window.addEventListener('popstate', () => {
    load();
});

const messageMissingId = Message.error('法令IDが指定されていません。');
const messageLoadError = Message.error('データを取得できませんでした。');

let contentVersion = 0;

async function init() {
    Dialog.setColor('var(--color-black)', 'var(--color-white)', 'rgba(0,0,0,0.32)');
    Flex.setColor('var(--color-black)', 'var(--color-white)');

    messageMissingId.disableClose();
    messageLoadError.disableClose();

    History.init(api);
    Info.init(api);
    Menu.init(api);
    Nav.init(api);
    Search.init(api);

    await load();
}

function move(id) {
    window.history.pushState(null, '', Route.getLawHref(id));
    load();
}

async function load() {
    contentVersion = contentVersion + 1;
    const functionVersion = contentVersion;

    contentEl.innerHTML = '';

    const id = Route.getLawId();
    if (!id) {
        messageLoadError.hide();
        messageMissingId.show();
        return;
    }

    const law = await Service.getLawFullText(id);
    if (functionVersion !== contentVersion) {
        return;
    }
    if (!law) {
        messageMissingId.hide();
        messageLoadError.show();
        return;
    }

    messageMissingId.hide();
    messageLoadError.hide();

    contentEl.innerHTML = law;

    const title = contentEl.querySelector('.Law > .LawBody > .LawTitle')?.textContent || '';
    document.title = title;
    Nav.setTitle(title);
}
