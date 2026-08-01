export const Highlight = {
    apply,
    clear,
};

function apply(root, value) {
    clear(root);

    if (!value) {
        return;
    }

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
        const startIndex = match.index;
        const endIndex = regex.lastIndex;
        let count = 0;
        let startInfo = null;
        let endInfo = null;

        for (const info of nodes) {
            const length = info.text.length;
            if (!startInfo && count + length > startIndex) {
                startInfo = { node: info.node, offset: startIndex - count };
            }
            if (!endInfo && count + length >= endIndex) {
                endInfo = { node: info.node, offset: endIndex - count };
                break;
            }
            count += length;
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

        const fragment = range.extractContents();
        const span = document.createElement('span');
        span.className = 'highlight';
        span.appendChild(fragment);
        range.insertNode(span);
    }

    hiddenRt.forEach(({ parent, next, node: rt }) => {
        parent.insertBefore(rt, next);
    });
}

function clear(root) {
    const highlighted = [];
    if (root.classList.contains('highlight')) {
        highlighted.push(root);
    }
    root.querySelectorAll('.highlight').forEach(element => {
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
