import { Model } from 'nextbone'

const isOnline = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return false
}

const getDocRef = (model, method) => {
  if (method === 'create') {
    const refRoot = model.refRoot()
    return refRoot ? refRoot.doc() : undefined
  }
  return model.ref()
}

class FireModel extends Model {
  refRoot() {
    if (this.collection) {
      return this.collection.ref()
    }
  }

  ref() {
    const refRoot = this.refRoot()
    if (refRoot && !this.isNew()) {
      return refRoot.doc(this.id)
    }
    return refRoot
  }

  async sync(method, options) {
    const docRef = getDocRef(this, method)

    if (!docRef) {
      throw new Error(`FireModel: ref not defined`)
    }
    const { id, ...modelData } = this.toJSON(options)
    const data = options.attrs || modelData
    let action
    switch (method) {
      case 'create':
      case 'update':
        action = docRef.set(data)
        break
      case 'patch':
        action = docRef.update(data)
        break
      case 'delete':
        action = docRef.delete()
        break
      default:
        throw new Error(`FireModel: unrecognized sync method: "${method}"`)
    }
    if (isOnline()) {
      await action
    }
    if (method === 'create') {
      return { ...modelData, id: docRef.id }
    }
    return modelData
  }
}

export { FireModel }
