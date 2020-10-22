import * as firebase from '@firebase/testing'
import { uniqueId } from 'lodash-es'

const app = firebase.initializeTestApp({
  projectId: 'nextbone-firestore-test',
  auth: { uid: 'alice', email: 'alice@example.com' },
})

export const createCollectionRef = () => {
  return db.collection(uniqueId('collection'))
}

export const db = app.firestore()
export const FieldValue = firebase.firestore.FieldValue
export const Timestamp = firebase.firestore.Timestamp
export const DocumentReference = firebase.firestore.DocumentReference
export const CollectionReference = firebase.firestore.CollectionReference
export const clearFirestoreData = firebase.clearFirestoreData
