import { Device } from '/lib/device.js';

import { Route } from '/global/route.js';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const content = document.querySelector('#content');
    content.appendChild(buildLawLink('129AC0000000089', '民法'));
    content.appendChild(buildLawLink('417AC0000000086', '会社法'));
}

function buildLawLink(id, name) {
    const link = document.createElement('a');
    link.classList.add('law-link');
    link.href = Route.getLawHref(id);
    link.textContent = name;
    return link;
}
