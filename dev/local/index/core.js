import { Device } from '/lib/device.js';

import { Config } from '/global/config.js';

let stateEl;

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const content = document.querySelector('#content');
    content.classList.add('dev-content');
    content.appendChild(buildTitle('dev'));
    content.appendChild(buildModeSection());
    content.appendChild(buildPageSection());
}

function buildModeSection() {
    const section = buildSection('dev モード');

    stateEl = document.createElement('div');
    section.appendChild(stateEl);

    const group = buildGroup();
    group.appendChild(buildButton('切り替える', () => {
        Config.setDev(!Config.getDev());
        updateState();
    }));
    section.appendChild(group);

    section.appendChild(buildNote('状態はこのブラウザの localStorage に「dev」として保存される。'));

    updateState();
    return section;
}

function buildPageSection() {
    const section = buildSection('ページ');

    const group = buildGroup();
    group.appendChild(buildLink('テスト', './test.html'));
    group.appendChild(buildLink('トップページ', '../'));
    section.appendChild(group);

    return section;
}

function updateState() {
    stateEl.textContent = Config.getDev() ? 'dev モード：ON' : 'dev モード：OFF';
}

function buildTitle(text) {
    const title = document.createElement('h1');
    title.className = 'dev-title';
    title.textContent = text;
    return title;
}

function buildSection(text) {
    const section = document.createElement('section');
    section.className = 'dev-section';

    const category = document.createElement('h2');
    category.className = 'dev-category';
    category.textContent = text;
    section.appendChild(category);

    return section;
}

function buildGroup() {
    const group = document.createElement('div');
    group.className = 'dev-group';
    return group;
}

function buildButton(text, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dev-button';
    button.textContent = text;
    button.addEventListener('click', () => onClick());
    return button;
}

function buildLink(text, href) {
    const link = document.createElement('a');
    link.className = 'dev-button';
    link.href = href;
    link.textContent = text;
    return link;
}

function buildNote(text) {
    const note = document.createElement('div');
    note.className = 'dev-note';
    note.textContent = text;
    return note;
}
