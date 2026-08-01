export const Search = {
    init,
    show,
};

import { Frame } from '/lib/frame.js?v=20260101';

let frame;
let searchContainer;
let lawContent;
let lawContainer;
let searchContent;
let searchInput;
let searchClear;
let searchResult;

function init(api) {
    lawContent = api.getContent();
    lawContainer = api.getContainer();

    searchInput = document.querySelector('#search-input');
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    });
    searchInput.addEventListener('input', () => {
        if (searchInput.value !== '') {
            searchClear.style.display = '';
        } else {
            searchClear.style.display = 'none';
        }
        updateResult(false);
    });

    searchClear = document.querySelector('#search-clear');
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.style.display = 'none';
        updateResult(false);
    });

    searchResult = document.querySelector('#search-result');
    searchResult.addEventListener('touchstart', () => {
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    });

    searchContent = document.querySelector('#search-content');
    searchContent.classList.add('search-content');

    searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container');
    searchContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    searchContainer.appendChild(searchContent);

    const overlay = document.createElement('div');
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'start';
    overlay.appendChild(searchContainer);

    frame = Frame.createPanel(overlay);

    const panel = frame.getPanel();
    panel.classList.add('search-overlay');
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100vw';
    panel.style.height = '100vh';

    let pressTarget = null;

    overlay.addEventListener('pointerdown', (e) => {
        pressTarget = e.target;
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && pressTarget === overlay) {
            hide();
        }
    });
}

function show() {
    const style = window.getComputedStyle(lawContent);
    searchResult.style.fontSize = (parseFloat(style.fontSize) - 1.5) + 'px';
    searchResult.style.lineHeight = (parseFloat(style.lineHeight) / parseFloat(style.fontSize) - 0.2) + '';
    searchResult.style.letterSpacing = style.letterSpacing;

    frame.show();
    requestAnimationFrame(() => {
        searchContainer.classList.add('show');
    });

    searchInput.value = '';
    searchInput.style.display = '';
    searchInput.style.caretColor = 'transparent';
    searchInput.focus();
    setTimeout(() => {
        searchInput.style.caretColor = '';
    }, 200);
    searchClear.style.display = 'none';

    updateResult(false);
}

function hide() {
    searchContainer.classList.remove('show');
    frame.hide();

    searchInput.value = '';
    searchInput.style.display = 'none';
}

function updateResult(isUnlimited) {
    const value = searchInput.value.trim();
    if (!value) {
        searchResult.innerHTML = '';
        searchResult.style.display = 'none';
        return;
    } else {
        searchResult.style.display = '';
    }

    let limit = 100;
    if (isUnlimited) {
        limit = 10000;
    } else {
        if (value.length === 1) {
            limit = 10;
        } else if (value.length === 2) {
            limit = 20;
        } else if (value.length === 3) {
            limit = 20;
        }
    }

    const matched = [];

    const exactSearch = searchByNum(value);
    if (exactSearch) {
        matched.push(exactSearch);
    }

    const textSearch = searchByText(value, limit);
    for (const el of textSearch) {
        matched.push(el);
    }

    if (matched.length > 0) {
        const restore = isUnlimited ? searchResult.scrollTop : 0;
        searchResult.innerHTML = '';
        renderResult(matched, value);
        searchResult.scrollTop = restore;
    } else {
        searchResult.innerHTML = '';
        const el = document.createElement('div');
        el.textContent = '検索結果なし';
        searchResult.appendChild(el);
    }
}

function renderResult(list, value) {
    searchResult.style.display = 'none';
    const fragment = document.createDocumentFragment();
    list.forEach(content => {
        const item = document.createElement('div');

        if (content.matches('.Article, .ParagraphContainer')) {
            const contentClone = content.cloneNode(true);
            highlightText(contentClone, value);
            const supplProvision = content.closest('.SupplProvision');
            if (supplProvision) {
                const labelClone = supplProvision.querySelector('.SupplProvisionLabel').cloneNode(true);
                if (labelClone) {
                    item.appendChild(labelClone);
                }
            }
            item.appendChild(contentClone);
        } else {
            const contentClone = content.cloneNode(true);
            if (!content.classList.contains('limit')) {
                highlightText(contentClone, value);
            }
            item.appendChild(contentClone);
        }

        if (content.classList.contains('limit')) {
            item.addEventListener('click', () => updateResult(true));
        } else {
            item.addEventListener('click', () => scrollToElement(content, value));
        }

        fragment.appendChild(item);
    });
    searchResult.appendChild(fragment);
    searchResult.style.display = '';
}

function searchByNum(value) {
    const articleNum = convertNum(value);
    if (!articleNum) {
        return null;
    }

    const mainProvision = lawContent.querySelector('.MainProvision');
    if (!mainProvision) {
        return null;
    }

    const exactMatch = mainProvision.querySelector('.Article[data-num="' + articleNum + '"]');
    if (exactMatch) {
        return exactMatch;
    }

    const rangeArticles = mainProvision.querySelectorAll('.Article[data-num*=":"]');
    for (const el of rangeArticles) {
        const dataNum = el.getAttribute('data-num');
        const [start, end] = dataNum.split(':');
        const searchBase = articleNum.replace(/_.*$/, '');
        const searchInt = parseInt(searchBase, 10);
        const startBase = start.replace(/_.*$/, '');
        const startInt = parseInt(startBase, 10);
        const endBase = end.replace(/_.*$/, '');
        const endInt = parseInt(endBase, 10);

        if (!isNaN(searchInt) && !isNaN(startInt) && !isNaN(endInt)) {
            if (searchInt >= startInt && searchInt <= endInt) {
                return el;
            }
        }
    }

    return null;
}

function searchByText(value, limit) {
    const matched = [];
    const lawBody = lawContent.querySelector('.LawBody');
    if (lawBody) {
        let str = '.ArticleCaption, .ParagraphCaption, ';
        str += '.ArticleTitle, .ParagraphNum, .ItemTitle, ';
        str += '.Subitem1Title, .Subitem2Title, .Subitem3Title, .Subitem4Title, .Subitem5Title, ';
        str += '.Remarks > .RemarksLabel, ';
        str += '.ParagraphSentence, .ItemSentence, ';
        str += '.Subitem1Sentence, .Subitem2Sentence, .Subitem3Sentence, .Subitem4Sentence, .Subitem5Sentence, ';
        str += '.TableColumn .Sentence, .Remarks > .Sentence';
        const elements = lawBody.querySelectorAll(str);
        const seen = new Set();
        for (const el of elements) {
            if (!el.offsetParent) {
                continue;
            }
            const clone = el.cloneNode(true);
            clone.querySelectorAll('rt').forEach(rt => rt.remove());
            const text = clone.textContent;
            if (text.includes(value)) {
                let nodeToPush;
                if (el.closest('.Article')) {
                    nodeToPush = el.closest('.Article');
                } else if (el.closest('.ParagraphContainer') ) {
                    nodeToPush = el.closest('.ParagraphContainer');
                } else if (el.closest('.Preamble')) {
                    nodeToPush = el.closest('.Preamble');
                } else if (el.closest('.SupplProvisionAppdxTable')) {
                    nodeToPush = el.closest('.SupplProvisionAppdxTable');
                } else if (el.closest('.AppdxTable')) {
                    nodeToPush = el.closest('.AppdxTable');
                } else if (el.closest('.AppdxNote')) {
                    nodeToPush = el.closest('.AppdxNote');
                } else {
                    nodeToPush = el;
                }
                if (!seen.has(nodeToPush)) {
                    matched.push(nodeToPush);
                    seen.add(nodeToPush);
                    if (matched.length >= limit) {
                        const limitEl = document.createElement('div');
                        limitEl.className = 'limit';
                        limitEl.textContent = 'すべての検索結果を表示';
                        limitEl.textContent += '（現在は' + limit + '件のみ表示）';
                        matched.push(limitEl);
                        seen.add(limitEl);
                        break;
                    }
                }
            }
        }
    }
    return matched;
}

function convertNum(str) {
    if (!str) {
        return '';
    }
    str = str.replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3').replace(/４/g, '4');
    str = str.replace(/５/g, '5').replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8').replace(/９/g, '9');
    str = str.replace(/の/g, '_').replace(/ /g, '_').replace(/　/g, '_');
    str = str.replace(/-/g, '_').replace(/－/g, '_').replace(/ー/g, '_').replace(/＿/g, '_');
    return str;
}

const highlightTimers = new WeakMap();

function scrollToElement(el, value) {
    hide();
    const elTop = el.offsetTop;
    const offset = -16;
    smoothScroll(lawContainer, elTop + offset, 500);
    highlightText(el, value);

    const oldTimer = highlightTimers.get(el);
    if (oldTimer) {
        clearTimeout(oldTimer);
    }
    const timer = setTimeout(() => {
        highlightText(el, '');
        highlightTimers.delete(el);
    }, 2000);
    highlightTimers.set(el, timer);
}

function smoothScroll(container, toY, duration) {
    const fromY = container.scrollTop;
    const distance = toY - fromY;
    const start = performance.now();
    function ease(t) {
        if (t < 0.5) {
            return 8 * t ** 4;
        } else {
            return 1 - ((-2 * t + 2) ** 4) / 2;
        }
    }
    function scrollStep(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = ease(progress);
        container.scrollTop = fromY + distance * eased;
        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }
    requestAnimationFrame(scrollStep);
}

function highlightText(root, value) {
    const unwrap = [];
    if (root.classList.contains('highlight')) {
        unwrap.push(root);
    }
    root.querySelectorAll('.highlight').forEach(el => {
        unwrap.push(el);
    });
    unwrap.forEach(node => {
        const parent = node.parentNode;
        while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
    });

    if (!value) return;

    const hiddenRt = [];
    root.querySelectorAll('rt').forEach(rt => {
        hiddenRt.push({ parent: rt.parentNode, next: rt.nextSibling, node: rt });
        rt.remove();
    });

    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let buffer = '';
    let node;
    while ((node = walker.nextNode())) {
        nodes.push({ node, text: node.textContent });
        buffer += node.textContent;
    }

    const matches = [];
    let match;
    while ((match = regex.exec(buffer)) !== null) {
        const startIdx = match.index;
        const endIdx = regex.lastIndex;

        let count = 0;
        let startInfo = null;
        let endInfo = null;
        for (const info of nodes) {
            const len = info.text.length;
            if (!startInfo && count + len > startIdx) {
                startInfo = { node: info.node, offset: startIdx - count };
            }
            if (!endInfo && count + len >= endIdx) {
                endInfo = { node: info.node, offset: endIdx - count };
                break;
            }
            count += len;
        }
        if (startInfo && endInfo) {
            matches.push({ startInfo, endInfo });
        }
    }

    for (let i = matches.length - 1; i >= 0; i--) {
        const { startInfo, endInfo } = matches[i];
        const range = document.createRange();
        range.setStart(startInfo.node, startInfo.offset);
        range.setEnd(endInfo.node, endInfo.offset);

        const startRuby = startInfo.node.parentNode.closest('ruby');
        const endRuby = endInfo.node.parentNode.closest('ruby');
        if (startRuby && endRuby && startRuby === endRuby) {
            range.setStartBefore(startRuby);
            range.setEndAfter(endRuby);
        } else if (startRuby) {
            range.setStartBefore(startRuby);
        } else if (endRuby) {
            range.setEndAfter(endRuby);
        }

        const frag = range.extractContents();
        const span = document.createElement('span');
        span.className = 'highlight';
        span.appendChild(frag);
        range.insertNode(span);
    }

    hiddenRt.forEach(({ parent, next, node }) => {
        parent.insertBefore(node, next);
    });
}
