export const Menu = {
    init,
    show,
};

import { Shell } from '/lib/shell.js?v=20260101';

let modal;

function init(api) {
    const menuItemConfig = document.querySelector('#menu-item-config');
    menuItemConfig.addEventListener('click', () => {
        hide();
        api.onConfigSelect();
    });

    const menuItemIndex = document.querySelector('#menu-item-index');
    menuItemIndex.addEventListener('click', () => {
        window.location.href = './';
    });

    const menuItemInfo = document.querySelector('#menu-item-info');
    menuItemInfo.addEventListener('click', () => {
        hide();
        api.onInfoSelect();
    });

    const menuItemHistory = document.querySelector('#menu-item-history');
    menuItemHistory.addEventListener('click', () => {
        hide();
        api.onHistorySelect();
    });

    const menuItemDiff = document.querySelector('#menu-item-diff');
    menuItemDiff.addEventListener('click', () => {
        hide();
        api.onDiffSelect();
    });

    const menuItemMokuji = document.querySelector('#menu-item-mokuji');
    menuItemMokuji.addEventListener('click', () => {
        hide();
        api.onMokujiSelect();
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
