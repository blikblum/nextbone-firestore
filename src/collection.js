import { Collection } from 'nextbone'
import { uniqueId } from 'lodash-es'
import { FireModel } from './model.js'
import { getDocs, addDoc, onSnapshot, queryEqual } from 'firebase/firestore'

/**
 * @typedef {import('firebase/firestore').Query} Query
 * @typedef {import('firebase/firestore').DocumentReference} DocumentReference
 * @typedef {import('firebase/firestore').CollectionReference} CollectionReference
 */

const optionDefaults = {
  serverTimestamps: 'estimate',
  debug: false,
}

const createParamsProxy = (params, instance) => {
  return new Proxy(params, {
    set(target, prop, value) {
      target[prop] = value
      instance.updateRef()
      return true
    },
  })
}

class FireCollection extends Collection {
  constructor({ models, ...options } = {}) {
    super(models, options)
    /**
     * @type {CollectionReference | Query | undefined}
     */
    this._ref = undefined
    /**
     * @type {CollectionReference | undefined}
     */
    this._pathRef = undefined
    this._params = {}
    this._paramsProxy = createParamsProxy(this._params, this)
    this.sourceId = undefined
    this.listenerSourceId = undefined
    this.readyPromise = Promise.resolve()
    this.updateRefPromise = undefined
    this.observedCount = 0
    this.firedInitialFetch = false
    this.options = Object.assign(Object.assign({}, optionDefaults), options)
    this.isDebugEnabled = options.debug || false
  }

  get isObserved() {
    return this.observedCount > 0
  }

  get path() {
    return this._ref ? this._ref.path : undefined
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
    this.updateRef()
  }

  /**
   * @return {Promise<void> | undefined}
   */
  beforeSync() {
    // to be overriden
  }

  /**
   * @return { CollectionReference | undefined}
   */
  ref() {
    // to be overriden
  }

  /**
   * @param {CollectionReference} ref
   * @returns {Query | CollectionReference | undefined}
   */
  query(ref) {
    return ref
  }

  /**
   * @returns {Query | CollectionReference | undefined}
   */
  getRef() {
    const ref = (this._pathRef = this.ref(this._params))
    return ref ? this.query(ref, this._params) : ref
  }

  /**
   * @returns {CollectionReference | undefined}
   */
  getPathRef() {
    return this._pathRef
  }

  /**
   * @returns {CollectionReference | Query | undefined}
   */
  ensureRef() {
    if (!this._ref) {
      this._ref = this.getRef()
    }
    return this._ref
  }

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
   * @param {*} data
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

  observe() {
    this.observedCount++
    if (this.observedCount === 1) {
      this.ensureRef()
      this.updateListeners(true)
    }
  }

  unobserve() {
    if (this.observedCount > 0) {
      this.observedCount--
      this.updateListeners(false)
    }
  }

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

  initReadyResolver() {
    if (!this.readyResolveFn) {
      this.readyPromise = new Promise((resolve) => {
        this.readyResolveFn = resolve
      })
    }
  }

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

  handleSnapshotError(err) {
    this.trigger('load', this)
    throw new Error(`${this.path} snapshot error: ${err.message}`)
  }

  logDebug(message) {
    if (this.isDebugEnabled) {
      if (this._ref) {
        console.log(`${this.cid} (${this._ref.path}) ${message} `)
      } else {
        console.log(`${this.cid} ${message}`)
      }
    }
  }

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

  changeLoadingState(isLoading) {
    if (this.isLoading === isLoading) {
      // this.logDebug(`Ignore change loading state: ${isLoading}`);
      return
    }
    this.logDebug(`Change loading state: ${isLoading}`)
    this.changeReady(!isLoading)
    this.isLoading = isLoading
  }

  async sync() {
    const ref = this.ensureRef()
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

FireCollection.model = FireModel

export { FireCollection, FireModel }
