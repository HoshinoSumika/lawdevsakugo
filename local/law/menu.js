export const Menu = {
    init,
    show,
};

import { Shell } from '/global/shell.js?v=20260101';

import { Config } from './config.js?v=20260101';
import { History } from './history.js?v=20260101';
import { Info } from './info.js?v=20260101';
import { Mokuji } from './mokuji.js?v=20260101';

let modal;

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
    menuContent.classList.add('menu-content');

    modal = Shell.createModal(menuContent);
    modal.setPlacement('left');
    modal.setTitle('');
    modal.enableCloseButton(hide);
}

function show() {
    modal.show();
}

function hide() {
    modal.hide();
}
