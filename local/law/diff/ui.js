import { Shell } from '/lib/shell.js?v=20260101';
import { Kaiseki } from '/global/kaiseki.js?v=20260101';

export function createSelectionModal({ onCompare, onClose }) {
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
    const dismiss = () => {
        modal.hide();
        onClose();
    };
    modal.enableCloseButton(dismiss);
    modal.setDismiss(dismiss);
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

    function setRevisions(value, currentLawId) {
        revisions = Array.isArray(value) ? value : [];
        selectedIds = new Set();
        selectionNotice = '';
        setLoadingVisible(false);
        list.innerHTML = '';

        if (revisions.length < 2) {
            list.innerHTML = '<div class="diff-message">比較できる履歴がありません。</div>';
        } else {
            let scrollTarget = null;
            revisions.forEach(revision => {
                const item = createRevisionItem(revision, toggle);
                if (matchesCurrentLaw(revision, currentLawId)) {
                    selectedIds.add(revision.law_revision_id);
                    item.classList.add('selected');
                    item.setAttribute('aria-pressed', 'true');
                    scrollTarget = item;
                }
                list.appendChild(item);
            });
            if (scrollTarget) {
                requestAnimationFrame(() => scrollToRevision(scrollTarget));
            }
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

    function scrollToRevision(item) {
        const scrollOffset = 12;
        const listRect = list.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        list.scrollTop += itemRect.top - listRect.top - scrollOffset;
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

function matchesCurrentLaw(revision, currentLawId) {
    if (!currentLawId) return false;
    if (revision.law_revision_id === currentLawId) return true;
    return revision.current_revision_status === 'CurrentEnforced'
        && revision.law_revision_id.split('_')[0] === currentLawId;
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
    const secondary = document.createElement('div');
    secondary.className = 'diff-revision-secondary';
    const labels = formatRevision(revision);
    primary.textContent = labels.primary;
    secondary.textContent = labels.secondary;
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
    const labels = formatRevision(revision);
    detail.textContent = labels.primary + '　' + labels.secondary;
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
    const enforcementDate = revision.amendment_enforcement_date || '';
    let primary = '';
    if (revision.current_revision_status === 'UnEnforced') {
        primary = revision.amendment_enforcement_comment
            || Kaiseki.wareki(enforcementDate);
        primary += '　施行予定';
    } else if (revision.current_revision_status === 'CurrentEnforced') {
        primary = Kaiseki.wareki(enforcementDate) + '　現在施行';
    } else if (revision.current_revision_status === 'PreviousEnforced') {
        primary = Kaiseki.wareki(enforcementDate) + '　施行';
    }

    const secondary = revision.amendment_law_num
        ? '（' + revision.amendment_law_num + '）'
        : '（新規制定）';
    return { primary, secondary };
}
