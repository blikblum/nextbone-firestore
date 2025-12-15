export class FireCollection extends Collection<import("nextbone").Model<any, import("nextbone").ModelSetOptions, any>> {
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
    constructor({ models, ...options }?: {});
    /**
     * @type {Query | undefined}
     */
    _query: Query | undefined;
    /**
     * @type {CollectionReference | undefined}
     */
    _ref: CollectionReference | undefined;
    _params: {};
    _paramsProxy: Record<string, any>;
    readyPromise: Promise<void>;
    queryPromise: Promise<void>;
    observedCount: number;
    firedInitialFetch: boolean;
    options: {
        serverTimestamps: string;
        debug: boolean;
    };
    isDebugEnabled: any;
    get isObserved(): boolean;
    set params(value: Record<string, any>);
    get params(): Record<string, any>;
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @param {Record<string, any>} params
     * @return { string | undefined}
     */
    path(params: Record<string, any>): string | undefined;
    /**
     * @param {Record<string, any>} params
     * @return { CollectionReference | undefined}
     */
    ref(params: Record<string, any>): CollectionReference | undefined;
    /**
     * @param {CollectionReference} ref
     * @param {Record<string, any>} params
     * @returns {Query | undefined}
     */
    query(ref: CollectionReference, params: Record<string, any>): Query | undefined;
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
import { Collection } from 'nextbone';
import type { Query } from 'firebase/firestore';
import type { CollectionReference } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import type { QuerySnapshot } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { FirestoreDataConverter } from 'firebase/firestore';
//# sourceMappingURL=collection.d.ts.map