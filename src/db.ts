import { type Data, type Mode, empty, demoData } from "./core";
const dbName = "migramap-v1";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(dbName, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("datasets");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () =>
      reject(
        Error(
          "Browser database could not be opened. Check storage permissions.",
        ),
      );
    r.onblocked = () => reject(Error("Close other MigraMap tabs and retry."));
  });
}
export async function readData(mode: Mode): Promise<Data> {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const r = db.transaction("datasets").objectStore("datasets").get(mode);
      r.onsuccess = () =>
        resolve(r.result ?? (mode === "demo" ? demoData() : empty()));
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function writeData(mode: Mode, data: Data): Promise<void> {
  const db = await open();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      tx.objectStore("datasets").put(data, mode);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          Error(
            "Could not save. Storage may be full or unavailable. Your previous records were preserved.",
          ),
        );
      tx.onabort = () => reject(Error("Save cancelled; please retry."));
    });
  } finally {
    db.close();
  }
}
