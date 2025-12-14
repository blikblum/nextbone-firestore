import { Collection } from 'nextbone'
import { FireModel } from './model.js'
import {
  getDocs,
  addDoc,
  onSnapshot,
  queryEqual,
  getFirestore,
  collection,
} from 'firebase/firestore'

/**
 * @import {Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter, QuerySnapshot} from 'firebase/firestore'
 */

const optionDefaults = {
  serverTimestamps: 'estimate',
  debug: false,
}

/**
 *
 * @param {Record<string, any>} params
 * @param {FireCollection} instance
 * @returns
 */
const createParamsProxy = (params, instance) => {
  return new Proxy(params, {
    set(target, prop, value) {
      target[prop] = value
      instance.updateQuery()
      return true
    },
  })
}

class FireCollection extends Collection {
  /**
   * @returns {Firestore}
   */
  static get db() {
    if (!this._db) {
      const dbFactory = this.getDb || getFirestore
      this._db = dbFactory()
    }
    return this._db
  }

  /**
   * @type {() => Firestore}
   */
  static getDb

  /**
   * @type {FirestoreDataConverter}
   */
  static converter

  constructor({ models, ...options } = {}) {
    super(models, options)
    /**
     * @type {Query | undefined}
     */
    this._query = undefined
    /**
     * @type {CollectionReference | undefined}
     */
    this._ref = undefined
    this._params = {}
    this._paramsProxy = createParamsProxy(this._params, this)
    this.readyPromise = Promise.resolve()
    this.queryPromise = undefined
    this.observedCount = 0
    this.firedInitialFetch = false
    this.options = Object.assign(Object.assign({}, optionDefaults), options)
    this.isDebugEnabled = options.debug || false
  }

  get isObserved() {
    return this.observedCount > 0
  }

  get params() {
    return this._paramsProxy
  }

  set params(value) {
    if (!value || typeof value !== 'object') {
      throw new Error(`FireCollection: params should be an object`)
    }

    this._params = value
    this._paramsProxy = createParamsProxy(value, this)
    this.updateQuery()
  }

  /**
   * @return {Promise<void> | undefined}
   */
  beforeSync() {
    // to be overriden
  }

  /**
   * @param {Record<string, any>} params
   * @return { string | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  path(params) {
    // to be overriden
  }

  /**
   * @param {Record<string, any>} params
   * @return { CollectionReference | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  ref(params) {
    // to be overriden
  }

  /**
   * @param {CollectionReference} ref
   * @param {Record<string, any>} params
   * @returns {Query | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  query(ref, params) {
    return ref
  }

  /**
   * @returns {Query | undefined}
   */
  getQuery() {
    let ref
    const path = this.path(this._params)
    if (path) {
      /**
       * @type {{db: Firestore, converter: FirestoreDataConverter}}
       */
      const { db, converter } = this.constructor
      ref = collection(db, path).withConverter(converter)
    } else {
      ref = this.ref(this._params)
    }
    this._ref = ref
    return ref ? this.query(ref, this._params) : ref
  }

  /**
   * @returns {CollectionReference | undefined}
   */
  getRef() {
    return this._ref
  }

  /**
   * @returns {Query | undefined}
   */
  ensureQuery() {
    if (!this._query) {
      this._query = this.getQuery()
    }
    return this._query
  }

  async updateQuery() {
    if (!this.queryPromise) {
      // by default batch reset calls
      this.queryPromise = Promise.resolve()
      await this.queryPromise
      this.changeSource(this.getQuery())
      this.queryPromise = undefined
    }
    return this._query
  }

  changeSource(newQuery) {
    if (!this._query && !newQuery) {
      // this.logDebug("Ignore change source");
      return
    }
    if (this._query && newQuery && queryEqual(this._query, newQuery)) {
      // this.logDebug("Ignore change source");
      return
    }
    this.logDebug(`Change source to ${newQuery?.path}`)
    this.firedInitialFetch = false
    this._query = newQuery
    if (newQuery) {
      this.logDebug('Setting new ref source')
      if (this.isObserved) {
        this.logDebug('Change collection -> update listeners')
        this.updateListeners(true)
      }
      this.changeLoading(true)
    } else {
      if (this.isObserved) {
        this.logDebug('Change collection -> clear listeners')
        this.updateListeners(false)
      }
      this.changeLoading(false)
      this.set([], { reset: true })
      this.trigger('load', this)
    }
    this.trigger('request', this)
  }

  /**
   * @param {*} data
   * @returns {Promise<DocumentReference>}
   */
  async addDocument(data) {
    this.ensureQuery()
    const ref = this._ref
    if (!ref) {
      throw new Error(`Can not add a document to a collection that has no ref`)
    }

    return addDoc(ref, data)
  }

  async ready() {
    const isListening = !!this.onSnapshotUnsubscribeFn
    if (this.queryPromise) {
      await this.queryPromise
    }
    this.ensureQuery()
    if (!isListening) {
      /**
       * If the client is calling ready() but document is not being observed /
       * no listeners are set up, we treat ready() as a one time fetch request,
       * so data is available after awaiting the promise.
       */
      this.fetchInitialData()
    }
    return this.readyPromise
  }

  observe() {
    this.observedCount++
    if (this.observedCount === 1) {
      this.ensureQuery()
      this.updateListeners(true)
    }
  }

  unobserve() {
    if (this.observedCount > 0) {
      this.observedCount--
      this.updateListeners(false)
    }
  }

  /**
   * @param {boolean} isReady
   */
  changeReady(isReady) {
    const { readyResolveFn } = this
    if (isReady) {
      if (readyResolveFn) {
        this.readyResolveFn = undefined
        readyResolveFn()
      }
    } else {
      if (!readyResolveFn) {
        this.readyPromise = new Promise((resolve) => {
          this.readyResolveFn = resolve
        })
      }
    }
  }

  fetchInitialData() {
    if (this.firedInitialFetch) {
      // this.logDebug("Ignore fetch initial data");
      return
    }
    if (!this._query) {
      this.set([], { reset: true })
      return
    }
    this.logDebug('Fetch initial data')
    /**
     * Simply pass the snapshot from the promise to the handler function which
     * will then resolve the ready promise just like the snapshot from a
     * listener would.
     */
    this.changeLoading(true)
    this.trigger('request', this)

    getDocs(this._query)
      .then(async (snapshot) => {
        await this.beforeSync()
        this.handleSnapshot(snapshot)
      })
      .catch((err) => {
        this.changeLoading(false)
        this.trigger('load', this)
        console.error(`Fetch initial data failed: ${err.message}`)
      })

    this.firedInitialFetch = true
  }

  /**
   * @param { QuerySnapshot } snapshot
   * @returns
   */
  handleSnapshot(snapshot) {
    this.logDebug(
      `handleSnapshot, ${Date.now()} docs.length: ${snapshot.docs.length}`
    )

    const data = snapshot.docs.map((doc) => ({
      ...doc.data({
        serverTimestamps: this.options.serverTimestamps,
      }),
      id: doc.id,
    }))
    this.changeLoading(false)
    this.set(data, { parse: true, reset: true })
    this.trigger('load', this)
    this.trigger('sync', this)
  }

  /**
   * @param {FirestoreError} err
   */
  handleSnapshotError(err) {
    this.changeLoading(false)
    this.trigger('load', this)
    throw new Error(`${this._query?.path} snapshot error: ${err.message}`)
  }

  logDebug(message) {
    if (this.isDebugEnabled) {
      if (this._query) {
        console.log(`${this.cid} (${this._query.path}) ${message} `)
      } else {
        console.log(`${this.cid} ${message}`)
      }
    }
  }

  updateListeners(shouldListen) {
    const { onSnapshotUnsubscribeFn } = this

    if (onSnapshotUnsubscribeFn) {
      this.logDebug('Unsubscribe listeners')
      onSnapshotUnsubscribeFn()
      this.onSnapshotUnsubscribeFn = undefined
    }

    if (shouldListen) {
      this.logDebug('Subscribe listeners')
      this.changeLoading(true)
      this.trigger('request', this)
      if (this._query) {
        this.onSnapshotUnsubscribeFn = onSnapshot(
          this._query,
          async (snapshot) => {
            await this.beforeSync()
            this.handleSnapshot(snapshot)
          },
          (err) => this.handleSnapshotError(err)
        )
      }
    }
  }

  /**
   * @param {boolean} isLoading
   * @returns
   */
  changeLoading(isLoading) {
    if (this.isLoading === isLoading) {
      // this.logDebug(`Ignore change loading state: ${isLoading}`);
      return
    }
    this.logDebug(`Change loading state: ${isLoading}`)
    this.changeReady(!isLoading)
    this.isLoading = isLoading
  }

  async sync() {
    const query = this.ensureQuery()
    const snapshot = await getDocs(query)
    await this.beforeSync()
    const data = snapshot.docs.map((doc) => ({
      ...doc.data({
        serverTimestamps: this.options.serverTimestamps,
      }),
      id: doc.id,
    }))
    return data
  }
}

FireCollection.model = FireModel

export { FireCollection, FireModel }
