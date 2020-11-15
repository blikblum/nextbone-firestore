import { expect } from 'chai'
import { spy, stub } from 'sinon'
import { FireCollection } from '../src/collection'
import {
  initializeDataset,
  clearDataset,
  collectionName,
  collectionData,
} from './helpers/dataset'
import {
  db,
  CollectionReference,
  createCollectionRef,
  Query,
} from './helpers/firebase'

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

  describe('resetRef', () => {
    it('should call ref and return its result', async () => {
      class TestCollection extends FireCollection {
        ref() {
          return db.collection('collectionPath')
        }
      }
      const collection = new TestCollection()
      const refSpy = spy(collection, 'ref')
      const ref = await collection.resetRef()
      expect(ref.path).to.equal('collectionPath')
      expect(refSpy).to.be.calledOnce
    })

    it('should call query with return from ref', async () => {
      const ref = db.collection('collectionPath')
      class TestCollection extends FireCollection {
        query(ref) {
          return ref.orderBy('name')
        }
      }
      const collection = new TestCollection()
      stub(collection, 'ref').returns(ref)
      const querySpy = spy(collection, 'query')
      const resolvedRef = await collection.resetRef()
      expect(querySpy).to.be.calledOnce.and.be.calledWith(ref)
      expect(resolvedRef).to.be.instanceOf(Query)
    })

    it('should not call query when ref returns undefined', async () => {
      class TestCollection extends FireCollection {
        query(ref) {
          return ref.orderBy('name')
        }
      }
      const collection = new TestCollection()
      const querySpy = spy(collection, 'query')
      await collection.resetRef()
      expect(querySpy).to.not.be.called
    })

    it('should call ref only once when called in same microtask', async () => {
      class TestCollection extends FireCollection {
        ref() {
          return db.collection('collectionPath')
        }
      }
      const collection = new TestCollection()
      const refSpy = spy(collection, 'ref')
      collection.resetRef()
      await collection.resetRef()
      expect(refSpy).to.be.calledOnce
    })
  })

  describe('observe', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should start observing for changes in collection', async () => {
      const ref = createCollectionRef()
      class TestCollection extends FireCollection {
        ref() {
          return ref
        }
      }

      const collection = new TestCollection()
      collection.observe()
      expect(collection.isObserved).to.be.equal(true)
      ref.add({ x: 'y' })
      return new Promise((resolve) => {
        collection.once('add', (model) => {
          expect(model.get('x')).to.equal('y')
          expect(collection.length).to.be.equal(1)
          collection.unobserve()
          resolve()
        })
      })
    })
  })

  describe('unobserve', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should stop observing for changes in collection', async () => {
      let callCount = 0
      const ref = createCollectionRef()
      class TestCollection extends FireCollection {
        ref() {
          return ref
        }
      }

      const collection = new TestCollection()
      collection.observe()
      ref.add({ x: 'y' })
      return new Promise((resolve) => {
        collection.on('add', () => {
          callCount++
          if (callCount > 1) {
            throw new Error('add event should not be called after unobserve')
          } else {
            collection.unobserve()
            expect(collection.isObserved).to.be.equal(false)
            ref.add({ a: 'b' }).then(() => {
              setTimeout(resolve, 100)
            })
          }
        })
      })
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

  describe('addDocument', () => {
    it('should add a new document', async () => {
      const collectionRef = createCollectionRef()
      const addSpy = spy(collectionRef, 'add')
      class TestCollection extends FireCollection {
        ref() {
          return collectionRef
        }
      }
      const collection = new TestCollection()

      await collection.addDocument({ foo: 'bar' })
      const snapshot = await collectionRef.get()
      expect(addSpy).to.be.calledOnce
      expect(snapshot.docs.length).to.be.equal(1)
      expect(snapshot.docs[0].data()).to.be.eql({ foo: 'bar' })
    })
  })
})
