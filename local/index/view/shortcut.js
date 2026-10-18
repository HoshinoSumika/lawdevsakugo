export const Shortcut = {
    init,
    show,
    hide,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';

import { Config } from '/global/config.js';
import { Route } from '/global/route.js';
import { Text } from '/global/text.js';

const RECENT_LIMIT = 10;
const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const INSET_HEIGHT = 'calc(100dvh - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_WIDTH + ')';

const SECTION_MAP = {
    bookmark: {
        getTitle: Text.getBookmark,
        getEmpty: Text.getBookmarkEmpty,
        getList: () => Config.getBookmarkList(),
        remove: (id) => Config.setBookmarkList(Config.getBookmarkList().filter(law => law.id !== id)),
    },
    recent: {
        getTitle: Text.getRecent,
        getEmpty: Text.getRecentEmpty,
        getList: () => Config.getRecentList().reverse(),
        remove: (id) => Config.setRecentList(Config.getRecentList().filter(law => law.id !== id)),
    },
};

let api;
let shortcut;
let modal;
let modalContent;
let modalSection;

function init(value) {
    api = value;

    shortcut = document.createElement('div');
    shortcut.className = 'shortcut shortcut-hidden';
    api.getContent().appendChild(shortcut);

    modalContent = document.createElement('div');
    modalContent.className = 'shortcut-content';

    modal = Dialog.createModal(modalContent);
    modal.enableCloseButton(hideModal);

    window.addEventListener('resize', () => {
        applySize();
    });
}

function show() {
    const bookmarkList = Config.getShortcutBookmark() ? Config.getBookmarkList() : [];
    const recentList = Config.getShortcutRecent() ? Config.getRecentList().filter(recent => !includes(bookmarkList, recent.id)).slice(-RECENT_LIMIT).reverse() : [];

    shortcut.replaceChildren();
    appendSection(Text.getBookmark(), bookmarkList, () => showModal('bookmark'));
    appendSection(Text.getRecent(), recentList, () => showModal('recent'));
    appendSection(Text.getMajorLaw(), Config.getShortcutMajor() ? api.getMajorList() : []);
    shortcut.classList.remove('shortcut-hidden');
}

function hide() {
    shortcut.classList.add('shortcut-hidden');
}

function includes(lawList, id) {
    return lawList.some(law => law.id === id);
}

function appendSection(heading, lawList, onSelect) {
    if (lawList.length === 0) {
        return;
    }

    const headingEl = document.createElement('h2');
    headingEl.className = 'shortcut-heading';
    headingEl.textContent = heading;
    if (onSelect) {
        headingEl.classList.add('clickable');
        headingEl.insertAdjacentHTML('beforeend', Design.getIcon('right', 'currentColor', 16));
        headingEl.addEventListener('click', onSelect);
    }

    const shortcutList = document.createElement('div');
    shortcutList.className = 'shortcut-list';
    lawList.forEach(law => {
        shortcutList.appendChild(buildLawItem(law));
    });

    const section = document.createElement('section');
    section.className = 'shortcut-section';
    section.appendChild(headingEl);
    section.appendChild(shortcutList);
    shortcut.appendChild(section);
}

function buildLawItem(law) {
    const text = document.createElement('span');
    text.textContent = law.title;

    const item = document.createElement('a');
    item.className = 'shortcut-item';
    item.href = Route.getLawHref(law.id);
    item.draggable = false;
    item.title = law.title;
    item.appendChild(text);
    return item;
}

function showModal(section) {
    modalSection = section;
    applySize();
    modal.setTitle(SECTION_MAP[section].getTitle());
    modal.fitHeight(renderModal);
    modal.resetScroll();
    modal.show();
}

function hideModal() {
    modal.hide();
}

function applySize() {
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (modalContent.closest('.dialog-modal').getBoundingClientRect().width < MODAL_MAX_WIDTH) {
        modal.setMaxHeight(INSET_HEIGHT);
    }
}

function renderModal() {
    const lawList = SECTION_MAP[modalSection].getList();

    modalContent.replaceChildren();
    if (lawList.length === 0) {
        const message = document.createElement('div');
        message.className = 'shortcut-message';
        message.textContent = SECTION_MAP[modalSection].getEmpty();
        modalContent.appendChild(message);
        return;
    }
    lawList.forEach(law => {
        modalContent.appendChild(buildLawRow(law));
    });
}

function buildLawRow(law) {
    const link = document.createElement('a');
    link.className = 'shortcut-link';
    link.href = Route.getLawHref(law.id);
    link.draggable = false;
    link.textContent = law.title;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'shortcut-remove';
    remove.innerHTML = Design.getIcon('delete', 'var(--color-gray)');
    remove.addEventListener('click', () => {
        SECTION_MAP[modalSection].remove(law.id);
        modal.fitHeight(renderModal);
        api.onShortcutChange();
    });

    const row = document.createElement('div');
    row.className = 'shortcut-row';
    row.appendChild(link);
    row.appendChild(remove);
    return row;
}
