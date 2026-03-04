export const Theme = {
    init,
    set,
    get,
};

const THEMES = {
    light: `
:root {
    color-scheme: light;
    --color-black: black;
    --color-gray: dimgray;
    --color-silver: #e6e6e6;
    --color-smoke: whitesmoke;
    --color-white: white;
    --color-hover: #ebebeb;
    --color-active: #e1e1e1;
    --color-border: #c3c3c3;
    --color-link: darkblue;
    --color-highlight: yellow;
}
`,
    dark: `
:root {
    color-scheme: dark;
    --color-black: whitesmoke;
    --color-gray: darkgray;
    --color-silver: #3d3d3d;
    --color-smoke: #363636;
    --color-white: #242424;
    --color-hover: #484848;
    --color-active: #606060;
    --color-border: #727272;
    --color-link: royalblue;
    --color-highlight: teal;
}
`,
    paper: `
:root {
    color-scheme: light;
    --color-black: #2a2a2a;
    --color-gray: #6a6a6a;
    --color-silver: #dedbd6;
    --color-smoke: #f2efe9;
    --color-white: #faf9f6;
    --color-hover: #ebe7df;
    --color-active: #e0dbd1;
    --color-border: #c9c3b8;
    --color-link: #7b5c3d;
    --color-highlight: #d4b483;
}
`,
    sepia: `
:root {
    color-scheme: light;
    --color-black: #2a231c;
    --color-gray: #5a5146;
    --color-silver: #c4b7a3;
    --color-smoke: #ddd2be;
    --color-white: #e7dcc8;
    --color-hover: #d1c5b0;
    --color-active: #c4b79f;
    --color-border: #ae9f88;
    --color-link: #5f432c;
    --color-highlight: #ddc36a;
}
`,
    nord: `
:root {
    color-scheme: dark;
    --color-black: #eceff4;
    --color-gray: #d8dee9;
    --color-silver: #4c566a;
    --color-smoke: #3b4252;
    --color-white: #2e3440;
    --color-hover: #434c5e;
    --color-active: #4c566a;
    --color-border: #616e88;
    --color-link: #88c0d0;
    --color-highlight: #a3be8c;
}
`,
    chocolate: `
:root {
    color-scheme: dark;
    --color-black: #e0d3bf;
    --color-gray: #b8aa94;
    --color-silver: #4a4034;
    --color-smoke: #3b3228;
    --color-white: #2f281f;
    --color-hover: #4f4538;
    --color-active: #5b5042;
    --color-border: #726655;
    --color-link: #c49a6c;
    --color-highlight: #8f7f4a;
}
`,
};

const STORAGE_KEY = 'theme';
const STYLE_ID = 'style-theme';

function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const key = stored && THEMES[stored] ? stored : 'system';
    set(key);
}

function set(key) {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();

    if (key === 'system') {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    if (!THEMES[key]) {
        return;
    }

    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = THEMES[key];
    document.head.appendChild(el);

    localStorage.setItem(STORAGE_KEY, key);
}

function get() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && THEMES[stored] ? stored : 'system';
}
