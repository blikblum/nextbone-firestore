import { FireModel } from '../src/model'
import { FirestoreMock, CollectionMock, DocMock } from './utils'
import { expect } from 'chai'

describe('FireModel', () => {
  let db

  beforeEach(() => {
    db = new FirestoreMock()
  })

  describe('ref', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.ref()).to.be.undefined
    })

    it('should return its collection ref when is new', () => {
      const model = new FireModel()
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.ref()
      expect(ref).to.be.instanceOf(CollectionMock)
      expect(ref.path).to.equal('mycollection')
    })

    it('should return a doc ref children of its collection ref when is not new', () => {
      const model = new FireModel({ id: 'xyz' })
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.ref()
      expect(ref).to.be.instanceOf(DocMock)
      expect(ref.path).to.be.equal('mycollection/xyz')
    })
  })
})
