export const History = {
    init,
    show,
};

import { Shell } from '/lib/shell.js?v=20260101';

import { Cache } from '/global/cache.js?v=20260101';
import { Kaiseki } from '/global/kaiseki.js?v=20260101';
import { Service } from '/global/service.js?v=20260101';

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
    updateContent();
    modal.show();
}

function hide() {
    modal.hide();
}

let revisions;

async function updateContent() {
    let id = window.location.pathname.slice(1);
    if (!id) {
        return;
    }
    if (id.includes('_')) {
        id = id.split('_')[0];
    }
    if (!revisions) {
        historyContent.innerHTML = '<div style="width: 100%; height: 32px; text-align: center;">' + 'Loading...' + '</div>';
        await Cache.init('LawRevisionsBeta');
        await Cache.cleanup();
        try {
            revisions = await Cache.getItem(id);
            check();
        } catch (e) {
        }
        if (!revisions) {
            const data = await Service.getLawRevisions(id);
            revisions = data ? data.revisions : null;
            check();
            if (revisions) {
                await Cache.setItem(id, revisions);
            }
        }
        await Cache.cleanup();
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
                str = '<div>' + Kaiseki.wareki(enforcementDate) + '　施行予定' + '</div>';
            }
        } else if (revision.current_revision_status === 'CurrentEnforced') {
            const enforcementDate = revision.amendment_enforcement_date || '';
            str = '<div>' + Kaiseki.wareki(enforcementDate) + '　現在施行' + '</div>';
        } else if (revision.current_revision_status === 'PreviousEnforced') {
            const enforcementDate = revision.amendment_enforcement_date || '';
            str = '<div>' + Kaiseki.wareki(enforcementDate) + '　施行' + '</div>';
        }
        if (revision.amendment_law_num) {
            str += '<div>' + '（' + revision.amendment_law_num + '）' + '</div>';
        } else {
            str += '<div>' + '（' + '新規制定' + '）' + '</div>';
        }

        if (revision.law_revision_id === window.location.pathname.slice(1)) {
            item.style.fontWeight = 'bold';
            scrollTarget = item;
        } else if (revision.current_revision_status === 'CurrentEnforced') {
            if (revision.law_revision_id.split('_')[0] === window.location.pathname.slice(1)) {
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
                window.history.pushState(null, '', '/' + id);
                api.onRevisionSelect();
            }
        });
        historyContent.appendChild(item);
    });

    if (scrollTarget) {
        historyContent.scrollTop = scrollTarget.offsetTop - parseFloat(window.getComputedStyle(historyContent).paddingTop);
    }
}

function check() {
    if (!Array.isArray(revisions) || revisions.length === 0) {
        return;
    }

    const hasCurrentEnforced = revisions.some(revision => revision.current_revision_status === 'CurrentEnforced');
    if (hasCurrentEnforced) {
        return;
    }

    let foundUnEnforced = false;

    for (const revision of revisions) {
        if (revision.current_revision_status === 'UnEnforced') {
            foundUnEnforced = true;
            continue;
        }

        if (revision.current_revision_status === 'PreviousEnforced') {
            revision.current_revision_status = 'CurrentEnforced';
        }

        break;
    }
}