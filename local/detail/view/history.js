export const History = {
    init,
    show,
};

import { Device } from '/lib/device.js';
import { Dialog } from '/lib/dialog.js';

import { Service } from '/global/service.js';
import { Text } from '/global/text.js';
import { Util } from '/global/util.js';

const SCROLL_DURATION = 800;
const SCROLL_OFFSET = 12;
const INSET_SIZE = 'calc(100% - var(--size-offset) * 4)';
const MODAL_WIDTH = 'min(480px, ' + INSET_SIZE + ')';

let api;
let modal;
let content;
let currentItem = null;

let revisionList = [];
let revisionLawId = '';
let requestVersion = 0;

function init(value) {
    api = value;

    content = document.createElement('div');
    content.classList.add('history-content');

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getHistory());
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);

    window.addEventListener('resize', () => {
        applySize();
    });
}

async function show() {
    requestVersion = requestVersion + 1;
    const version = requestVersion;

    applySize();

    const lawId = api.getLawId();
    const baseLawId = lawId.split('_')[0];

    if (!baseLawId) {
        modal.fitHeight(() => renderMessage(Text.getLawIdUnavailable(), true));
        modal.resetScroll();
        modal.show();
        return;
    }

    if (baseLawId === revisionLawId && revisionList.length > 0) {
        modal.fitHeight(() => renderRevisionList(lawId));
        scrollToCurrent(false);
        modal.show();
        return;
    }

    revisionList = [];
    revisionLawId = baseLawId;
    modal.fitHeight(() => renderMessage(Text.getLoading(), false));
    modal.resetScroll();
    modal.show();

    const loaded = await Service.getLawRevisions(baseLawId);
    if (version !== requestVersion) {
        return;
    }

    if (!loaded) {
        modal.fitHeight(() => renderMessage(Text.getHistoryLoadFailed(), true));
        return;
    }

    revisionList = loaded;
    modal.fitHeight(() => renderRevisionList(lawId));
    scrollToCurrent(true);
}

function applySize() {
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (Device.isMobile()) {
        modal.setHeight(INSET_SIZE);
    }
}

function hide() {
    requestVersion = requestVersion + 1;
    modal.hide();
}

function renderMessage(text, isError) {
    currentItem = null;
    content.innerHTML = '';

    const message = document.createElement('div');
    message.classList.add('history-message');
    message.classList.toggle('error', isError);
    message.textContent = text;
    content.appendChild(message);
}

function renderRevisionList(lawId) {
    if (revisionList.length === 0) {
        renderMessage(Text.getHistoryEmpty(), false);
        return;
    }

    currentItem = null;
    content.innerHTML = '';

    revisionList.forEach(revision => {
        const isCurrent = isCurrentLaw(revision, lawId);
        const item = buildItem(revision, isCurrent);
        content.appendChild(item);
        if (isCurrent) {
            currentItem = item;
        }
    });
}

function buildItem(revision, isCurrent) {
    const label = formatRevision(revision);

    const date = document.createElement('div');
    date.classList.add('history-item-date');
    date.textContent = label.date;

    const num = document.createElement('div');
    num.classList.add('history-item-num');
    num.textContent = label.num;

    const item = document.createElement('div');
    item.classList.add('history-item');
    item.classList.toggle('current', isCurrent);
    item.appendChild(date);
    item.appendChild(num);
    item.addEventListener('click', () => {
        hide();
        if (!isCurrent) {
            api.onRevisionSelect(getRequestId(revision));
        }
    });
    return item;
}

function scrollToCurrent(isAnimated) {
    if (!currentItem) {
        return;
    }
    const scroll = content.closest('.dialog-scroll');
    const top = currentItem.getBoundingClientRect().top - content.getBoundingClientRect().top - SCROLL_OFFSET;
    if (isAnimated) {
        Util.scroll(scroll, top, SCROLL_DURATION);
        return;
    }
    scroll.scrollTop = top;
}

function getRequestId(revision) {
    if (revision.current_revision_status === 'CurrentEnforced') {
        return revisionLawId;
    }
    return revision.law_revision_id;
}

function isCurrentLaw(revision, lawId) {
    if (revision.law_revision_id === lawId) {
        return true;
    }
    return revision.current_revision_status === 'CurrentEnforced'
        && revision.law_revision_id.split('_')[0] === lawId;
}

function formatRevision(revision) {
    const enforcementDate = Util.date(revision.amendment_enforcement_date || '');

    let date = '';
    if (revision.current_revision_status === 'UnEnforced') {
        date = (revision.amendment_enforcement_comment || enforcementDate) + '　' + Text.getUnenforced();
    } else if (revision.current_revision_status === 'CurrentEnforced') {
        date = enforcementDate + '　' + Text.getCurrentEnforced();
    } else if (revision.current_revision_status === 'PreviousEnforced') {
        date = enforcementDate + '　' + Text.getPreviousEnforced();
    }

    const num = revision.amendment_law_num
        ? '（' + revision.amendment_law_num + '）'
        : '（' + Text.getNewEnactment() + '）';
    return { date, num };
}
