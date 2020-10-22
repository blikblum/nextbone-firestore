import { db, clearFirestoreData } from './firebase'

export const collectionName = 'someCollection'
export const collectionData = [
  {
    title: 'Document 1',
    count: 1,
    type: 'odd',
  },
  {
    title: 'Document 2',
    count: 2,
    type: 'even',
  },
  {
    title: 'Document 3',
    count: 3,
    type: 'odd',
  },
  {
    title: 'Document 4',
    count: 4,
    type: 'even',
  },
]

export async function initializeDataset() {
  const promisedOperations = collectionData.map((doc) => {
    return db.collection(collectionName).doc(`${doc.count}`).set(doc)
  })
  await Promise.all(promisedOperations)
}

export async function clearDataset() {
  await clearFirestoreData({ projectId: 'nextbone-firestore-test' })
}
