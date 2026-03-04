import { Device } from '/global/device.js?v=20260303';
import { Theme } from '/global/theme.js?v=20260303';

import { Search } from './search.js?v=20260303';

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Search.init();
    init();
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

function init() {
}
