export const Text = {
    getLoading,
    getNotFound,
    getTopPage,
    getInfo,
    getHistory,
    getBookmarkAdd,
    getBookmarkRemove,
    getBookmarkAdded,
    getBookmarkRemoved,
    getOutline,
    getCompare,
    getOutlineLawInfo,
    getMainProvision,
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
    getRemove,
    getHighlightColor,
    getHighlightBackground,
    getBackgroundColor,
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
    getCharacterPlacement,
    getCharacterPlacementPreviewTitle,
    getCharacterPlacementPreviewSentence,
    getCharacterPlacementPreviewWordList,
    getArticlePlacement,
    getCaptionPlacement,
    getPlacementDefault,
    getPlacementReverse,
    getSingleParagraphNum,
    getShown,
    getHidden,
    getArticlePlacementPreviewCaption,
    getArticlePlacementPreviewTitle,
    getArticlePlacementPreviewSingleTitle,
    getArticlePlacementPreviewParagraphNum,
    getArticlePlacementPreviewSentence,
    getArticlePlacementPreviewSecondSentence,
    getArticlePlacementPreviewSingleSentence,
    getArticleCaptionDisplay,
    getArticleTitleDisplay,
    getStructureHeadingDisplay,
    getPartHeading,
    getChapterHeading,
    getSectionHeading,
    getSubsectionHeading,
    getDivisionHeading,
    getFontFamilyDefault,
    getBold,
    getItalic,
    getLineHeight,
    getParagraphSpacing,
    getParagraphSpacingStandard,
    getParagraphSpacingWide,
    getLetterSpacing,
    getContentWidth,
    getContentWidthStandard,
    getContentWidthWide,
    getContentWidthNone,
    getVerticalAlign,
    getVerticalAlignBottom,
    getVerticalAlignMiddle,
    getVerticalAlignTop,
    getVerticalAlignOffset,
    getComparePreference,
    getCompareReplaceRatio,
    getCompareOldColor,
    getCompareNewColor,
    getStoragePreference,
    getPreferenceClear,
    getPreferenceClearConfirm,
    getPreferenceCleared,
    getCacheClear,
    getCacheClearConfirm,
    getCacheCleared,
    getCacheClearFailed,
    getClear,
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
    getCompareRun,
    getCompareEmpty,
    getCompareLoadFailed,
    getCompareExtractFailed,
    getCompareNoChange,
    getLawTitle,
    getLawAbbrev,
    getLawNum,
    getPromulgationDate,
    getEnforcementDate,
    getAmendmentLaw,
    getRepealStatus,
    getRepealAlert,
    getSearchEmpty,
    getSearchShowAll,
    getSearchLimit,
    getSiteName,
    getSearchPlaceholder,
    getBookmark,
    getRecent,
    getBookmarkEmpty,
    getRecentEmpty,
    getBookmarkClear,
    getBookmarkClearConfirm,
    getBookmarkCleared,
    getRecentClear,
    getRecentClearConfirm,
    getRecentCleared,
    getMajorLaw,
    getMenu,
    getShowBookmark,
    getShowRecent,
    getShowMajorLaw,
    getHelp,
    getHelpBody,
    getTerms,
    getTermsBody,
    getPrivacy,
    getPrivacyBody,
    getLawType,
    getInternetSearch,
    getInternetSearching,
    getInternetResult,
    getInternetResultLimit,
    getInternetEmpty,
    getInternetFailed,
    getUnenforcedLaw,
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

function getBookmarkAdd() {
    return 'ブックマークを追加';
}

function getBookmarkRemove() {
    return 'ブックマークを削除';
}

function getBookmarkAdded() {
    return 'ブックマークに追加しました。';
}

function getBookmarkRemoved() {
    return 'ブックマークから削除しました。';
}

function getOutline() {
    return '目次';
}

function getCompare() {
    return '条文比較';
}

function getOutlineLawInfo() {
    return '法令情報';
}

function getMainProvision() {
    return '本　則';
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
    return '除外';
}

function getExclusionAdd() {
    return '除外語句を追加';
}

function getAdd() {
    return '追加';
}

function getRemove() {
    return '削除';
}

function getHighlightColor() {
    return '文字の色';
}

function getHighlightBackground() {
    return '背景';
}

function getBackgroundColor() {
    return '背景の色';
}

function getDefaultColor() {
    return '既定';
}

function getCustomColor() {
    return '指定';
}

function getHighlightCustomColor() {
    return '指定の色';
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

function getCharacterPlacement() {
    return '文字の配置';
}

function getCharacterPlacementPreviewTitle() {
    return '第百二十三条';
}

function getCharacterPlacementPreviewSentence() {
    return 'これは、文字の配置を確認するための例文（括弧の内容（第二階層の括弧の内容を含む。）を含む。）であり、括弧及び語句の文字サイズが本文と異なる場合又はその配置を変更した場合に用いる。';
}

function getCharacterPlacementPreviewWordList() {
    return ['及び', '又は'];
}

function getArticlePlacement() {
    return '条文の配置';
}

function getCaptionPlacement() {
    return '見出しの配置';
}

function getPlacementDefault() {
    return '既定';
}

function getPlacementReverse() {
    return '反転';
}

function getSingleParagraphNum() {
    return '第一項のみの条文の項番号';
}

function getShown() {
    return '表示';
}

function getHidden() {
    return '非表示';
}

function getArticlePlacementPreviewCaption() {
    return '（見出し）';
}

function getArticlePlacementPreviewTitle() {
    return '第百二十三条';
}

function getArticlePlacementPreviewSingleTitle() {
    return '第百二十四条';
}

function getArticlePlacementPreviewParagraphNum() {
    return '２';
}

function getArticlePlacementPreviewSentence() {
    return 'これは、条文の配置を確認するための例文である。';
}

function getArticlePlacementPreviewSecondSentence() {
    return '前項の規定は、第二項以下の配置を確認する場合について準用する。';
}

function getArticlePlacementPreviewSingleSentence() {
    return 'これは、第一項のみの条文の配置を確認するための例文である。';
}

function getArticleCaptionDisplay() {
    return '条文の見出しの表示';
}

function getArticleTitleDisplay() {
    return '条文の番号の表示';
}

function getStructureHeadingDisplay() {
    return '編・章・節・款・目の表示';
}

function getPartHeading() {
    return '編';
}

function getChapterHeading() {
    return '章';
}

function getSectionHeading() {
    return '節';
}

function getSubsectionHeading() {
    return '款';
}

function getDivisionHeading() {
    return '目';
}

function getFontFamilyDefault() {
    return '既定';
}

function getBold() {
    return '太字';
}

function getItalic() {
    return '斜体';
}

function getLineHeight() {
    return '行間';
}

function getParagraphSpacing() {
    return '段落の間隔';
}

function getParagraphSpacingStandard() {
    return '標準';
}

function getParagraphSpacingWide() {
    return '広い';
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

function getVerticalAlign() {
    return '文字の配置（縦）';
}

function getVerticalAlignBottom() {
    return '下';
}

function getVerticalAlignMiddle() {
    return '中央';
}

function getVerticalAlignTop() {
    return '上';
}

function getVerticalAlignOffset() {
    return '中央からのずれ';
}

function getComparePreference() {
    return '条文比較の詳細設定';
}

function getCompareReplaceRatio() {
    return '部分変更と全体変更の境界点';
}

function getCompareOldColor() {
    return '旧法の色';
}

function getCompareNewColor() {
    return '新法の色';
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

function getCacheClear() {
    return 'キャッシュをクリア';
}

function getCacheClearConfirm() {
    return '保存されているキャッシュをすべてクリアします。よろしいですか？';
}

function getCacheCleared() {
    return 'キャッシュをクリアしました。';
}

function getCacheClearFailed() {
    return 'キャッシュをクリアできませんでした。';
}

function getClear() {
    return 'クリア';
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

function getCompareRun() {
    return '比較';
}

function getCompareEmpty() {
    return '比較できる履歴がありません。';
}

function getCompareLoadFailed() {
    return '比較する法令データを取得できませんでした。';
}

function getCompareExtractFailed() {
    return '法令データから条文を抽出できませんでした。';
}

function getCompareNoChange() {
    return '本文の条文に差分はありません。';
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

function getRepealAlert(status) {
    return 'この法令は「' + getRepealStatus(status) + '」の状態です。';
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

function getSiteName() {
    return '法令検索';
}

function getSearchPlaceholder() {
    return '法令名';
}

function getBookmark() {
    return 'ブックマーク';
}

function getRecent() {
    return '閲覧履歴';
}

function getBookmarkEmpty() {
    return 'ブックマークがありません。';
}

function getRecentEmpty() {
    return '閲覧履歴がありません。';
}

function getBookmarkClear() {
    return 'ブックマークを削除';
}

function getBookmarkClearConfirm() {
    return 'すべてのブックマークを削除します。よろしいですか？';
}

function getBookmarkCleared() {
    return 'ブックマークを削除しました。';
}

function getRecentClear() {
    return '閲覧履歴を削除';
}

function getRecentClearConfirm() {
    return 'すべての閲覧履歴を削除します。よろしいですか？';
}

function getRecentCleared() {
    return '閲覧履歴を削除しました。';
}

function getMajorLaw() {
    return '主要法令';
}

function getMenu() {
    return 'メニュー';
}

function getShowBookmark() {
    return 'ブックマークを表示';
}

function getShowRecent() {
    return '閲覧履歴を表示';
}

function getShowMajorLaw() {
    return '主要法令を表示';
}

function getHelp() {
    return '使い方';
}

function getHelpBody() {
    return '<h3>トップページ</h3>'
        + '<p>検索予測は、一部の法令にのみ対応しています。</p>'
        + '<h3>法令閲覧ページ</h3>'
        + '<h4>検索</h4>'
        + '<p>「検索」機能は、条文の検索に特化しています。「制定文」や「編」「章」「節」などは検索結果に含まれません。これらを検索する場合は、ブラウザーの検索機能をご利用ください。</p>'
        + '<p>条番号で検索する際には、漢数字のみならず、半角数字や全角数字で検索することも可能です。たとえば「第四百十三条の二」を検索する場合には、「４１３　２」「413-2」などと入力すれば検索できます。</p>'
        + '<h4>目次</h4>'
        + '<p>「目次」機能で表示される目次では、「法令情報」が最初に表示されます。この「法令情報」は、本文中の「法令番号」「法令名」「制定文」「目次」など、法令番号から本則までのすべての内容を意味しています。</p>'
        + '<h3>法令データ</h3>'
        + '<p>法令データは、「e-Gov法令検索」（<a href="https://laws.e-gov.go.jp/">https://laws.e-gov.go.jp/</a>）のAPIを利用して取得しています。</p>'
        + '<p>法令データは、サービスに合わせて編集・加工等を行っております。法令の正確な内容や最新の情報については、必ず官報をご確認ください。</p>'
        + '<p>項番号のない古い法律においては、第二項以下の項に「②」「③」などの丸数字を付与しています。</p>';
}

function getTerms() {
    return '利用規約';
}

function getTermsBody() {
    return '<h3>コンテンツの利用について</h3>'
        + '<p>コンテンツ利用に当たっては、本利用規約に同意したものとみなします。</p>'
        + '<h3>免責事項</h3>'
        + '<p>当サイトの法令データが、官報に掲載している内容と異なる場合には、官報が優先します。</p>'
        + '<p>当サイトは、利用者がコンテンツを用いて行う一切の行為について何ら責任を負うものではありません。</p>'
        + '<h3>準拠法と合意管轄</h3>'
        + '<p>本利用規約は、日本法に基づいて解釈されます。</p>'
        + '<p>本利用規約によるコンテンツの利用及び本利用規約に関する紛争については、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。</p>';
}

function getPrivacy() {
    return 'プライバシー';
}

function getPrivacyBody() {
    return '<h3>Cookie</h3>'
        + '<p>当サイトでは、Cookie（クッキー）を使用しておりません。また、閲覧履歴や利用環境などの情報を収集する仕組みを設けておりません。</p>'
        + '<p>ただし、当サイトの公開に利用しているサービスであるCloudflareが、サービス提供等のために必要な技術的情報を収集する場合があります。これらの情報の取り扱いについては、Cloudflareのプライバシーポリシーをご確認ください。</p>'
        + '<h3>localStorageとIndexedDB</h3>'
        + '<p>当サイトでは、設定の保持や利便性向上のため、localStorage及びIndexedDBを使用してブラウザにデータを保存しています。localStorageには各種設定を永続的に、IndexedDBには法令データを一時的に保存します。これらのデータは、利用者のブラウザー内でのみ利用されます。</p>';
}

function getLawType(type) {
    if (type === 'Constitution') {
        return '憲法';
    } else if (type === 'Act') {
        return '法律';
    } else if (type === 'CabinetOrder') {
        return '政令';
    } else if (type === 'ImperialOrder') {
        return '勅令';
    } else if (type === 'MinisterialOrdinance') {
        return '府省令';
    } else if (type === 'Rule') {
        return '規則';
    }
    return 'その他';
}

function getInternetSearch(query) {
    return '「' + query + '」を e-Gov で検索';
}

function getInternetSearching() {
    return 'e-Gov で検索中';
}

function getInternetResult(count) {
    return 'e-Gov の検索結果 ' + count.toLocaleString() + ' 件';
}

function getInternetResultLimit(totalCount, limit) {
    return totalCount.toLocaleString() + ' 件のうち ' + limit + ' 件を表示';
}

function getInternetEmpty(query) {
    return '「' + query + '」に一致する法令は見つかりませんでした。';
}

function getInternetFailed() {
    return '検索結果を取得できませんでした。';
}

function getUnenforcedLaw() {
    return '未施行';
}
