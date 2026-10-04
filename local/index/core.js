import { Device } from '/lib/device.js';

import { Route } from '/global/route.js';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
    const link = document.createElement('a');
    link.href = Route.getLawHref('129AC0000000089');
    link.textContent = '民法';
    document.querySelector('#content').appendChild(link);
}
