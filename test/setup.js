require('@babel/register')({
  // This will override `node_modules` ignoring
  ignore: [
    function (filepath) {
      const result =
        filepath.indexOf('node_modules') !== -1 &&
        !filepath.match(/(lodash-es|nextbone)/)
      return result
    },
  ],
})

var chai = require('chai')
var sinonChai = require('sinon-chai')

chai.use(sinonChai)
