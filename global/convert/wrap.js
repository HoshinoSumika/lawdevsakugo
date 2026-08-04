export function wrap(element, ranges, className) {
    if (ranges.length === 0) {
        return element;
    }

    const owner = element.ownerDocument;
    const textNodes = [];
    collectTextNodes(element, textNodes);

    let offset = 0;
    textNodes.forEach(textNode => {
        const nodeStart = offset;
        const nodeEnd = nodeStart + textNode.data.length;
        offset = nodeEnd;

        const parts = ranges
            .filter(range => range.start < nodeEnd && range.end > nodeStart)
            .map(range => ({
                start: Math.max(range.start, nodeStart) - nodeStart,
                end: Math.min(range.end, nodeEnd) - nodeStart,
            }));
        if (parts.length === 0) return;

        const fragment = owner.createDocumentFragment();
        let cursor = 0;
        parts.forEach(part => {
            const before = textNode.data.slice(cursor, part.start);
            if (before) {
                fragment.append(before);
            }
            const wrapper = owner.createElement('span');
            wrapper.className = className;
            wrapper.textContent = textNode.data.slice(part.start, part.end);
            fragment.appendChild(wrapper);
            cursor = part.end;
        });
        const rest = textNode.data.slice(cursor);
        if (rest) {
            fragment.append(rest);
        }
        textNode.replaceWith(fragment);
    });
    return element;
}

function collectTextNodes(node, textNodes) {
    node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            textNodes.push(child);
        } else {
            collectTextNodes(child, textNodes);
        }
    });
}
