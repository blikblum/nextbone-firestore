export class ReferenceMock {
  constructor(parent, id) {
    this.parent = parent
    this.id = id
  }

  get path() {
    const parentPath = this.parent.path
    return parentPath ? `${parentPath}/${this.id}` : this.id
  }

  collection() {
    throw new Error('Abstract method call')
  }

  doc() {
    throw new Error('Abstract method call')
  }
}

export class CollectionReferenceMock extends ReferenceMock {
  doc(id) {
    return new DocReferenceMock(this, id)
  }
}

export class DocReferenceMock extends ReferenceMock {
  collection(id) {
    return new CollectionReferenceMock(this, id)
  }

  set(data) {
    this._data = data
  }
}

export class FirestoreMock {
  constructor() {
    this.path = ''
  }

  doc(id) {
    return new DocReferenceMock(this, id)
  }

  collection(id) {
    return new CollectionReferenceMock(this, id)
  }
}
