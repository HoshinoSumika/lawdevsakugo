export const Text = {
    getLoading,
    getNotFound,
    getTopPage,
    getInfo,
    getHistory,
    getLawIdMissing,
    getLawIdUnavailable,
    getLawLoadFailed,
    getHistoryLoadFailed,
    getHistoryEmpty,
    getUnenforced,
    getCurrentEnforced,
    getPreviousEnforced,
    getNewEnactment,
    getLawTitle,
    getLawAbbrev,
    getLawNum,
    getPromulgationDate,
    getEnforcementDate,
    getAmendmentLaw,
    getRepealStatus,
    getSearchEmpty,
    getSearchShowAll,
    getSearchLimit,
};

function getLoading() {
    return '読み込み中';
}

function getNotFound() {
    return '404';
}

function getTopPage() {
    return 'トップページ';
}

function getInfo() {
    return '法令詳細';
}

function getHistory() {
    return '改正履歴';
}

function getLawIdMissing() {
    return '法令IDが指定されていません。';
}

function getLawIdUnavailable() {
    return '法令IDを取得できませんでした。';
}

function getLawLoadFailed() {
    return 'データを取得できませんでした。';
}

function getHistoryLoadFailed() {
    return '改正履歴を取得できませんでした。';
}

function getHistoryEmpty() {
    return '改正履歴がありません。';
}

function getUnenforced() {
    return '施行予定';
}

function getCurrentEnforced() {
    return '現在施行';
}

function getPreviousEnforced() {
    return '施行';
}

function getNewEnactment() {
    return '新規制定';
}

function getLawTitle() {
    return '現行法令名';
}

function getLawAbbrev() {
    return '略称法令名';
}

function getLawNum() {
    return '法令番号';
}

function getPromulgationDate() {
    return '公布日';
}

function getEnforcementDate() {
    return '施行日';
}

function getAmendmentLaw() {
    return '改正法令';
}

function getRepealStatus(...argList) {
    if (argList.length === 0) {
        return '状態';
    }
    const status = argList[0];
    if (status === 'Repeal') {
        return '廃止';
    } else if (status === 'Expire') {
        return '失効';
    } else if (status === 'Suspend') {
        return '停止';
    } else if (status === 'LossOfEffectiveness') {
        return '実効性喪失';
    }
    return '';
}

function getSearchEmpty() {
    return '検索結果なし';
}

function getSearchShowAll() {
    return 'すべての検索結果を表示';
}

function getSearchLimit(limit) {
    return '（現在は' + limit + '件のみ表示）';
}
