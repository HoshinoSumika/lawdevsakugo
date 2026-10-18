export const Info = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Text } from '/global/text.js';

const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const MODAL_WIDTH = 'min(480px, ' + INSET_WIDTH + ')';

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
    modal.setWidth(MODAL_WIDTH);
    modal.enableCloseButton(hide);
}

function show(name) {
    modal.setTitle(TITLE_MAP[name]());
    modal.fitHeight(() => {
        content.innerHTML = BODY_MAP[name]();
    });
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
}
