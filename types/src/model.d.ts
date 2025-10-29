export class FireModel extends Model<any, import("nextbone").ModelSetOptions, any> {
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
    constructor(attributes?: any, options?: any);
    /**
     * @return {Promise<void> | undefined}
     */
    beforeSync(): Promise<void> | undefined;
    /**
     * @returns {CollectionReference | undefined}
     */
    refRoot(): CollectionReference | undefined;
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
    _params: {};
    _paramsProxy: any;
    _unsubscribe: import("@firebase/firestore").Unsubscribe;
    readyPromise: Promise<void>;
    updateRefPromise: Promise<void>;
    set params(value: any);
    get params(): any;
    observe(): void;
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
    rootPath(params: Record<string, any>): string | undefined;
    /**
     * @returns {DocumentReference | Query | undefined}
     */
    getRef(): DocumentReference | Query | undefined;
    updateRef(): Promise<any>;
    /**
     * @param {DocumentReference | Query} newRef
     * @returns
     */
    changeRef(newRef: DocumentReference | Query): void;
    changeReady(isReady: any): void;
    readyResolveFn: (value: any) => void;
    initReadyResolver(): void;
    changeLoadingState(isLoading: any): void;
    isLoading: any;
    ready(): Promise<void>;
}
import { Model } from 'nextbone';
//# sourceMappingURL=model.d.ts.map