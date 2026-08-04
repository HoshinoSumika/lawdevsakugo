export const Highlight = {
    apply,
    clear,
};

import { Convert } from '/global/convert.js?v=20260101';

const HIGHLIGHT_CLASS = 'highlight';

function apply(root, value) {
    clear(root);

    if (!value) {
        return;
    }

    const hiddenRt = [];
    root.querySelectorAll('rt').forEach(rt => {
        const placeholder = document.createComment('rt');
        rt.replaceWith(placeholder);
        hiddenRt.push({ placeholder, node: rt });
    });

    Convert.wrap(root, findRanges(root.textContent, value), HIGHLIGHT_CLASS);

    hiddenRt.forEach(({ placeholder, node }) => {
        placeholder.replaceWith(node);
    });
}

function findRanges(text, value) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'g');
    const ranges = [];

    let match;
    while ((match = pattern.exec(text)) !== null) {
        ranges.push({ start: match.index, end: pattern.lastIndex });
    }
    return ranges;
}

function clear(root) {
    const highlighted = [];
    if (root.classList.contains(HIGHLIGHT_CLASS)) {
        highlighted.push(root);
    }
    root.querySelectorAll('.' + HIGHLIGHT_CLASS).forEach(element => {
        highlighted.push(element);
    });
    highlighted.forEach(element => {
        const parent = element.parentNode;
        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
    });
}
