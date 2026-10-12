export const Preference = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';
import { Message } from '/lib/message.js';

import { Cache } from '/global/cache.js';
import { Component } from '/global/component.js';
import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

const INSET_SIZE = 'calc(100% - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_SIZE + ')';

const styleMap = {};
const style = document.createElement('style');
const refreshList = [];

let modal;
let content;
let mainPage;
let advancedPage;
let mainScrollTop = 0;

let messagePreferenceCleared;
let messageCacheDeleted;
let messageCacheDeleteFailed;

function init() {
    document.head.appendChild(style);
    applyAll();

    messagePreferenceCleared = Message.info(Text.getPreferenceCleared());
    messageCacheDeleted = Message.info(Text.getCacheDeleted());
    messageCacheDeleteFailed = Message.error(Text.getCacheDeleteFailed());

    mainPage = document.createElement('div');
    mainPage.classList.add('preference-page');
    mainPage.appendChild(buildSwitchItem(Text.getShowToc(), Config.getToc, (value) => {
        Config.setToc(value);
        applyToc(value);
    }));
    mainPage.appendChild(buildSwitchItem(Text.getShowSupplProvision(), Config.getSupplProvision, (value) => {
        Config.setSupplProvision(value);
        applySupplProvision(value);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildRadioItem(Text.getFontFamily(), [
        { value: 'sans-serif', label: Text.getSansSerif() },
        { value: 'serif', label: Text.getSerif() },
    ], Config.getFontFamily, (value) => {
        Config.setFontFamily(value);
        applyFontFamily(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getFontSize(), 14, 18, 0.5, Config.getFontSize, formatFontSize, (value) => {
        Config.setFontSize(value);
        applyFontSize(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getLineHeight(), 1.6, 2.0, 0.05, Config.getLineHeight, formatLineHeight, (value) => {
        Config.setLineHeight(value);
        applyLineHeight(value);
    }));
    mainPage.appendChild(buildSeekbarItem(Text.getLetterSpacing(), 0, 0.2, 0.01, Config.getLetterSpacing, formatLetterSpacing, (value) => {
        Config.setLetterSpacing(value);
        applyLetterSpacing(value);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildNavigationItem(Text.getAdvancedPreference(), () => {
        showSubPage(Text.getAdvancedPreference(), advancedPage);
    }));
    mainPage.appendChild(buildDivider());
    mainPage.appendChild(buildActionItem(Text.getCacheDelete(), () => {
        showConfirmPage(Text.getCacheDelete(), Text.getCacheDeleteConfirm(), Text.getDelete(), deleteCache);
    }));
    mainPage.appendChild(buildActionItem(Text.getPreferenceClear(), () => {
        showConfirmPage(Text.getPreferenceClear(), Text.getPreferenceClearConfirm(), Text.getClear(), clearPreference);
    }));

    advancedPage = document.createElement('div');
    advancedPage.classList.add('preference-page');
    advancedPage.appendChild(buildSwitchItem(Text.getWidthLimit(), Config.getWidthLimit, (value) => {
        Config.setWidthLimit(value);
        applyWidthLimit(value, Config.getWidthLimitSize());
    }));
    advancedPage.appendChild(buildSeekbarItem(Text.getWidthLimitSize(), 640, 1040, 20, Config.getWidthLimitSize, formatWidthLimitSize, (value) => {
        Config.setWidthLimitSize(value);
        applyWidthLimit(Config.getWidthLimit(), value);
    }));

    content = document.createElement('div');
    content.classList.add('preference-content');
    content.appendChild(mainPage);

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getPreference());
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);

    window.addEventListener('resize', () => {
        applySize();
    });
}

function show() {
    applySize();
    showMainPage();
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
}

function applySize() {
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (content.closest('.dialog-modal').getBoundingClientRect().width < MODAL_MAX_WIDTH) {
        modal.setHeight(INSET_SIZE);
    }
}

function showMainPage() {
    modal.setTitle(Text.getPreference());
    modal.disableBackButton();
    modal.clearNav();
    modal.fitHeight(() => {
        content.replaceChildren(mainPage);
    });
    content.closest('.dialog-scroll').scrollTop = mainScrollTop;
}

function showSubPage(title, page) {
    mainScrollTop = content.closest('.dialog-scroll').scrollTop;

    modal.setTitle(title);
    modal.enableBackButton(showMainPage);
    modal.fitHeight(() => {
        content.replaceChildren(page);
    });
    modal.resetScroll();
}

function showConfirmPage(title, text, actionLabel, onConfirm) {
    const page = document.createElement('div');
    page.classList.add('preference-page', 'confirm');
    page.textContent = text;

    modal.addRightButton(actionLabel, onConfirm);
    showSubPage(title, page);
}

function clearPreference() {
    Config.clear();
    applyAll();
    refreshList.forEach(refresh => refresh());
    mainScrollTop = 0;
    showMainPage();
    messagePreferenceCleared.show();
}

async function deleteCache() {
    try {
        await Cache.deleteAll();
        showMainPage();
        messageCacheDeleted.show();
    } catch (e) {
        console.error(e);
        messageCacheDeleteFailed.show();
    }
}

function setStyle(name, text) {
    styleMap[name] = text;
    style.textContent = Object.values(styleMap).join('\n');
}

function applyAll() {
    applyToc(Config.getToc());
    applySupplProvision(Config.getSupplProvision());
    applyFontFamily(Config.getFontFamily());
    applyFontSize(Config.getFontSize());
    applyLineHeight(Config.getLineHeight());
    applyLetterSpacing(Config.getLetterSpacing());
    applyWidthLimit(Config.getWidthLimit(), Config.getWidthLimitSize());
}

function applyToc(isShown) {
    setStyle('toc', isShown ? '' : '.content .LawBody > .TOC { display: none; }');
}

function applySupplProvision(isShown) {
    setStyle('suppl-provision', isShown ? '' : '.content .LawBody > .SupplProvision { display: none; }');
}

function applyFontFamily(value) {
    setStyle('font-family', '.content { font-family: ' + value + '; }');
}

function applyFontSize(value) {
    setStyle('font-size', '.content { font-size: ' + value + 'px; }');
}

function applyLineHeight(value) {
    setStyle('line-height', '.content { line-height: ' + value + '; }');
}

function applyLetterSpacing(value) {
    setStyle('letter-spacing', '.content { letter-spacing: ' + value + 'em; }');
}

function applyWidthLimit(isEnabled, size) {
    setStyle('width-limit', isEnabled ? '.content { max-width: ' + size + 'px; }' : '');
}

function formatFontSize(value) {
    return value.toFixed(1) + 'px';
}

function formatLineHeight(value) {
    return value.toFixed(2);
}

function formatLetterSpacing(value) {
    return value.toFixed(2) + 'em';
}

function formatWidthLimitSize(value) {
    return value + 'px';
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

function buildRadioItem(labelText, optionList, get, onChange) {
    const radio = Component.createRadio(optionList, get(), onChange);
    refreshList.push(() => radio.setValue(get()));

    const item = document.createElement('div');
    item.classList.add('preference-item');
    item.appendChild(buildLabel(labelText));
    item.appendChild(radio.getElement());
    return item;
}

function buildSeekbarItem(labelText, min, max, step, get, format, onChange) {
    const value = document.createElement('div');
    value.classList.add('preference-value');
    value.textContent = format(get());

    const seekbar = Component.createSeekbar(min, max, step, get(), (next) => {
        value.textContent = format(next);
        onChange(next);
    });
    refreshList.push(() => {
        seekbar.setValue(get());
        value.textContent = format(get());
    });

    const header = document.createElement('div');
    header.classList.add('preference-seekbar-header');
    header.appendChild(buildLabel(labelText));
    header.appendChild(value);

    const item = document.createElement('div');
    item.classList.add('preference-item', 'seekbar');
    item.appendChild(header);
    item.appendChild(seekbar.getElement());
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
