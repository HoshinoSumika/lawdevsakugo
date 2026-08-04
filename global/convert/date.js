const ERAS = [
    { name: '令和', start: '2019-05-01' },
    { name: '平成', start: '1989-01-08' },
    { name: '昭和', start: '1926-12-25' },
    { name: '大正', start: '1912-07-30' },
    { name: '明治', start: '1868-01-25' },
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function date(dateStr) {
    const match = DATE_PATTERN.exec(dateStr);
    if (!match) {
        return '';
    }

    const year = parseInt(match[1], 10);
    const suffix = parseInt(match[2], 10) + '月' + parseInt(match[3], 10) + '日';

    const era = ERAS.find(item => dateStr >= item.start);
    if (!era) {
        return year + '年' + suffix;
    }

    const eraYear = year - Number(era.start.slice(0, 4)) + 1;
    const label = eraYear === 1 ? '元年' : eraYear + '年';
    return era.name + label + suffix;
}
