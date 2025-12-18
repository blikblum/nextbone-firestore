import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
  onSnapshot,
  collection,
  queryEqual,
} from 'firebase/firestore'
import { Model } from 'nextbone'
import { createParamsProxy } from './helpers.js'

/**
 * @import { ModelSetOptions, Model } from 'nextbone'
 * @import {Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter, QuerySnapshot, DocumentSnapshot, FirestoreError} from 'firebase/firestore'
 */

/**
 * @param {FireModel} model
 * @param {string} method
 * @returns {DocumentReference | undefined}
 */
const getDocRef = (model, method) => {
  if (method === 'create') {
    const collectionRef = model.collectionRef()
    return collectionRef ? doc(collectionRef) : undefined
  }
  return model.ref()
}

class FireModel extends Model {
  /**
   * @return {Promise<void> | undefined}
   */
  beforeSync() {
    // to be overriden
  }

  /**
   * @returns {CollectionReference | undefined}
   */
  collectionRef() {
    if (this.collection) {
      this.collection.ensureQuery()
      return this.collection.getRef()
    }
  }

  /**
   * @returns {DocumentReference | CollectionReference | undefined}
   */
  ref() {
    const collectionRef = this.collectionRef()
    if (collectionRef && !this.isNew()) {
      return doc(collectionRef, this.id)
    }
    return collectionRef
  }

  /**
   * @param {string} method
   * @param {*} options
   * @returns
   */
  async sync(method, options) {
    const docRef = getDocRef(this, method)

    if (!docRef) {
      throw new Error(`FireModel: ref not defined`)
    }
    await this.beforeSync()
    // eslint-disable-next-line no-unused-vars
    const { id, ...modelData } = this.toJSON(options)
    const data = options.attrs || modelData
    let action
    let response = modelData
    switch (method) {
      case 'read': {
        const snapshot = await getDoc(docRef)
        response = { ...snapshot.data(), id: docRef.id }
        break
      }
      case 'create':
      case 'update':
        action = setDoc(docRef, data, { merge: options.merge })
        break
      case 'patch':
        action = updateDoc(docRef, data)
        break
      case 'delete':
        action = deleteDoc(docRef)
        break
      default:
        throw new Error(`FireModel: unrecognized sync method: "${method}"`)
    }
    if (action) {
      await action
    }
    if (method === 'create') {
      response = { ...modelData, id: docRef.id }
    }
    return response
  }
}

/**
 * NextBone model synchronized with a Firestore document.
 * @template {Record<string, any>} [TAttributes=Record<string, any>]
 * @template {Record<string, any>} [Params=Record<string, any>]
 * @extends {FireModel<TAttributes, ModelSetOptions, any>}
 */
class ObservableModel extends FireModel {
  /**
   * @returns {Firestore}
   */
  static get db() {
    if (!this._db) {
      const dbFactory = this.getFirestore || getFirestore
      this._db = dbFactory()
    }
    return this._db
  }

  /**
   * @type {() => Firestore}
   */
  static getFirestore

  /**
   * @type {FirestoreDataConverter}
   */
  static converter

  constructor(attributes, options) {
    super(attributes, options)
    /**
     * @type { Query | DocumentReference | undefined}
     */
    this._query = undefined
    /** @type {Params} */
    this._params = {}
    /** @type {Params} */
    this._paramsProxy = createParamsProxy(this._params, this)
    this._unsubscribe = undefined
    this.readyPromise = Promise.resolve()
    this.queryPromise = undefined
    this.observedCount = 0
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
    this.updateQuery()
  }

  get isObserved() {
    return this.observedCount > 0
  }

  observe() {
    this.observedCount++
    if (this.observedCount === 1) {
      this.updateListeners(true)
    }
  }

  unobserve() {
    if (this.observedCount > 0) {
      this.observedCount--
      if (this.observedCount === 0) {
        this.updateListeners(false)
      }
    }
  }

  /**
   * @param {QuerySnapshot} snapshot
   * @returns {DocumentSnapshot | undefined}
   */
  selectSnapshot(snapshot) {
    return snapshot.docs[0]
  }

  /**
   * Optionally apply query constraints to a path ref and return a Query.
   * Override in subclasses.
   * @param {DocumentReference} ref
   * @param {Params} [params]
   * @returns {Query | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  query(ref, params) {}

  /**
   * Should return the path for this collection.
   * Override in subclasses.
   * @param {Params} [params]
   * @returns {string | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  collectionPath(params) {}

  /**
   * @returns {Query | undefined}
   */
  getQuery() {
    const params = this._params
    const path = this.collectionPath(params)
    if (!path) {
      return undefined
    }

    /**
     * @type {{db: Firestore, converter: FirestoreDataConverter}}
     */
    const { db, converter } = this.constructor
    const rootRef = collection(db, path).withConverter(converter)

    if (!params.id) {
      const queryResult = this.query(rootRef, params)
      if (!queryResult) {
        throw new Error(
          `FireModel: query() must return a Query when no id param is provided`
        )
      }

      return queryResult
    }

    return doc(rootRef, params.id)
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

  /**
   * @param {DocumentReference | Query} newQuery
   * @returns
   */
  changeSource(newQuery) {
    const { _query, isObserved } = this
    if (!_query && !newQuery) {
      return
    }
    if (_query && newQuery && queryEqual(_query, newQuery)) {
      return
    }

    this._query = newQuery

    if (newQuery) {
      if (isObserved) {
        this.updateListeners(true)
      }
    } else {
      if (isObserved) {
        this.updateListeners(false)
      }
      this.changeLoading(false)
      this.clear()
      this.trigger('load', this)
    }
    this.trigger('request', this)
  }

  /**
   * @param {boolean} shouldListen
   */
  updateListeners(shouldListen) {
    const { _unsubscribe } = this

    if (_unsubscribe) {
      _unsubscribe()
      this._unsubscribe = undefined
    }

    if (shouldListen) {
      this.changeLoading(true)
      if (this._query) {
        this._unsubscribe = onSnapshot(
          this._query,
          (snapshot) => {
            this.handleSnapshot(snapshot)
          },
          (err) => {
            this.handleSnapshotError(err)
          }
        )
      }
    }
  }

  /**
   * @param {QuerySnapshot | DocumentSnapshot} snapshot
   * @returns
   */
  handleSnapshot(snapshot) {
    this.changeLoading(false)
    const docSnapshot =
      this._query.type === 'document' ? snapshot : this.selectSnapshot(snapshot)
    if (!docSnapshot) {
      this.clear()
      return
    }

    if (docSnapshot.exists()) {
      this.set({ id: docSnapshot.id, ...docSnapshot.data() }, { reset: true })
    } else {
      this.clear()
    }
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

  changeLoading(isLoading) {
    if (this.isLoading === isLoading) {
      return
    }
    this.changeReady(!isLoading)
    this.isLoading = isLoading
  }

  async ready() {
    if (this.queryPromise) {
      await this.queryPromise
    }

    return this.readyPromise
  }
}

export { FireModel, ObservableModel }
