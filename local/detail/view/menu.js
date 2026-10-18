export const Menu = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';
import { Message } from '/lib/message.js';

import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

let api;
let modal;
let bookmarkItem;

let messageBookmarkAdded;
let messageBookmarkRemoved;

function init(value) {
    api = value;

    messageBookmarkAdded = Message.info(Text.getBookmarkAdded());
    messageBookmarkRemoved = Message.info(Text.getBookmarkRemoved());

    bookmarkItem = buildItem('bookmark', '', () => {
        hide();
        toggleBookmark();
    });

    const scroll = document.createElement('div');
    scroll.classList.add('menu-scroll');
    scroll.appendChild(buildItem('home', Text.getTopPage(), () => {
        window.location.href = '/';
    }));
    scroll.appendChild(buildDivider());
    scroll.appendChild(buildItem('info', Text.getInfo(), () => {
        hide();
        api.onInfoSelect();
    }));
    scroll.appendChild(buildItem('history', Text.getHistory(), () => {
        hide();
        api.onHistorySelect();
    }));
    scroll.appendChild(buildDivider());
    scroll.appendChild(buildItem('outline', Text.getOutline(), () => {
        hide();
        api.onOutlineSelect();
    }));
    scroll.appendChild(buildItem('difference', Text.getCompare(), () => {
        hide();
        api.onCompareSelect();
    }));
    scroll.appendChild(buildDivider());
    scroll.appendChild(bookmarkItem);

    const content = document.createElement('div');
    content.classList.add('menu-content');
    content.appendChild(scroll);
    content.appendChild(buildItem('config', Text.getPreference(), () => {
        hide();
        api.onPreferenceSelect();
    }));

    modal = Dialog.createModal(content);
    modal.setPlacement('left');
    modal.setTitle('');
    modal.enableCloseButton(hide);
}

function show() {
    renderBookmarkItem();
    modal.show();
}

function hide() {
    modal.hide();
}

function renderBookmarkItem() {
    bookmarkItem.style.display = api.getLawTitle() ? '' : 'none';
    bookmarkItem.querySelector('span').textContent = isBookmarked(getBaseLawId()) ? Text.getBookmarkRemove() : Text.getBookmarkAdd();
}

function toggleBookmark() {
    const id = getBaseLawId();
    const bookmarkList = Config.getBookmarkList();
    if (isBookmarked(id)) {
        Config.setBookmarkList(bookmarkList.filter(bookmark => bookmark.id !== id));
        messageBookmarkAdded.hide();
        messageBookmarkRemoved.show();
        return;
    }
    Config.setBookmarkList(bookmarkList.concat({ id, title: api.getLawTitle() }));
    messageBookmarkRemoved.hide();
    messageBookmarkAdded.show();
}

function isBookmarked(id) {
    return Config.getBookmarkList().some(bookmark => bookmark.id === id);
}

function getBaseLawId() {
    return api.getLawId().split('_')[0];
}

function buildItem(icon, label, onClick) {
    const text = document.createElement('span');
    text.textContent = label;

    const item = document.createElement('div');
    item.classList.add('menu-item');
    item.innerHTML = Design.getIcon(icon, 'var(--color-black)');
    item.appendChild(text);
    item.addEventListener('click', onClick);
    return item;
}

function buildDivider() {
    const divider = document.createElement('div');
    divider.classList.add('menu-divider');
    return divider;
}
