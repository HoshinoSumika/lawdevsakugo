import { Control } from '/global/control.js?v=20260213';
import { Device } from '/global/device.js?v=20260213';
import { Interface } from '/global/interface.js?v=20260213';

window.addEventListener('DOMContentLoaded', () => {
    init();
});

window.addEventListener('load', () => {
    Device.disableHoverOnTouch();
});

let content;
let interfaceView;
let controlView;

function init() {
    const content = document.createElement('div');
    content.style.width = '100%';
    content.style.height = '100%';

    interfaceView = Interface.createModal(content);
    interfaceView.enableTitleBar();
    interfaceView.enableExpandButton();
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().style.width = '360px';
    interfaceView.getContainer().style.height = '480px';

    controlView = Control.createInstance(content);
    controlView.open(getRootMenu());

    document.querySelector('#menu-button').addEventListener('click', () => {
        interfaceView.show();
        interfaceView.setTitle('title->root');
    });
}

function getRootMenu() {
    const el = document.createElement('div');
    el.className = 'page';

    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = 'Open Sub Menu';
    item.addEventListener('click', () => {
        interfaceView.setTitle('title->sub');
        controlView.open(getSubMenu());
    });

    el.appendChild(item);

    return el;
}

function getSubMenu() {
    const el = document.createElement('div');
    el.className = 'page';

    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = 'Back';
    item.addEventListener('click', () => {
        interfaceView.setTitle('title->root');
        controlView.back();
    });

    el.appendChild(item);

    return el;
}
