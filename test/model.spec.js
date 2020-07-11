import { FireModel } from '../src/model'
import {
  FirestoreMock,
  CollectionReferenceMock,
  DocReferenceMock,
} from './utils'
import { expect } from 'chai'
import { spy, stub } from 'sinon'

describe('FireModel', () => {
  let db

  beforeEach(() => {
    db = new FirestoreMock()
  })

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
      expect(ref).to.be.instanceOf(DocReferenceMock)
      expect(ref.path).to.equal('collectionPath/modelId')
    })

    it('should return its collection ref', () => {
      const model = new FireModel()
      model.collection = { ref: () => db.collection('mycollection') }
      const ref = model.refRoot()
      expect(ref).to.be.instanceOf(CollectionReferenceMock)
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
      expect(ref).to.be.instanceOf(CollectionReferenceMock)
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
      expect(ref).to.be.instanceOf(DocReferenceMock)
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
      expect(ref).to.be.instanceOf(DocReferenceMock)
      expect(ref.path).to.be.equal('collectionPath/xyz')
    })
  })

  describe('sync', () => {
    it('should call ref.get when destroying a model', async () => {
      const getStub = stub()
      getStub.resolves({})
      class TestModel extends FireModel {
        ref() {
          return { delete: getStub }
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.destroy()
      expect(getStub).to.be.calledOnce
    })

    it('should create a doc ref and call its set with when saving new model', async () => {
      const docRef = new DocReferenceMock(null, 'xyz')
      const collectionRef = db.collection('myCollection')
      const setSpy = spy(docRef, 'set')
      class TestModel extends FireModel {
        refRoot() {
          return {
            doc() {
              return docRef
            },
          }
        }
      }
      const model = new TestModel({ foo: 'bar', test: 'a' })
      await model.save()
      expect(setSpy).to.be.calledOnceWithExactly({ foo: 'bar', test: 'a' })
      expect(model.attributes).to.be.eql({
        id: 'xyz',
        foo: 'bar',
        test: 'a',
      })
    })

    it('should call ref.set with merged attributes when saving existing model', async () => {
      const setSpy = spy()
      class TestModel extends FireModel {
        ref() {
          return { set: setSpy }
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' })
      expect(setSpy).to.be.calledOnceWithExactly({ foo: 'y', test: 'a' })
      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
    })

    it('should call ref.update with passed attrs when saving existing model with patch', async () => {
      const updateSpy = spy()
      class TestModel extends FireModel {
        ref() {
          return { update: updateSpy }
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.save({ foo: 'y' }, { patch: true })
      expect(updateSpy).to.be.calledOnceWithExactly({ foo: 'y' })
      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
    })

    it('should call ref.delete when destroying a model', async () => {
      const deleteSpy = spy()
      class TestModel extends FireModel {
        ref() {
          return { delete: deleteSpy }
        }
      }
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      await model.destroy()
      expect(deleteSpy).to.be.calledOnce
    })
  })
})
