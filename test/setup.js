import chai from 'chai'
import sinonChai from 'sinon-chai'
import { cleanup, clearFirestoreData } from './helpers/firebase.js'

chai.use(sinonChai)

export const mochaHooks = {
  async beforeAll() {
    await clearFirestoreData()
  },

  async afterAll() {
    await cleanup()
  },
}
