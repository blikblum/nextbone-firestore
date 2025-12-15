export class FireModel extends Model<any, import("nextbone").ModelSetOptions, any> {
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
export class ObservableModel extends FireModel {
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
    _params: {};
    _paramsProxy: Record<string, any>;
    _unsubscribe: import("@firebase/firestore").Unsubscribe;
    readyPromise: Promise<void>;
    queryPromise: Promise<void>;
    observedCount: number;
    set params(value: Record<string, any>);
    get params(): Record<string, any>;
    get isObserved(): boolean;
    observe(): void;
    unobserve(): void;
    /**
     * @param {QuerySnapshot} snapshot
     * @returns {DocumentSnapshot | undefined}
     */
    selectSnapshot(snapshot: QuerySnapshot): DocumentSnapshot | undefined;
    /**
     * @param {DocumentReference} ref
     * @param {Record<string, any>} params
     * @returns {Query | undefined}
     */
    query(ref: DocumentReference, params: Record<string, any>): Query | undefined;
    /**
     * @param {Record<string, any>} params
     * @returns {string | undefined}
     */
    collectionPath(params: Record<string, any>): string | undefined;
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
    ready(): Promise<void>;
}
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