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

const PAGE_MAP = {
    help: {
        getTitle: Text.getHelp,
        getBody: Text.getHelpBody,
    },
    terms: {
        getTitle: Text.getTerms,
        getBody: Text.getTermsBody,
    },
    privacy: {
        getTitle: Text.getPrivacy,
        getBody: Text.getPrivacyBody,
    },
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
    modal.setTitle(PAGE_MAP[name].getTitle());
    modal.fit(() => {
        content.innerHTML = PAGE_MAP[name].getBody();
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
