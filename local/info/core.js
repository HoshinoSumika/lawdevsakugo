import { Device } from '/global/device.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    initTitle();
    initContent().then(() => {});
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

function initTitle() {
    const info = getInfo();
    let title = '';
    if (info === 'about') {
        title = '当サイトについて';
    } else if (info === 'privacy') {
        title = 'プライバシー';
    } else if (info === 'terms') {
        title = '利用規約';
    } else {
        title = '404';
    }
    document.title = title;
    document.querySelector('#title').innerHTML = title;
}

async function initContent() {
    const info = getInfo();
    const content = await getContent(info);
    if (content) {
        document.querySelector('#content').innerHTML = content;
    } else {
        document.querySelector('#content').innerHTML = '404';
    }
}

function getInfo() {
    const info = new URLSearchParams(window.location.search).get('q');
    return info;
}

async function getContent(str) {
    if (!str) {
        return null;
    }
    try {
        const url = '/data/page/' + str;
        const res = await fetch(url);
        if (res.ok) {
            let result = await res.text();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}
