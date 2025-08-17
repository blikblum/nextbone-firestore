import { Collection } from 'nextbone'
import { uniqueId } from 'lodash-es'
import { FireModel } from './model.js'
import { getDocs, addDoc, onSnapshot, queryEqual } from 'firebase/firestore'

/**
 * @import { Model, ModelSetOptions } from 'nextbone'
 * @import { DocumentReference, CollectionReference, Query, QuerySnapshot, SnapshotOptions, Unsubscribe } from 'firebase/firestore'
 */

/** @type {{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }} */
const optionDefaults = {
  serverTimestamps: 'estimate',
  debug: false,
}

/**
 * Proxies params to trigger updateRef() whenever a property is set.
 * @template P extends object
 * @param {P} params
 * @param {FireCollection<P>} instance
 * @returns {P}
 */
const createParamsProxy = (params, instance) => {
  return new Proxy(params, {
    set(target, prop, value) {
      target[prop] = value
      instance.updateRef()
      return true
    },
  })
}

/**
 * NextBone collection synchronized with a Firestore collection or query.
 * @template {Record<string, unknown>} [Params=Record<string, unknown>]
 * @extends {Collection<Model<Record<string, unknown>, ModelSetOptions, any>>}
 */
class FireCollection extends Collection {
  /** @type {Query|CollectionReference|undefined} */
  _ref
  /** @type {CollectionReference|undefined} */
  _pathRef
  /** @type {Params} */
  _params
  /** @type {Params} */
  _paramsProxy
  /** @type {string|undefined} */
  sourceId
  /** @type {string|undefined} */
  listenerSourceId
  /** @type {Promise<void>} */
  readyPromise
  /** @type {(() => void)|undefined} */
  readyResolveFn
  /** @type {Promise<void>|undefined} */
  updateRefPromise
  /** @type {number} */
  observedCount
  /** @type {boolean} */
  firedInitialFetch
  /** @type {{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }} */
  options
  /** @type {boolean} */
  isDebugEnabled
  /** @type {boolean} */
  isLoading
  /** @type {Unsubscribe|undefined} */
  onSnapshotUnsubscribeFn

  /**
   * @param {{ models?: any } & Partial<{ serverTimestamps: SnapshotOptions['serverTimestamps'], debug: boolean }>} [options]
   */
  constructor({ models, ...options } = {}) {
    super(models, options)

    /** @type {typeof this._ref} */
    this._ref = undefined

    /** @type {typeof this._pathRef} */
    this._pathRef = undefined
    /** @type {Params} */
    this._params = {}
    /** @type {Params} */
    this._paramsProxy = createParamsProxy(this._params, this)
    /** @type {typeof this.sourceId} */
    this.sourceId = undefined
    /** @type {typeof this.listenerSourceId} */
    this.listenerSourceId = undefined
    /** @type {Promise<void>} */
    this.readyPromise = Promise.resolve()
    /** @type {typeof this.updateRefPromise} */
    this.updateRefPromise = undefined
    /** @type {number} */
    this.observedCount = 0
    /** @type {boolean} */
    this.firedInitialFetch = false
    /** @type {typeof this.options} */
    this.options = Object.assign(Object.assign({}, optionDefaults), options)
    /** @type {boolean} */
    this.isDebugEnabled = !!(options && options.debug)
  }

  /** @returns {boolean} */
  get isObserved() {
    return this.observedCount > 0
  }

  /** @returns {string|undefined} */
  get path() {
    return this._ref ? this._ref.path : undefined
  }

  /** @returns {Params} */
  get params() {
    return this._paramsProxy
  }

  /** @param {Params} value */
  set params(value) {
    if (!value || typeof value !== 'object') {
      throw new Error(`FireCollection: params should be an object`)
    }

    this._params = value
    this._paramsProxy = createParamsProxy(value, this)
    this.updateRef()
  }

  /** Hook executed before synchronizing data. Override as needed.
   * @returns {Promise<void>|void}
   */
  beforeSync() {
    // to be overriden
  }

  /**
   * Should return the base CollectionReference for this collection.
   * Override in subclasses.
   * @param {Params} [params]
   * @returns {CollectionReference|undefined}
   */
  // eslint-disable-next-line no-unused-vars
  ref(params) {
    // to be overriden
  }

  /**
   * Optionally apply query constraints to a path ref and return a Query.
   * @param {CollectionReference} ref
   * @param {Params} [params]
   * @returns {Query|CollectionReference|undefined}
   */
  // eslint-disable-next-line no-unused-vars
  query(ref, params) {
    return ref
  }

  /**
   * Build and return the current reference (Query or CollectionReference).
   * @returns {Query|CollectionReference|undefined}
   */
  getRef() {
    const ref = (this._pathRef = this.ref(this._params))
    return ref ? this.query(ref, this._params) : ref
  }

  /** @returns {CollectionReference|undefined} */
  getPathRef() {
    return this._pathRef
  }

  /**
   * Ensure and return the current reference.
   * @returns {Query|CollectionReference|undefined}
   */
  ensureRef() {
    if (!this._ref) {
      this._ref = this.getRef()
    }
    return this._ref
  }

  /**
   * Debounced/batched update that recalculates the ref and triggers source changes.
   * @returns {Promise<Query|CollectionReference|undefined>}
   */
  async updateRef() {
    if (!this.updateRefPromise) {
      // by default batch reset calls
      this.updateRefPromise = Promise.resolve()
      await this.updateRefPromise
      this.changeSource(this.getRef())
      this.updateRefPromise = undefined
    }
    return this._ref
  }

  /**
   * Switch to a new source ref/query. Manages listeners and loading state.
   * @param {Query|CollectionReference|undefined} newRef
   * @returns {void}
   */
  changeSource(newRef) {
    if (!this._ref && !newRef) {
      // this.logDebug("Ignore change source");
      return
    }
    if (this._ref && newRef && queryEqual(this._ref, newRef)) {
      // this.logDebug("Ignore change source");
      return
    }
    this.logDebug(`Change source to ${newRef ? newRef.path : undefined}`)
    this.firedInitialFetch = false
    this._ref = newRef
    if (newRef) {
      this.logDebug('Setting new ref source')
      this.sourceId = uniqueId('s')
      if (this.isObserved) {
        this.logDebug('Change collection -> update listeners')
        this.updateListeners(true)
      }
      this.changeLoadingState(true)
    } else {
      if (this.isObserved) {
        this.logDebug('Change collection -> clear listeners')
        this.updateListeners(false)
      }
      this.set([], { reset: true })
      this.changeLoadingState(false)
      this.trigger('load', this)
    }
    this.trigger('request')
  }

  /**
   * Add a new document to the underlying collection path.
   * @param {object} data
   * @returns {Promise<DocumentReference>}
   */
  async addDocument(data) {
    this.ensureRef()
    const ref = this._pathRef
    if (!ref) {
      throw new Error(`Can not add a document to a collection that has no ref`)
    }

    return addDoc(ref, data)
  }

  /**
   * Resolve when the collection becomes ready. Triggers a one-time fetch if not listening.
   * @returns {Promise<void>}
   */
  async ready() {
    const isListening = !!this.onSnapshotUnsubscribeFn
    if (this.updateRefPromise) {
      await this.updateRefPromise
    }
    this.ensureRef()
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

  /** Start observing and attach realtime listeners when first observer appears. */
  observe() {
    this.observedCount++
    if (this.observedCount === 1) {
      this.ensureRef()
      this.updateListeners(true)
    }
  }

  /** Stop observing and detach listeners when no observers remain. */
  unobserve() {
    if (this.observedCount > 0) {
      this.observedCount--
      this.updateListeners(false)
    }
  }

  /**
   * Set or reset the ready promise based on loading state.
   * @param {boolean} isReady
   * @returns {void}
   */
  changeReady(isReady) {
    if (isReady) {
      const readyResolve = this.readyResolveFn
      if (readyResolve) {
        this.readyResolveFn = undefined
        readyResolve()
      }
    } else {
      this.initReadyResolver()
    }
  }

  /** Initialize the internal ready resolver/promise. */
  initReadyResolver() {
    if (!this.readyResolveFn) {
      this.readyPromise = new Promise((resolve) => {
        this.readyResolveFn = resolve
      })
    }
  }

  /**
   * Perform a one-time getDocs() fetch and feed it into handleSnapshot.
   * @returns {void}
   */
  fetchInitialData() {
    if (this.firedInitialFetch) {
      // this.logDebug("Ignore fetch initial data");
      return
    }
    if (!this._ref) {
      this.set([], { reset: true })
      return
    }
    this.logDebug('Fetch initial data')
    /**
     * Simply pass the snapshot from the promise to the handler function which
     * will then resolve the ready promise just like the snapshot from a
     * listener would.
     */
    this.changeLoadingState(true)
    this.trigger('request')

    getDocs(this._ref)
      .then(async (snapshot) => {
        await this.beforeSync()
        this.handleSnapshot(snapshot)
      })
      .catch((err) => {
        this.changeLoadingState(false)
        this.trigger('load', this)
        console.error(`Fetch initial data failed: ${err.message}`)
      })

    this.firedInitialFetch = true
  }

  /**
   * Normalize snapshot docs and reset the collection.
   * @param {QuerySnapshot} snapshot
   * @returns {void}
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
    this.set(data, { parse: true, reset: true })
    this.changeLoadingState(false)
    this.trigger('load', this)
    this.trigger('sync')
  }

  /**
   * Handle onSnapshot errors.
   * @param {Error} err
   * @returns {void}
   */
  handleSnapshotError(err) {
    this.trigger('load', this)
    throw new Error(`${this.path} snapshot error: ${err.message}`)
  }

  /**
   * Log debug messages when debug is enabled.
   * @param {string} message
   * @returns {void}
   */
  logDebug(message) {
    if (this.isDebugEnabled) {
      if (this._ref) {
        console.log(`${this.cid} (${this._ref.path}) ${message} `)
      } else {
        console.log(`${this.cid} ${message}`)
      }
    }
  }

  /**
   * Attach or detach realtime listeners based on shouldListen.
   * @param {boolean} shouldListen
   * @returns {void}
   */
  updateListeners(shouldListen) {
    const isListening = !!this.onSnapshotUnsubscribeFn
    if (
      shouldListen &&
      isListening &&
      this.sourceId === this.listenerSourceId
    ) {
      // this.logDebug("Ignore update listeners");
      return
    }
    if (isListening) {
      this.logDebug('Unsubscribe listeners')
      this.onSnapshotUnsubscribeFn()
      this.onSnapshotUnsubscribeFn = undefined
      this.listenerSourceId = undefined
    }
    if (shouldListen) {
      this.logDebug('Subscribe listeners')
      this.changeLoadingState(true)
      this.trigger('request')
      if (this._ref) {
        this.onSnapshotUnsubscribeFn = onSnapshot(
          this._ref,
          async (snapshot) => {
            await this.beforeSync()
            this.handleSnapshot(snapshot)
          },
          (err) => this.handleSnapshotError(err)
        )
      }
      this.listenerSourceId = this.sourceId
    }
  }

  /**
   * Toggle loading state and update the ready promise.
   * @param {boolean} isLoading
   * @returns {void}
   */
  changeLoadingState(isLoading) {
    if (this.isLoading === isLoading) {
      // this.logDebug(`Ignore change loading state: ${isLoading}`);
      return
    }
    this.logDebug(`Change loading state: ${isLoading}`)
    this.changeReady(!isLoading)
    this.isLoading = isLoading
  }

  /**
   * Perform a one-time fetch and return normalized data.
   * @returns {Promise<Array<Record<string, any>>>}
   */
  async sync() {
    const ref = /** @type {NonNullable<typeof this._ref>} */ (this.ensureRef())
    const snapshot = await getDocs(ref)
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

/** @type {typeof FireModel} */
FireCollection.model = FireModel

export { FireCollection, FireModel }
