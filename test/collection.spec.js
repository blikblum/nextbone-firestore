import { FireCollection } from '../src/collection'
import {
  FirestoreMock,
  CollectionReferenceMock,
  DocReferenceMock,
  DocSnapshotMock,
  QuerySnapshotMock,
} from './utils'
import { expect } from 'chai'
import { spy, stub } from 'sinon'

describe('FireCollection', () => {
  let db

  beforeEach(() => {
    db = new FirestoreMock()
  })

  describe('ref', () => {
    it('should return undefined by default', () => {
      const model = new FireCollection()
      expect(model.ref()).to.be.undefined
    })

    it('should return the declared ref', () => {
      class TestCollection extends FireCollection {
        ref() {
          return db.collection('collectionPath')
        }
      }
      const collection = new TestCollection()
      const ref = collection.ref()
      expect(ref).to.be.instanceOf(CollectionReferenceMock)
      expect(ref.path).to.equal('collectionPath')
    })
  })

  describe('sync', () => {
    it('should call ref get when fetching a collection', async () => {
      const collectionRef = db.collection('myCollection')
      const getStub = stub().resolves(
        new QuerySnapshotMock([
          { id: 'x', foo: 'bar' },
          { id: 'y', foo: 'foo' },
        ])
      )
      collectionRef.get = getStub
      class TestCollection extends FireCollection {
        ref() {
          return collectionRef
        }
      }
      const collection = new TestCollection()
      await collection.fetch()
      expect(getStub).to.be.calledOnce
      expect(collection.get('x').attributes).to.be.eql({ id: 'x', foo: 'bar' })
      expect(collection.get('y').attributes).to.be.eql({ id: 'y', foo: 'foo' })
    })
  })
})
