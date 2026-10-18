export const Preference = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';
import { Message } from '/lib/message.js';

import { Component } from '/global/component.js';
import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const MODAL_WIDTH = 'min(480px, ' + INSET_WIDTH + ')';
const SLIDE_DURATION = 200;
const SLIDE_EASING = 'ease-out';
const FADE_DURATION = 50;

const refreshList = [];

let api;
let modal;
let content;
let mainPage;
let storagePage;
let pageList = [];

let messageBookmarkCleared;
let messageRecentCleared;

function init(value) {
    api = value;

    messageBookmarkCleared = Message.info(Text.getBookmarkCleared());
    messageRecentCleared = Message.info(Text.getRecentCleared());

    mainPage = document.createElement('div');
    mainPage.classList.add('preference-page');
    mainPage.appendChild(buildSwitchItem(Text.getShowBookmark(), Config.getShortcutBookmark, (value) => {
        Config.setShortcutBookmark(value);
        api.onShortcutChange();
    }));
    mainPage.appendChild(buildSwitchItem(Text.getShowRecent(), Config.getShortcutRecent, (value) => {
        Config.setShortcutRecent(value);
        api.onShortcutChange();
    }));
    mainPage.appendChild(buildSwitchItem(Text.getShowMajorLaw(), Config.getShortcutMajor, (value) => {
        Config.setShortcutMajor(value);
        api.onShortcutChange();
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildNavigationItem(Text.getStoragePreference(), () => {
        showNextPage(Text.getStoragePreference(), storagePage);
    }));

    storagePage = document.createElement('div');
    storagePage.classList.add('preference-page');
    storagePage.appendChild(buildActionItem(Text.getBookmarkClear(), () => {
        showConfirmPage(Text.getBookmarkClear(), Text.getBookmarkClearConfirm(), Text.getRemove(), clearBookmark);
    }));
    storagePage.appendChild(buildActionItem(Text.getRecentClear(), () => {
        showConfirmPage(Text.getRecentClear(), Text.getRecentClearConfirm(), Text.getRemove(), clearRecent);
    }));

    content = document.createElement('div');
    content.classList.add('preference-content');
    content.appendChild(mainPage);

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getPreference());
    modal.setWidth(MODAL_WIDTH);
    modal.enableCloseButton(hide);
}

function show() {
    refreshList.forEach(refresh => refresh());
    pageList = [{ title: Text.getPreference(), page: mainPage, scrollTop: 0 }];
    renderTitle();
    modal.clearNav();
    modal.fit(() => {
        content.replaceChildren(mainPage);
    });
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
}

function renderTitle() {
    modal.setTitle(pageList[pageList.length - 1].title);
    if (pageList.length > 1) {
        modal.enableBackButton(showPreviousPage);
    } else {
        modal.disableBackButton();
    }
}

function showNextPage(title, page) {
    pageList[pageList.length - 1].scrollTop = content.closest('.dialog-scroll').scrollTop;
    pageList.push({ title, page, scrollTop: 0 });

    renderTitle();
    switchPage(page, 0, -100);
}

function showPreviousPage() {
    pageList.pop();
    const current = pageList[pageList.length - 1];

    renderTitle();
    modal.clearNav();
    switchPage(current.page, current.scrollTop, 100);
}

function switchPage(page, scrollTop, shift) {
    const scroll = content.closest('.dialog-scroll');
    const previous = content.firstChild;
    const previousScrollTop = scroll.scrollTop;
    const height = scroll.clientHeight;

    previous.getAnimations().forEach(animation => animation.cancel());
    page.getAnimations().forEach(animation => animation.cancel());

    const isResized = modal.fit(() => {
        content.replaceChildren(page);
    });
    scroll.scrollTop = scrollTop;

    if (isResized || previous === page) {
        return;
    }

    const ghost = document.createElement('div');
    ghost.classList.add('preference-ghost');
    ghost.style.top = (scroll.scrollTop - previousScrollTop) + 'px';
    ghost.style.height = (height + previousScrollTop) + 'px';
    ghost.appendChild(previous);
    content.appendChild(ghost);

    const option = { duration: SLIDE_DURATION, easing: SLIDE_EASING };
    ghost.animate([
        { transform: 'translateX(0%)' },
        { transform: 'translateX(' + shift + '%)' },
    ], option).onfinish = () => {
        ghost.remove();
    };
    ghost.animate([
        { opacity: 1 },
        { opacity: 0 },
    ], { duration: FADE_DURATION, easing: 'ease', fill: 'forwards' });
    page.animate([
        { transform: 'translateX(' + -shift + '%)' },
        { transform: 'translateX(0%)' },
    ], option);
}

function showConfirmPage(title, text, actionLabel, onConfirm) {
    const page = document.createElement('div');
    page.classList.add('preference-page', 'confirm');
    page.textContent = text;

    modal.addRightButton(actionLabel, onConfirm);
    showNextPage(title, page);
}

function clearBookmark() {
    Config.setBookmarkList([]);
    api.onShortcutChange();
    showPreviousPage();
    messageBookmarkCleared.show();
}

function clearRecent() {
    Config.setRecentList([]);
    api.onShortcutChange();
    showPreviousPage();
    messageRecentCleared.show();
}

function buildSwitchItem(labelText, get, onChange) {
    const toggle = Component.createSwitch(get(), onChange);
    refreshList.push(() => toggle.setValue(get()));

    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable');
    item.appendChild(buildLabel(labelText));
    item.appendChild(toggle.getElement());
    item.addEventListener('click', (e) => {
        if (!toggle.getElement().contains(e.target)) {
            toggle.toggle();
        }
    });
    return item;
}

function buildNavigationItem(labelText, onClick) {
    const icon = document.createElement('div');
    icon.classList.add('preference-icon');
    icon.innerHTML = Design.getIcon('right', 'var(--color-gray)');

    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable');
    item.appendChild(buildLabel(labelText));
    item.appendChild(icon);
    item.addEventListener('click', onClick);
    return item;
}

function buildActionItem(labelText, onClick) {
    const item = document.createElement('div');
    item.classList.add('preference-item', 'clickable', 'danger');
    item.appendChild(buildLabel(labelText));
    item.addEventListener('click', onClick);
    return item;
}

function buildLabel(text) {
    const label = document.createElement('div');
    label.classList.add('preference-label');
    label.textContent = text;
    return label;
}

function buildDivider() {
    const divider = document.createElement('div');
    divider.classList.add('preference-divider');
    return divider;
}
