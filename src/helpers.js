/**
 * @import {FireCollection} from './collection.js'
 * @import {ObservableModel} from './model.js'
 */

/**
 * @param {Record<string, any>} params
 * @param {ObservableModel | FireCollection} instance
 * @returns
 */
export const createParamsProxy = (params, instance) => {
  return new Proxy(params, {
    set(target, prop, value) {
      target[prop] = value
      instance.updateQuery()
      return true
    },
  })
}
