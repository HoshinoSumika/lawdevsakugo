export const Cache = {
    open,
    deleteAll,
};

import { Storage } from '/lib/storage.js';

const STORAGE_NAME_CONTENT = 'Content';
const STORAGE_NAME_SIZE = 'Size';
const STORAGE_NAME_TIME = 'Time';
const DB_VERSION = 1;

async function open(name) {
    const database = await openDatabase(name);
    return {
        setItem: (key, value) => setItem(key, value, database),
        getItem: key => getItem(key, database),
        removeItem: key => removeItem(key, database),
        clear: () => clear(database),
        getSize: () => getSize(database),
        getMaxSize: () => getMaxSize(name),
        setMaxSize: size => setMaxSize(size, name),
        getMaxTime: () => getMaxTime(name),
        setMaxTime: time => setMaxTime(time, name),
        cleanup: () => cleanup(database, name),
        close: () => database.close(),
    };
}

async function deleteAll() {
    const databaseList = await indexedDB.databases();
    await Promise.all(databaseList.map(database => deleteDatabase(database.name)));
}

function deleteDatabase(name) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = e => reject(e.target.error);
    });
}

function openDatabase(name) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, DB_VERSION);

        request.onupgradeneeded = e => {
            const db = e.target.result;
            db.createObjectStore(STORAGE_NAME_CONTENT);
            db.createObjectStore(STORAGE_NAME_SIZE);
            db.createObjectStore(STORAGE_NAME_TIME);
        };

        request.onsuccess = e => {
            const database = e.target.result;
            database.onversionchange = () => {
                database.close();
            };
            resolve(database);
        };

        request.onerror = e => {
            reject(e.target.error);
        };
    });
}

function setItem(key, value, database) {
    return new Promise((resolve, reject) => {
        const tx = database.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
        const contentStore = tx.objectStore(STORAGE_NAME_CONTENT);
        const sizeStore = tx.objectStore(STORAGE_NAME_SIZE);
        const timeStore = tx.objectStore(STORAGE_NAME_TIME);

        const size = new Blob([value]).size;
        const time = Date.now();

        contentStore.put(value, key);
        sizeStore.put(size, key);
        timeStore.put(time, key);

        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

function getItem(key, database) {
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORAGE_NAME_CONTENT, 'readonly');
        const store = tx.objectStore(STORAGE_NAME_CONTENT);
        const request = store.get(key);

        request.onsuccess = e => {
            resolve(e.target.result ?? null);
        };
        request.onerror = e => {
            reject(e.target.error);
        };
    });
}

function removeItem(key, database) {
    return new Promise((resolve, reject) => {
        const tx = database.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
        tx.objectStore(STORAGE_NAME_CONTENT).delete(key);
        tx.objectStore(STORAGE_NAME_SIZE).delete(key);
        tx.objectStore(STORAGE_NAME_TIME).delete(key);

        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

function clear(database) {
    return new Promise((resolve, reject) => {
        const tx = database.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
        tx.objectStore(STORAGE_NAME_CONTENT).clear();
        tx.objectStore(STORAGE_NAME_SIZE).clear();
        tx.objectStore(STORAGE_NAME_TIME).clear();

        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

function getSize(database) {
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORAGE_NAME_SIZE, 'readonly');
        const store = tx.objectStore(STORAGE_NAME_SIZE);

        const sizeList = [];
        const request = store.openCursor();

        request.onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
                sizeList.push(cursor.value);
                cursor.continue();
            } else {
                const totalSize = sizeList.reduce((acc, cur) => acc + cur, 0);
                resolve(totalSize);
            }
        };
        request.onerror = e => reject(e.target.error);
    });
}

const KEY_MAX_SIZE = 'storage-max-size';
const VALUE_MAX_SIZE = 20 * 1024 * 1024;

function getMaxSize(name) {
    return Storage.get(KEY_MAX_SIZE + '-' + name, VALUE_MAX_SIZE);
}

function setMaxSize(size, name) {
    if (size === VALUE_MAX_SIZE) {
        Storage.remove(KEY_MAX_SIZE + '-' + name);
    } else {
        Storage.set(KEY_MAX_SIZE + '-' + name, size);
    }
}

const KEY_MAX_TIME = 'storage-max-time';
const VALUE_MAX_TIME = 1 * 8 * 60 * 60 * 1000;

function getMaxTime(name) {
    return Storage.get(KEY_MAX_TIME + '-' + name, VALUE_MAX_TIME);
}

function setMaxTime(time, name) {
    if (time === VALUE_MAX_TIME) {
        Storage.remove(KEY_MAX_TIME + '-' + name);
    } else {
        Storage.set(KEY_MAX_TIME + '-' + name, time);
    }
}

async function cleanup(database, name) {
    const maxTime = getMaxTime(name);
    const maxSize = getMaxSize(name);
    const now = Date.now();
    let currentSize = 0;
    const itemList = [];
    await new Promise((resolve, reject) => {
        const tx = database.transaction([STORAGE_NAME_TIME, STORAGE_NAME_SIZE], 'readonly');
        const timeStore = tx.objectStore(STORAGE_NAME_TIME);
        const sizeStore = tx.objectStore(STORAGE_NAME_SIZE);
        let fetchedCount = 0;
        const fetchSizeAndAdd = (key, time) => {
            const sizeRequest = sizeStore.get(key);
            sizeRequest.onsuccess = (e) => {
                const size = e.target.result;
                itemList.push({ key, time, size });
                currentSize += size;
                fetchedCount++;
            };
            sizeRequest.onerror = (e) => reject(e.target.error);
        };
        const timeRequest = timeStore.openCursor();
        timeRequest.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                fetchSizeAndAdd(cursor.key, cursor.value);
                cursor.continue();
            } else {
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
    const expiredKeyList = itemList.filter(item => now - item.time > maxTime).map(item => item.key);
    let deleteKeyList = [...expiredKeyList];
    let deleteSize = expiredKeyList.reduce((sum, key) => sum + itemList.find(i => i.key === key).size, 0);
    let remainingSize = currentSize - deleteSize;
    if (remainingSize > maxSize) {
        const nonExpiredItemList = itemList.filter(item => !expiredKeyList.includes(item.key)).sort((a, b) => a.time - b.time);
        for (const item of nonExpiredItemList) {
            if (remainingSize <= maxSize) break;
            deleteKeyList.push(item.key);
            remainingSize -= item.size;
        }
    }
    if (deleteKeyList.length > 0) {
        await new Promise((resolve, reject) => {
            const tx = database.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
            const contentStore = tx.objectStore(STORAGE_NAME_CONTENT);
            const sizeStore = tx.objectStore(STORAGE_NAME_SIZE);
            const timeStore = tx.objectStore(STORAGE_NAME_TIME);

            for (const key of deleteKeyList) {
                contentStore.delete(key);
                sizeStore.delete(key);
                timeStore.delete(key);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }
}
