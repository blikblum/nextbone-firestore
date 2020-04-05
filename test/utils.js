export class RefMock {
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

export class CollectionMock extends RefMock {
  doc(id) {
    return new DocMock(this, id)
  }
}

export class DocMock extends RefMock {
  collection(id) {
    return new CollectionMock(this, id)
  }
}

export class FirestoreMock {
  constructor() {
    this.path = ''
  }

  doc(id) {
    return new DocMock(this, id)
  }

  collection(id) {
    return new CollectionMock(this, id)
  }
}
