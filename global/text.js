export const Text = {
    getLoading,
    getNotFound,
    getTopPage,
    getInfo,
    getHistory,
    getPreference,
    getShowToc,
    getShowSupplProvision,
    getParenHighlight,
    getWordHighlight,
    getParenHighlightPreference,
    getWordHighlightPreference,
    getWordAdd,
    getWordRemove,
    getExclusion,
    getExclusionAdd,
    getAdd,
    getHighlightColor,
    getHighlightColorNone,
    getHighlightBackground,
    getDefaultColor,
    getCustomColor,
    getHighlightCustomColor,
    getBackgroundNone,
    getBackgroundDefault,
    getBackgroundHatch,
    getParenOverallPreference,
    getParenDepthPreference,
    getParenDepth,
    getParenPreviewTitle,
    getParenPreviewSentence,
    getFontFamily,
    getFontSize,
    getTypesettingPreference,
    getLineHeight,
    getLetterSpacing,
    getContentWidth,
    getContentWidthStandard,
    getContentWidthWide,
    getContentWidthNone,
    getStoragePreference,
    getPreferenceClear,
    getPreferenceClearConfirm,
    getPreferenceCleared,
    getCacheDelete,
    getCacheDeleteConfirm,
    getCacheDeleted,
    getCacheDeleteFailed,
    getClear,
    getDelete,
    getSansSerif,
    getSerif,
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

const KANJI_NUMBER_LIST = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

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

function getPreference() {
    return '設定';
}

function getShowToc() {
    return '本文中の目次を表示';
}

function getShowSupplProvision() {
    return '附則を表示';
}

function getParenHighlight() {
    return '括弧を強調表示';
}

function getWordHighlight() {
    return '語句を強調表示';
}

function getParenHighlightPreference() {
    return '括弧の強調表示の詳細設定';
}

function getWordHighlightPreference() {
    return '語句の強調表示の詳細設定';
}

function getWordAdd() {
    return '語句を追加';
}

function getWordRemove() {
    return '語句を削除';
}

function getExclusion() {
    return '除外する語句';
}

function getExclusionAdd() {
    return '除外する語句を追加';
}

function getAdd() {
    return '追加';
}

function getHighlightColor() {
    return '文字の色';
}

function getHighlightColorNone() {
    return 'なし';
}

function getHighlightBackground() {
    return '背景';
}

function getDefaultColor() {
    return '既定';
}

function getCustomColor() {
    return '指定';
}

function getHighlightCustomColor() {
    return '指定色';
}

function getBackgroundNone() {
    return 'なし';
}

function getBackgroundDefault() {
    return '既定';
}

function getBackgroundHatch() {
    return '網掛け';
}

function getParenOverallPreference() {
    return '括弧全体の設定';
}

function getParenDepthPreference() {
    return '括弧階層ごとの設定';
}

function getParenDepth(depth) {
    return '第' + KANJI_NUMBER_LIST[depth] + '階層';
}

function getParenPreviewTitle() {
    return '第百二十三条';
}

function getParenPreviewSentence() {
    return 'これは、括弧の強調表示を確認するための例文（第一階層の括弧の内容（第二階層の括弧の内容（第三階層の括弧の内容（第四階層の括弧の内容を含む。）を含む。）を含む。）を含む。）である。';
}

function getFontFamily() {
    return '書体';
}

function getFontSize() {
    return '文字サイズ';
}

function getTypesettingPreference() {
    return '組版の詳細設定';
}

function getLineHeight() {
    return '行間';
}

function getLetterSpacing() {
    return '字間';
}

function getContentWidth() {
    return '本文の幅';
}

function getContentWidthStandard() {
    return '標準';
}

function getContentWidthWide() {
    return '広い';
}

function getContentWidthNone() {
    return '無制限';
}

function getStoragePreference() {
    return 'データの管理';
}

function getPreferenceClear() {
    return '設定をクリア';
}

function getPreferenceClearConfirm() {
    return 'すべての設定を初期値に戻します。よろしいですか？';
}

function getPreferenceCleared() {
    return '設定をクリアしました。';
}

function getCacheDelete() {
    return 'キャッシュを削除';
}

function getCacheDeleteConfirm() {
    return '保存されているキャッシュをすべて削除します。よろしいですか？';
}

function getCacheDeleted() {
    return 'キャッシュを削除しました。';
}

function getCacheDeleteFailed() {
    return 'キャッシュを削除できませんでした。';
}

function getClear() {
    return 'クリア';
}

function getDelete() {
    return '削除';
}

function getSansSerif() {
    return 'ゴシック';
}

function getSerif() {
    return '明朝';
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
