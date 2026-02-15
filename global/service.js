export const Service = {
    search,
    getLawRevisions,
    getLawFullText,
};

import { convert } from '/global/convert.js?v=20260213';

async function search(title) {
    try {
        const url = '/ignore/' + title + '.json';
        const res = await fetch(url);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/laws';
        const queryParams = '?response_format=json' + '&limit=9999' + '&law_title=' + title;
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function getLawRevisions(id) {
    try {
        const url = '/ignore/' + id + '.json';
        const res = await fetch(url);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_revisions/';
        const queryParams = '?response_format=json';
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + id + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const result = await res.json();
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function getLawFullText(id) {
    try {
        const url = '/ignore/' + id + '.xml';
        const res = await fetch(url);
        if (res.ok) {
            let result = await res.text();
            result = convert(result);
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    try {
        const apiBaseUrl = 'https://laws.e-gov.go.jp/api/2/law_data/';
        const queryParams = '?law_full_text_format=xml&response_format=xml';
        const encodedApiUrl = encodeURIComponent(apiBaseUrl + id + queryParams);
        const proxyUrl = '/proxy?url=' + encodedApiUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            let result = await res.text();
            result = convert(result);
            return result;
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}
