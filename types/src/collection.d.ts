import { Collection } from 'nextbone';
import type { Model } from 'nextbone';
import type { Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter, QuerySnapshot, SnapshotOptions, FirestoreError } from 'firebase/firestore';
/**
 * NextBone collection synchronized with a Firestore collection or query.
 * @template {Model} [TModel=Model]
 * @template {Record<string, any>} [Params=Record<string, any>]
 * @extends {Collection<TModel>}
 */
declare class FireCollection<TModel extends Model = Model, Params extends Record<string, any> = Record<string, any>> extends Collection<TModel> {
    static _db: Firestore | undefined;
    /**
     * @type {Query | undefined}
     */
    _query: Query | undefined;
    /**
     * @type {CollectionReference | undefined}
     */
    _ref: CollectionReference | undefined;
    updateQueryBatched: () => Promise<void>;
    /** @type {Params} */
    _params: Params;
    readyPromise: Promise<void>;
    queryPromise: Promise<void> | undefined;
    observedCount: number;
    firedInitialFetch: boolean;
    options: {
        serverTimestamps: SnapshotOptions['serverTimestamps'];
        debug: boolean;
    } & {
        serverTimestamps?: SnapshotOptions['serverTimestamps'];
        debug?: boolean | undefined;
    };
    isDebugEnabled: boolean;
    readyResolveFn: ((value: any) => void) | undefined;
    onSnapshotUnsubscribeFn: import("@firebase/firestore").Unsubscribe | undefined;
    /**
     * @returns {Firestore}
     */
    static get db(): Firestore;
    /**
     * @type {() => Firestore}
     */
    static getFirestore: () => Firestore;
    /**
     * @type {FirestoreDataConverter}
     */
    static converter: FirestoreDataConverter<any, import("@firebase/firestore").DocumentData>;
    /**
     * @param {{ models?: any } & Partial<{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }>} [options]
     */
    constructor({ models, ...options }?: {
        models?: any;
    } & Partial<{
        serverTimestamps: SnapshotOptions['serverTimestamps'];
        debug: boolean;
    }>);
    get isObserved(): boolean;
    /** @returns {Params} */
    get params(): Params;
    /** @param {Params} value */
    set params(value: Params);
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * Should return the path for this collection.
     * Override in subclasses.
     * @param {Params} [params]
     * @return { string | undefined}
     */
    path(params?: Params): string | undefined;
    /**
     * Should return the base CollectionReference for this collection.
     * Override in subclasses.
     * @param {Params} [params]
     * @returns {CollectionReference|undefined}
     */
    ref(params?: Params): CollectionReference | undefined;
    /**
     * Optionally apply query constraints to a path ref and return a Query.
     * Override in subclasses.
     * @param {CollectionReference} ref
     * @param {Params} [params]
     * @returns {Query | undefined}
     */
    query(ref: CollectionReference, params?: Params): Query | undefined;
    /**
     * @returns {Query | undefined}
     */
    getQuery(): Query | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    getRef(): CollectionReference | undefined;
    /**
     * @returns {Query | undefined}
     */
    ensureQuery(): Query | undefined;
    /**
     * @returns {Query | undefined}
     */
    updateQuery(): Query | undefined;
    changeSource(newQuery: any): void;
    /**
     * @param {*} data
     * @returns {Promise<DocumentReference>}
     */
    addDocument(data: any): Promise<DocumentReference>;
    ready(): Promise<void>;
    observe(): void;
    unobserve(): void;
    /**
     * @param {boolean} isReady
     */
    changeReady(isReady: boolean): void;
    fetchInitialData(): void;
    /**
     * @param { QuerySnapshot } snapshot
     * @returns
     */
    handleSnapshot(snapshot: QuerySnapshot): void;
    /**
     * @param {FirestoreError} err
     */
    handleSnapshotError(err: FirestoreError): void;
    logDebug(message: any): void;
    updateListeners(shouldListen: any): void;
    /**
     * @param {boolean} isLoading
     * @returns
     */
    changeLoading(isLoading: boolean): void;
    sync(): Promise<{
        id: string;
    }[]>;
}
export { FireCollection };
//# sourceMappingURL=collection.d.ts.map