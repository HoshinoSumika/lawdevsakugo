export const Search = {
    init,
    show,
};

import { Frame } from '/lib/frame.js?v=20260101';

import { Data } from './search/data.js?v=20260101';
import { Highlight } from './search/highlight.js?v=20260101';
import { Navigation } from './search/navigation.js?v=20260101';
import { UI } from './search/ui.js?v=20260101';

let lawContent;
let lawContainer;

function init(api) {
    lawContent = api.getContent();
    lawContainer = api.getContainer();

    UI.init({
        createPanel: content => Frame.createPanel(content),
        onInput: () => updateResult(false),
        onClear: () => updateResult(false),
    });
}

function show() {
    UI.show(lawContent);
    updateResult(false);
}

function updateResult(isUnlimited) {
    const query = UI.getQuery().trim();
    const result = Data.search(lawContent, query, { isUnlimited });

    UI.render(result, {
        query,
        isUnlimited,
        highlight: Highlight.apply,
        onExpand: () => updateResult(true),
        onSelect: element => {
            UI.hide();
            Navigation.moveTo(lawContainer, element, query, {
                highlight: Highlight.apply,
                clearHighlight: Highlight.clear,
            });
        },
    });
}
