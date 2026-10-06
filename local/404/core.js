import { Device } from '/lib/device.js';

import { Text } from '/global/text.js';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const content = document.querySelector('#content');

    const status = document.createElement('div');
    status.textContent = Text.getNotFound();
    content.appendChild(status);

    const link = document.createElement('a');
    link.href = '/';
    link.textContent = Text.getTopPage();
    content.appendChild(link);
}
