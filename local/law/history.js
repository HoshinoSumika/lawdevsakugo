export const History = {
    init,
    register,
    show,
};

import { Interface } from '/global/interface.js?v=20260213';
import { Kaiseki } from '/global/kaiseki.js?v=20260213';
import { Service } from '/global/service.js?v=20260213';
import { Storage } from '/global/storage.js?v=20260213';

let interfaceView;
let historyContent;

function init() {
    historyContent = document.createElement('div');

    interfaceView = Interface.createModal(historyContent);
    interfaceView.enableTitleBar();
    interfaceView.setTitle('改正履歴');
    interfaceView.getOverlay().classList.add('law-overlay');
    interfaceView.getOverlay().classList.add('history-overlay');
    interfaceView.getContainer().classList.add('law-container');
    interfaceView.getContainer().classList.add('history-container');
    interfaceView.getContent().classList.add('history-content');

    interfaceView.onShow(() => {
        requestAnimationFrame(() => {
            interfaceView.getContainer().classList.add('show');
        });
    });
    interfaceView.onHide(() => {
        interfaceView.getContainer().classList.remove('show');
    });
}

let initContent = () => {};

function register(name, func) {
    if (name === 'initContent') {
        initContent = func;
    }
}

function show() {
    updateContent();
    interfaceView.show();
}

function hide() {
    interfaceView.hide();
}

let revisions;

async function updateContent() {
    let id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        return;
    }
    if (id.includes('_')) {
        id = id.split('_')[0];
    }
    if (!revisions) {
        historyContent.innerHTML = '<div style="width: 100%; height: 32px; text-align: center;">' + 'Loading...' + '</div>';
        await Storage.init('LawRevisionsBeta');
        await Storage.cleanup();
        try {
            revisions = await Storage.getItem(id);
        } catch (e) {
        }
        if (!revisions) {
            const data = await Service.getLawRevisions(id);
            revisions = data ? data.revisions : null;
            if (revisions) {
                await Storage.setItem(id, revisions);
            }
        }
        await Storage.cleanup();
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

        if (revision.law_revision_id === new URLSearchParams(window.location.search).get('id')) {
            item.style.fontWeight = 'bold';
            scrollTarget = item;
        } else if (revision.current_revision_status === 'CurrentEnforced') {
            if (revision.law_revision_id.split('_')[0] === new URLSearchParams(window.location.search).get('id')) {
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
                const url = new URL(window.location.href);
                url.searchParams.set('id', id);
                window.history.pushState(null, '', url);
                initContent();
            }
        });
        historyContent.appendChild(item);
    });

    if (scrollTarget) {
        historyContent.scrollTop = scrollTarget.offsetTop - parseFloat(window.getComputedStyle(historyContent).paddingTop);
    }
}
