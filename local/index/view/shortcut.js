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
const DROP_DURATION = 200;

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
let drag = null;

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
    modal.fit(renderModal);
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
    link.addEventListener('click', hideModal);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'shortcut-remove';
    remove.innerHTML = Design.getIcon('delete', 'var(--color-gray)');
    remove.addEventListener('click', () => {
        SECTION_MAP[modalSection].remove(law.id);
        modal.fit(renderModal);
        api.onShortcutChange();
    });

    const row = document.createElement('div');
    row.className = 'shortcut-row';
    if (modalSection === 'bookmark') {
        const handle = document.createElement('div');
        handle.className = 'shortcut-drag';
        handle.innerHTML = Design.getIcon('drag', 'var(--color-gray)');
        handle.addEventListener('pointerdown', event => startDrag(event, row));
        row.appendChild(handle);
    }
    row.appendChild(link);
    row.appendChild(remove);
    return row;
}

function startDrag(event, row) {
    if (drag || !event.isPrimary || event.button !== 0) {
        return;
    }
    event.preventDefault();

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    const rowList = Array.from(modalContent.children);
    const first = rowList[0];
    const last = rowList[rowList.length - 1];
    drag = {
        row,
        handle,
        rowList,
        centerList: rowList.map(item => item.offsetTop + item.offsetHeight / 2),
        startIndex: rowList.indexOf(row),
        index: rowList.indexOf(row),
        startY: getContentY(event.clientY),
        minShift: first.offsetTop - row.offsetTop,
        maxShift: last.offsetTop + last.offsetHeight - row.offsetTop - row.offsetHeight,
        shift: 0,
    };
    row.classList.add('dragging');
}

function moveDrag(event) {
    drag.shift = Math.max(drag.minShift, Math.min(drag.maxShift, getContentY(event.clientY) - drag.startY));
    drag.row.style.transform = 'translateY(' + drag.shift + 'px)';

    const height = drag.row.offsetHeight;
    const center = drag.centerList[drag.startIndex] + drag.shift;
    let index = drag.startIndex;
    drag.centerList.forEach((other, position) => {
        if (position > drag.startIndex && other < center + height / 2) {
            index = index + 1;
        } else if (position < drag.startIndex && other > center - height / 2) {
            index = index - 1;
        }
    });
    if (index === drag.index) {
        return;
    }
    drag.index = index;

    drag.rowList.forEach((item, position) => {
        if (item === drag.row) {
            return;
        }
        let shift = 0;
        if (position < drag.startIndex && position >= index) {
            shift = height;
        } else if (position > drag.startIndex && position <= index) {
            shift = -height;
        }
        item.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
    });
}

function endDrag() {
    drag.handle.removeEventListener('pointermove', moveDrag);
    drag.handle.removeEventListener('pointerup', endDrag);
    drag.handle.removeEventListener('pointercancel', endDrag);

    const target = drag.rowList[drag.index];
    let shift = 0;
    if (drag.index > drag.startIndex) {
        shift = target.offsetTop + target.offsetHeight - drag.row.offsetTop - drag.row.offsetHeight;
    } else if (drag.index < drag.startIndex) {
        shift = target.offsetTop - drag.row.offsetTop;
    }

    const animation = drag.row.animate([
        { transform: 'translateY(' + drag.shift + 'px)' },
        { transform: 'translateY(' + shift + 'px)' },
    ], { duration: DROP_DURATION, easing: 'ease' });
    drag.row.style.transform = 'translateY(' + shift + 'px)';
    animation.onfinish = finishDrag;
}

function finishDrag() {
    const lawList = Config.getBookmarkList();
    lawList.splice(drag.index, 0, lawList.splice(drag.startIndex, 1)[0]);
    Config.setBookmarkList(lawList);
    drag = null;
    renderModal();
    api.onShortcutChange();
}

function getContentY(clientY) {
    return clientY - modalContent.getBoundingClientRect().top;
}
