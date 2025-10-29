export class FireCollection extends Collection<import("nextbone").Model<any, import("nextbone").ModelSetOptions, any>> {
    /**
     * @returns {Firestore}
     */
    static get db(): Firestore;
    /**
     * @type {() => Firestore}
     */
    static getDb: () => Firestore;
    /**
     * @type {FirestoreDataConverter}
     */
    static converter: FirestoreDataConverter;
    constructor({ models, ...options }?: {
        models: any;
    });
    /**
     * @type {Query | undefined}
     */
    _query: Query | undefined;
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
    set params(value: any);
    get params(): any;
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @param {Record<string, any>} params
     * @return { string | undefined}
     */
    path(): string | undefined;
    /**
     * @param {Record<string, any>} params
     * @return { CollectionReference | undefined}
     */
    ref(): CollectionReference | undefined;
    /**
     * @param {CollectionReference} ref
     * @param {Record<string, any>} params
     * @returns {Query | undefined}
     */
    query(ref: CollectionReference): Query | undefined;
    /**
     * @returns {Query | undefined}
     */
    getQuery(): Query | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    getPathRef(): CollectionReference | undefined;
    /**
     * @returns {Query | undefined}
     */
    ensureRef(): Query | undefined;
    updateRef(): Promise<any>;
    changeSource(newQuery: any): void;
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
    sync(): Promise<any[]>;
}
export namespace FireCollection {
    export let _db: Firestore;
    export { FireModel as model };
}
import { FireModel } from './model.js';
import { Collection } from 'nextbone';
export { FireModel };
//# sourceMappingURL=collection.d.ts.map