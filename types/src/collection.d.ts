export type Query = import('firebase/firestore').Query;
export type DocumentReference = import('firebase/firestore').DocumentReference;
export type CollectionReference = import('firebase/firestore').CollectionReference;
export class FireCollection extends Collection<import("nextbone").Model<any, import("nextbone").ModelSetOptions, any>> {
    constructor({ models, ...options }?: {
        models: any;
    });
    /**
     * @type {CollectionReference | Query | undefined}
     */
    _ref: CollectionReference | Query | undefined;
    /**
     * @type {CollectionReference | undefined}
     */
    _pathRef: CollectionReference | undefined;
    _params: {};
    _paramsProxy: any;
    sourceId: any;
    listenerSourceId: any;
    readyPromise: Promise<void>;
    updateRefPromise: Promise<void>;
    observedCount: number;
    firedInitialFetch: boolean;
    options: {
        serverTimestamps: string;
        debug: boolean;
    };
    isDebugEnabled: any;
    get isObserved(): boolean;
    get path(): any;
    set params(value: any);
    get params(): any;
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @return { CollectionReference | undefined}
     */
    ref(): CollectionReference | undefined;
    /**
     * @param {CollectionReference} ref
     * @returns {Query | CollectionReference | undefined}
     */
    query(ref: CollectionReference): Query | CollectionReference | undefined;
    /**
     * @returns {Query | CollectionReference | undefined}
     */
    getRef(): Query | CollectionReference | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    getPathRef(): CollectionReference | undefined;
    /**
     * @returns {CollectionReference | Query | undefined}
     */
    ensureRef(): CollectionReference | Query | undefined;
    updateRef(): Promise<import("@firebase/firestore").CollectionReference<import("@firebase/firestore").DocumentData> | import("@firebase/firestore").Query<import("@firebase/firestore").DocumentData>>;
    changeSource(newRef: any): void;
    /**
     * @param {*} data
     * @returns {Promise<DocumentReference>}
     */
    addDocument(data: any): Promise<DocumentReference>;
    ready(): Promise<void>;
    observe(): void;
    unobserve(): void;
    changeReady(isReady: any): void;
    readyResolveFn: (value: any) => void;
    initReadyResolver(): void;
    fetchInitialData(): void;
    handleSnapshot(snapshot: any): void;
    handleSnapshotError(err: any): void;
    logDebug(message: any): void;
    updateListeners(shouldListen: any): void;
    onSnapshotUnsubscribeFn: import("@firebase/firestore").Unsubscribe;
    changeLoadingState(isLoading: any): void;
    isLoading: any;
    sync(): Promise<{
        id: string;
    }[]>;
}
export namespace FireCollection {
    export { FireModel as model };
}
import { FireModel } from './model.js';
import { Collection } from 'nextbone';
export { FireModel };
//# sourceMappingURL=collection.d.ts.map