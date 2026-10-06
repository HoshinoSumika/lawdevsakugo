export const Menu = {
    init,
    show,
};

import { Design } from '/lib/design.js';
import { Dialog } from '/lib/dialog.js';

import { Text } from '/global/text.js';

let modal;

function init(api) {
    const content = document.createElement('div');
    content.classList.add('menu-content');
    content.appendChild(buildItem('home', Text.getTopPage(), () => {
        window.location.href = '/';
    }));
    content.appendChild(buildDivider());
    content.appendChild(buildItem('info', Text.getInfo(), () => {
        hide();
        api.onInfoSelect();
    }));
    content.appendChild(buildItem('history', Text.getHistory(), () => {
        hide();
        api.onHistorySelect();
    }));

    modal = Dialog.createModal(content);
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

function buildItem(icon, label, onClick) {
    const text = document.createElement('span');
    text.textContent = label;

    const item = document.createElement('div');
    item.classList.add('menu-item');
    item.innerHTML = Design.getIcon(icon, 'var(--color-black)');
    item.appendChild(text);
    item.addEventListener('click', onClick);
    return item;
}

function buildDivider() {
    const divider = document.createElement('div');
    divider.classList.add('menu-divider');
    return divider;
}
