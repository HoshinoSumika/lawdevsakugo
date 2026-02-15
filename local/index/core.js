import { Device } from '/global/device.js?v=20260213';
import { Interface } from '/global/interface.js?v=20260213';
import { Theme } from '/global/theme.js?v=20260213';

import { Search } from './search.js?v=20260213';

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Search.init();
    init();
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

function init() {
    const content = document.createElement('div');
    const interfaceView = Interface.createModal(content);
    interfaceView.enableTitleBar();
    interfaceView.enableExpandButton();
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('index-container');
    interfaceView.getContent().classList.add('help-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });

    const help = document.querySelector('#help-button');
    help.addEventListener('click', () => {
        content.innerHTML = document.querySelector('#help-content').innerHTML;
        interfaceView.setTitle('使い方');
        interfaceView.show();
    });
}
