import { collection } from 'firebase/firestore'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { uniqueId } from 'lodash-es'

let globalTestEnv

async function getTestEnv() {
  if (globalTestEnv) return globalTestEnv
  globalTestEnv = await initializeTestEnvironment({
    projectId: 'nextbone-firestore-test',
    firestore: {
      host: 'localhost',
      port: 8080,
      // rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  })
  return globalTestEnv
}

async function getTestContext() {
  const testEnv = await getTestEnv()
  return testEnv.authenticatedContext('alice', { email: 'alice@example.com' })
}

export const createCollectionRef = (db) => {
  return collection(db, uniqueId('collection'))
}

export const getDb = async () => {
  const context = await getTestContext()
  return context.firestore()
}

export const clearFirestoreData = async () => {
  const testEnv = await getTestEnv()
  // awaiting leads to FetchError: request to http://localhost:8080/emulator/v1/projects/nextbone-firestore-test/databases/(default)/documents failed, reason: connect ECONNREFUSED ::1:8080
  // await testEnv.clearFirestore()
  testEnv.clearFirestore()
}

export const cleanup = async () => {
  const testEnv = await getTestEnv()
  testEnv.cleanup()
}
