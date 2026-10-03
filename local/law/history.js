export const History = {
    init,
    show,
};

import { Scroll } from '/lib/scroll.js';
import { Shell } from '/lib/shell.js';

import { Convert } from '/global/convert.js';
import { Service } from '/global/service.js';

const SCROLL_DURATION = 800;

let api;
let modal;
let content;
let list;
let loading;

let revisions = [];
let revisionsLawId = '';
let requestVersion = 0;

function init(value) {
    api = value;

    content = document.createElement('div');
    content.className = 'history-content';

    list = document.createElement('div');
    list.className = 'history-revision-list';
    content.appendChild(list);

    loading = document.createElement('div');
    loading.className = 'history-loading';
    loading.textContent = 'Loading...';
    content.appendChild(loading);

    modal = Shell.createModal(content);
    modal.setTitle('改正履歴');
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);
    content.closest('.shell-modal').classList.add('history-modal');
}

async function show() {
    const version = ++requestVersion;

    modal.show();

    const lawId = api.getLawId() || '';
    const baseLawId = lawId.split('_')[0];
    if (!baseLawId) {
        showListMessage('法令IDを取得できませんでした。', true);
        return;
    }

    if (baseLawId === revisionsLawId && revisions.length > 0) {
        renderRevisions(lawId);
        return;
    }

    revisions = [];
    revisionsLawId = baseLawId;
    list.innerHTML = '';
    setBusy(true);

    const loaded = await Service.getLawRevisions(baseLawId);
    if (version !== requestVersion) return;
    setBusy(false);

    if (!loaded) {
        showListMessage('改正履歴を取得できませんでした。', true);
        return;
    }
    revisions = loaded;
    renderRevisions(lawId);
}

function hide() {
    requestVersion++;
    setBusy(false);
    modal.hide();
}

function renderRevisions(currentLawId) {
    list.innerHTML = '';

    if (revisions.length === 0) {
        showListMessage('改正履歴がありません。', false);
        return;
    }

    let scrollTarget = null;
    revisions.forEach(revision => {
        const isCurrent = isCurrentLaw(revision, currentLawId);
        const item = createRevisionItem(revision, isCurrent);
        list.appendChild(item);
        if (isCurrent) {
            scrollTarget = item;
        }
    });
    list.scrollTop = 0;

    if (scrollTarget) {
        scrollToRevision(scrollTarget);
    }
}

function createRevisionItem(revision, isCurrent) {
    const item = document.createElement('div');
    item.className = 'history-revision-item';
    item.classList.toggle('current', isCurrent);
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    if (isCurrent) {
        item.setAttribute('aria-current', 'true');
    }

    const labels = formatRevision(revision);
    item.appendChild(createLine('history-revision-primary', labels.primary));
    item.appendChild(createLine('history-revision-secondary', labels.secondary));

    const select = () => selectRevision(revision, isCurrent);
    item.addEventListener('click', select);
    item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            select();
        }
    });
    return item;
}

function createLine(className, text) {
    const line = document.createElement('div');
    line.className = className;
    line.textContent = text;
    return line;
}

function selectRevision(revision, isCurrent) {
    hide();
    if (isCurrent) return;
    api.onRevisionSelect(getRequestId(revision));
}

function getRequestId(revision) {
    if (revision.current_revision_status === 'CurrentEnforced') {
        return revisionsLawId;
    }
    return revision.law_revision_id;
}

function showListMessage(text, isError) {
    list.innerHTML = '';
    const message = document.createElement('div');
    message.className = isError ? 'history-message history-error' : 'history-message';
    message.textContent = text;
    list.appendChild(message);
}

function setBusy(value) {
    content.classList.toggle('busy', value);
    loading.classList.toggle('show', value);
}

function scrollToRevision(item) {
    if (!item.isConnected) return;
    const scrollOffset = 12;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    Scroll.smooth(list, list.scrollTop + itemRect.top - listRect.top - scrollOffset, SCROLL_DURATION);
}

function isCurrentLaw(revision, currentLawId) {
    if (!currentLawId) return false;
    if (revision.law_revision_id === currentLawId) return true;
    return revision.current_revision_status === 'CurrentEnforced'
        && revision.law_revision_id.split('_')[0] === currentLawId;
}

function formatRevision(revision) {
    const enforcementDate = revision.amendment_enforcement_date || '';
    let primary = '';
    if (revision.current_revision_status === 'UnEnforced') {
        primary = (revision.amendment_enforcement_comment || Convert.date(enforcementDate)) + '　施行予定';
    } else if (revision.current_revision_status === 'CurrentEnforced') {
        primary = Convert.date(enforcementDate) + '　現在施行';
    } else if (revision.current_revision_status === 'PreviousEnforced') {
        primary = Convert.date(enforcementDate) + '　施行';
    }

    const secondary = revision.amendment_law_num
        ? '（' + revision.amendment_law_num + '）'
        : '（新規制定）';
    return { primary, secondary };
}
