export const Storage = {
    init,
    setItem,
    getItem,
    removeItem,
    clear,
    getSize,
    getMaxSize,
    setMaxSize,
    getMaxTime,
    setMaxTime,
    cleanup,
};

let dbName = null;
let dbInstance = null;
const STORAGE_NAME_CONTENT = 'Content';
const STORAGE_NAME_SIZE = 'Size';
const STORAGE_NAME_TIME = 'Time';
const DB_VERSION = 1;

function init(name) {
    dbName = name;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, DB_VERSION);

        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORAGE_NAME_CONTENT)) {
                db.createObjectStore(STORAGE_NAME_CONTENT);
            }
            if (!db.objectStoreNames.contains(STORAGE_NAME_SIZE)) {
                db.createObjectStore(STORAGE_NAME_SIZE);
            }
            if (!db.objectStoreNames.contains(STORAGE_NAME_TIME)) {
                db.createObjectStore(STORAGE_NAME_TIME);
            }
        };

        request.onsuccess = e => {
            dbInstance = e.target.result;
            dbInstance.onversionchange = () => {
                try {
                    dbInstance.close();
                } catch {
                }
                dbInstance = null;
            };
            resolve();
        };

        request.onerror = e => {
            reject(e.target.error);
        };
    });
}

function setItem(key, value) {
    return new Promise((resolve, reject) => {
        if (!dbInstance) {
            reject(new Error('DB is not initialized'));
            return;
        }

        const tx = dbInstance.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
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

function getItem(key) {
    return new Promise(async (resolve, reject) => {
        if (!dbInstance) {
            reject(new Error('DB is not initialized'));
            return;
        }

        try {
            const tx = dbInstance.transaction(STORAGE_NAME_CONTENT, 'readonly');
            const store = tx.objectStore(STORAGE_NAME_CONTENT);
            const request = store.get(key);

            request.onsuccess = e => {
                resolve(e.target.result ?? null);
            };
            request.onerror = e => {
                reject(e.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

function removeItem(key) {
    return new Promise((resolve, reject) => {
        if (!dbInstance) {
            reject(new Error('DB is not initialized'));
            return;
        }

        const tx = dbInstance.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
        tx.objectStore(STORAGE_NAME_CONTENT).delete(key);
        tx.objectStore(STORAGE_NAME_SIZE).delete(key);
        tx.objectStore(STORAGE_NAME_TIME).delete(key);

        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

function clear() {
    return new Promise((resolve, reject) => {
        if (!dbInstance) {
            reject(new Error('DB is not initialized'));
            return;
        }

        const tx = dbInstance.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
        tx.objectStore(STORAGE_NAME_CONTENT).clear();
        tx.objectStore(STORAGE_NAME_SIZE).clear();
        tx.objectStore(STORAGE_NAME_TIME).clear();

        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

function getSize() {
    return new Promise((resolve, reject) => {
        if (!dbInstance) {
            reject(new Error('DB is not initialized'));
            return;
        }

        const tx = dbInstance.transaction(STORAGE_NAME_SIZE, 'readonly');
        const store = tx.objectStore(STORAGE_NAME_SIZE);

        const sizes = [];
        const request = store.openCursor();

        request.onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
                sizes.push(cursor.value);
                cursor.continue();
            } else {
                const totalSize = sizes.reduce((acc, cur) => acc + cur, 0);
                resolve(totalSize);
            }
        };
        request.onerror = e => reject(e.target.error);
    });
}

const KEY_MAX_SIZE = 'storage-max-size';
const VALUE_MAX_SIZE = 20 * 1024 * 1024;

function getMaxSize() {
    const value = localStorage.getItem(KEY_MAX_SIZE + '-' + dbName);
    return value ? Number(value) : VALUE_MAX_SIZE;
}

function setMaxSize(size) {
    if (size === VALUE_MAX_SIZE) {
        localStorage.removeItem(KEY_MAX_SIZE + '-' + dbName);
    } else {
        localStorage.setItem(KEY_MAX_SIZE + '-' + dbName, String(size));
    }
}

const KEY_MAX_TIME = 'storage-max-time';
const VALUE_MAX_TIME = 1 * 8 * 60 * 60 * 1000;

function getMaxTime() {
    const value = localStorage.getItem(KEY_MAX_TIME + '-' + dbName);
    return value ? Number(value) : VALUE_MAX_TIME;
}

function setMaxTime(time) {
    if (time === VALUE_MAX_TIME) {
        localStorage.removeItem(KEY_MAX_TIME + '-' + dbName);
    } else {
        localStorage.setItem(KEY_MAX_TIME + '-' + dbName, String(time));
    }
}

async function cleanup() {
    const maxTime = getMaxTime();
    const maxSize = getMaxSize();
    const now = Date.now();
    let currentSize = 0;
    const allItems = [];
    await new Promise((resolve, reject) => {
        const tx = dbInstance.transaction([STORAGE_NAME_TIME, STORAGE_NAME_SIZE], 'readonly');
        const timeStore = tx.objectStore(STORAGE_NAME_TIME);
        const sizeStore = tx.objectStore(STORAGE_NAME_SIZE);
        let fetchedCount = 0;
        const fetchSizeAndAdd = (key, time) => {
            const sizeRequest = sizeStore.get(key);
            sizeRequest.onsuccess = (e) => {
                const size = e.target.result ?? 0;
                allItems.push({ key, time, size });
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
    const expiredKeys = allItems.filter(item => now - item.time > maxTime).map(item => item.key);
    let keysToDelete = [...expiredKeys];
    let deleteSize = expiredKeys.reduce((sum, key) => sum + (allItems.find(i => i.key === key)?.size ?? 0), 0);
    let remainingSize = currentSize - deleteSize;
    if (remainingSize > maxSize) {
        const nonExpiredItems = allItems.filter(item => !expiredKeys.includes(item.key)).sort((a, b) => a.time - b.time);
        for (const item of nonExpiredItems) {
            if (remainingSize <= maxSize) break;
            keysToDelete.push(item.key);
            remainingSize -= item.size;
        }
    }
    if (keysToDelete.length > 0) {
        await new Promise((resolve, reject) => {
            const tx = dbInstance.transaction([STORAGE_NAME_CONTENT, STORAGE_NAME_SIZE, STORAGE_NAME_TIME], 'readwrite');
            const contentStore = tx.objectStore(STORAGE_NAME_CONTENT);
            const sizeStore = tx.objectStore(STORAGE_NAME_SIZE);
            const timeStore = tx.objectStore(STORAGE_NAME_TIME);

            for (const key of keysToDelete) {
                contentStore.delete(key);
                sizeStore.delete(key);
                timeStore.delete(key);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }
}
