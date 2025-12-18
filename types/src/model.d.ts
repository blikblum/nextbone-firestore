export class FireModel extends Model<any, ModelSetOptions, any> {
    constructor(attributes?: Partial<any>, options?: any);
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
 * @template {Record<string, any>} [Params=Record<string, any>]
 * @extends {FireModel<Record<string, any>, ModelSetOptions, any>}
 */
export class ObservableModel<Params extends Record<string, any> = Record<string, any>> {
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
    /**
     * @type { Query | DocumentReference | undefined}
     */
    _query: Query | DocumentReference | undefined;
    /** @type {Params} */
    _params: Params;
    /** @type {Params} */
    _paramsProxy: Params;
    _unsubscribe: import("@firebase/firestore").Unsubscribe;
    readyPromise: Promise<void>;
    queryPromise: Promise<void>;
    observedCount: number;
    /** @param {Params} value */
    set params(value: Params);
    /** @returns {Params} */
    get params(): Params;
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
     * @returns {Query | undefined}
     */
    getQuery(): Query | undefined;
    updateQuery(): Promise<Query<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData> | DocumentReference<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>>;
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
    readyResolveFn: (value: any) => void;
    changeLoading(isLoading: any): void;
    isLoading: any;
    ready(): Promise<void>;
}
import type { ModelSetOptions } from 'nextbone';
import { Model } from 'nextbone';
import type { CollectionReference } from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';
import type { Query } from 'firebase/firestore';
import type { QuerySnapshot } from 'firebase/firestore';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { FirestoreError } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { FirestoreDataConverter } from 'firebase/firestore';
//# sourceMappingURL=model.d.ts.map