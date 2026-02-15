export const Menu = {
    init,
    show,
};

import { Interface } from '/global/interface.js?v=20260213';

import { Config } from './config.js?v=20260213';
import { History } from './history.js?v=20260213';
import { Info } from './info.js?v=20260213';
import { Mokuji } from './mokuji.js?v=20260213';

let interfaceView;

function init() {
    const menuItemConfig = document.querySelector('#menu-item-config');
    menuItemConfig.addEventListener('click', () => {
        hide();
        Config.show();
    });

    const menuItemIndex = document.querySelector('#menu-item-index');
    menuItemIndex.addEventListener('click', () => {
        window.location.href = './';
    });

    const menuItemInfo = document.querySelector('#menu-item-info');
    menuItemInfo.addEventListener('click', () => {
        hide();
        Info.show();
    });

    const menuItemHistory = document.querySelector('#menu-item-history');
    menuItemHistory.addEventListener('click', () => {
        hide();
        History.show();
    });

    const menuItemDiff = document.querySelector('#menu-item-diff');
    menuItemDiff.addEventListener('click', () => {
        const url = new URL('./diff.html', window.location);
        url.searchParams.set('id', new URLSearchParams(window.location.search).get('id'));
        window.location.href = url;
    });

    const menuItemMokuji = document.querySelector('#menu-item-mokuji');
    menuItemMokuji.addEventListener('click', () => {
        hide();
        Mokuji.toggle();
    });

    const menuItemPrint = document.querySelector('#menu-item-print');
    menuItemPrint.addEventListener('click', () => {
        hide();
        window.print();
    });

    const menuContent = document.querySelector('#menu-content');

    interfaceView = Interface.createModal(menuContent);
    interfaceView.enableTitleBar();
    interfaceView.setTitle('');
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getOverlay().classList.add('menu-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('menu-container');
    interfaceView.getContent().classList.add('menu-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });
}

function show() {
    interfaceView.show();
}

function hide() {
    interfaceView.hide();
}
