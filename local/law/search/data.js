export const Data = {
    search,
};

const TEXT_SELECTOR = [
    '.ArticleCaption',
    '.ParagraphCaption',
    '.ArticleTitle',
    '.ParagraphNum',
    '.ItemTitle',
    '.Subitem1Title',
    '.Subitem2Title',
    '.Subitem3Title',
    '.Subitem4Title',
    '.Subitem5Title',
    '.Remarks > .RemarksLabel',
    '.ParagraphSentence',
    '.ItemSentence',
    '.Subitem1Sentence',
    '.Subitem2Sentence',
    '.Subitem3Sentence',
    '.Subitem4Sentence',
    '.Subitem5Sentence',
    '.TableColumn .Sentence',
    '.Remarks > .Sentence',
].join(', ');

function search(lawContent, value, { isUnlimited = false } = {}) {
    if (!value) {
        return {
            items: [],
            hasMore: false,
            limit: 0,
        };
    }

    const limit = getLimit(value, isUnlimited);
    const items = [];
    const exactMatch = searchByNum(lawContent, value);

    if (exactMatch) {
        items.push(exactMatch);
    }

    const textResult = searchByText(lawContent, value, limit);
    items.push(...textResult.items);

    return {
        items,
        hasMore: textResult.hasMore,
        limit,
    };
}

function getLimit(value, isUnlimited) {
    if (isUnlimited) {
        return 10000;
    }
    if (value.length === 1) {
        return 10;
    }
    if (value.length === 2 || value.length === 3) {
        return 20;
    }
    return 100;
}

function searchByNum(lawContent, value) {
    const articleNum = convertNum(value);
    if (!articleNum) {
        return null;
    }

    const mainProvision = lawContent.querySelector('.MainProvision');
    if (!mainProvision) {
        return null;
    }

    const exactMatch = mainProvision.querySelector('.Article[data-num="' + articleNum + '"]');
    if (exactMatch) {
        return exactMatch;
    }

    const rangeArticles = mainProvision.querySelectorAll('.Article[data-num*=":"]');
    for (const element of rangeArticles) {
        const dataNum = element.getAttribute('data-num');
        const [start, end] = dataNum.split(':');
        const searchBase = articleNum.replace(/_.*$/, '');
        const searchInt = parseInt(searchBase, 10);
        const startBase = start.replace(/_.*$/, '');
        const startInt = parseInt(startBase, 10);
        const endBase = end.replace(/_.*$/, '');
        const endInt = parseInt(endBase, 10);

        if (!isNaN(searchInt) && !isNaN(startInt) && !isNaN(endInt)) {
            if (searchInt >= startInt && searchInt <= endInt) {
                return element;
            }
        }
    }

    return null;
}

function searchByText(lawContent, value, limit) {
    const items = [];
    const lawBody = lawContent.querySelector('.LawBody');
    if (!lawBody) {
        return {
            items,
            hasMore: false,
        };
    }

    const elements = lawBody.querySelectorAll(TEXT_SELECTOR);
    const seen = new Set();
    for (const element of elements) {
        if (!element.offsetParent) {
            continue;
        }

        const clone = element.cloneNode(true);
        clone.querySelectorAll('rt').forEach(rt => rt.remove());
        if (!clone.textContent.includes(value)) {
            continue;
        }

        const resultElement = getResultElement(element);
        if (seen.has(resultElement)) {
            continue;
        }

        items.push(resultElement);
        seen.add(resultElement);
        if (items.length >= limit) {
            return {
                items,
                hasMore: true,
            };
        }
    }

    return {
        items,
        hasMore: false,
    };
}

function getResultElement(element) {
    return element.closest('.Article')
        || element.closest('.ParagraphContainer')
        || element.closest('.Preamble')
        || element.closest('.SupplProvisionAppdxTable')
        || element.closest('.AppdxTable')
        || element.closest('.AppdxNote')
        || element;
}

function convertNum(value) {
    if (!value) {
        return '';
    }

    value = value.replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2').replace(/３/g, '3').replace(/４/g, '4');
    value = value.replace(/５/g, '5').replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8').replace(/９/g, '9');
    value = value.replace(/の/g, '_').replace(/ /g, '_').replace(/　/g, '_');
    value = value.replace(/-/g, '_').replace(/－/g, '_').replace(/ー/g, '_').replace(/＿/g, '_');
    return value;
}
