import type { Conversation } from "@/lib/conversations";

const DATABASE_NAME = "voice-of-customer-analyzer";
const DATABASE_VERSION = 1;
const STORE_NAME = "datasets";
const CURRENT_DATASET_KEY = "current";

export type DatasetSourceType = "csv" | "txt" | "pasted_text" | "sample";

export type StoredDataset = {
  id: string;
  name: string;
  sourceType: DatasetSourceType;
  importedAt: string;
  conversationCount: number;
  conversations: Conversation[];
};

export type DatasetStoreOperation = "open" | "read" | "write" | "delete";

export class DatasetStoreError extends Error {
  constructor(message: string, public readonly operation: DatasetStoreOperation, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DatasetStoreError";
  }
}

function messageFor(operation: DatasetStoreOperation, error?: DOMException) {
  if (error?.name === "QuotaExceededError") return "This dataset could not be saved because browser storage is full. Free some storage space, then try again.";
  if (error?.name === "SecurityError" || error?.name === "NotAllowedError") return "Local browser storage is blocked. Allow site storage in your browser settings, then try again.";
  if (operation === "read") return "The local dataset could not be read. Try refreshing the page or replace the dataset.";
  if (operation === "delete") return "The local dataset could not be cleared. Check your browser storage settings and try again.";
  if (operation === "write") return "The dataset could not be saved locally. Check your browser storage settings and available space, then try again.";
  return "Local dataset storage is unavailable in this browser. Enable site storage or try a supported browser.";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new DatasetStoreError(messageFor("open"), "open"));
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (cause) {
      reject(new DatasetStoreError(messageFor("open", cause instanceof DOMException ? cause : undefined), "open", { cause }));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatasetStoreError(messageFor("open", request.error ?? undefined), "open", { cause: request.error }));
    request.onblocked = () => reject(new DatasetStoreError("Local dataset storage is blocked by another open tab. Close other tabs for this app, then try again.", "open"));
  });
}

function runRequest<T>(operation: DatasetStoreOperation, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      database.close();
      callback();
    };
    let transaction: IDBTransaction;
    let request: IDBRequest<T>;
    let result: T;
    try {
      transaction = database.transaction(STORE_NAME, mode);
      request = action(transaction.objectStore(STORE_NAME));
    } catch (cause) {
      finish(() => reject(new DatasetStoreError(messageFor(operation, cause instanceof DOMException ? cause : undefined), operation, { cause })));
      return;
    }
    request.onsuccess = () => {
      result = request.result;
      if (mode === "readonly") finish(() => resolve(result));
    };
    request.onerror = () => finish(() => reject(new DatasetStoreError(messageFor(operation, request.error ?? undefined), operation, { cause: request.error })));
    transaction.oncomplete = () => finish(() => resolve(result));
    transaction.onabort = () => finish(() => reject(new DatasetStoreError(messageFor(operation, transaction.error ?? undefined), operation, { cause: transaction.error })));
  }));
}

export function createDataset(input: Pick<StoredDataset, "name" | "sourceType" | "conversations">): StoredDataset {
  const conversations = input.conversations.map((conversation) => ({ ...conversation }));
  return { id: crypto.randomUUID(), name: input.name, sourceType: input.sourceType, importedAt: new Date().toISOString(), conversationCount: conversations.length, conversations };
}

export async function saveCurrentDataset(dataset: StoredDataset): Promise<void> {
  await runRequest("write", "readwrite", (store) => store.put(dataset, CURRENT_DATASET_KEY));
}

export async function getCurrentDataset(): Promise<StoredDataset | null> {
  return (await runRequest<StoredDataset | undefined>("read", "readonly", (store) => store.get(CURRENT_DATASET_KEY))) ?? null;
}

export async function clearCurrentDataset(): Promise<void> {
  await runRequest("delete", "readwrite", (store) => store.delete(CURRENT_DATASET_KEY));
}

export function getDatasetStoreMessage(error: unknown): string {
  return error instanceof DatasetStoreError ? error.message : "The local dataset operation failed. Check your browser storage settings and try again.";
}
