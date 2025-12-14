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
 * @import {Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter, QuerySnapshot, DocumentSnapshot, FirestoreError} from 'firebase/firestore'
 */

/**
 * @param {FireModel} model
 * @param {string} method
 * @returns {DocumentReference | undefined}
 */
const getDocRef = (model, method) => {
  if (method === 'create') {
    const refRoot = model.refRoot()
    return refRoot ? doc(refRoot) : undefined
  }
  return model.ref()
}

class FireModel extends Model {
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

  /**
   * @return {Promise<void> | undefined}
   */
  beforeSync() {
    // to be overriden
  }

  /**
   * @returns {CollectionReference | undefined}
   */
  refRoot() {
    if (this.collection) {
      this.collection.ensureQuery()
      return this.collection.getRef()
    }
  }

  /**
   * @returns {DocumentReference | CollectionReference | undefined}
   */
  ref() {
    const refRoot = this.refRoot()
    if (refRoot && !this.isNew()) {
      return doc(refRoot, this.id)
    }
    return refRoot
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

class ObservableModel extends FireModel {
  constructor(attributes, options) {
    super(attributes, options)
    /**
     * @type { Query | DocumentReference | undefined}
     */
    this._query = undefined
    this._params = {}
    this._paramsProxy = createParamsProxy(this._params, this)
    this._unsubscribe = undefined
    this.readyPromise = Promise.resolve()
    this.queryPromise = undefined
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

  observe() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = undefined
    }

    const query = this.getQuery()
    if (!query) {
      return
    }

    this.changeLoading(true)
    this._unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        this.handleSnapshot(snapshot)
      },
      (err) => {
        this.handleSnapshotError(err)
      }
    )
  }

  /**
   * @param {QuerySnapshot} snapshot
   * @returns {DocumentSnapshot | undefined}
   */
  selectSnapshot(snapshot) {
    return snapshot.docs[0]
  }

  /**
   * @param {DocumentReference} ref
   * @param {Record<string, any>} params
   * @returns {Query | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  query(ref, params) {}

  /**
   * @param {Record<string, any>} params
   * @returns {string | undefined}
   */
  // eslint-disable-next-line no-unused-vars
  rootPath(params) {}

  /**
   * @returns {Query | undefined}
   */
  getQuery() {
    const params = this._params
    const path = this.rootPath(params)
    if (!path) {
      return undefined
    }

    /**
     * @type {{db: Firestore, converter: FirestoreDataConverter}}
     */
    const { db, converter } = this.constructor
    const rootRef = collection(db, path).withConverter(converter)

    if (!params.id) {
      return this.query(rootRef, params)
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
    if (!this._query && !newQuery) {
      return
    }
    if (this._query && newQuery && queryEqual(this._query, newQuery)) {
      return
    }

    this._query = newQuery

    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = undefined
    }

    if (newQuery) {
      this.changeLoading(true)
      this._unsubscribe = onSnapshot(
        newQuery,
        (snapshot) => {
          this.handleSnapshot(snapshot)
        },
        (err) => {
          this.handleSnapshotError(err)
        }
      )
    } else {
      this.changeLoading(false)
      this.clear()
      this.trigger('load', this)
    }
    this.trigger('request', this)
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
