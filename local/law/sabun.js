export const Sabun = {
    init,
    show,
};

import { Scroll } from '/lib/scroll.js';
import { Shell } from '/lib/shell.js';

import { Convert } from '/global/convert.js';
import { Diff } from '/global/diff.js';
import { Service } from '/global/service.js';

const DELETION_CLASS = 'diff-inline-deletion';
const ADDITION_CLASS = 'diff-inline-addition';
const SCROLL_DURATION = 800;
const FULL_CHANGE_RATIO = 0.8;
const CAPTION_CHANGE_RATIO = 0.5;
const KEPT_RUN_MIN_LENGTH = 4;
const LABEL_SELECTOR = [
    '.ArticleCaption',
    '.ArticleTitle',
    '.ParagraphNum',
    '.ItemTitle',
    '.Subitem1Title',
    '.Subitem2Title',
    '.Subitem3Title',
    '.Subitem4Title',
    '.Subitem5Title',
].join(', ');

let api;
let modal;
let modalElement;
let selectionView;
let comparisonView;
let guidance;
let list;
let loading;
let compareButton;

let revisions = [];
let revisionsLawId = '';
let selectedIds = [];
let notice = '';
let busy = false;
let requestVersion = 0;
let comparisonVersion = 0;

function init(value) {
    api = value;

    const content = document.createElement('div');
    content.className = 'diff-content';

    selectionView = document.createElement('div');
    selectionView.className = 'diff-view diff-selection-view';
    content.appendChild(selectionView);

    guidance = document.createElement('div');
    guidance.className = 'diff-selection-guidance';
    selectionView.appendChild(guidance);

    list = document.createElement('div');
    list.className = 'diff-revision-list';
    selectionView.appendChild(list);

    loading = document.createElement('div');
    loading.className = 'diff-loading';
    loading.textContent = 'Loading...';
    selectionView.appendChild(loading);

    comparisonView = document.createElement('div');
    comparisonView.className = 'diff-view diff-comparison-view';
    content.appendChild(comparisonView);

    modal = Shell.createModal(content);
    modal.setTitle('条文比較');
    modal.disableTitleShade();
    modal.enableCloseButton(hide);
    modal.setDismiss(hide);
    modalElement = content.closest('.shell-modal');

    showSelectionView();
}

function clearModalTransition() {
    modalElement.style.transition = '';
}

async function show() {
    const version = ++requestVersion;

    modalElement.classList.add('diff-no-transition');
    showSelectionView();
    flushStyles();
    modalElement.classList.remove('diff-no-transition');
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
    modal.updateShade(list);
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

async function compare() {
    if (busy || selectedIds.length !== 2) return;

    const version = ++requestVersion;
    const [newRevision, oldRevision] = revisions.filter(
        revision => selectedIds.includes(revision.law_revision_id),
    );

    notice = '';
    setBusy(true);
    await waitForPaint();

    try {
        const [oldHtml, newHtml] = await Promise.all([
            Service.getLawFullText(getRequestId(oldRevision)),
            Service.getLawFullText(getRequestId(newRevision)),
        ]);
        if (version !== requestVersion) return;

        if (!oldHtml || !newHtml) {
            notice = '比較する法令データを取得できませんでした。';
            return;
        }

        const rows = buildRows(oldHtml, newHtml);
        if (!rows) {
            notice = '法令データから条文を抽出できませんでした。';
            return;
        }
        showComparisonView(oldRevision, newRevision, rows);
    } finally {
        if (version === requestVersion) {
            setBusy(false);
        }
    }
}

function getRequestId(revision) {
    if (revision.current_revision_status === 'CurrentEnforced') {
        return revisionsLawId;
    }
    return revision.law_revision_id;
}

function showSelectionView() {
    clearModalTransition();
    comparisonVersion++;
    comparisonView.innerHTML = '';
    selectionView.classList.add('active');
    comparisonView.classList.remove('active');
    modalElement.classList.add('diff-selection-modal');
    modalElement.classList.remove('diff-comparison-modal');
    modal.disableBackButton();
    modal.clearNav();
    compareButton = modal.addRightButton('比較', compare);
    renderGuidance();
}

function showComparisonView(oldRevision, newRevision, rows) {
    clearModalTransition();
    const version = ++comparisonVersion;
    comparisonView.innerHTML = '';
    selectionView.classList.remove('active');
    comparisonView.classList.add('active');
    modalElement.classList.remove('diff-selection-modal');
    modalElement.classList.add('diff-comparison-modal');
    modal.clearNav();
    compareButton = null;
    modal.enableBackButton(showSelectionView);

    afterResize(() => {
        if (version !== comparisonVersion) return;
        renderComparison(oldRevision, newRevision, rows);
    });
}

function afterResize(callback) {
    flushStyles();
    const animations = modalElement.getAnimations().filter(
        animation => animation.transitionProperty === 'width'
            || animation.transitionProperty === 'height',
    );
    if (animations.length === 0) {
        callback();
        return;
    }
    Promise.all(animations.map(animation => animation.finished)).then(callback, callback);
}

function renderComparison(oldRevision, newRevision, rows) {
    const scroll = document.createElement('div');
    scroll.className = 'diff-comparison-scroll';

    const header = document.createElement('div');
    header.className = 'diff-columns-header';
    header.appendChild(createColumnHeader(oldRevision));
    header.appendChild(createColumnHeader(newRevision));
    scroll.appendChild(header);

    const body = document.createElement('div');
    body.className = 'diff-comparison-body';
    if (rows.length === 0) {
        const message = document.createElement('div');
        message.className = 'diff-no-changes';
        message.textContent = '本文の条文に差分はありません。';
        body.appendChild(message);
    } else {
        rows.forEach(row => body.appendChild(createDiffRow(row)));
    }
    scroll.appendChild(body);

    comparisonView.innerHTML = '';
    comparisonView.appendChild(scroll);
}

function renderRevisions(currentLawId) {
    selectedIds = [];
    notice = '';
    list.innerHTML = '';

    if (revisions.length < 2) {
        showListMessage('比較できる履歴がありません。', false);
        return;
    }

    let scrollTarget = null;
    revisions.forEach(revision => {
        const item = createRevisionItem(revision);
        list.appendChild(item);
        if (isCurrentLaw(revision, currentLawId)) {
            selectedIds.push(revision.law_revision_id);
            scrollTarget = item;
        }
    });
    list.scrollTop = 0;
    renderSelection();
    modal.updateShade(list);

    if (scrollTarget) {
        afterResize(() => scrollToRevision(scrollTarget));
    }
}

function createRevisionItem(revision) {
    const item = document.createElement('div');
    item.className = 'diff-revision-item';
    item.dataset.revisionId = revision.law_revision_id;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');

    const mark = document.createElement('span');
    mark.className = 'diff-selection-mark';
    item.appendChild(mark);

    const labels = formatRevision(revision);
    const text = document.createElement('div');
    text.className = 'diff-revision-text';
    text.appendChild(createLine('diff-revision-primary', labels.primary));
    text.appendChild(createLine('diff-revision-secondary', labels.secondary));
    item.appendChild(text);

    const toggle = () => toggleSelection(revision.law_revision_id);
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
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

function toggleSelection(id) {
    if (busy) return;
    notice = '';
    if (selectedIds.includes(id)) {
        selectedIds = selectedIds.filter(value => value !== id);
    } else if (selectedIds.length < 2) {
        selectedIds = [...selectedIds, id];
    } else {
        notice = '選択できるのは2件までです。先にいずれかの選択を解除してください。';
    }
    renderSelection();
}

function renderSelection() {
    list.querySelectorAll('.diff-revision-item').forEach(item => {
        const selected = selectedIds.includes(item.dataset.revisionId);
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
    });
    renderGuidance();
}

function renderGuidance() {
    guidance.textContent = notice
        || '比較する履歴を2件選択してください（' + selectedIds.length + '/2）。';
    guidance.classList.toggle('notice', Boolean(notice));

    if (!compareButton) return;
    const disabled = busy || selectedIds.length !== 2;
    compareButton.classList.toggle('diff-button-disabled', disabled);
    compareButton.style.cursor = disabled ? 'default' : 'pointer';
    compareButton.setAttribute('aria-disabled', String(disabled));
}

function showListMessage(text, isError) {
    selectedIds = [];
    notice = '';
    list.innerHTML = '';
    const message = document.createElement('div');
    message.className = isError ? 'diff-message diff-error' : 'diff-message';
    message.textContent = text;
    list.appendChild(message);
    renderGuidance();
    modal.updateShade(list);
}

function setBusy(value) {
    busy = value;
    selectionView.classList.toggle('busy', value);
    loading.classList.toggle('show', value);
    renderGuidance();
}

function scrollToRevision(item) {
    if (!item.isConnected) return;
    const scrollOffset = 12;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    Scroll.smooth(list, list.scrollTop + itemRect.top - listRect.top - scrollOffset, SCROLL_DURATION);
}

function flushStyles() {
    void modalElement.offsetWidth;
}

function waitForPaint() {
    return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
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

function createColumnHeader(revision) {
    const labels = formatRevision(revision);
    const header = document.createElement('div');
    header.textContent = labels.primary + labels.secondary;
    return header;
}

function createDiffRow({ oldItem, newItem, oldRanges, newRanges }) {
    if (oldItem && newItem && oldRanges && newRanges && isMostlyChanged(oldItem, newItem, oldRanges)) {
        oldRanges = null;
        newRanges = null;
    }

    const row = document.createElement('div');
    row.className = 'diff-article-row';
    row.appendChild(createArticleCell(oldItem, 'deletion', oldRanges, DELETION_CLASS));
    row.appendChild(createArticleCell(newItem, 'addition', newRanges, ADDITION_CLASS));
    return row;
}

function isMostlyChanged(oldItem, newItem, oldRanges) {
    const ratio = measureChangedRatio(oldItem.element, oldRanges);
    if (ratio > FULL_CHANGE_RATIO) return true;
    return ratio > CAPTION_CHANGE_RATIO && isCaptionReplaced(oldItem.element, newItem.element);
}

function measureChangedRatio(element, ranges) {
    const body = buildBodyMask(element);
    const changed = new Uint8Array(body.length);
    ranges.forEach(range => changed.fill(1, range.start, range.end));

    let total = 0;
    let kept = 0;
    let run = 0;
    for (let i = 0; i <= body.length; i++) {
        const isBody = i < body.length && body[i] === 1;
        if (isBody) total++;
        if (isBody && !changed[i]) {
            run++;
            continue;
        }
        if (run >= KEPT_RUN_MIN_LENGTH) kept += run;
        run = 0;
    }
    return total === 0 ? 0 : 1 - kept / total;
}

function buildBodyMask(element) {
    const body = new Uint8Array(element.textContent.length);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let offset = 0;
    let node;
    while ((node = walker.nextNode())) {
        const value = node.nodeValue;
        if (!node.parentElement.closest(LABEL_SELECTOR)) {
            for (let i = 0; i < value.length; i++) {
                if (!/\s/.test(value[i])) body[offset + i] = 1;
            }
        }
        offset += value.length;
    }
    return body;
}

function isCaptionReplaced(oldElement, newElement) {
    const oldCaption = getCaption(oldElement);
    const newCaption = getCaption(newElement);
    if (!oldCaption || !newCaption) return false;
    return !newCaption.includes(oldCaption.replace(/等$/, ''));
}

function getCaption(element) {
    const caption = element.querySelector(':scope > .ArticleCaption');
    return caption ? caption.textContent.replace(/^（|）$/g, '') : '';
}

function createArticleCell(article, type, ranges, className) {
    const cell = document.createElement('div');
    cell.className = 'diff-article-cell';
    if (!article) {
        cell.classList.add('empty');
        return cell;
    }

    cell.classList.add(type);
    cell.dataset.marker = type === 'deletion' ? '−' : '+';

    if (ranges) {
        cell.appendChild(Convert.wrap(article.element, ranges, className));
    } else {
        cell.classList.add('full-change');
        cell.appendChild(article.element);
    }
    return cell;
}

function buildRows(oldHtml, newHtml) {
    const oldArticles = extractArticles(oldHtml);
    const newArticles = extractArticles(newHtml);
    if (!oldArticles || !newArticles) return null;
    return Diff.compare(oldArticles, newArticles);
}

function extractArticles(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    const mainProvision = container.querySelector('.MainProvision');
    if (!mainProvision) return null;

    let elements = Array.from(mainProvision.querySelectorAll('.Article'));
    let type = 'article';
    if (elements.length === 0) {
        elements = Array.from(mainProvision.querySelectorAll(':scope > .ParagraphContainer'));
        type = 'paragraph';
    }
    if (elements.length === 0) return null;

    return elements.map((element, index) => ({
        key: getArticleKey(element, index, type),
        text: element.textContent,
        element,
    }));
}

function getArticleKey(element, index, type) {
    const target = type === 'paragraph'
        ? element.querySelector(':scope > .Paragraph')
        : element;

    const number = target?.getAttribute('data-num');
    if (number) return type + '-num:' + number;

    const titleSelector = type === 'article' ? '.ArticleTitle' : '.ParagraphNum';
    const title = target?.querySelector(titleSelector)?.textContent.trim();
    if (title) return type + '-title:' + title;
    return type + '-index:' + index;
}
