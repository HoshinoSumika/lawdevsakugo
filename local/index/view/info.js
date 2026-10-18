export const Info = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Text } from '/global/text.js';

const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const INSET_HEIGHT = 'calc(100dvh - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_WIDTH + ')';

const TITLE_MAP = {
    help: Text.getHelp,
    terms: Text.getTerms,
    privacy: Text.getPrivacy,
    about: Text.getAbout,
};

const BODY_MAP = {
    help: Text.getHelpBody,
    terms: Text.getTermsBody,
    privacy: Text.getPrivacyBody,
    about: Text.getAboutBody,
};

let modal;
let content;

function init() {
    content = document.createElement('div');
    content.classList.add('info-content');

    modal = Dialog.createModal(content);
    modal.enableCloseButton(hide);

    window.addEventListener('resize', () => {
        applySize();
    });
}

function show(name) {
    applySize();
    modal.setTitle(TITLE_MAP[name]());
    modal.fitHeight(() => {
        content.innerHTML = BODY_MAP[name]();
    });
    modal.resetScroll();
    modal.show();
}

function applySize() {
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (content.closest('.dialog-modal').getBoundingClientRect().width < MODAL_MAX_WIDTH) {
        modal.setMaxHeight(INSET_HEIGHT);
    }
}

function hide() {
    modal.hide();
}
