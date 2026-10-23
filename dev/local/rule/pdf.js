export const Pdf = {
    read,
};

const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/';
const ROW_TOLERANCE = 1.5;
const RUN_GAP_RATIO = 0.4;
const LETTER_SPACE_RATIO = 0.3;
const LETTER_SPACE_MIN = 1;

async function read(file) {
    const pdfjs = await import(PDFJS_URL + 'build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'build/pdf.worker.min.mjs';
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data, cMapUrl: PDFJS_URL + 'cmaps/', cMapPacked: true });
    const pdf = await loadingTask.promise;

    const itemList = [];
    const imagePageList = [];
    for (let index = 0; index < pdf.numPages; index++) {
        const page = await pdf.getPage(index + 1);
        const height = page.view[3];
        const textContent = await page.getTextContent();
        textContent.items.forEach(item => {
            const text = item.str ? removeLetterSpace(item.str).trim() : '';
            if (!text) {
                return;
            }
            itemList.push({
                page: index,
                y: height - item.transform[5],
                x0: item.transform[4],
                x1: item.transform[4] + item.width,
                size: item.height,
                text,
            });
        });
        const operatorList = await page.getOperatorList();
        if (operatorList.fnArray.includes(pdfjs.OPS.paintImageXObject)) {
            imagePageList.push(index + 1);
        }
    }
    await loadingTask.destroy();

    const charWidth = findCharWidth(itemList);
    return { lineList: buildLineList(itemList, charWidth), charWidth, imagePageList };
}

function removeLetterSpace(text) {
    const count = (text.match(/\S (?=\S)/g) || []).length;
    if (count < LETTER_SPACE_MIN || count < text.replace(/ /g, '').length * LETTER_SPACE_RATIO) {
        return text;
    }
    return text.replace(/(\S) (?=\S)/g, '$1');
}

function findCharWidth(itemList) {
    const sizeList = itemList.map(item => item.size).filter(size => size > 0).sort((a, b) => a - b);
    return sizeList[Math.floor(sizeList.length / 2)] || 10;
}

function buildLineList(itemList, charWidth) {
    const sortedList = itemList.slice().sort((a, b) => a.page - b.page || a.y - b.y || a.x0 - b.x0);
    const rowList = [];
    sortedList.forEach(item => {
        const row = rowList[rowList.length - 1];
        if (row && row.page === item.page && Math.abs(row.y - item.y) < ROW_TOLERANCE) {
            row.itemList.push(item);
            return;
        }
        rowList.push({ page: item.page, y: item.y, itemList: [item] });
    });
    return rowList.map(row => buildLine(row, charWidth));
}

function buildLine(row, charWidth) {
    const runList = [];
    row.itemList.sort((a, b) => a.x0 - b.x0).forEach(item => {
        const run = runList[runList.length - 1];
        const gap = run ? item.x0 - run.x1 : 0;
        if (run && gap <= charWidth * RUN_GAP_RATIO) {
            run.text += item.text;
            run.x1 = Math.max(run.x1, item.x1);
            run.itemList.push(item);
            return;
        }
        runList.push({
            x0: item.x0,
            x1: item.x1,
            text: item.text,
            space: run ? Math.max(1, Math.round(gap / charWidth)) : 0,
            itemList: [item],
        });
    });
    return {
        page: row.page,
        y: row.y,
        x0: runList[0].x0,
        x1: Math.max(...runList.map(run => run.x1)),
        runList,
        text: runList.map(run => ' '.repeat(run.space) + run.text).join(''),
    };
}
