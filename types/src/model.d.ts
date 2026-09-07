import { Model } from 'nextbone';
import type { Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter, QuerySnapshot, DocumentSnapshot, FirestoreError } from 'firebase/firestore';
/**
 * NextBone model with methods to mutate a Firestore document
 * @template {Record<string, any>} [TAttributes=Record<string, any>]
 * @extends {Model<TAttributes>}
 */
declare class FireModel<TAttributes extends Record<string, any> = Record<string, any>> extends Model<TAttributes> {
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    collectionRef(): CollectionReference | undefined;
    /**
     * @returns {DocumentReference | CollectionReference | undefined}
     */
    ref(): DocumentReference | CollectionReference | undefined;
    /**
     * @param {string} method
     * @param {*} options
     * @returns
     */
    sync(method: string, options: any): Promise<any>;
}
/**
 * NextBone model synchronized with a Firestore document.
 * @template {Record<string, any>} [TAttributes=Record<string, any>]
 * @template {Record<string, any>} [Params=Record<string, any>]
 * @extends {FireModel<TAttributes>}
 */
declare class ObservableModel<TAttributes extends Record<string, any> = Record<string, any>, Params extends Record<string, any> = Record<string, any>> extends FireModel<TAttributes> {
    static _db: Firestore | undefined;
    /**
     * @type { Query | DocumentReference | undefined}
     */
    _query: Query | DocumentReference | undefined;
    updateQueryBatched: () => Promise<void>;
    /** @type {Params} */
    _params: Params;
    _unsubscribe: import("@firebase/firestore").Unsubscribe | undefined;
    readyPromise: Promise<void>;
    queryPromise: Promise<void> | undefined;
    observedCount: number;
    readyResolveFn: ((value: any) => void) | undefined;
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
    constructor(attributes: any, options: any);
    /** @returns {Params} */
    get params(): Params;
    /** @param {Params} value */
    set params(value: Params);
    get isObserved(): boolean;
    observe(): void;
    unobserve(): void;
    /**
     * @param {QuerySnapshot} snapshot
     * @returns {DocumentSnapshot | undefined}
     */
    selectSnapshot(snapshot: QuerySnapshot): DocumentSnapshot | undefined;
    /**
     * Optionally apply query constraints to a path ref and return a Query.
     * Override in subclasses.
     * @param {DocumentReference} ref
     * @param {Params} [params]
     * @returns {Query | undefined}
     */
    query(ref: DocumentReference, params?: Params): Query | undefined;
    /**
     * Should return the path for this collection.
     * Override in subclasses.
     * @param {Params} [params]
     * @returns {string | undefined}
     */
    collectionPath(params?: Params): string | undefined;
    /**
     * Should return the document path for this model.
     * Override in subclasses.
     * @param {Params} [params]
     * @returns {string | undefined}
     */
    path(params?: Params): string | undefined;
    /**
     * @returns {Query | DocumentReference | undefined}
     */
    getQuery(): Query | DocumentReference | undefined;
    /**
     * @returns {Query | undefined}
     */
    updateQuery(): Query | undefined;
    /**
     * @param {DocumentReference | Query} newQuery
     * @returns
     */
    changeSource(newQuery: DocumentReference | Query): void;
    /**
     * @param {boolean} shouldListen
     */
    updateListeners(shouldListen: boolean): void;
    /**
     * @param {QuerySnapshot | DocumentSnapshot} snapshot
     * @returns
     */
    handleSnapshot(snapshot: QuerySnapshot | DocumentSnapshot): void;
    /**
     * @param {FirestoreError} err
     */
    handleSnapshotError(err: FirestoreError): void;
    changeReady(isReady: any): void;
    changeLoading(isLoading: any): void;
    ready(): Promise<void>;
}
export { FireModel, ObservableModel };
//# sourceMappingURL=model.d.ts.map