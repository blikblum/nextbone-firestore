import { expect } from 'chai'
import sinon from 'sinon'
import { FireModel, ObservableModel } from '../src/model.js'
import { FireCollection } from '../src/collection.js'
import {
  initializeDataset,
  clearDataset,
  collectionName,
  collectionData,
} from './helpers/dataset.js'
import { createCollectionRef, getDb } from './helpers/firebase.js'

import {
  doc,
  collection,
  getDoc,
  getDocs,
  DocumentReference,
  CollectionReference,
  query,
  orderBy,
} from 'firebase/firestore'

const { spy } = sinon

describe('FireModel', () => {
  let db

  before(async () => {
    db = await getDb()
  })

  describe('collectionRef', () => {
    it('should return undefined by default', () => {
      const model = new FireModel()
      expect(model.collectionRef()).to.be.undefined
    })

    it('should return the declared ref', () => {
      class TestModel extends FireModel {
        collectionRef() {
          return doc(db, 'collectionPath/modelId')
        }
      }
      const model = new TestModel()
      const ref = model.collectionRef()
      expect(ref).to.be.instanceOf(DocumentReference)
      expect(ref.path).to.equal('collectionPath/modelId')
    })

    it('should return its collection ref', () => {
      const model = new FireModel()
      model.collection = new FireCollection()
      sinon
        .stub(model.collection, 'ref')
        .callsFake(() => collection(db, 'mycollection'))
      const ref = model.collectionRef()
      expect(ref).to.be.instanceOf(CollectionReference)
      expect(ref.path).to.equal('mycollection')
    })

    it('should call collection ref only once', () => {
      const model = new FireModel()
      model.collection = new FireCollection()
      sinon
        .stub(model.collection, 'ref')
        .callsFake(() => collection(db, 'mycollection'))
      model.collectionRef()
      expect(model.collection.ref).to.be.calledOnce
      model.collectionRef()
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
        collectionRef() {
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
        collectionRef() {
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
      const collectionRef = createCollectionRef(db)

      class TestModel extends FireModel {
        collectionRef() {
          return collectionRef
        }
      }
      const model = new TestModel({ foo: 'bar', test: 'a' })
      await model.save()
      const snapshot = await getDocs(collectionRef)
      expect(snapshot.docs).to.have.length(1, 'one doc should be created')
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

    it('should use collection ref when saving existing model', async () => {
      class TestCollection extends FireCollection {
        ref() {
          return collection(db, 'myCollection2')
        }
      }

      class TestModel extends FireModel {}
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      new TestCollection({ models: [model] })
      await model.save({ foo: 'y' })

      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
    })

    it('should work when collection uses query and when saving existing model', async () => {
      class TestCollection extends FireCollection {
        query(ref) {
          return query(ref, orderBy('count'))
        }

        ref() {
          return collection(db, 'myCollection2')
        }
      }

      class TestModel extends FireModel {}
      const model = new TestModel({ id: 'x', foo: 'bar', test: 'a' })
      new TestCollection({ models: [model] })
      await model.save({ foo: 'y' })

      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'y',
        test: 'a',
      })
    })

    it.skip('should handle merge option for nested fields when saving existing model', async () => {
      const docRef = doc(db, 'myCollection3', 'x')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: { color: 'a', type: 'x' } })
      await model.save({ test: { color: 'y' } }, { merge: true })
      const snapshot = await getDoc(docRef)
      expect(snapshot.data()).to.be.eql({
        foo: 'bar',
        test: { color: 'y', type: 'x' },
      })
      // todo: implement reading doc data from database or ignore the mangled state leaving to be updated lazily
      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'bar',
        test: { color: 'y', type: 'x' },
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

    it.skip('should accept dot notation for nested fields when saving existing model with patch', async () => {
      const docRef = doc(db, 'myCollection3', 'x')

      class TestModel extends FireModel {
        ref() {
          return docRef
        }
      }
      const model = new TestModel({ id: 'x' })
      await model.save({ foo: 'bar', test: { color: 'a', type: 'x' } })
      await model.save({ 'test.color': 'y' }, { patch: true, wait: true })
      const snapshot = await getDoc(docRef)
      expect(snapshot.data()).to.be.eql({
        foo: 'bar',
        test: { color: 'y', type: 'x' },
      })
      // todo: implement reading doc data from database or ignore the mangled state leaving to be updated lazily
      expect(model.attributes).to.be.eql({
        id: 'x',
        foo: 'bar',
        test: { color: 'y', type: 'x' },
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

describe('ObservableModel', () => {
  let db

  before(async () => {
    db = await getDb()

    ObservableModel.getFirestore = () => db
  })

  after(() => {
    ObservableModel.getFirestore = undefined
  })

  describe('inheritance', () => {
    it('should extend FireModel', () => {
      const model = new ObservableModel()
      expect(model).to.be.instanceOf(FireModel)
      expect(model).to.be.instanceOf(ObservableModel)
    })

    it('should have sync method from FireModel', () => {
      const model = new ObservableModel()
      expect(model.sync).to.be.a('function')
    })

    it('should have refRoot and ref methods from FireModel', () => {
      const model = new ObservableModel()
      expect(model.collectionRef).to.be.a('function')
      expect(model.ref).to.be.a('function')
    })

    it('should have beforeSync method from FireModel', () => {
      const model = new ObservableModel()
      expect(model.beforeSync).to.be.a('function')
    })
  })

  describe('observable functionality', () => {
    it('should have params property', () => {
      const model = new ObservableModel()
      expect(model.params).to.be.an('object')
    })

    it('should have observe method', () => {
      const model = new ObservableModel()
      expect(model.observe).to.be.a('function')
    })

    it('should have ready method', () => {
      const model = new ObservableModel()
      expect(model.ready).to.be.a('function')
    })

    it('should have updateQuery method', () => {
      const model = new ObservableModel()
      expect(model.updateQuery).to.be.a('function')
    })

    it('should have changeSource method', () => {
      const model = new ObservableModel()
      expect(model.changeSource).to.be.a('function')
    })

    it('should have query and collectionPath methods', () => {
      const model = new ObservableModel()
      expect(model.query).to.be.a('function')
      expect(model.collectionPath).to.be.a('function')
    })
  })

  describe('collectionPath', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should define the model collection path from params', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        // query must be defined when no id is provided
        query(ref) {
          return ref
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      // Should have loaded data from the first doc (default selectSnapshot behavior)
      expect(model.get('title')).to.equal('Document 1')
      expect(model.get('count')).to.equal(1)
      model._unsubscribe?.()
    })

    it('should throw error if query() does not return Query when no id is provided', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        // query not defined or does not return anything
        query() {
          return undefined
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      let caughtError = null
      try {
        model.getQuery()
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).to.be.an('error')
      expect(caughtError.message).to.equal(
        'FireModel: query() must return a Query when no id param is provided'
      )
      model._unsubscribe?.()
    })

    it('should return undefined query when collectionPath returns undefined', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }
      }

      const model = new TestObservableModel()
      // params.collectionName is not set, so collectionPath returns undefined
      const query = model.getQuery()
      expect(query).to.be.undefined
    })

    it('should support dynamic collection paths', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          if (params.orgId) {
            return `organizations/${params.orgId}/items`
          }
          return undefined
        }

        query(ref) {
          return ref
        }
      }

      const model = new TestObservableModel()

      // Initially no path
      expect(model.getQuery()).to.be.undefined

      // After setting orgId, path is defined (though collection may not exist)
      model.params.orgId = 'org123'
      const query = model.getQuery()
      expect(query).to.not.be.undefined
    })
  })

  describe('path method for document selection', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should use path method to construct doc reference when defined', async () => {
      class TestObservableModel extends ObservableModel {
        path(params) {
          if (params.collectionName && params.docId) {
            return `${params.collectionName}/${params.docId}`
          }
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName
      model.params.docId = '2' // Document with count: 2

      model.observe()
      await model.ready()

      expect(model.id).to.equal('2')
      expect(model.get('title')).to.equal('Document 2')
      expect(model.get('count')).to.equal(2)
      expect(model.get('type')).to.equal('even')
      model._unsubscribe?.()
    })

    it('should return undefined query when path returns falsy', () => {
      class TestObservableModel extends ObservableModel {
        path() {
          return undefined
        }
      }

      const model = new TestObservableModel()
      expect(model.getQuery()).to.be.undefined
    })

    it('should fall back to collectionPath when path returns falsy', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      // Should use collectionPath + query since path returns undefined
      expect(model.id).to.not.be.undefined
      model._unsubscribe?.()
    })

    it('should update model when path params change', async () => {
      class TestObservableModel extends ObservableModel {
        path(params) {
          if (params.collectionName && params.docId) {
            return `${params.collectionName}/${params.docId}`
          }
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName
      model.params.docId = '1'

      model.observe()
      await model.ready()

      expect(model.id).to.equal('1')
      expect(model.get('title')).to.equal('Document 1')

      // Change to different document
      model.params.docId = '3'
      await model.ready()

      expect(model.id).to.equal('3')
      expect(model.get('title')).to.equal('Document 3')
      expect(model.get('type')).to.equal('odd')
      model._unsubscribe?.()
    })

    it('should clear model when path points to non-existent document', async () => {
      class TestObservableModel extends ObservableModel {
        path(params) {
          if (params.collectionName && params.docId) {
            return `${params.collectionName}/${params.docId}`
          }
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName
      model.params.docId = 'nonexistent'

      model.observe()
      await model.ready()

      expect(model.id).to.be.undefined
      expect(model.get('title')).to.be.undefined
      model._unsubscribe?.()
    })
  })

  describe('selectSnapshot default behavior', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should select first document when using collectionPath with query', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      // Default selectSnapshot returns first doc
      expect(model.get('title')).to.equal('Document 1')
      expect(model.get('count')).to.equal(1)
      model._unsubscribe?.()
    })

    it('should clear model when collection is empty', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = 'emptyCollection'

      model.observe()
      await model.ready()

      expect(model.id).to.be.undefined
      expect(model.get('title')).to.be.undefined
      model._unsubscribe?.()
    })
  })

  describe('selectSnapshot override', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should allow overriding selectSnapshot to select different document', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }

        selectSnapshot(snapshot) {
          // Select last document instead of first
          const docs = snapshot.docs
          return docs[docs.length - 1]
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      // Should have selected last document (Document 4)
      expect(model.get('title')).to.equal('Document 4')
      expect(model.get('count')).to.equal(4)
      model._unsubscribe?.()
    })

    it('should allow selectSnapshot to filter based on criteria', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }

        selectSnapshot(snapshot) {
          // Select document with highest count
          const docs = snapshot.docs
          let maxDoc = docs[0]
          for (const doc of docs) {
            if (doc.data().count > maxDoc.data().count) {
              maxDoc = doc
            }
          }
          return maxDoc
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      expect(model.get('count')).to.equal(4)
      expect(model.get('title')).to.equal('Document 4')
      model._unsubscribe?.()
    })

    it('should clear model when selectSnapshot returns undefined', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref) {
          return ref
        }

        selectSnapshot() {
          // Return undefined to simulate no selection
          return undefined
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName

      model.observe()
      await model.ready()

      expect(model.id).to.be.undefined
      expect(model.get('title')).to.be.undefined
      model._unsubscribe?.()
    })

    it('should use selectSnapshot with query results', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref, params) {
          if (params.type) {
            return query(ref, orderBy('count'))
          }
          return ref
        }

        selectSnapshot(snapshot) {
          // Select second document from query results
          return snapshot.docs[1]
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName
      model.params.type = 'any' // trigger query with orderBy

      model.observe()
      await model.ready()

      // With orderBy('count'), docs are ordered 1,2,3,4 - second is count: 2
      expect(model.get('count')).to.equal(2)
      expect(model.get('title')).to.equal('Document 2')
      model._unsubscribe?.()
    })
  })

  describe('query method', () => {
    before(async () => {
      await initializeDataset()
    })

    after(async () => {
      await clearDataset()
    })

    it('should apply query filters when using collectionPath with query', async () => {
      class TestObservableModel extends ObservableModel {
        collectionPath(params) {
          return params.collectionName
        }

        query(ref, params) {
          if (params.sortBy) {
            return query(ref, orderBy(params.sortBy, 'desc'))
          }
          return ref
        }
      }

      const model = new TestObservableModel()
      model.params.collectionName = collectionName
      model.params.sortBy = 'count'

      model.observe()
      await model.ready()

      // With orderBy desc, first doc should be Document 4 (highest count)
      expect(model.get('title')).to.equal('Document 4')
      expect(model.get('count')).to.equal(4)
      model._unsubscribe?.()
    })
  })
})
