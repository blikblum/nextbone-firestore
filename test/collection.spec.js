import { expect } from 'chai'
import { spy } from 'sinon'
import { FireCollection } from '../src/collection'
import {
  initializeDataset,
  clearDataset,
  collectionName,
  collectionData,
} from './helpers/dataset'
import { db, CollectionReference } from './helpers/firebase'

describe('FireCollection', () => {
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
      expect(ref).to.be.instanceOf(CollectionReference)
      expect(ref.path).to.equal('collectionPath')
    })
  })

  describe('sync', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should call ref get when fetching a collection', async () => {
      const collectionRef = db.collection(collectionName).orderBy('count')
      const getSpy = spy(collectionRef, 'get')
      class TestCollection extends FireCollection {
        ref() {
          return collectionRef
        }
      }
      const collection = new TestCollection()
      await collection.fetch()
      const responseData = collection.map((model) => model.omit('id'))

      expect(getSpy).to.be.calledOnce
      expect(responseData).to.be.eql(collectionData)
    })
  })
})
