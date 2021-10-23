import { doc, setDoc, collection } from 'firebase/firestore'
import { clearFirestoreData, getDb } from './firebase.js'

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
  const db = await getDb()
  const promisedOperations = collectionData.map((data) => {
    return setDoc(doc(db, collectionName, `${data.count}`), data)
  })
  await Promise.all(promisedOperations)
}

export async function clearDataset() {
  await clearFirestoreData({ projectId: 'nextbone-firestore-test' })
}
