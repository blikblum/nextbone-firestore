import { expect } from 'chai'
import sinon from 'sinon'
import { FireModel } from '../src/model.js'
import { FireCollection } from '../src/collection.js'
import {
  initializeDataset,
  clearDataset,
  collectionName,
  collectionData,
} from './helpers/dataset.js'
import { getDb } from './helpers/firebase.js'

import {
  doc,
  collection,
  getDoc,
  getDocs,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore'

const { spy } = sinon

describe('FireModel', () => {
  let db

  before(async () => {
    db = await getDb()
  })

  describe('refRoot', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.refRoot()).to.be.undefined
    })

    it('should return the declared ref', () => {
      class TestModel extends FireModel {
        refRoot() {
          return doc(db, 'collectionPath/modelId')
        }
      }
      const model = new TestModel()
      const ref = model.refRoot()
      expect(ref).to.be.instanceOf(DocumentReference)
      expect(ref.path).to.equal('collectionPath/modelId')
    })

    it('should return its collection ref', () => {
      const model = new FireModel()
      model.collection = new FireCollection()
      sinon
        .stub(model.collection, 'ref')
        .callsFake(() => collection(db, 'mycollection'))
      const ref = model.refRoot()
      expect(ref).to.be.instanceOf(CollectionReference)
      expect(ref.path).to.equal('mycollection')
    })

    it('should call collection ref only once', () => {
      const model = new FireModel()
      model.collection = new FireCollection()
      sinon
        .stub(model.collection, 'ref')
        .callsFake(() => collection(db, 'mycollection'))
      model.refRoot()
      expect(model.collection.ref).to.be.calledOnce
      model.refRoot()
      expect(model.collection.ref).to.be.calledOnce
    })
  })

  describe('ref', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.ref()).to.be.undefined
    })

    it('should return refRoot if declared', () => {
      class TestModel extends FireModel {
        refRoot() {
          return collection(db, 'collectionPath')
        }
      }
      const model = new TestModel()
      const ref = model.ref()
      expect(ref).to.be.instanceOf(CollectionReference)
      expect(ref.path).to.equal('collectionPath')
    })

    it('should return the declared ref', () => {
      class TestModel extends FireModel {
        ref() {
          return doc(db, 'collectionPath/modelId')
        }
      }
      const model = new TestModel()
      const ref = model.ref()
      expect(ref).to.be.instanceOf(DocumentReference)
      expect(ref.path).to.equal('collectionPath/modelId')
    })

    it('should return a doc ref children of refRoot when is not new', () => {
      class TestModel extends FireModel {
        refRoot() {
          return collection(db, 'collectionPath')
        }
      }
      const model = new TestModel({ id: 'xyz' })
      const ref = model.ref()
      expect(ref).to.be.instanceOf(DocumentReference)
      expect(ref.path).to.be.equal('collectionPath/xyz')
    })
  })

  describe('sync', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should fetch a model using a doc ref', async () => {
      class TestModel extends FireModel {
        ref() {
          return doc(db, `${collectionName}/1`)
        }
      }
      const model = new TestModel()
      await model.fetch()
      expect(model.attributes).to.be.eql({ id: '1', ...collectionData[0] })
    })

    it('should create a doc when saving new model', async () => {
      const collectionRef = collection(db, 'myCollection1')

      class TestModel extends FireModel {
        refRoot() {
          return collectionRef
        }
      }
      const model = new TestModel({ foo: 'bar', test: 'a' })
      await model.save()
      const snapshot = await getDocs(collectionRef)
      const firstDoc = snapshot.docs[0]
      expect(model.attributes).to.be.eql({
        id: firstDoc.id,
        foo: 'bar',
        test: 'a',
      })
      expect(firstDoc.data()).to.eql({ foo: 'bar', test: 'a' })
    })

    it('should use merged attributes when saving existing model', async () => {
      const docRef = doc(db, 'myCollection2', 'x')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' })
      const snapshot = await getDoc(docRef)

      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
      expect(snapshot.data()).to.be.eql({
        foo: 'y',
        test: 'a',
      })
    })

    it('should update doc with passed attrs when saving existing model with patch', async () => {
      const docRef = doc(db, 'myCollection3', 'x')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' }, { patch: true })
      const snapshot = await getDoc(docRef)
      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
      expect(snapshot.data()).to.be.eql({
        foo: 'y',
        test: 'a',
      })
    })

    it('should delete doc when destroying a model', async () => {
      const docRef = doc(db, 'myCollection4', 'x')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: 'a' })
      let snapshot = await getDoc(docRef)
      expect(snapshot.exists()).to.be.true
      await model.destroy()
      snapshot = await getDoc(docRef)
      expect(snapshot.exists()).to.be.false
    })
  })

  describe('beforeSync', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should be called before parse when calling fetch', async () => {
      const beforeSyncSpy = spy()
      const parseSpy = spy()
      class TestModel extends FireModel {
        ref() {
          return doc(db, collectionName, '1')
        }

        async beforeSync() {
          await new Promise((resolve) => {
            setTimeout(resolve, 50)
          })
          beforeSyncSpy()
        }

        parse() {
          parseSpy()
        }
      }
      const model = new TestModel()
      await model.fetch()

      expect(beforeSyncSpy).to.be.calledOnce
      expect(parseSpy).to.be.calledOnce
      expect(beforeSyncSpy).to.be.calledBefore(parseSpy)
    })
  })
})
