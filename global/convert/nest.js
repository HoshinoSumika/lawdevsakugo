function analyze(text, pair, quote) {
    const [open, close] = pair;
    const [quoteOpen, quoteClose] = quote;
    const ignored = new Uint8Array(text.length);

    let quoteStart = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === quoteOpen && quoteStart < 0) {
            quoteStart = i;
        } else if (text[i] === quoteClose && quoteStart >= 0) {
            const stack = [];

            for (let j = quoteStart + 1; j < i; j++) {
                if (text[j] === open) {
                    stack.push(j);
                } else if (text[j] === close) {
                    if (stack.length) stack.pop();
                    else ignored[j] = 1;
                }
            }
            for (const j of stack) ignored[j] = 1;
            quoteStart = -1;
        }
    }

    const events = new Int8Array(text.length);
    const stack = [];

    for (let i = 0; i < text.length; i++) {
        if (ignored[i]) continue;

        if (text[i] === open) {
            stack.push(i);
        } else if (text[i] === close && stack.length) {
            events[stack.pop()] = 1;
            events[i] = -1;
        }
    }

    const levels = new Uint16Array(text.length);
    let depth = 0;

    for (let i = 0; i < text.length; i++) {
        if (events[i] === 1) depth++;
        levels[i] = depth;
        if (events[i] === -1) depth--;
    }

    return { events, ignored, levels };
}

function nest(element, options = {}) {
    const pair = options.pair || ['（', '）'];
    const quote = options.quote || ['「', '」'];
    const className = options.className || 'paren';
    const dataName = options.dataName || 'depth';
    const clone = element.cloneNode(true);
    const textNodes = [];

    (function collect(node) {
        for (const child of node.childNodes) {
            if (child.nodeType === 3) textNodes.push(child);
            else if (child.nodeType === 1) collect(child);
        }
    })(clone);

    const text = textNodes.map(node => node.nodeValue).join('');
    const { levels } = analyze(text, pair, quote);
    const document = clone.ownerDocument;
    let offset = 0;

    for (const node of textNodes) {
        const fragment = document.createDocumentFragment();
        const length = node.nodeValue.length;
        let start = 0;

        while (start < length) {
            const depth = levels[offset + start];
            let end = start + 1;
            while (end < length && levels[offset + end] === depth) end++;

            const value = text.slice(offset + start, offset + end);
            if (depth === 0) {
                fragment.append(value);
            } else {
                const span = document.createElement('span');
                span.className = className;
                span.setAttribute('data-' + dataName, String(depth));
                span.textContent = value;
                fragment.append(span);
            }
            start = end;
        }

        node.replaceWith(fragment);
        offset += length;
    }

    return clone;
}

export { nest };
