import { escapePattern } from '/global/convert/escape.js?v=20260101';

export function nest(element, options) {
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
