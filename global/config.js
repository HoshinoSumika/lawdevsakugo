import { Storage } from '/lib/storage.js';

export const Config = {
    getDev,
    setDev,
};

function getDev() {
    return Storage.get('dev', false) === true;
}

function setDev(value) {
    Storage.set('dev', value);
}
