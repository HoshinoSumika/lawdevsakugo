export const Info = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Util } from '/global/util.js';

const REPEAL_STATUS_MAP = {
    Repeal: '廃止',
    Expire: '失効',
    Suspend: '停止',
    LossOfEffectiveness: '実効性喪失',
};

let lawContent;
let modal;
let content;

function init(api) {
    lawContent = api.getContent();

    content = document.createElement('div');
    content.classList.add('info-content');

    modal = Dialog.createModal(content);
    modal.setWidth('min(480px, calc(100% - var(--size-offset) * 4))');
    modal.setTitle('法令詳細');
    modal.enableCloseButton(hide);
}

function show() {
    render();
    modal.resetScroll();
    modal.show();
}

function hide() {
    modal.hide();
}

function render() {
    content.innerHTML = '';

    const law = lawContent.querySelector('.Law');
    if (!law) {
        return;
    }

    const data = law.dataset;
    const tbody = document.createElement('tbody');

    appendRow(tbody, '現行法令名', data.revision_info_law_title);
    appendRow(tbody, '略称法令名', data.revision_info_abbrev);
    appendRow(tbody, '法令番号', data.law_info_law_num);
    appendRow(tbody, '公布日', Util.date(data.law_info_promulgation_date || ''));
    appendRow(tbody, '施行日', Util.date(data.revision_info_amendment_enforcement_date || ''));
    if (data.revision_info_amendment_law_title && data.revision_info_amendment_law_num) {
        appendRow(tbody, '改正法令', data.revision_info_amendment_law_title + '（' + data.revision_info_amendment_law_num + '）');
    }
    appendRow(tbody, '状態', REPEAL_STATUS_MAP[data.revision_info_repeal_status]);

    const table = document.createElement('table');
    table.appendChild(tbody);
    content.appendChild(table);
}

function appendRow(tbody, label, value) {
    if (!value) {
        return;
    }

    const th = document.createElement('th');
    th.textContent = label;

    const td = document.createElement('td');
    td.textContent = value;

    const tr = document.createElement('tr');
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
}
