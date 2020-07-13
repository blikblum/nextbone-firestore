import { Collection, Events } from 'nextbone'
import { uniqueId } from 'lodash-es'

import { FireModel } from './model'

const optionDefaults = {
  serverTimestamps: 'estimate',
  debug: false,
}
function hasReference(ref) {
  return !!ref
}

class FireCollection extends Collection {
  static decorator(instance) {
    //hack to fix decorator limitation
    //works only when using next-service
    instance._applyRefSources()
    return instance
  }

  constructor(options) {
    super()
    this.isDebugEnabled = false
    this.readyPromise = Promise.resolve()
    this.resetPromise = undefined
    this.options = optionDefaults
    this.observedCount = 0
    this.firedInitialFetch = false
    this._id = uniqueId('c')
    this.logDebug('FireCollection constructor')
    if (options) {
      this.options = Object.assign(Object.assign({}, optionDefaults), options)
      this.isDebugEnabled = options.debug || false
    }
  }

  _applyRefSources() {
    const refSources = this.constructor.__refSources
    if (refSources) {
      refSources.forEach((name) => {
        if (this.hasOwnProperty(name)) {
          // eslint-disable-line
          const value = this[name]
          delete this[name]
          this[name] = value
        }
      })
    }
  }

  get isObserved() {
    return this.observedCount > 0
  }
  get path() {
    return this._ref ? this._ref.path : undefined
  }

  ref() {
    // to be overriden
  }

  query(ref) {
    return ref
  }

  getRef() {
    return this.query(this.ref())
  }

  ensureRef() {
    if (!this._ref) {
      this._ref = this.getRef()
    }
    return this._ref
  }

  resetRef(sync) {
    if (sync) {
      this.changeSource(this.getRef())
    } else {
      if (!this.resetPromise) {
        // by default batch reset calls
        this.resetPromise = Promise.resolve()
        this.resetPromise.then(() => {
          this.changeSource(this.getRef())
          this.resetPromise = undefined
        })
      }
    }
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
      this.reset([])
      this.changeLoadingState(false)
    }
    this.trigger('request')
  }
  async add(data) {
    // todo add a separated cache for ref (necessary when query is defined)
    const ref = this.ref()
    if (!hasReference(ref)) {
      throw new Error(`Can not add a document to a collection that has no ref`)
    }
    if (navigator.onLine) {
      await ref.add(data)
    } else {
      ref.add(data)
    }
  }
  ready(shouldListen) {
    const isListening = !!this.onSnapshotUnsubscribeFn
    this.ensureRef()
    if (!isListening) {
      /**
       * If the client is calling ready() but document is not being observed /
       * no listeners are set up, we treat ready() as a one time fetch request,
       * so data is available after awaiting the promise.
       */
      if (shouldListen) {
        this.observedCount++
        this.changeLoadingState(true)
        this.updateListeners(true)
        this.trigger('request')
      } else {
        this.fetchInitialData()
      }
    }
    return this.readyPromise
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
      throw Error('Can not fetch data without a collection reference')
    }
    this.logDebug('Fetch initial data')
    /**
     * Simply pass the snapshot from the promise to the handler function which
     * will then resolve the ready promise just like the snapshot from a
     * listener would.
     */
    this.changeLoadingState(true)
    this.trigger('request')
    if (this._query) {
      this._query
        .get()
        .then((snapshot) => this.handleSnapshot(snapshot))
        .catch((err) =>
          console.error(`Fetch initial data failed: ${err.message}`)
        )
    } else {
      this._ref
        .get()
        .then((snapshot) => this.handleSnapshot(snapshot))
        .catch((err) =>
          console.error(`Fetch initial data failed: ${err.message}`)
        )
    }
    this.firedInitialFetch = true
  }
  parse(data) {
    return data
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
    this.set(this.parse(data))
    this.changeLoadingState(false)
    this.trigger('sync')
  }

  handleSnapshotError(err) {
    this.trigger('sync')
    throw new Error(`${this.path} snapshot error: ${err.message}`)
  }

  logDebug(message) {
    if (this.isDebugEnabled) {
      if (this._ref) {
        console.log(`${this._id} (${this._ref.path}) ${message} `)
      } else {
        console.log(`${this._id} ${message}`)
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
      if (this._query) {
        this.onSnapshotUnsubscribeFn = this._query.onSnapshot(
          (snapshot) => this.handleSnapshot(snapshot),
          (err) => this.handleSnapshotError(err)
        )
      } else if (this._ref) {
        this.onSnapshotUnsubscribeFn = this._ref.onSnapshot(
          (snapshot) => this.handleSnapshot(snapshot),
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
        this.listenTo(value, events, this.resetRef)
      }

      if (oldValue instanceof Events) {
        this.stopListening(oldValue)
      }
      this[key] = value
      this.resetRef()
    },
    configurable: true,
    enumerable: true,
  }
  if (!isLegacy) {
    const {
      kind,
      key,
      placement,
      descriptor,
      initializer,
    } = optionsOrProtoOrDescriptor
    return {
      kind,
      placement,
      initializer,
      descriptor,
      key,
      finisher(ctor) {
        const refSources = ctor.__refSources || (ctor.__refSources = new Set())
        refSources.add(name)
        Object.defineProperty(ctor.prototype, name, fieldDescriptor)
      },
    }
  }
  return fieldDescriptor
}

export { FireCollection, FireModel, refSource }
