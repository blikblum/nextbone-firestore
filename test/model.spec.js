import { FireCollection } from '../src/collection'
import { FireModel } from '../src/model'
import { FirestoreMock, CollectionMock, DocMock } from './utils'

describe('FireModel', () => {
  let db

  beforeEach(() => {
    db = new FirestoreMock()
  })

  describe('ref', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.ref()).toBe(undefined)
    })

    it('should return its collection ref when is new', () => {
      const model = new FireModel()
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.ref()
      expect(ref).toBeInstanceOf(CollectionMock)
      expect(ref.path).toBe('mycollection')
    })

    it('should return a doc ref children of its collection ref when is not new', () => {
      const model = new FireModel({ id: 'xyz' })
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.ref()
      expect(ref).toBeInstanceOf(DocMock)
      expect(ref.path).toBe('mycollection/xyz')
    })
  })
})
