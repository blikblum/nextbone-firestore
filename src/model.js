import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Model } from 'nextbone'

/**
 * @param {Model} model
 * @param {string} method
 * @returns
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
      this.collection.ensureRef()
      return this.collection.getPathRef()
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

export { FireModel }
