import { Shell } from '/lib/shell.js?v=20260101';

export function createSelectionModal({ onCompare }) {
    const content = document.createElement('div');
    content.className = 'diff-selection-content';

    const guidance = document.createElement('div');
    guidance.className = 'diff-selection-guidance';
    guidance.setAttribute('role', 'status');
    guidance.setAttribute('aria-live', 'polite');
    content.appendChild(guidance);

    const list = document.createElement('div');
    list.className = 'diff-revision-list';
    content.appendChild(list);

    const loading = document.createElement('div');
    loading.className = 'diff-loading';
    loading.textContent = 'Loading...';
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-live', 'polite');
    content.appendChild(loading);

    const modal = Shell.createModal(content);
    modal.setTitle('条文比較');
    modal.setWidth('min(560px, 94vw)');
    modal.setHeight('min(720px, 86dvh)');
    modal.enableCloseButton(modal.hide);
    content.parentElement.classList.add('diff-selection-modal');

    let revisions = [];
    let selectedIds = new Set();
    let busy = false;
    let selectionNotice = '';

    const compareButton = modal.addRightButton('比較', () => {
        if (busy || selectedIds.size !== 2) return;
        const selected = revisions.filter(revision => selectedIds.has(revision.law_revision_id));
        onCompare(selected);
    });

    function setLoading() {
        selectedIds = new Set();
        selectionNotice = '';
        guidance.textContent = '比較する履歴を2件選択してください。';
        list.innerHTML = '';
        setLoadingVisible(true);
        updateAction();
    }

    function setRevisions(value) {
        revisions = Array.isArray(value) ? value : [];
        selectedIds = new Set();
        selectionNotice = '';
        setLoadingVisible(false);
        list.innerHTML = '';

        if (revisions.length < 2) {
            list.innerHTML = '<div class="diff-message">比較できる履歴がありません。</div>';
        } else {
            revisions.forEach(revision => list.appendChild(createRevisionItem(revision, toggle)));
        }
        updateAction();
    }

    function toggle(item, revision) {
        const id = revision.law_revision_id;
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            selectionNotice = '';
            item.classList.remove('selected');
            item.setAttribute('aria-pressed', 'false');
        } else if (selectedIds.size < 2) {
            selectedIds.add(id);
            selectionNotice = '';
            item.classList.add('selected');
            item.setAttribute('aria-pressed', 'true');
        } else {
            selectionNotice = '選択できる履歴は2件までです。いずれかの選択を解除してください。';
        }
        updateAction();
    }

    function updateAction() {
        const count = selectedIds.size;
        guidance.textContent = selectionNotice
            || `比較する履歴を2件選択してください（${count}/2）`;
        guidance.classList.toggle('notice', Boolean(selectionNotice));
        const disabled = busy || count !== 2;
        compareButton.classList.toggle('diff-button-disabled', disabled);
        compareButton.setAttribute('aria-disabled', String(disabled));
    }

    function setBusy(value) {
        busy = value;
        content.classList.toggle('busy', busy);
        setLoadingVisible(busy);
        updateAction();
    }

    function setError(message) {
        selectedIds = new Set();
        selectionNotice = '';
        setLoadingVisible(false);
        list.innerHTML = '';
        const element = document.createElement('div');
        element.className = 'diff-message diff-error';
        element.textContent = message;
        list.appendChild(element);
        updateAction();
    }

    function setLoadingVisible(value) {
        loading.classList.toggle('show', value);
    }

    setLoading();
    return {
        show: modal.show,
        hide: modal.hide,
        setLoading,
        setRevisions,
        setBusy,
        setError,
    };
}

export function createComparisonModal({ onBack }) {
    const content = document.createElement('div');
    content.className = 'diff-comparison-content';

    const modal = Shell.createModal(content);
    modal.setTitle('条文比較');
    modal.setWidth('100vw');
    modal.setHeight('100dvh');
    modal.enableBackButton(onBack);
    modal.enableCloseButton(modal.hide);
    content.parentElement.classList.add('diff-comparison-modal');

    function render({ oldRevision, newRevision, rows }) {
        content.innerHTML = '';

        const scroll = document.createElement('div');
        scroll.className = 'diff-comparison-scroll';

        const header = document.createElement('div');
        header.className = 'diff-columns-header';
        header.appendChild(createColumnHeader('古い履歴', oldRevision));
        header.appendChild(createColumnHeader('新しい履歴', newRevision));
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
        content.appendChild(scroll);
    }

    return { show: modal.show, hide: modal.hide, render };
}

function createRevisionItem(revision, onToggle) {
    const item = document.createElement('div');
    item.className = 'diff-revision-item';
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-pressed', 'false');

    const mark = document.createElement('span');
    mark.className = 'diff-selection-mark';
    mark.setAttribute('aria-hidden', 'true');
    item.appendChild(mark);

    const text = document.createElement('div');
    text.className = 'diff-revision-text';
    const primary = document.createElement('div');
    primary.className = 'diff-revision-primary';
    primary.textContent = revision.amendment_enforcement_comment
        || formatDate(revision.amendment_enforcement_date)
        || '制定時';
    const secondary = document.createElement('div');
    secondary.className = 'diff-revision-secondary';
    secondary.textContent = revision.amendment_law_num || '制定時';
    if (revision.current_revision_status === 'CurrentEnforced') {
        secondary.textContent += '　（現行）';
    }
    text.append(primary, secondary);
    item.appendChild(text);

    const toggle = () => onToggle(item, revision);
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
        }
    });
    return item;
}

function createColumnHeader(label, revision) {
    const header = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = label;
    const detail = document.createElement('span');
    detail.textContent = formatRevision(revision);
    header.append(title, detail);
    return header;
}

function createDiffRow({ oldArticle, newArticle, oldRanges, newRanges }) {
    const row = document.createElement('div');
    row.className = 'diff-article-row';
    row.appendChild(createArticleCell(oldArticle, 'deletion', oldRanges));
    row.appendChild(createArticleCell(newArticle, 'addition', newRanges));
    return row;
}

function createArticleCell(article, type, ranges) {
    const cell = document.createElement('div');
    cell.className = 'diff-article-cell';
    if (!article) {
        cell.classList.add('empty');
        return cell;
    }

    cell.classList.add(type);
    if (!Array.isArray(ranges)) {
        cell.classList.add('full-change');
    }
    cell.dataset.marker = type === 'deletion' ? '−' : '+';
    const articleClone = article.element.cloneNode(true);
    if (Array.isArray(ranges) && ranges.length > 0) {
        highlightRanges(articleClone, ranges, 'diff-inline-' + type);
    }
    cell.appendChild(articleClone);
    return cell;
}

function highlightRanges(element, ranges, className) {
    const textNodes = [];
    collectTextNodes(element, textNodes);

    let offset = 0;
    textNodes.forEach(textNode => {
        const nodeStart = offset;
        const nodeEnd = nodeStart + textNode.data.length;
        offset = nodeEnd;

        const overlaps = ranges
            .filter(range => range.start < nodeEnd && range.end > nodeStart)
            .map(range => ({
                start: Math.max(0, range.start - nodeStart),
                end: Math.min(textNode.data.length, range.end - nodeStart),
            }));
        if (overlaps.length === 0) return;

        const fragment = textNode.ownerDocument.createDocumentFragment();
        let cursor = 0;
        overlaps.forEach(range => {
            if (range.start > cursor) {
                fragment.appendChild(textNode.ownerDocument.createTextNode(textNode.data.slice(cursor, range.start)));
            }
            const highlight = textNode.ownerDocument.createElement('span');
            highlight.className = className;
            highlight.textContent = textNode.data.slice(range.start, range.end);
            fragment.appendChild(highlight);
            cursor = range.end;
        });
        if (cursor < textNode.data.length) {
            fragment.appendChild(textNode.ownerDocument.createTextNode(textNode.data.slice(cursor)));
        }
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

function collectTextNodes(node, result) {
    node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
            result.push(child);
        } else {
            collectTextNodes(child, result);
        }
    });
}

function formatRevision(revision) {
    const date = formatDate(revision.amendment_enforcement_date) || '制定時';
    const lawNumber = revision.amendment_law_num || '制定時';
    return date + '　' + lawNumber;
}

function formatDate(value) {
    if (!value) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}
