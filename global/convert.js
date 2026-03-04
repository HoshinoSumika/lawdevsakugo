export function convert(xmlStr) {
    let temp = xmlStr;

    temp = transformXmlToHtml(temp);

    if (!(temp instanceof Node)) {
        return null;
    }

    temp = removeIgnorableSpaces(temp);

    temp = extractLaw(temp); // 一定の情報を保持しつつ、本体を抽出

    temp = moveRemarksAfterTableStruct(temp); // 「（備考）」や「（注）」を表の後に置く
    temp = moveArticleCaptionBeforeTitle(temp); // 見出しを条数の前に置く
    temp = moveArticleTitlesIntoFirstParagraphStrict(temp); // 条数（span）をArticleの内部に置く
    temp = addOldParagraphCircledNums(temp); // 番号のない項に丸数字の番号を追加
    temp = extractParagraphCaptionBeforeParagraph(temp); // 段落見出しを抽出しないと、段落（span）のインデントが困難
    temp = tagParagraphBlankNum(temp); // 番号のない段落にタグを追加
    temp = addParagraphContainer(temp);

    temp = trim(temp);

    temp = addSupplProvisionAmendLawNum(temp); // 附則の法令番号を追加
    temp = addSupplProvisionExtractLabel(temp); // 「抄」を追加

    temp = addZenkakuSpaceAfterClass(temp, 'ArticleTitle');
    temp = addZenkakuSpaceAfterClass(temp, 'ParagraphNum');
    temp = addZenkakuSpaceAfterClass(temp, 'ItemTitle');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem1Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem2Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem3Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem4Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem5Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Column');

    return temp.outerHTML;
}

function transformXmlToHtml(xmlStr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length) {
        return null;
    }

    const tagMap = {
        TOC: 'section', MainProvision: 'section', SupplProvision: 'section', AppdxTable: 'section',
        Part: 'section', Chapter: 'section', Section: 'section', Subsection: 'section', Division: 'section',
        Article: 'section',

        PartTitle: 'span', ChapterTitle: 'span', SectionTitle: 'span', SubsectionTitle: 'span', DivisionTitle: 'span',
        SupplProvisionLabel: 'span',
        ArticleRange: 'span',

        ArticleTitle: 'span', ParagraphNum: 'span',
        ParagraphSentence: 'span', Sentence: 'span',
        ItemTitle: 'span', ItemSentence: 'span',
        Subitem1Title: 'span', Subitem1Sentence: 'span',
        Subitem2Title: 'span', Subitem2Sentence: 'span',
        Subitem3Title: 'span', Subitem3Sentence: 'span',
        Subitem4Title: 'span', Subitem4Sentence: 'span',
        Subitem5Title: 'span', Subitem5Sentence: 'span',
        Column: 'span',
        ListSentence: 'span', Sublist1Sentence: 'span', Sublist2Sentence: 'span', Sublist3Sentence: 'span',

        SupplProvisionAppdxTableTitle: 'span', AppdxTableTitle: 'span', AppdxNoteTitle: 'span',
        AppdxStyleTitle: 'span', AppdxFormatTitle: 'span',
        RelatedArticleNum: 'span',

        TableStruct: 'table', Table: 'tbody',
        TableRow: 'tr', TableColumn: 'td',

        Ruby: 'ruby', Rt: 'rt',
    };

    function convertNode(xmlNode, htmlDoc) {
        if (xmlNode.nodeType === Node.ELEMENT_NODE) {
            const origName = xmlNode.localName || xmlNode.nodeName;
            const tagName = tagMap[origName] || 'div';
            const element = htmlDoc.createElement(tagName);
            element.className = origName;

            if (xmlNode.attributes && xmlNode.attributes.length) {
                for (let i = 0; i < xmlNode.attributes.length; i++) {
                    const attr = xmlNode.attributes[i];
                    const nameLower = attr.name.toLowerCase();

                    if (tagName === 'td' && (nameLower === 'rowspan' || nameLower === 'colspan')) {
                        element.setAttribute(nameLower, attr.value);
                        continue;
                    }

                    const prefix = attr.prefix ? attr.prefix + '-' : '';
                    const safeLocal = (attr.localName || attr.name).replace(/[^a-zA-Z0-9_\-]+/g, '-');
                    const dataName = 'data-' + prefix + safeLocal;
                    element.setAttribute(dataName, attr.value);
                }
            }

            for (let child = xmlNode.firstChild; child; child = child.nextSibling) {
                const convertedChild = convertNode(child, htmlDoc);
                if (convertedChild) {
                    element.appendChild(convertedChild);
                }
            }
            return element;
        }

        if (xmlNode.nodeType === Node.TEXT_NODE) {
            return xmlNode.nodeValue.length ? htmlDoc.createTextNode(xmlNode.nodeValue) : null;
        }

        return null;
    }

    const htmlDoc = document.implementation.createHTMLDocument('');
    return convertNode(xmlDoc.documentElement, htmlDoc);
}

function removeIgnorableSpaces(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const removeList = [];
    let node;
    while ((node = walker.nextNode())) {
        if (/^[\x20\t\r\n]*$/.test(node.nodeValue)) {
            removeList.push(node);
        }
    }
    removeList.forEach(n => {
        if (n.parentNode) {
            n.parentNode.removeChild(n);
        }
    });

    return el;
}

function extractLaw(el) {
    const container = el.querySelector('.law_full_text');
    if (!container) {
        return el.ownerDocument.createElement('div');
    }

    const law = container.querySelector('.Law');
    if (!law) {
        return el.ownerDocument.createElement('div');
    }

    const lawInfo = el.querySelector('.law_info');
    if (lawInfo) {
        const childElements = lawInfo.children;
        for (let i = 0; i < childElements.length; i++) {
            const childEl = childElements[i];
            const dataKey = childEl.className.toLowerCase();
            const textContent = childEl.textContent.trim();
            law.setAttribute('data-law_info_' + dataKey, textContent);
        }
    }

    const revisionInfo = el.querySelector('.revision_info');
    if (revisionInfo) {
        const childElements = revisionInfo.children;
        for (let i = 0; i < childElements.length; i++) {
            const childEl = childElements[i];
            const dataKey = childEl.className.toLowerCase();
            const textContent = childEl.textContent.trim();
            law.setAttribute('data-revision_info_' + dataKey, textContent);
        }
    }

    return law;
}

function moveRemarksAfterTableStruct(el) {
    const tableStructs = el.querySelectorAll('.TableStruct');
    tableStructs.forEach(table => {
        const parent = table.parentNode;
        if (!parent) return;

        let prev = table.previousElementSibling;
        while (prev && prev.classList.contains('Remarks')) {
            const current = prev;
            prev = current.previousElementSibling;

            parent.removeChild(current);
            if (table.nextSibling) {
                parent.insertBefore(current, table.nextSibling);
            } else {
                parent.appendChild(current);
            }
        }
    });

    return el;
}

function moveArticleCaptionBeforeTitle(el) {
    const articles = el.querySelectorAll('.Article');
    articles.forEach(article => {
        const title = article.querySelector(':scope > .ArticleTitle');
        const caption = article.querySelector(':scope > .ArticleCaption');

        if (title && caption && title.nextElementSibling === caption) {
            article.insertBefore(caption, title);
        }
    });

    return el;
}

function moveArticleTitlesIntoFirstParagraphStrict(el) {
    const articles = el.querySelectorAll('.Article');
    articles.forEach(article => {
        const title = article.querySelector(':scope > .ArticleTitle');
        if (!title) {
            return;
        }
        const sib = title.nextElementSibling;
        if (!sib || !sib.classList.contains('Paragraph')) {
            return;
        }
        sib.insertBefore(title, sib.firstChild);
    });

    return el;
}

function addOldParagraphCircledNums(el) {
    const oldParas = el.querySelectorAll('.Paragraph[data-oldnum]');
    oldParas.forEach(p => {
        const oldVal = p.getAttribute('data-oldnum');
        if (!oldVal || oldVal.trim().toLowerCase() !== 'true') {
            return;
        }

        const numAttr = p.getAttribute('data-num');
        const n = numAttr ? parseInt(numAttr, 10) : NaN;
        if (!Number.isInteger(n) || n <= 0) {
            return;
        }

        const pn = p.querySelector(':scope > .ParagraphNum');
        if (!pn) {
            return;
        }

        if (pn.textContent.trim().length > 0) {
            return;
        }

        pn.textContent = formatCircledNumber(n);
    });

    return el;
}

function formatCircledNumber(n) {
    if (n >= 1 && n <= 20) {
        return String.fromCharCode(0x2460 + (n - 1));
    }
    return '(' + n + ')';
}

function extractParagraphCaptionBeforeParagraph(el) {
    const paras = el.querySelectorAll('.Paragraph');
    paras.forEach(p => {
        const cap = p.querySelector(':scope > .ParagraphCaption');
        if (!cap) {
            return;
        }

        const parent = p.parentNode;
        if (!parent) {
            return;
        }

        parent.insertBefore(cap, p);
    });

    return el;
}

function tagParagraphBlankNum(el) {
    let str = '.Preamble > .Paragraph, ';
    str += '.MainProvision > .Paragraph, .SupplProvision > .Paragraph, ';
    str += '.MainProvision > .Article > .Paragraph[data-num]:not([data-num="1"]), ';
    str += '.SupplProvision > .Article > .Paragraph[data-num]:not([data-num="1"])';
    el.querySelectorAll(str).forEach(p => {
        const pn = p.querySelector(':scope > .ParagraphNum');
        if (!pn || pn.textContent.trim()) return;
        p.classList.add('ParagraphBlankNum');
    });
    return el;
}

function addParagraphContainer(el) {
    el.querySelectorAll('.Paragraph').forEach(p => {
        if (p.closest('.Article')) return;

        const parent = p.parentNode;
        if (!parent) return;

        const prev = p.previousElementSibling;
        const hasCaption = prev && prev.classList.contains('ParagraphCaption');

        const container = el.ownerDocument.createElement('section');
        container.className = 'ParagraphContainer';

        const insertBeforeNode = hasCaption ? prev : p;
        parent.insertBefore(container, insertBeforeNode);

        if (hasCaption) {
            container.appendChild(prev);
        }

        container.appendChild(p);
    });

    return el;
}

function trim(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    const removeList = [];
    while ((node = walker.nextNode())) {
        const original = node.nodeValue;
        const trimmed = original.replace(/^[\x20\t\r\n]+|[\x20\t\r\n]+$/g, '');

        if (original !== trimmed) {
            node.nodeValue = trimmed;
        }
        if (trimmed.length === 0) {
            removeList.push(node);
        }
    }
    removeList.forEach(n => {
        if (n.parentNode) {
            n.parentNode.removeChild(n);
        }
    });
    return el;
}

function addSupplProvisionAmendLawNum(el) {
    const sections = el.querySelectorAll('.SupplProvision[data-amendlawnum]');
    sections.forEach(sec => {
        const lawnum = sec.getAttribute('data-amendlawnum');
        if (!lawnum || lawnum.trim() === '') {
            return;
        }
        const label = sec.querySelector(':scope > .SupplProvisionLabel');
        if (!label) {
            return;
        }
        const suffix = '　' + '（' + lawnum + '）';
        const currentText = label.textContent || '';
        if (currentText.includes(suffix)) {
            return;
        }
        label.appendChild(document.createTextNode(suffix));
    });

    return el;
}

function addSupplProvisionExtractLabel(el) {
    const sections = el.querySelectorAll('.SupplProvision[data-extract="true"]');
    sections.forEach(sec => {
        const label = sec.querySelector(':scope > .SupplProvisionLabel');
        if (!label) {
            return;
        }
        const suffix = '　' + '抄';
        const currentText = label.textContent || '';
        if (currentText.includes(suffix)) {
            return;
        }
        label.appendChild(document.createTextNode(suffix));
    });

    return el;
}

function addZenkakuSpaceAfterClass(el, targetClass) {
    const targets = el.querySelectorAll('.' + CSS.escape(targetClass));
    const zenkaku = '\u3000';

    targets.forEach(node => {
        if (node.textContent.trim().length === 0) {
            return;
        }
        const parent = node.parentElement;
        if (!parent) {
            return;
        }
        if (parent.lastElementChild === node) {
            return;
        }
        const nextNode = node.nextSibling;
        if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
            if (!nextNode.data.startsWith(zenkaku)) {
                nextNode.data = zenkaku + nextNode.data;
            }
        } else {
            parent.insertBefore(document.createTextNode(zenkaku), nextNode || node.nextSibling);
        }
    });

    return el;
}
