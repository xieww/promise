const Promise = require('../src/index.js');

module.exports = {
  deferred: function () {
    let defer = {};
    defer.promise = new Promise(function (resolve, reject) {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    return defer;
  }
};