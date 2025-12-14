import { collection } from 'firebase/firestore'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { nanoid } from 'nanoid'

/**
 * @type {import('@firebase/rules-unit-testing').RulesTestEnvironment | undefined}
 */
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

export const createCollectionRef = (db, path = `collection-${nanoid()}`) => {
  return collection(db, path)
}

export const getDb = async () => {
  const context = await getTestContext()
  return context.firestore()
}

export const clearFirestoreData = async () => {
  const testEnv = await getTestEnv()
  await testEnv.clearFirestore()
}

export const cleanup = async () => {
  const testEnv = await getTestEnv()
  await testEnv.cleanup()
}
