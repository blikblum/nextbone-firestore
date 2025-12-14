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

/**
 * @import {Firestore, DocumentReference, CollectionReference, Query, FirestoreDataConverter} from 'firebase/firestore'
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

/**
 * @param {Record<string, any>} params
 * @param {ObservableModel} instance
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

class ObservableModel extends FireModel {
  constructor(attributes, options) {
    super(attributes, options)
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

    const ref = this.getQuery()
    if (!ref) {
      return
    }

    this.changeLoading(true)
    this._unsubscribe = onSnapshot(ref, (snapshot) => {
      const docSnapshot =
        ref.type === 'document' ? snapshot : this.selectSnapshot(snapshot)
      if (!docSnapshot) {
        this.clear()
        return
      }
      if (docSnapshot.exists()) {
        this.set({ id: docSnapshot.id, ...docSnapshot.data() }, { reset: true })
      } else {
        this.clear()
      }
      this.changeLoading(false)
    })
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
      this.changeRef(this.getQuery())
      this.queryPromise = undefined
    }
    return this._ref
  }

  /**
   * @param {DocumentReference | Query} newRef
   * @returns
   */
  changeRef(newRef) {
    if (!this._ref && !newRef) {
      return
    }
    if (this._ref && newRef && queryEqual(this._ref, newRef)) {
      return
    }

    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = undefined
    }

    if (newRef) {
      this.changeLoading(true)
      this._unsubscribe = onSnapshot(newRef, (snapshot) => {
        const docSnapshot =
          newRef.type === 'document' ? snapshot : this.selectSnapshot(snapshot)
        if (!docSnapshot) {
          this.clear()
          return
        }

        if (docSnapshot.exists()) {
          this.set(
            { id: docSnapshot.id, ...docSnapshot.data() },
            { reset: true }
          )
        } else {
          this.clear()
        }
        this.changeLoading(false)
      })
    } else {
      this.clear()
      this.changeLoading(false)
    }
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
