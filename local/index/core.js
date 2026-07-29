import { Device } from '/global/device.js?v=20260703';
import { Theme } from '/global/theme.js?v=20260703';

import { Search } from './search.js?v=20260703';

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
