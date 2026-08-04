export function term(element, terms) {
    const words = Object.keys(terms).filter(word => word.length > 0);
    if (words.length === 0) {
        return element;
    }
    words.sort((a, b) => b.length - a.length);

    const escaped = words.map(escapePattern);
    const pattern = new RegExp('(' + escaped.join('|') + ')', 'g');
    const owner = element.ownerDocument;
    const walker = owner.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    const replacements = [];

    let node;
    while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        pattern.lastIndex = 0;
        const fragment = owner.createDocumentFragment();
        let last = 0;
        let hasMatch = false;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            hasMatch = true;
            const word = match[0];
            if (match.index > last) {
                fragment.appendChild(owner.createTextNode(text.slice(last, match.index)));
            }
            const span = owner.createElement('span');
            span.className = terms[word];
            span.textContent = word;
            fragment.appendChild(span);
            last = match.index + word.length;
        }
        if (!hasMatch) continue;
        if (last < text.length) {
            fragment.appendChild(owner.createTextNode(text.slice(last)));
        }
        replacements.push({ old: node, fragment });
    }

    replacements.forEach(({ old, fragment }) => {
        old.replaceWith(fragment);
    });
    return element;
}

function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
