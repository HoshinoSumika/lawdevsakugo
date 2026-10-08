export const Info = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Text } from '/global/text.js';
import { Util } from '/global/util.js';

const INSET_SIZE = 'calc(100% - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_SIZE + ')';

let lawContent;
let modal;
let content;

function init(api) {
    lawContent = api.getContent();

    content = document.createElement('div');
    content.classList.add('info-content');

    modal = Dialog.createModal(content);
    modal.setWidth(MODAL_WIDTH);
    modal.setTitle(Text.getInfo());
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

    appendRow(tbody, Text.getLawTitle(), data.revision_info_law_title);
    appendRow(tbody, Text.getLawAbbrev(), data.revision_info_abbrev);
    appendRow(tbody, Text.getLawNum(), data.law_info_law_num);
    appendRow(tbody, Text.getPromulgationDate(), Util.date(data.law_info_promulgation_date || ''));
    appendRow(tbody, Text.getEnforcementDate(), Util.date(data.revision_info_amendment_enforcement_date || ''));
    if (data.revision_info_amendment_law_title && data.revision_info_amendment_law_num) {
        appendRow(tbody, Text.getAmendmentLaw(), data.revision_info_amendment_law_title + '（' + data.revision_info_amendment_law_num + '）');
    }
    appendRow(tbody, Text.getRepealStatus(), Text.getRepealStatus(data.revision_info_repeal_status));

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
