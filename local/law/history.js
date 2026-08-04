export const History = {
    init,
    show,
};

import { Scroll } from '/lib/scroll.js?v=20260101';
import { Shell } from '/lib/shell.js?v=20260101';

import { Convert } from '/global/convert.js?v=20260101';
import { Service } from '/global/service.js?v=20260101';

const SCROLL_DELAY = 200;
const SCROLL_DURATION = 800;

let api;
let modal;
let historyContent;

function init(value) {
    api = value;

    historyContent = document.createElement('div');
    historyContent.classList.add('history-content');

    modal = Shell.createModal(historyContent);
    modal.setPlacement('left');
    modal.setTitle('改正履歴');
    modal.enableCloseButton(hide);
}

function show() {
    modal.show();
    updateContent();
}

function hide() {
    modal.hide();
}

let revisions;
let revisionsLawId = '';

async function updateContent() {
    let id = api.getLawId();
    if (!id) {
        return;
    }
    if (id.includes('_')) {
        id = id.split('_')[0];
    }
    if (!revisions || revisionsLawId !== id) {
        historyContent.innerHTML = '<div style="width: 100%; height: 32px; text-align: center;">' + 'Loading...' + '</div>';
        revisionsLawId = id;
        revisions = await Service.getLawRevisions(id);
    }
    if (revisions) {
        historyContent.innerHTML = '';
        renderContent();
    } else {
        historyContent.innerHTML = '<div>データを取得できませんでした。</div>';
    }
}

function renderContent() {
    if (!Array.isArray(revisions) || revisions.length === 0) {
        return;
    }

    let scrollTarget;

    revisions.forEach(revision => {
        const item = document.createElement('div');

        let str = '';
        if (revision.current_revision_status === 'UnEnforced') {
            const enforcementComment = revision.amendment_enforcement_comment || '';
            if (enforcementComment) {
                str = '<div>' + enforcementComment + '　施行予定' + '</div>';
            } else {
                const enforcementDate = revision.amendment_enforcement_date || '';
                str = '<div>' + Convert.date(enforcementDate) + '　施行予定' + '</div>';
            }
        } else if (revision.current_revision_status === 'CurrentEnforced') {
            const enforcementDate = revision.amendment_enforcement_date || '';
            str = '<div>' + Convert.date(enforcementDate) + '　現在施行' + '</div>';
        } else if (revision.current_revision_status === 'PreviousEnforced') {
            const enforcementDate = revision.amendment_enforcement_date || '';
            str = '<div>' + Convert.date(enforcementDate) + '　施行' + '</div>';
        }
        if (revision.amendment_law_num) {
            str += '<div>' + '（' + revision.amendment_law_num + '）' + '</div>';
        } else {
            str += '<div>' + '（' + '新規制定' + '）' + '</div>';
        }

        if (revision.law_revision_id === api.getLawId()) {
            item.style.fontWeight = 'bold';
            scrollTarget = item;
        } else if (revision.current_revision_status === 'CurrentEnforced') {
            if (revision.law_revision_id.split('_')[0] === api.getLawId()) {
                item.style.fontWeight = 'bold';
                scrollTarget = item;
            }
        }

        item.innerHTML = str;
        item.addEventListener('click', () => {
            hide();
            let id;
            if (revision.current_revision_status === 'CurrentEnforced') {
                id = revision.law_revision_id.split('_')[0];
            } else {
                id = revision.law_revision_id;
            }
            if (item.style.fontWeight === 'bold') {
            } else {
                api.onRevisionSelect(id);
            }
        });
        historyContent.appendChild(item);
    });

    historyContent.scrollTop = 0;
    if (scrollTarget) {
        setTimeout(() => scrollToRevision(scrollTarget), SCROLL_DELAY);
    }
}

function scrollToRevision(item) {
    if (!item.isConnected) return;
    const paddingTop = parseFloat(window.getComputedStyle(historyContent).paddingTop);
    Scroll.smooth(historyContent, item.offsetTop - paddingTop, SCROLL_DURATION);
}
