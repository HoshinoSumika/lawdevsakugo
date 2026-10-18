export const Shortcut = {
    init,
    show,
    hide,
};

import { Config } from '/global/config.js';
import { Route } from '/global/route.js';
import { Text } from '/global/text.js';

const RECENT_LIMIT = 10;

let api;
let shortcut;

function init(value) {
    api = value;

    shortcut = document.createElement('div');
    shortcut.className = 'shortcut shortcut-hidden';
    api.getContent().appendChild(shortcut);
}

function show() {
    const bookmarkList = Config.getShortcutBookmark() ? Config.getBookmarkList() : [];
    const recentList = Config.getShortcutRecent() ? Config.getRecentList().filter(recent => !includes(bookmarkList, recent.id)).slice(-RECENT_LIMIT).reverse() : [];

    shortcut.replaceChildren();
    appendSection(Text.getBookmark(), bookmarkList);
    appendSection(Text.getRecent(), recentList);
    appendSection(Text.getMajorLaw(), Config.getShortcutMajor() ? api.getMajorList() : []);
    shortcut.classList.remove('shortcut-hidden');
}

function hide() {
    shortcut.classList.add('shortcut-hidden');
}

function includes(lawList, id) {
    return lawList.some(law => law.id === id);
}

function appendSection(heading, lawList) {
    if (lawList.length === 0) {
        return;
    }

    const headingEl = document.createElement('h2');
    headingEl.className = 'shortcut-heading';
    headingEl.textContent = heading;

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
    item.title = law.title;
    item.appendChild(text);
    return item;
}
