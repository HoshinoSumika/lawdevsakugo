export const Convert = {
    date,
    nest,
    term,
    wrap,
};

const ERAS = [
    { name: '令和', start: '2019-05-01' },
    { name: '平成', start: '1989-01-08' },
    { name: '昭和', start: '1926-12-25' },
    { name: '大正', start: '1912-07-30' },
    { name: '明治', start: '1868-01-25' },
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function date(dateStr) {
    const match = DATE_PATTERN.exec(dateStr);
    if (!match) {
        return '';
    }

    const year = parseInt(match[1], 10);
    const suffix = parseInt(match[2], 10) + '月' + parseInt(match[3], 10) + '日';

    const era = ERAS.find(item => dateStr >= item.start);
    if (!era) {
        return year + '年' + suffix;
    }

    const eraYear = year - Number(era.start.slice(0, 4)) + 1;
    const label = eraYear === 1 ? '元年' : eraYear + '年';
    return era.name + label + suffix;
}

function nest(element, options) {
    const [open, close] = options.pair;
    const quote = options.quote || [];
    const [quoteOpen, quoteClose] = quote;

    const marks = [open, close];
    if (quote.length > 0) {
        marks.push(quoteOpen, quoteClose);
    }

    const pattern = new RegExp('(' + marks.map(escapePattern).join('|') + ')');
    const owner = element.ownerDocument;

    let quoteDepth = 0;

    function convertElement(node, hasOpenAncestor) {
        const savedQuoteDepth = quoteDepth;
        const clone = node.cloneNode(false);
        const success = convertChildren(Array.from(node.childNodes), clone, hasOpenAncestor);
        quoteDepth = savedQuoteDepth;
        return success ? clone : node.cloneNode(true);
    }

    function convertChildren(nodes, parent, hasOpenAncestor) {
        const entryQuoteDepth = quoteDepth;
        const stack = [];

        function appendNode(node) {
            const target = stack.length ? stack[stack.length - 1] : parent;
            target.appendChild(node);
        }

        function appendText(text) {
            appendNode(owner.createTextNode(text));
        }

        for (let node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                for (let part of node.nodeValue.split(pattern)) {
                    if (!part) continue;

                    if (part === quoteOpen) {
                        quoteDepth++;
                        appendText(part);
                    } else if (part === quoteClose) {
                        appendText(part);
                        quoteDepth = Math.max(quoteDepth - 1, 0);
                    } else if (part === open && quoteDepth === 0) {
                        const span = owner.createElement('span');
                        span.className = options.className;
                        span.textContent = open;
                        appendNode(span);
                        stack.push(span);
                    } else if (part === close && quoteDepth === 0) {
                        if (stack.length === 0) {
                            console.log(hasOpenAncestor
                                ? 'Nesting across elements : ' + open + close
                                : 'Missing open : ' + open);
                            return false;
                        }
                        stack[stack.length - 1].appendChild(owner.createTextNode(close));
                        stack.pop();
                    } else {
                        appendText(part);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                appendNode(convertElement(node, hasOpenAncestor || stack.length > 0));
            } else {
                appendNode(node.cloneNode(true));
            }
        }

        if (stack.length > 0) {
            console.log('Missing close : ' + close + ' : ' + stack.map(el => el.outerHTML));
            return false;
        }
        if (quoteDepth > entryQuoteDepth) {
            console.log('Unclosed quote : ' + quoteOpen);
        }
        return true;
    }

    return convertElement(element, false);
}

function term(element, terms) {
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

function wrap(element, ranges, className) {
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
