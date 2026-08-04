export const Info = {
    init,
    show,
    update,
    clear,
};

import { Shell } from '/lib/shell.js?v=20260101';

import { Convert } from '/global/convert.js?v=20260101';

let modal;
let lawContent;
let infoContent;

function init(api) {
    lawContent = api.getContent();

    infoContent = document.createElement('div');
    infoContent.classList.add('info-content');

    modal = Shell.createModal(infoContent);
    modal.setTitle('法令詳細');
    modal.enableCloseButton(hide);
}

function show() {
    modal.show();
}

function hide() {
    modal.hide();
}

function update() {
    updateContent();
}

function clear() {
    infoContent.innerHTML = 'Loading...';
}

function updateContent() {
    infoContent.innerHTML = '';

    const infoEl = lawContent.querySelector('.Law');
    if (!infoEl) {
        const message = document.createElement('div');
        message.style.padding = '8px 16px 8px 16px';
        message.textContent = 'データを取得できませんでした。';
        infoContent.appendChild(message);
        return;
    }

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const dataAttributes = infoEl.dataset;
    let value;

    value = dataAttributes['revision_info_law_title'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '現行法令名';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_abbrev'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '略称法令名';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['law_info_law_num'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '法令番号';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['law_info_promulgation_date'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '公布日';
        const td = document.createElement('td');
        td.textContent = Convert.date(value);
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_amendment_enforcement_date'];
    if (value) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '施行日';
        const td = document.createElement('td');
        td.textContent = Convert.date(value);
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_amendment_law_title'] + '（' + dataAttributes['revision_info_amendment_law_num'] + '）';
    if (dataAttributes['revision_info_amendment_law_title'] && dataAttributes['revision_info_amendment_law_num']) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '改正法令';
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    value = dataAttributes['revision_info_repeal_status'];
    if (value !== 'None') {
        let str = '';
        if (value === 'Repeal') {
            str = '廃止';
        } else if (value === 'Expire') {
            str = '失効';
        } else if (value === 'Suspend') {
            str = '停止';
        } else if (value === 'LossOfEffectiveness') {
            str = '実効性喪失';
        }
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = '状態';
        const td = document.createElement('td');
        td.textContent = str;
        tr.appendChild(th);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    infoContent.appendChild(table);
}
