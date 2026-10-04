import { Device } from '/lib/device.js';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const content = document.querySelector('#content');

    const status = document.createElement('div');
    status.textContent = '404';
    content.appendChild(status);

    const link = document.createElement('a');
    link.href = '/';
    link.textContent = 'トップページ';
    content.appendChild(link);
}
