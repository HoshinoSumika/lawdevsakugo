import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const WAIT_MS = 300;
const LINK_PATTERN = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
const SIZE_PATTERN = /[（(]PDF[:：][^）)]*[）)]$/;
const ENTITY_MAP = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'', '&nbsp;': ' ' };

const pageUrl = process.argv[2];
const folder = process.argv[3];

if (!pageUrl || !folder) {
    console.log('使い方: node dev/download.mjs <規則集の一覧ページの URL> <保存先のフォルダー>');
    process.exit(1);
}

const res = await fetch(pageUrl);
if (!res.ok) {
    console.log('一覧ページを取得できなかった（' + res.status + '）');
    process.exit(1);
}
const itemList = findItemList(await res.text(), pageUrl);
await mkdir(folder, { recursive: true });

let count = 0;
for (const item of itemList) {
    if (item.kind !== 'pdf') {
        console.log('HTML のページなので保存しない: ' + item.title);
        continue;
    }
    try {
        const size = await download(item.url, join(folder, item.file));
        count = count + 1;
        console.log('保存した（' + Math.round(size / 1024) + 'KB）: ' + item.title);
    } catch (e) {
        item.error = e.message;
        console.log('保存できなかった: ' + item.title + '（' + e.message + '）');
    }
    await sleep(WAIT_MS);
}

const list = { url: pageUrl, date: buildDate(new Date()), itemList };
await writeFile(join(folder, 'list.json'), JSON.stringify(list, null, 4) + '\n');
console.log('PDF ' + count + ' 件と list.json を ' + folder + ' に保存した');

function findItemList(html, url) {
    const start = html.indexOf('<main');
    const end = html.indexOf('</main>');
    const main = start === -1 ? html : html.slice(start, end === -1 ? html.length : end);
    const page = new URL(url);
    const folderPath = page.pathname.slice(0, page.pathname.lastIndexOf('/') + 1);

    const resultList = [];
    for (const match of main.matchAll(LINK_PATTERN)) {
        const target = new URL(match[1], page);
        target.hash = '';
        if (resultList.some(item => item.url === target.href)) {
            continue;
        }
        const title = cleanText(match[2]);
        if (/\.pdf$/i.test(target.pathname)) {
            resultList.push({ title, url: target.href, kind: 'pdf', file: decodeURIComponent(target.pathname.split('/').pop()) });
        } else if (target.pathname.startsWith(folderPath) && target.pathname !== page.pathname && target.pathname.endsWith('.html')) {
            resultList.push({ title, url: target.href, kind: 'html', file: null });
        }
    }
    return resultList;
}

function cleanText(html) {
    let text = html.replace(/<[^>]+>/g, '');
    Object.keys(ENTITY_MAP).forEach(entity => {
        text = text.split(entity).join(ENTITY_MAP[entity]);
    });
    return text.replace(/\s+/g, ' ').trim().replace(SIZE_PATTERN, '').trim();
}

async function download(url, path) {
    const pdfRes = await fetch(url);
    if (!pdfRes.ok) {
        throw new Error('HTTP ' + pdfRes.status);
    }
    const data = Buffer.from(await pdfRes.arrayBuffer());
    if (data.subarray(0, 4).toString() !== '%PDF') {
        throw new Error('PDF ではない');
    }
    await writeFile(path, data);
    return data.length;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
