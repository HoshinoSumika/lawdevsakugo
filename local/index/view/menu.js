export const Menu = {
    init,
};

import { Design } from '/lib/design.js';

import { Text } from '/global/text.js';

let api;
let menuButton;
let menuOverlay;
let menuPanel;

function init(value) {
    api = value;

    menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'button menu-button';
    menuButton.setAttribute('aria-label', Text.getMenu());
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.innerHTML = Design.getIcon('menu', 'var(--color-black)');
    menuButton.addEventListener('click', show);

    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    menuOverlay.addEventListener('click', hide);

    menuPanel = document.createElement('div');
    menuPanel.className = 'menu-panel menu-panel-hidden';
    menuPanel.setAttribute('role', 'menu');
    menuPanel.appendChild(buildItem('help', Text.getHelp(), () => api.onInfoSelect('help')));
    menuPanel.appendChild(buildItem('article', Text.getTerms(), () => api.onInfoSelect('terms')));
    menuPanel.appendChild(buildItem('shield', Text.getPrivacy(), () => api.onInfoSelect('privacy')));
    menuPanel.appendChild(buildItem('config', Text.getPreference(), () => api.onPreferenceSelect()));

    document.body.append(menuButton, menuOverlay, menuPanel);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isShown()) {
            event.preventDefault();
            event.stopPropagation();
            hide();
        }
    }, true);
}

function show() {
    menuButton.classList.add('menu-button-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuOverlay.classList.add('menu-overlay-shown');
    menuPanel.classList.remove('menu-panel-hidden');
}

function hide() {
    menuButton.classList.remove('menu-button-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuOverlay.classList.remove('menu-overlay-shown');
    menuPanel.classList.add('menu-panel-hidden');
}

function isShown() {
    return !menuPanel.classList.contains('menu-panel-hidden');
}

function buildItem(icon, label, onClick) {
    const text = document.createElement('span');
    text.textContent = label;

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'menu-item';
    item.setAttribute('role', 'menuitem');
    item.innerHTML = Design.getIcon(icon, 'var(--color-black)');
    item.appendChild(text);
    item.addEventListener('click', () => {
        hide();
        onClick();
    });
    return item;
}
