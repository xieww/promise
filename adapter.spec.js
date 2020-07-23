const Promise = require('./index.js');

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