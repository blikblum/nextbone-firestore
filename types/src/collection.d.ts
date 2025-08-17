/**
 * NextBone collection synchronized with a Firestore collection or query.
 * @template {Record<string, unknown>} [Params=Record<string, unknown>]
 * @extends {Collection<Model<Record<string, unknown>, ModelSetOptions, any>>}
 */
export class FireCollection<Params extends Record<string, unknown> = Record<string, unknown>> extends Collection<Model<Record<string, unknown>, ModelSetOptions, any>> {
    /**
     * @param {{ models?: any } & Partial<{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }>} [options]
     */
    constructor({ models, ...options }?: {
        models?: any;
    } & Partial<{
        serverTimestamps: SnapshotOptions['serverTimestamps'];
        debug: boolean;
    }>);
    /** @type {Query|CollectionReference|undefined} */
    _ref: Query | CollectionReference | undefined;
    /** @type {CollectionReference|undefined} */
    _pathRef: CollectionReference | undefined;
    /** @type {Params} */
    _params: Params;
    /** @type {Params} */
    _paramsProxy: Params;
    /** @type {string|undefined} */
    sourceId: string | undefined;
    /** @type {string|undefined} */
    listenerSourceId: string | undefined;
    /** @type {Promise<void>} */
    readyPromise: Promise<void>;
    /** @type {(() => void)|undefined} */
    readyResolveFn: (() => void) | undefined;
    /** @type {Promise<void>|undefined} */
    updateRefPromise: Promise<void> | undefined;
    /** @type {number} */
    observedCount: number;
    /** @type {boolean} */
    firedInitialFetch: boolean;
    /** @type {{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }} */
    options: {
        serverTimestamps: SnapshotOptions['serverTimestamps'];
        debug: boolean;
    };
    /** @type {boolean} */
    isDebugEnabled: boolean;
    /** @type {Unsubscribe|undefined} */
    onSnapshotUnsubscribeFn: Unsubscribe | undefined;
    /** @returns {boolean} */
    get isObserved(): boolean;
    /** @returns {string|undefined} */
    get path(): string;
    /** @param {Params} value */
    set params(value: Params);
    /** @returns {Params} */
    get params(): Params;
    /** Hook executed before synchronizing data. Override as needed.
     * @returns {Promise<void>|void}
     */
    beforeSync(): Promise<void> | void;
    /**
     * Should return the base CollectionReference for this collection.
     * Override in subclasses.
     * @param {Params} [params]
     * @returns {CollectionReference|undefined}
     */
    ref(params?: Params): CollectionReference | undefined;
    /**
     * Optionally apply query constraints to a path ref and return a Query.
     * @param {CollectionReference} ref
     * @param {Params} [params]
     * @returns {Query|CollectionReference|undefined}
     */
    query(ref: CollectionReference, params?: Params): Query | CollectionReference | undefined;
    /**
     * Build and return the current reference (Query or CollectionReference).
     * @returns {Query|CollectionReference|undefined}
     */
    getRef(): Query | CollectionReference | undefined;
    /** @returns {CollectionReference|undefined} */
    getPathRef(): CollectionReference | undefined;
    /**
     * Ensure and return the current reference.
     * @returns {Query|CollectionReference|undefined}
     */
    ensureRef(): Query | CollectionReference | undefined;
    /**
     * Debounced/batched update that recalculates the ref and triggers source changes.
     * @returns {Promise<Query|CollectionReference|undefined>}
     */
    updateRef(): Promise<Query | CollectionReference | undefined>;
    /**
     * Switch to a new source ref/query. Manages listeners and loading state.
     * @param {Query|CollectionReference|undefined} newRef
     * @returns {void}
     */
    changeSource(newRef: Query | CollectionReference | undefined): void;
    /**
     * Add a new document to the underlying collection path.
     * @param {object} data
     * @returns {Promise<DocumentReference>}
     */
    addDocument(data: object): Promise<DocumentReference>;
    /**
     * Resolve when the collection becomes ready. Triggers a one-time fetch if not listening.
     * @returns {Promise<void>}
     */
    ready(): Promise<void>;
    /** Start observing and attach realtime listeners when first observer appears. */
    observe(): void;
    /** Stop observing and detach listeners when no observers remain. */
    unobserve(): void;
    /**
     * Set or reset the ready promise based on loading state.
     * @param {boolean} isReady
     * @returns {void}
     */
    changeReady(isReady: boolean): void;
    /** Initialize the internal ready resolver/promise. */
    initReadyResolver(): void;
    /**
     * Perform a one-time getDocs() fetch and feed it into handleSnapshot.
     * @returns {void}
     */
    fetchInitialData(): void;
    /**
     * Normalize snapshot docs and reset the collection.
     * @param {QuerySnapshot} snapshot
     * @returns {void}
     */
    handleSnapshot(snapshot: QuerySnapshot): void;
    /**
     * Handle onSnapshot errors.
     * @param {Error} err
     * @returns {void}
     */
    handleSnapshotError(err: Error): void;
    /**
     * Log debug messages when debug is enabled.
     * @param {string} message
     * @returns {void}
     */
    logDebug(message: string): void;
    /**
     * Attach or detach realtime listeners based on shouldListen.
     * @param {boolean} shouldListen
     * @returns {void}
     */
    updateListeners(shouldListen: boolean): void;
    /**
     * Toggle loading state and update the ready promise.
     * @param {boolean} isLoading
     * @returns {void}
     */
    changeLoadingState(isLoading: boolean): void;
    /**
     * Perform a one-time fetch and return normalized data.
     * @returns {Promise<Array<Record<string, any>>>}
     */
    sync(): Promise<Array<Record<string, any>>>;
}
export namespace FireCollection {
    export { FireModel as model };
}
import { FireModel } from './model.js';
import { Collection } from 'nextbone';
export { FireModel };
//# sourceMappingURL=collection.d.ts.map