import { AsyncLocalStorage } from "node:async_hooks";
const store = new AsyncLocalStorage();
export const currentRequestId = () => store.getStore()?.requestId;
export const withRequestContext = (id, callback) => store.run({ requestId: id }, callback);
