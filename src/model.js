import { Model } from 'nextbone'

class FireModel extends Model {
  ref() {
    let result
    if (this.collection) {
      result = this.collection.ref()
      if (result && !this.isNew()) {
        result = result.doc(this.id)
      }
    }
    return result
  }

  async sync(method, options) {
    const ref = this.ref()

    if (!ref) {
      throw new Error(`FireModel: ref not defined`)
    }
    const { id, ...modelData } = this.toJSON(options)
    const data = options.attrs || modelData
    const isOnline = navigator.onLine
    let response
    switch (method) {
      case 'update':
        if (isOnline) {
          await ref.set(data)
        } else {
          ref.set(data)
        }

        break
      case 'patch':
        if (isOnline) {
          await ref.update(data)
        } else {
          ref.update(data)
        }
        break
      case 'create':
        let docRef
        if (isOnline) {
          docRef = await ref.add(data)
        } else {
          docRef = ref.doc()
          docRef.set(data)
        }
        response = { ...docRef.data(), id: docRef.id }
        break
      case 'delete':
        await ref.delete()
        break
      default:
        throw new Error(`FireModel: unrecognized sync method: "${method}"`)
    }
    return response || modelData
  }
}

export { FireModel }
