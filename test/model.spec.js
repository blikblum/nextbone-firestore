import { expect } from 'chai'
import { spy, stub } from 'sinon'
import { FireModel } from '../src/model'
import {
  initializeDataset,
  clearDataset,
  collectionName,
  collectionData,
} from './helpers/dataset'
import { db, CollectionReference, DocumentReference } from './helpers/firebase'

describe('FireModel', () => {
  describe('refRoot', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.refRoot()).to.be.undefined
    })

    it('should return the declared ref', () => {
      class TestModel extends FireModel {
        refRoot() {
          return db.collection('collectionPath').doc('modelId')
        }
      }
      const model = new TestModel()
      const ref = model.refRoot()
      expect(ref).to.be.instanceOf(DocumentReference)
      expect(ref.path).to.equal('collectionPath/modelId')
    })

    it('should return its collection ref', () => {
      const model = new FireModel()
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.refRoot()
      expect(ref).to.be.instanceOf(CollectionReference)
      expect(ref.path).to.equal('mycollection')
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
          return db.collection('collectionPath')
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
          return db.collection('collectionPath').doc('modelId')
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
          return db.collection('collectionPath')
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

    it('should call refRoot.get when fetching a model', async () => {
      const docRef = db.collection(collectionName).doc('1')
      const getSpy = spy(docRef, 'get')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel()
      await model.fetch()
      expect(getSpy).to.be.calledOnce
      expect(model.attributes).to.be.eql({ id: '1', ...collectionData[0] })
    })

    it('should create a doc ref and call its set with when saving new model', async () => {
      const collectionRef = db.collection('myCollection1')
      const docRef = collectionRef.doc()
      const docStub = stub(collectionRef, 'doc')
      const setSpy = spy(docRef, 'set')
      docStub.returns(docRef)

      class TestModel extends FireModel {
        refRoot() {
          return collectionRef
        }
      }
      const model = new TestModel({ foo: 'bar', test: 'a' })
      await model.save()
      const snapshot = await collectionRef.get()
      expect(docStub).to.be.calledOnce
      expect(setSpy).to.be.calledOnceWithExactly({ foo: 'bar', test: 'a' })
      expect(model.attributes).to.be.eql({
        id: docRef.id,
        foo: 'bar',
        test: 'a',
      })
      expect(snapshot.docs[0].data()).to.eql({ foo: 'bar', test: 'a' })
    })

    it('should call ref.set with merged attributes when saving existing model', async () => {
      const docRef = db.collection('myCollection2').doc('x')
      const setSpy = spy(docRef, 'set')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' })
      const snapshot = await docRef.get()

      expect(setSpy).to.be.calledOnceWithExactly({
        foo: 'y',
        test: 'a',
      })
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

    it('should call ref.update with passed attrs when saving existing model with patch', async () => {
      const docRef = db.collection('myCollection3').doc('x')
      const updateSpy = spy(docRef, 'update')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' }, { patch: true })
      const snapshot = await docRef.get()
      expect(updateSpy).to.be.calledOnceWithExactly({ foo: 'y' })
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

    it('should call ref.delete when destroying a model', async () => {
      const docRef = db.collection('myCollection4').doc('x')
      const deleteSpy = spy(docRef, 'delete')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: 'a' })
      let snapshot = await docRef.get()
      expect(snapshot.exists).to.be.true
      await model.destroy()
      snapshot = await docRef.get()
      expect(deleteSpy).to.be.calledOnce
      expect(snapshot.exists).to.be.false
    })
  })
})
