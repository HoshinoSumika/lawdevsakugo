export const Preference = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Component } from '/global/component.js';
import { Config } from '/global/config.js';
import { Text } from '/global/text.js';

const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const MODAL_WIDTH = 'min(480px, ' + INSET_WIDTH + ')';

const refreshList = [];

let api;
let modal;
let content;

function init(value) {
    api = value;

    content = document.createElement('div');
    content.classList.add('preference-content');
    content.appendChild(buildSwitchItem(Text.getShowBookmark(), Config.getShortcutBookmark, (value) => {
        Config.setShortcutBookmark(value);
        api.onShortcutChange();
    }));
    content.appendChild(buildSwitchItem(Text.getShowRecent(), Config.getShortcutRecent, (value) => {
        Config.setShortcutRecent(value);
        api.onShortcutChange();
    }));
    content.appendChild(buildSwitchItem(Text.getShowMajorLaw(), Config.getShortcutMajor, (value) => {
        Config.setShortcutMajor(value);
        api.onShortcutChange();
    }));

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getPreference());
    modal.setWidth(MODAL_WIDTH);
    modal.enableCloseButton(hide);
}

function show() {
    refreshList.forEach(refresh => refresh());
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
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

function buildLabel(text) {
    const label = document.createElement('div');
    label.classList.add('preference-label');
    label.textContent = text;
    return label;
}
