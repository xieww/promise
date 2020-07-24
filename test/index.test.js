const { assert, expect } = require("chai");
const adapter = require("./adapter.spec.js");
const Promise = require("../src/index.js");

// 测试
describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(adapter);
});

describe("Promise Tests", function () {
  it("should be resolved?", function (done) {
    var promise = Promise.resolve(42);
    promise.then(function (value) {
      assert(value === 42);
      done();
    });
  });

  it("should be a thenable?", function (done) {
    var promise = Promise.resolve({
      then: function (resolve, reject) {
        resolve("thenable");
      },
    });
    promise.then(function (value) {
      assert(value === "thenable");
      done();
    });
  });

  it("should be a Promise?", function (done) {
    var promise = Promise.resolve(
      new Promise((resolve, reject) => {
        resolve("Promise");
      })
    );
    promise.then(function (value) {
      assert(value === "Promise");
      done();
    });
  });

  it("should be reject", function (done) {
    var promise = Promise.reject("出错了");
    if (typeof promise === "object") {
      assert(promise.reason === "出错了");
      done();
    }
  });

  it("should be catch", function (done) {
    var promise = Promise.reject("catch");
    if (typeof promise === "object") {
      promise.catch((error) => {
        assert(error === "catch");
        done();
      });
    }
  });

  it("should be resolve finally", function (done) {
    var promise = Promise.resolve("finally");
    promise.then().finally(() => {
      done();
    });
  });

  it("should be reject finally ", function (done) {
    var promise = Promise.reject("error finally");
    promise.then().finally(() => {
      done();
    });
  });

  it("should be immediately resolved ", function (done) {
    var promise = Promise.all([]);
    promise.then(() => {
      done();
    });
  });

  it("should be reject ", function (done) {
    var promise1 = new Promise((resolve, reject) => {
      reject("error");
    });
    var promise2 = 42;
    var promise = Promise.all([promise1, promise2]);
    promise
      .then((res) => {
        done();
      })
      .catch((error) => {
        console.log("error", error);
        done();
      });
  });

  it("should be all ([3, 42, 'foo'])", function (done) {
    var promise1 = new Promise((resolve, reject) => {
      resolve(3);
      done();
    });
    var promise2 = 42;
    var promise3 = new Promise(function (resolve, reject) {
      setTimeout(resolve, 100, "foo");
    });

    Promise.all([promise1, promise2, promise3]).then(
      function (values) {
        assert(JSON.stringify(values) === "[ 3, 42, 'foo' ]");
        done();
      },
      (err) => {
        console.log(err);
        done();
      }
    );
  });

  /******race*******/
  it("should be race ", function (done) {
    Promise.race([
      new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(100);
        }, 1000);
      }),
      undefined,
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(100);
        }, 100);
      }),
    ]).then(
      (data) => {
        console.log("success ", data);
        done();
      },
      (err) => {
        console.log("err ", err);
        done();
      }
    );
  });
});
