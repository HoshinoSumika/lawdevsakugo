import { Device } from '/lib/device.js';
import { Dialog } from '/lib/dialog.js';
import { Flex } from '/lib/flex.js';

import { Dictionary } from './dictionary.js';
import { Info } from './view/info.js';
import { Internet } from './internet.js';
import { Menu } from './view/menu.js';
import { Preference } from './view/preference.js';
import { Search } from './view/search.js';
import { Shortcut } from './view/shortcut.js';

const CANDIDATE_LIMIT = 8;
const INTERNET_LIMIT = 100;

const contentEl = document.querySelector('#content');

const api = {
    getContent: () => contentEl,
    getMajorList: () => Dictionary.getMajorList(),
    onQueryChange: (value) => changeQuery(value),
    onInternetSelect: () => selectInternet(),
    onInternetAllSelect: (totalCount) => selectInternetAll(totalCount),
    onPreferenceSelect: () => Preference.show(),
    onInfoSelect: (name) => Info.show(name),
    onShortcutChange: () => changeShortcut(),
    onListToggle: () => changeShortcut(),
};

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

window.addEventListener('pageshow', event => {
    showPage(event.persisted);
});

let query = '';
let internetQuery = '';
let searchVersion = 0;
let dictionaryLoad = null;

function init() {
    Dialog.setColor('var(--color-black)', 'var(--color-white)', 'rgba(0,0,0,0.32)');
    Flex.setColor('var(--color-black)', 'var(--color-white)');

    Info.init();
    Menu.init(api);
    Preference.init(api);
    Search.init(api);
    Shortcut.init(api);
    dictionaryLoad = Dictionary.load();
}

async function showPage(isPersisted) {
    if (isPersisted) {
        Search.reset();
        query = '';
        internetQuery = '';
    }

    await dictionaryLoad;
    if (!internetQuery) {
        renderQuery();
    }
}

function changeQuery(value) {
    if (value.trim() === query) {
        return;
    }
    query = value.trim();
    renderQuery();
}

function renderQuery() {
    internetQuery = '';
    searchVersion = searchVersion + 1;

    if (query) {
        Shortcut.hide();
        Search.showCandidate(query, Dictionary.find(query, CANDIDATE_LIMIT));
    } else {
        Search.hideList();
        Shortcut.show();
    }
}

function changeShortcut() {
    if (query && Search.isListShown()) {
        Shortcut.hide();
    } else {
        Shortcut.show();
    }
}

function selectInternet() {
    searchInternet(query, INTERNET_LIMIT);
}

function selectInternetAll(totalCount) {
    searchInternet(internetQuery, totalCount);
}

async function searchInternet(value, limit) {
    internetQuery = value;

    searchVersion = searchVersion + 1;
    const functionVersion = searchVersion;
    Search.showLoading();

    const result = await Internet.search(value, limit);
    if (functionVersion !== searchVersion) {
        return;
    }
    if (!result) {
        Search.showError();
        return;
    }
    Search.showInternetResult(value, result);
}
