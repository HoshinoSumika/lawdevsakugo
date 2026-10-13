export const Nav = {
    init,
    setTitle,
};

import { Design } from '/lib/design.js';

let title;

function init(api) {
    const nav = document.createElement('nav');
    nav.classList.add('nav');

    title = document.createElement('span');
    title.classList.add('nav-title-text');
    title.addEventListener('click', api.onInfoSelect);

    const titleArea = document.createElement('div');
    titleArea.classList.add('nav-title');
    titleArea.appendChild(title);

    nav.appendChild(buildButton('menu', api.onMenuSelect));
    nav.appendChild(titleArea);
    nav.appendChild(buildButton('search', api.onSearchSelect));

    document.body.prepend(nav);
}

function setTitle(text) {
    title.textContent = text;
}

function buildButton(name, onClick) {
    const button = document.createElement('div');
    button.classList.add('button');
    button.innerHTML = Design.getIcon(name, 'var(--color-black)');
    button.addEventListener('click', onClick);
    return button;
}
