export const Convert = {
    date,
    nest,
    term,
    wrap,
};

function date(dateStr) {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (year >= 2019) {
        const eraYear = year - 2018;
        const label = eraYear === 1 ? '令和元年' : '令和' + eraYear + '年';
        return label + month + '月' + day + '日';
    } else if (year >= 1989) {
        const eraYear = year - 1988;
        const label = eraYear === 1 ? '平成元年' : '平成' + eraYear + '年';
        return label + month + '月' + day + '日';
    } else if (year >= 1926) {
        const eraYear = year - 1925;
        const label = eraYear === 1 ? '昭和元年' : '昭和' + eraYear + '年';
        return label + month + '月' + day + '日';
    } else if (year >= 1912) {
        const eraYear = year - 1911;
        const label = eraYear === 1 ? '大正元年' : '大正' + eraYear + '年';
        return label + month + '月' + day + '日';
    } else if (year >= 1868) {
        const eraYear = year - 1867;
        const label = eraYear === 1 ? '明治元年' : '明治' + eraYear + '年';
        return label + month + '月' + day + '日';
    } else {
        return year + '年' + month + '月' + day + '日';
    }
}

function nest(element, options) {
    const open = options.pair[0];
    const close = options.pair[1];

    const quote = options.quote || [];
    const quoteOpen = quote[0];
    const quoteClose = quote[1];

    const marks = [open, close];
    if (quote.length > 0) {
        marks.push(quoteOpen, quoteClose);
    }

    const escaped = marks.map(escapePattern);
    const pattern = new RegExp('(' + escaped.join('|') + ')');
    const owner = element.ownerDocument;

    function wrapNodes(nodes, parent) {
        let quoteDepth = 0;
        const stack = [];

        function appendText(text) {
            if (stack.length) {
                stack[stack.length - 1].appendChild(owner.createTextNode(text));
            } else {
                parent.appendChild(owner.createTextNode(text));
            }
        }

        function appendNode(node) {
            if (stack.length) {
                stack[stack.length - 1].appendChild(node);
            } else {
                parent.appendChild(node);
            }
        }

        for (let node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const parts = node.nodeValue.split(pattern);
                for (let part of parts) {
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
                        if (stack.length) {
                            stack[stack.length - 1].appendChild(owner.createTextNode(close));
                            stack.pop();
                        } else {
                            console.log('Missing open : ' + open);
                            return false;
                        }
                    } else {
                        appendText(part);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const clone = node.cloneNode(false);
                appendNode(clone);
                const ok = wrapNodes(Array.from(node.childNodes), clone);
                if (!ok) {
                    clone.replaceWith(node.cloneNode(true));
                }
            } else {
                appendNode(node.cloneNode(true));
            }
        }

        if (stack.length > 0) {
            console.log('Missing close : ' + close + ' : ' + stack.map(el => el.outerHTML));
            return false;
        }
        return true;
    }

    const result = element.cloneNode(false);
    const nodes = Array.from(element.childNodes);
    const success = wrapNodes(nodes, result);
    if (!success) {
        return element.cloneNode(true);
    }
    return result;
}

function term(element, terms) {
    const result = element.cloneNode(true);

    const words = Object.keys(terms).filter(word => word.length > 0);
    if (words.length === 0) {
        return result;
    }
    words.sort((a, b) => b.length - a.length);

    const escaped = words.map(escapePattern);
    const pattern = new RegExp('(' + escaped.join('|') + ')', 'g');
    const owner = result.ownerDocument;
    const walker = owner.createTreeWalker(result, NodeFilter.SHOW_TEXT, null);
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
    return result;
}

function escapePattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wrap(element, ranges, className) {
    const result = element.cloneNode(true);
    if (ranges.length === 0) {
        return result;
    }

    const owner = result.ownerDocument;
    const textNodes = [];
    collectTextNodes(result, textNodes);

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
            fragment.append(textNode.data.slice(cursor, part.start));
            const wrapper = owner.createElement('span');
            wrapper.className = className;
            wrapper.textContent = textNode.data.slice(part.start, part.end);
            fragment.appendChild(wrapper);
            cursor = part.end;
        });
        fragment.append(textNode.data.slice(cursor));
        textNode.replaceWith(fragment);
    });
    return result;
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
