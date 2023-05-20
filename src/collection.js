import { Collection, Events } from 'nextbone'
import { uniqueId } from 'lodash-es'
import { FireModel } from './model.js'
import { isOnline } from './utils.js'

const optionDefaults = {
  serverTimestamps: 'estimate',
  debug: false,
}
function hasReference(ref) {
  return !!ref
}

class FireCollection extends Collection {
  constructor({ models, ...options } = {}) {
    super(models, options)
    this._ref = undefined
    this.sourceId = undefined
    this.listenerSourceId = undefined
    this.isDebugEnabled = false
    this.readyPromise = Promise.resolve()
    this.updateRefPromise = undefined
    this.observedCount = 0
    this.firedInitialFetch = false
    this.options = Object.assign(Object.assign({}, optionDefaults), options)
    this.isDebugEnabled = options.debug || false
    this.logDebug('FireCollection constructor')
  }

  get isObserved() {
    return this.observedCount > 0
  }

  get path() {
    return this._ref ? this._ref.path : undefined
  }

  beforeSync() {
    // to be overriden
  }

  ref() {
    // to be overriden
  }

  query(ref) {
    return ref
  }

  getRef() {
    const ref = this.ref()
    return ref ? this.query(ref) : ref
  }

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
    if (this._ref && newRef && this._ref.isEqual(newRef)) {
      // this.logDebug("Ignore change source");
      return
    }
    this.logDebug(`Change source to ${newRef ? newRef.path : undefined}`)
    this.firedInitialFetch = false
    this._ref = newRef
    if (hasReference(newRef)) {
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
      this.set([])
      this.changeLoadingState(false)
    }
    this.trigger('request')
  }

  async addDocument(data) {
    // todo add a separated cache for ref (necessary when query is defined)
    const ref = this.ref()
    if (!hasReference(ref)) {
      throw new Error(`Can not add a document to a collection that has no ref`)
    }
    if (isOnline()) {
      await ref.add(data)
    } else {
      ref.add(data)
    }
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
      this.set([])
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

    this._ref
      .get()
      .then(async (snapshot) => {
        await this.beforeSync()
        this.handleSnapshot(snapshot)
      })
      .catch((err) =>
        console.error(`Fetch initial data failed: ${err.message}`)
      )

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
    this.set(data, { parse: true })
    this.changeLoadingState(false)
    this.trigger('sync load')
  }

  handleSnapshotError(err) {
    this.trigger('sync load')
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
      this.onSnapshotUnsubscribeFn && this.onSnapshotUnsubscribeFn()
      this.onSnapshotUnsubscribeFn = undefined
      this.listenerSourceId = undefined
    }
    if (shouldListen) {
      this.logDebug('Subscribe listeners')
      this.changeLoadingState(true)
      this.trigger('request')
      if (this._ref) {
        this.onSnapshotUnsubscribeFn = this._ref.onSnapshot(
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
    const wasLoading = this.isLoading
    if (wasLoading === isLoading) {
      // this.logDebug(`Ignore change loading state: ${isLoading}`);
      return
    }
    this.logDebug(`Change loading state: ${isLoading}`)
    this.changeReady(!isLoading)
    this.isLoading = isLoading
  }

  async sync() {
    const ref = this.ensureRef()
    const snapshot = await ref.get()
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

const refSource = (optionsOrProtoOrDescriptor, fieldName, events) => {
  const isLegacy = typeof fieldName === 'string'
  if (!isLegacy && typeof optionsOrProtoOrDescriptor.kind !== 'string') {
    // passed options
    return function (protoOrDescriptor) {
      return refSource(protoOrDescriptor, fieldName, optionsOrProtoOrDescriptor)
    }
  }

  const name = isLegacy ? fieldName : optionsOrProtoOrDescriptor.key
  const key = `__${name}`
  const fieldDescriptor = {
    get() {
      return this[key]
    },
    set(value) {
      const oldValue = this[key]
      if (value === oldValue) return

      if (value instanceof Events) {
        this.listenTo(value, events, this.updateRef)
      }

      if (oldValue instanceof Events) {
        this.stopListening(oldValue)
      }
      this[key] = value
      this.updateRef()
    },
    configurable: true,
    enumerable: true,
  }
  if (!isLegacy) {
    const { kind, placement, descriptor, initializer } =
      optionsOrProtoOrDescriptor
    return {
      kind,
      placement,
      initializer,
      descriptor,
      key,
      finisher(ctor) {
        Object.defineProperty(ctor.prototype, name, fieldDescriptor)
      },
    }
  }
  return fieldDescriptor
}

export { FireCollection, FireModel, refSource }
