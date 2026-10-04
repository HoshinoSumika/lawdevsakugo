export const Reference = {
    init,
    mark,
    clear,
};

import { Shell } from '/lib/shell.js';

import { Service } from '/global/service.js';

import { Address } from './reference/address.js';
import { Parser } from './reference/parser.js';

const REFERENCE_CLASS = 'tag-reference';

let api;
let modal = null;
let referenceContent = null;
let entries = [];
let externalLaws = new Map();
let requestVersion = 0;

function init(value) {
    api = value;

    api.getContent().addEventListener('click', (event) => {
        openFromClick(event, '', false);
    });
}

function createModal() {
    referenceContent = document.createElement('div');
    referenceContent.className = 'reference-content';
    referenceContent.addEventListener('click', (event) => {
        const entry = entries[entries.length - 1];
        openFromClick(event, entry ? entry.law : '', true);
    });

    modal = Shell.createModal(referenceContent);
    modal.setWidth('min(720px, 90vw)');
    modal.setMaxHeight('80dvh');
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);
}

function mark(law) {
    const index = Address.createIndex(law);
    let state = createState(null);

    law.querySelectorAll('.Sentence').forEach(sentence => {
        if (sentence.closest('.AmendProvision, .TOC')) {
            return;
        }

        const context = Address.createContext(index, sentence);
        const key = context.elements.Article || context.elements.Paragraph || context.scope;
        if (state.key !== key) {
            state = createState(key);
        }

        const textNodes = collectTextNodes(sentence, []);
        const text = textNodes.map(node => node.nodeValue).join('');
        const references = Address.build(Parser.parse(text), context, state);
        wrapReferences(textNodes, references);
    });

    return law;
}

function clear() {
    hide();
    externalLaws = new Map();
}

function createState(key) {
    return { key, lastLaw: '', lastTarget: null, lawNames: {} };
}

function collectTextNodes(node, textNodes) {
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            textNodes.push(child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'RT') {
            collectTextNodes(child, textNodes);
        }
    });
    return textNodes;
}

function wrapReferences(textNodes, references) {
    if (references.length === 0) {
        return;
    }

    let offset = 0;
    textNodes.forEach(textNode => {
        const value = textNode.nodeValue;
        const nodeStart = offset;
        const nodeEnd = nodeStart + value.length;
        offset = nodeEnd;

        const parts = references.filter(reference => reference.start < nodeEnd && reference.end > nodeStart);
        if (parts.length === 0) {
            return;
        }

        const owner = textNode.ownerDocument;
        const fragment = owner.createDocumentFragment();
        let cursor = 0;
        parts.forEach(reference => {
            const start = Math.max(reference.start, nodeStart) - nodeStart;
            const end = Math.min(reference.end, nodeEnd) - nodeStart;
            if (start > cursor) {
                fragment.append(value.slice(cursor, start));
            }
            fragment.appendChild(createReferenceSpan(owner, reference, value.slice(start, end)));
            cursor = end;
        });
        if (cursor < value.length) {
            fragment.append(value.slice(cursor));
        }
        textNode.replaceWith(fragment);
    });
}

function createReferenceSpan(owner, reference, text) {
    const span = owner.createElement('span');
    span.className = REFERENCE_CLASS;
    span.dataset.referenceTarget = reference.addresses.join(' ');
    if (reference.law) {
        span.dataset.referenceLaw = reference.law;
    }
    if (reference.lawName) {
        span.dataset.referenceLawName = reference.lawName;
    }
    span.textContent = text;
    return span;
}

function createEntry(span, contextLaw) {
    return {
        law: span.dataset.referenceLaw || contextLaw,
        lawName: span.dataset.referenceLawName || '',
        addresses: span.dataset.referenceTarget.split(' '),
    };
}

function buildTitle(entry, law) {
    const label = Address.label(entry.addresses);
    if (isMainLaw(entry.law)) {
        return label;
    }
    const lawTitle = law ? law.querySelector('.LawTitle')?.textContent : '';
    return (lawTitle || entry.lawName) + label;
}

function openFromClick(event, contextLaw, isNested) {
    const span = event.target.closest('.' + REFERENCE_CLASS);
    if (!span || hasSelection()) {
        return;
    }

    const entry = createEntry(span, contextLaw);

    if (isNested) {
        entries.push(entry);
    } else {
        hide();
        entries = [entry];
        createModal();
        modal.show();
    }
    render().then(() => {});
}

function hasSelection() {
    const selection = window.getSelection();
    return Boolean(selection) && !selection.isCollapsed;
}

function back() {
    if (entries.length <= 1) {
        return;
    }
    entries.pop();
    render().then(() => {});
}

function hide() {
    requestVersion = requestVersion + 1;
    entries = [];
    if (!modal) {
        return;
    }
    modal.dismiss();
    modal = null;
    referenceContent = null;
}

async function render() {
    requestVersion = requestVersion + 1;
    const version = requestVersion;
    const entry = entries[entries.length - 1];

    if (entries.length > 1) {
        modal.enableBackButton(back);
    } else {
        modal.disableBackButton();
    }
    modal.setTitle(buildTitle(entry, null));
    showMessage('Loading...');

    const law = await loadLaw(entry.law);
    if (version !== requestVersion) {
        return;
    }
    if (!law) {
        showMessage('データを取得できませんでした。');
        return;
    }

    modal.setTitle(buildTitle(entry, law));

    const targets = entry.addresses.flatMap(address => Address.resolve(law, address));
    if (targets.length === 0) {
        showMessage('参照先が見つかりませんでした。');
        return;
    }

    modal.fitHeight(() => {
        referenceContent.innerHTML = '';
        targets.forEach(target => {
            referenceContent.appendChild(target.cloneNode(true));
        });
    });
    modal.resetScroll();
}

function showMessage(text) {
    modal.fitHeight(() => {
        referenceContent.innerHTML = '';
        const message = document.createElement('div');
        message.className = 'reference-message';
        message.textContent = text;
        referenceContent.appendChild(message);
    });
}

function getMainLaw() {
    return api.getContent().querySelector('.Law');
}

function isMainLaw(lawNum) {
    const mainLaw = getMainLaw();
    return !lawNum || Boolean(mainLaw && mainLaw.dataset.law_info_law_num === lawNum);
}

function loadLaw(lawNum) {
    if (isMainLaw(lawNum)) {
        return Promise.resolve(getMainLaw());
    }
    if (!externalLaws.has(lawNum)) {
        const loading = fetchExternalLaw(lawNum).then(law => {
            if (!law) {
                externalLaws.delete(lawNum);
            }
            return law;
        });
        externalLaws.set(lawNum, loading);
    }
    return externalLaws.get(lawNum);
}

async function fetchExternalLaw(lawNum) {
    const id = await Service.getLawIdByNum(lawNum);
    if (!id) {
        return null;
    }
    const result = await Service.getLawFullText(id);
    if (!result) {
        return null;
    }
    const source = document.createElement('div');
    source.innerHTML = result;
    const law = source.firstElementChild;
    return law ? api.convertLaw(law) : null;
}
