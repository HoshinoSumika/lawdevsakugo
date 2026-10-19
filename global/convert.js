export const Convert = {
    encode,
    setArticleCaption,
};

const ZENKAKU_SPACE = '\u3000';
const CIRCLED_NUM_PATTERN = /^[\u2460-\u2473]$/;

function encode(xmlStr) {
    let temp = xmlStr;

    temp = transformXmlToHtml(temp);

    if (!temp) {
        return null;
    }

    temp = removeIgnorableSpace(temp);

    temp = extractLaw(temp);

    temp = moveRemarksAfterTableStruct(temp);
    temp = moveArticleCaptionBeforeTitle(temp);
    temp = moveArticleTitleIntoFirstParagraph(temp);
    temp = addOldParagraphCircledNum(temp);
    temp = extractParagraphCaptionBeforeParagraph(temp);
    temp = tagParagraphBlankNum(temp);
    temp = addParagraphContainer(temp);
    temp = addTitleContainer(temp, 'PartTitle');
    temp = addTitleContainer(temp, 'ChapterTitle');
    temp = addTitleContainer(temp, 'SectionTitle');
    temp = addTitleContainer(temp, 'SubsectionTitle');
    temp = addTitleContainer(temp, 'DivisionTitle');

    temp = trim(temp);

    temp = addSupplProvisionAmendLawNum(temp);
    temp = addSupplProvisionExtractLabel(temp);

    temp = addZenkakuSpaceAfterClass(temp, 'ArticleTitle');
    temp = addZenkakuSpaceAfterClass(temp, 'ParagraphNum');
    temp = addZenkakuSpaceAfterClass(temp, 'ItemTitle');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem1Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem2Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem3Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem4Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Subitem5Title');
    temp = addZenkakuSpaceAfterClass(temp, 'Column');
    temp = addFigLink(temp);

    return temp.outerHTML;
}

function setArticleCaption(el, isReversed, isSingleParagraphNumShown) {
    restoreArticle(el);
    if (isReversed) {
        reverseArticle(el, isSingleParagraphNumShown);
    }
    return el;
}

function transformXmlToHtml(xmlStr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length) {
        return null;
    }

    const tagMap = {
        TOC: 'section', MainProvision: 'section', SupplProvision: 'section', AppdxTable: 'section', AppdxFig: 'section',
        AppdxStyle: 'section',
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

        SupplProvisionAppdxTableTitle: 'span', AppdxTableTitle: 'span', AppdxNoteTitle: 'span', AppdxFigTitle: 'span',
        AppdxStyleTitle: 'span', AppdxFormatTitle: 'span',
        RelatedArticleNum: 'span',

        ArithFormula: 'span',

        TableStruct: 'table', Table: 'tbody',
        TableRow: 'tr', TableColumn: 'td',

        Ruby: 'ruby', Rt: 'rt',

        Sup: 'sup', Sub: 'sub',
    };

    function convertNode(xmlNode, htmlDoc) {
        if (xmlNode.nodeType === Node.ELEMENT_NODE) {
            const origName = xmlNode.localName;
            const tagName = tagMap[origName] || 'div';
            const element = htmlDoc.createElement(tagName);
            element.className = origName;

            for (let i = 0; i < xmlNode.attributes.length; i++) {
                const attr = xmlNode.attributes[i];
                const nameLower = attr.name.toLowerCase();

                if (tagName === 'td' && (nameLower === 'rowspan' || nameLower === 'colspan')) {
                    element.setAttribute(nameLower, attr.value);
                    continue;
                }

                element.setAttribute('data-' + nameLower, attr.value);
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
            return htmlDoc.createTextNode(xmlNode.nodeValue);
        }

        return null;
    }

    const htmlDoc = document.implementation.createHTMLDocument('');
    return convertNode(xmlDoc.documentElement, htmlDoc);
}

function removeIgnorableSpace(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const removeList = [];
    let node;
    while ((node = walker.nextNode())) {
        if (/^[\x20\t\r\n]*$/.test(node.nodeValue)) {
            removeList.push(node);
        }
    }
    removeList.forEach(n => {
        n.remove();
    });

    return el;
}

function extractLaw(el) {
    const container = el.querySelector('.law_full_text');
    const law = container.querySelector('.Law');

    const lawInfo = el.querySelector('.law_info');
    for (const childEl of lawInfo.children) {
        const dataKey = childEl.className.toLowerCase();
        const textContent = childEl.textContent.trim();
        law.setAttribute('data-law_info_' + dataKey, textContent);
    }

    const revisionInfo = el.querySelector('.revision_info');
    for (const childEl of revisionInfo.children) {
        const dataKey = childEl.className.toLowerCase();
        const textContent = childEl.textContent.trim();
        law.setAttribute('data-revision_info_' + dataKey, textContent);
    }

    return law;
}

function moveRemarksAfterTableStruct(el) {
    el.querySelectorAll('.TableStruct').forEach(table => {
        const parent = table.parentNode;
        const ref = table.nextSibling;
        table.querySelectorAll(':scope > .Remarks').forEach(remarks => {
            parent.insertBefore(remarks, ref);
        });
    });

    return el;
}

function moveArticleCaptionBeforeTitle(el) {
    el.querySelectorAll('.Article').forEach(article => {
        const title = article.querySelector(':scope > .ArticleTitle');
        const caption = article.querySelector(':scope > .ArticleCaption');

        if (caption && title.nextElementSibling === caption) {
            article.insertBefore(caption, title);
        }
    });

    return el;
}

function moveArticleTitleIntoFirstParagraph(el) {
    el.querySelectorAll('.Article').forEach(article => {
        const title = article.querySelector(':scope > .ArticleTitle');
        const paragraph = title.nextElementSibling;
        paragraph.insertBefore(title, paragraph.firstChild);
    });

    return el;
}

function addOldParagraphCircledNum(el) {
    el.querySelectorAll('.Paragraph[data-oldnum="true"]').forEach(p => {
        const n = parseInt(p.getAttribute('data-num'), 10);

        const pn = p.querySelector(':scope > .ParagraphNum');
        if (pn.textContent.trim().length > 0) {
            return;
        }

        pn.textContent = formatCircledNumber(n);
    });

    return el;
}

function formatCircledNumber(n) {
    if (n <= 20) {
        return String.fromCharCode(0x2460 + (n - 1));
    }
    return '(' + n + ')';
}

function extractParagraphCaptionBeforeParagraph(el) {
    el.querySelectorAll('.Paragraph').forEach(p => {
        const cap = p.querySelector(':scope > .ParagraphCaption');
        if (!cap) {
            return;
        }

        p.parentNode.insertBefore(cap, p);
    });

    return el;
}

function tagParagraphBlankNum(el) {
    let str = '.Preamble > .Paragraph, ';
    str += '.MainProvision > .Paragraph, .SupplProvision > .Paragraph, ';
    str += '.MainProvision > .Article > .Paragraph:not([data-num="1"]), ';
    str += '.SupplProvision > .Article > .Paragraph:not([data-num="1"])';
    el.querySelectorAll(str).forEach(p => {
        const pn = p.querySelector(':scope > .ParagraphNum');
        if (pn.textContent.trim()) return;
        p.classList.add('ParagraphBlankNum');
    });
    return el;
}

function addParagraphContainer(el) {
    el.querySelectorAll('.Paragraph').forEach(p => {
        if (p.closest('.Article')) return;

        const parent = p.parentNode;

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

function addTitleContainer(el, className) {
    el.querySelectorAll('.' + className).forEach(title => {
        if (title.closest('.TOC')) return;

        const parent = title.parentNode;
        const container = el.ownerDocument.createElement('div');
        container.className = className + 'Container';
        parent.insertBefore(container, title);
        container.appendChild(title);
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
        n.remove();
    });
    return el;
}

function addSupplProvisionAmendLawNum(el) {
    el.querySelectorAll('.SupplProvision[data-amendlawnum]').forEach(sec => {
        const lawnum = sec.getAttribute('data-amendlawnum');
        const label = sec.querySelector(':scope > .SupplProvisionLabel');
        const suffix = ZENKAKU_SPACE + '（' + lawnum + '）';
        label.appendChild(document.createTextNode(suffix));
    });

    return el;
}

function addSupplProvisionExtractLabel(el) {
    el.querySelectorAll('.SupplProvision[data-extract="true"]').forEach(sec => {
        const label = sec.querySelector(':scope > .SupplProvisionLabel');
        const suffix = ZENKAKU_SPACE + '抄';
        label.appendChild(document.createTextNode(suffix));
    });

    return el;
}

function addFigLink(el) {
    const lawRevisionId = el.getAttribute('data-revision_info_law_revision_id');

    el.querySelectorAll('.Fig').forEach(fig => {
        const src = fig.getAttribute('data-src');
        const fileExtension = getFileExtension(src);

        const url = new URL('https://laws.e-gov.go.jp/api/2/attachment/' + encodeURIComponent(lawRevisionId));
        url.searchParams.set('src', src);

        const link = el.ownerDocument.createElement('a');
        link.className = 'FigFile';
        link.href = url.toString();
        link.textContent = fileExtension;
        fig.appendChild(link);
    });

    return el;
}

function getFileExtension(src) {
    const fileName = src.split('/').pop();
    return fileName.slice(fileName.lastIndexOf('.') + 1).toUpperCase();
}

function addZenkakuSpaceAfterClass(el, targetClass) {
    el.querySelectorAll('.' + targetClass).forEach(node => {
        if (node.textContent.trim().length === 0) {
            return;
        }
        const parent = node.parentElement;
        if (parent.lastElementChild === node) {
            return;
        }
        const nextNode = node.nextSibling;
        if (nextNode.nodeType === Node.TEXT_NODE) {
            if (!nextNode.data.startsWith(ZENKAKU_SPACE)) {
                nextNode.data = ZENKAKU_SPACE + nextNode.data;
            }
        } else {
            parent.insertBefore(document.createTextNode(ZENKAKU_SPACE), nextNode);
        }
    });

    return el;
}

function reverseArticle(el, isSingleParagraphNumShown) {
    const isMainOldNum = el.querySelector('.MainProvision .Paragraph[data-oldnum="true"]') !== null;
    el.querySelectorAll('.Article').forEach(article => {
        const paragraphList = article.querySelectorAll(':scope > .Paragraph');
        const firstParagraph = paragraphList[0];
        const title = firstParagraph.querySelector(':scope > .ArticleTitle');
        const caption = article.querySelector(':scope > .ArticleCaption');
        const firstNum = buildFirstParagraphNum(paragraphList, isSingleParagraphNumShown, isOldNumArticle(article, isMainOldNum));

        const heading = el.ownerDocument.createElement('div');
        heading.className = 'ArticleHeading';
        article.insertBefore(heading, caption || findParagraphStart(firstParagraph));
        removeZenkakuSpaceAfter(title);
        heading.appendChild(title);
        if (caption) {
            heading.appendChild(caption);
        }

        const num = firstParagraph.querySelector(':scope > .ParagraphNum');
        if (firstNum) {
            num.textContent = firstNum;
            num.classList.add('ParagraphNumFilled');
            num.after(ZENKAKU_SPACE);
        } else if (!num.textContent.trim()) {
            firstParagraph.classList.add('ParagraphBlankNum');
            firstParagraph.classList.add('ParagraphBlankNumFilled');
        }
    });
}

function buildFirstParagraphNum(paragraphList, isSingleParagraphNumShown, isOldNum) {
    const firstNum = paragraphList[0].querySelector(':scope > .ParagraphNum');
    if (firstNum.textContent.trim()) {
        return '';
    }
    if (paragraphList.length === 1) {
        if (!isSingleParagraphNumShown) {
            return '';
        }
        return isOldNum ? formatCircledNumber(1) : '１';
    }
    const secondNum = paragraphList[1].querySelector(':scope > .ParagraphNum');
    const secondText = secondNum.textContent.trim();
    if (!secondText) {
        return '';
    }
    return CIRCLED_NUM_PATTERN.test(secondText) ? formatCircledNumber(1) : '１';
}

function isOldNumArticle(article, isMainOldNum) {
    const supplProvision = article.closest('.SupplProvision');
    if (!supplProvision || !supplProvision.querySelector('.Paragraph:not([data-num="1"])')) {
        return isMainOldNum;
    }
    return supplProvision.querySelector('.Paragraph:not([data-num="1"]):not([data-oldnum="true"])') === null;
}

function findParagraphStart(paragraph) {
    const prev = paragraph.previousElementSibling;
    if (prev && prev.classList.contains('ParagraphCaption')) {
        return prev;
    }
    return paragraph;
}

function restoreArticle(el) {
    el.querySelectorAll('.ArticleHeading').forEach(heading => {
        const article = heading.parentElement;
        const firstParagraph = article.querySelector(':scope > .Paragraph');
        const title = heading.querySelector(':scope > .ArticleTitle');
        const caption = heading.querySelector(':scope > .ArticleCaption');
        if (caption) {
            article.insertBefore(caption, heading);
        }
        heading.remove();

        const num = firstParagraph.querySelector(':scope > .ParagraphNumFilled');
        if (num) {
            removeZenkakuSpaceAfter(num);
            num.textContent = '';
            num.classList.remove('ParagraphNumFilled');
        }
        if (firstParagraph.classList.contains('ParagraphBlankNumFilled')) {
            firstParagraph.classList.remove('ParagraphBlankNum');
            firstParagraph.classList.remove('ParagraphBlankNumFilled');
        }

        firstParagraph.insertBefore(title, firstParagraph.firstChild);
        title.after(ZENKAKU_SPACE);
    });
}

function removeZenkakuSpaceAfter(node) {
    const next = node.nextSibling;
    next.data = next.data.slice(ZENKAKU_SPACE.length);
    if (!next.data) {
        next.remove();
    }
}
