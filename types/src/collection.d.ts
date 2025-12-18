/**
 * NextBone collection synchronized with a Firestore collection or query.
 * @template {import('nextbone').Model} [TModel=import('nextbone').Model]
 * @template {Record<string, any>} [Params=Record<string, any>]
 * @extends {Collection<TModel>}
 */
export class FireCollection<TModel extends import("nextbone").Model = import("nextbone").Model<any, ModelSetOptions, any>, Params extends Record<string, any> = Record<string, any>> extends Collection<TModel> {
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
        serverTimestamps: SnapshotOptions["serverTimestamps"];
        debug: boolean;
    }>);
    /**
     * @type {Query | undefined}
     */
    _query: Query | undefined;
    /**
     * @type {CollectionReference | undefined}
     */
    _ref: CollectionReference | undefined;
    /** @type {Params} */
    _params: Params;
    /** @type {Params} */
    _paramsProxy: Params;
    readyPromise: Promise<void>;
    queryPromise: Promise<void>;
    observedCount: number;
    firedInitialFetch: boolean;
    options: {
        serverTimestamps: SnapshotOptions["serverTimestamps"];
        debug: boolean;
    } & {
        serverTimestamps?: SnapshotOptions["serverTimestamps"];
        debug?: boolean;
    };
    isDebugEnabled: boolean;
    get isObserved(): boolean;
    /** @param {Params} value */
    set params(value: Params);
    /** @returns {Params} */
    get params(): Params;
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
    updateQuery(): Promise<Query<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>>;
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
    readyResolveFn: (value: any) => void;
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
    onSnapshotUnsubscribeFn: import("@firebase/firestore").Unsubscribe;
    /**
     * @param {boolean} isLoading
     * @returns
     */
    changeLoading(isLoading: boolean): void;
    sync(): Promise<{
        id: string;
    }[]>;
}
import type { ModelSetOptions } from 'nextbone';
import { Collection } from 'nextbone';
import type { Query } from 'firebase/firestore';
import type { CollectionReference } from 'firebase/firestore';
import type { SnapshotOptions } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import type { QuerySnapshot } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { FirestoreDataConverter } from 'firebase/firestore';
//# sourceMappingURL=collection.d.ts.map