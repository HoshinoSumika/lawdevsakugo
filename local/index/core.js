import { Device } from '/lib/device.js';

import { Theme } from '/global/theme.js';

import { Search } from './search.js';

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Search.init();
    init();
});

window.addEventListener('load', () => {
    Device.optimizeForTouch();
});

function init() {
}
