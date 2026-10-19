export const Compare = {
    init,
    show,
};

import { Dialog } from '/lib/dialog.js';

import { Config } from '/global/config.js';
import { Diff } from '/global/diff.js';
import { Service } from '/global/service.js';
import { Text } from '/global/text.js';
import { Util } from '/global/util.js';

const SCROLL_DURATION = 800;
const SCROLL_OFFSET = 12;
const INSET_WIDTH = 'calc(100% - var(--size-offset) * 4)';
const INSET_HEIGHT = 'calc(100dvh - var(--size-offset) * 4)';
const MODAL_MAX_WIDTH = 480;
const MODAL_WIDTH = 'min(' + MODAL_MAX_WIDTH + 'px, ' + INSET_WIDTH + ')';
const MODAL_HEIGHT = 'min(640px, ' + INSET_HEIGHT + ')';
const SELECTION_LIMIT = 2;
const MATCH_LENGTH_MIN = 4;
const CAPTION_RATIO_SCALE = 0.625;
const LABEL_SELECTOR = '.ArticleCaption, .ArticleTitle, .ParagraphNum, .ItemTitle, .Subitem1Title, .Subitem2Title, .Subitem3Title, .Subitem4Title, .Subitem5Title';

let api;
let modal;
let content;
let selectionPage;
let resultPage;
let list;
let loading;
let compareButton = null;
let currentItem = null;
let selectionScrollTop = 0;

let revisionList = [];
let revisionLawId = '';
let selectedIdList = [];
let isBusy = false;
let requestVersion = 0;

function init(value) {
    api = value;

    list = document.createElement('div');
    list.classList.add('compare-list');

    const loadingText = document.createElement('div');
    loadingText.classList.add('compare-loading-text');
    loadingText.textContent = Text.getLoading();

    loading = document.createElement('div');
    loading.classList.add('compare-loading');
    loading.appendChild(loadingText);

    selectionPage = document.createElement('div');
    selectionPage.classList.add('compare-selection');
    selectionPage.appendChild(list);
    selectionPage.appendChild(loading);

    resultPage = document.createElement('div');
    resultPage.classList.add('compare-result');

    content = document.createElement('div');
    content.classList.add('compare-content');
    content.appendChild(selectionPage);

    modal = Dialog.createModal(content);
    modal.setTitle(Text.getCompare());
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);

    window.addEventListener('resize', () => {
        applySize();
    });
}

async function show() {
    requestVersion = requestVersion + 1;
    const version = requestVersion;

    clearButton();
    modal.disableBackButton();
    content.replaceChildren(selectionPage);
    applySize();

    const lawId = api.getLawId();
    const baseLawId = lawId.split('_')[0];

    if (!baseLawId) {
        modal.fit(() => renderMessage(Text.getLawIdUnavailable(), true));
        modal.resetScroll();
        modal.show();
        return;
    }

    if (baseLawId === revisionLawId && revisionList.length > 0) {
        modal.fit(() => renderRevisionList(lawId));
        scrollToCurrent(false);
        modal.show();
        return;
    }

    revisionList = [];
    revisionLawId = baseLawId;
    modal.fit(() => renderMessage(Text.getLoading(), false));
    modal.resetScroll();
    modal.show();

    const loaded = await Service.getLawRevisionList(baseLawId);
    if (version !== requestVersion) {
        return;
    }

    if (!loaded) {
        modal.fit(() => renderMessage(Text.getHistoryLoadFailed(), true));
        return;
    }

    revisionList = loaded;
    modal.fit(() => renderRevisionList(lawId));
    scrollToCurrent(true);
}

function hide() {
    requestVersion = requestVersion + 1;
    setBusy(false);
    modal.hide();
}

function applySize() {
    if (content.firstChild === resultPage) {
        modal.setPlacement('full');
        return;
    }
    modal.setPlacement('center');
    modal.setWidth(MODAL_WIDTH);
    if (content.closest('.dialog-modal').getBoundingClientRect().width < MODAL_MAX_WIDTH) {
        modal.setHeight(INSET_HEIGHT);
    } else {
        modal.setHeight(MODAL_HEIGHT);
    }
}

function showResultPage() {
    const scroll = content.closest('.dialog-scroll');
    selectionScrollTop = scroll.scrollTop;

    clearButton();
    modal.enableBackButton(showSelectionPage);
    modal.fit(() => {
        content.replaceChildren(resultPage);
        applySize();
    });
    scroll.scrollTop = 0;
}

function showSelectionPage() {
    modal.disableBackButton();
    renderButton();
    modal.fit(() => {
        content.replaceChildren(selectionPage);
        applySize();
    });
    content.closest('.dialog-scroll').scrollTop = selectionScrollTop;
}

function renderMessage(text, isError) {
    currentItem = null;
    selectedIdList = [];
    list.replaceChildren(buildMessage(text, isError));
}

function buildMessage(text, isError) {
    const message = document.createElement('div');
    message.classList.add('compare-message');
    message.classList.toggle('error', isError);
    message.textContent = text;
    return message;
}

function renderRevisionList(lawId) {
    if (revisionList.length < SELECTION_LIMIT) {
        renderMessage(Text.getCompareEmpty(), false);
        return;
    }

    currentItem = null;
    selectedIdList = [];
    list.replaceChildren();

    revisionList.forEach(revision => {
        const item = buildItem(revision);
        list.appendChild(item);
        if (isCurrentLaw(revision, lawId)) {
            currentItem = item;
            selectedIdList = [revision.law_revision_id];
        }
    });
    renderSelection();
}

function buildItem(revision) {
    const label = formatRevision(revision);

    const date = document.createElement('div');
    date.classList.add('compare-item-date');
    date.textContent = label.date;

    const num = document.createElement('div');
    num.classList.add('compare-item-num');
    num.textContent = label.num;

    const item = document.createElement('div');
    item.classList.add('compare-item');
    item.dataset.revisionId = revision.law_revision_id;
    item.appendChild(date);
    item.appendChild(num);
    item.addEventListener('click', () => {
        toggleRevision(revision.law_revision_id);
    });
    return item;
}

function toggleRevision(id) {
    if (selectedIdList.includes(id)) {
        selectedIdList = selectedIdList.filter(selectedId => selectedId !== id);
    } else if (selectedIdList.length < SELECTION_LIMIT) {
        selectedIdList = selectedIdList.concat(id);
    } else {
        return;
    }
    renderSelection();
    renderButton();
}

function renderSelection() {
    const isFull = selectedIdList.length === SELECTION_LIMIT;
    list.querySelectorAll('.compare-item').forEach(item => {
        const isSelected = selectedIdList.includes(item.dataset.revisionId);
        item.classList.toggle('selected', isSelected);
        item.classList.toggle('disabled', isFull && !isSelected);
    });
}

function renderButton() {
    if (selectedIdList.length !== SELECTION_LIMIT) {
        clearButton();
        return;
    }
    if (!compareButton) {
        compareButton = modal.addRightButton(Text.getCompareRun(), compare);
    }
}

function clearButton() {
    if (!compareButton) {
        return;
    }
    modal.clearNav();
    compareButton = null;
}

function setBusy(value) {
    isBusy = value;
    loading.classList.toggle('shown', value);
}

async function compare() {
    if (isBusy) {
        return;
    }
    requestVersion = requestVersion + 1;
    const version = requestVersion;

    const [newRevision, oldRevision] = revisionList.filter(revision => selectedIdList.includes(revision.law_revision_id));

    setBusy(true);
    await waitForPaint();

    const [oldLaw, newLaw] = await Promise.all([
        Service.getLawFullText(getRequestId(oldRevision)),
        Service.getLawFullText(getRequestId(newRevision)),
    ]);
    if (version !== requestVersion) {
        return;
    }

    renderHeader(oldRevision, newRevision);
    if (!oldLaw || !newLaw) {
        resultPage.appendChild(buildMessage(Text.getCompareLoadFailed(), true));
    } else {
        renderRowList(buildRowList(oldLaw, newLaw));
    }
    setBusy(false);
    showResultPage();
}

function waitForPaint() {
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function buildRowList(oldLaw, newLaw) {
    const oldList = extractArticleList(oldLaw);
    const newList = extractArticleList(newLaw);
    if (!oldList || !newList) {
        return null;
    }
    return Diff.compare(oldList, newList);
}

function extractArticleList(law) {
    const template = document.createElement('template');
    template.innerHTML = law;
    api.arrangeArticle(template.content);

    const mainProvision = template.content.querySelector('.MainProvision');
    if (!mainProvision) {
        return null;
    }

    let elementList = Array.from(mainProvision.querySelectorAll('.Article'));
    let type = 'article';
    if (elementList.length === 0) {
        elementList = Array.from(mainProvision.querySelectorAll(':scope > .ParagraphContainer'));
        type = 'paragraph';
    }
    if (elementList.length === 0) {
        return null;
    }

    return elementList.map((element, index) => ({
        key: getArticleKey(element, index, type),
        text: element.textContent,
        element,
    }));
}

function getArticleKey(element, index, type) {
    const target = type === 'paragraph' ? element.querySelector(':scope > .Paragraph') : element;

    const num = target.dataset.num;
    if (num) {
        return type + '-num:' + num;
    }

    const title = target.querySelector(type === 'article' ? '.ArticleTitle' : '.ParagraphNum')?.textContent.trim();
    if (title) {
        return type + '-title:' + title;
    }
    return type + '-index:' + index;
}

function renderHeader(oldRevision, newRevision) {
    const header = document.createElement('div');
    header.classList.add('compare-header');
    header.appendChild(buildHeaderCell(oldRevision));
    header.appendChild(buildHeaderCell(newRevision));
    resultPage.replaceChildren(header);
}

function renderRowList(rowList) {
    if (!rowList) {
        resultPage.appendChild(buildMessage(Text.getCompareExtractFailed(), true));
        return;
    }
    if (rowList.length === 0) {
        resultPage.appendChild(buildMessage(Text.getCompareNoChange(), false));
        return;
    }

    rowList.forEach(row => {
        resultPage.appendChild(buildRow(row));
    });
}

function buildHeaderCell(revision) {
    const label = formatRevision(revision);

    const date = document.createElement('div');
    date.classList.add('compare-header-date');
    date.textContent = label.date;

    const num = document.createElement('div');
    num.classList.add('compare-header-num');
    num.textContent = label.num;

    const cell = document.createElement('div');
    cell.classList.add('compare-header-cell');
    cell.appendChild(date);
    cell.appendChild(num);
    return cell;
}

function buildRow(row) {
    let oldRangeList = row.oldRangeList;
    let newRangeList = row.newRangeList;
    if (oldRangeList && isReplaced(row.oldItem.element, row.newItem.element, oldRangeList)) {
        oldRangeList = null;
        newRangeList = null;
    }

    const element = document.createElement('div');
    element.classList.add('compare-row');
    element.appendChild(buildCell(row.oldItem, 'deletion', oldRangeList));
    element.appendChild(buildCell(row.newItem, 'addition', newRangeList));
    return element;
}

function buildCell(item, type, rangeList) {
    const cell = document.createElement('div');
    cell.classList.add('compare-cell');
    if (!item) {
        cell.classList.add('empty');
        return cell;
    }

    cell.classList.add(type);
    if (rangeList) {
        cell.appendChild(Util.wrap(item.element, rangeList, 'compare-' + type));
    } else {
        cell.classList.add('replaced');
        cell.appendChild(item.element);
    }
    return cell;
}

function isReplaced(oldElement, newElement, rangeList) {
    const ratio = measureChangeRatio(oldElement, rangeList);
    if (ratio > Config.getCompareReplaceRatio()) {
        return true;
    }
    return ratio > Config.getCompareReplaceRatio() * CAPTION_RATIO_SCALE && isCaptionReplaced(oldElement, newElement);
}

function measureChangeRatio(element, rangeList) {
    const bodyMask = buildBodyMask(element);
    const changeMask = new Uint8Array(bodyMask.length);
    rangeList.forEach(range => {
        changeMask.fill(1, range.start, range.end);
    });

    let total = 0;
    let kept = 0;
    let run = 0;
    for (let i = 0; i <= bodyMask.length; i++) {
        const isBody = i < bodyMask.length && bodyMask[i] === 1;
        if (isBody) {
            total = total + 1;
        }
        if (isBody && !changeMask[i]) {
            run = run + 1;
            continue;
        }
        if (run >= MATCH_LENGTH_MIN) {
            kept = kept + run;
        }
        run = 0;
    }
    if (total === 0) {
        return 0;
    }
    return 1 - kept / total;
}

function buildBodyMask(element) {
    const bodyMask = new Uint8Array(element.textContent.length);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node = walker.nextNode();
    while (node) {
        const value = node.nodeValue;
        if (!node.parentElement.closest(LABEL_SELECTOR)) {
            for (let i = 0; i < value.length; i++) {
                if (!/\s/.test(value[i])) {
                    bodyMask[offset + i] = 1;
                }
            }
        }
        offset = offset + value.length;
        node = walker.nextNode();
    }
    return bodyMask;
}

function isCaptionReplaced(oldElement, newElement) {
    const oldCaption = getCaption(oldElement);
    const newCaption = getCaption(newElement);
    if (!oldCaption || !newCaption) {
        return false;
    }
    return !newCaption.includes(oldCaption.replace(/等$/, ''));
}

function getCaption(element) {
    const caption = element.querySelector('.ArticleCaption');
    if (!caption) {
        return '';
    }
    return caption.textContent.replace(/^（|）$/g, '');
}

function scrollToCurrent(isAnimated) {
    if (!currentItem) {
        return;
    }
    const scroll = content.closest('.dialog-scroll');
    const top = currentItem.getBoundingClientRect().top - list.getBoundingClientRect().top - SCROLL_OFFSET;
    if (isAnimated) {
        Util.scroll(scroll, top, SCROLL_DURATION);
        return;
    }
    scroll.scrollTop = top;
}

function getRequestId(revision) {
    if (revision.current_revision_status === 'CurrentEnforced' || revision.current_revision_status === 'Repeal') {
        return revisionLawId;
    }
    return revision.law_revision_id;
}

function isCurrentLaw(revision, lawId) {
    if (revision.law_revision_id === lawId) {
        return true;
    }
    return (revision.current_revision_status === 'CurrentEnforced' || revision.current_revision_status === 'Repeal')
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
    } else if (revision.current_revision_status === 'Repeal') {
        date = enforcementDate + '　' + Text.getRepealStatus(revision.repeal_status);
    }

    let num = '';
    if (revision.amendment_law_num) {
        num = '（' + revision.amendment_law_num + '）';
    } else if (revision.current_revision_status !== 'Repeal') {
        num = '（' + Text.getNewEnactment() + '）';
    }
    return { date, num };
}
