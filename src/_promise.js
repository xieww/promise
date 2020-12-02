const PENDING = "pending"; // 等待状态
const FULFILLED = "fulfilled"; // 完成状态
const REJECTED = "rejected"; // 拒绝状态

function _Promise(executor) {
  let self = this;
  self.status = PENDING;
  self.onFulfilled = [];
  self.onRejected = [];

  function resolve(value) {
    if (self.status === PENDING) {
      self.status = FULFILLED;
      self.value = value;
      self.onFulfilled.forEach((fn) => fn());
    }
  }

  function reject(reason) {
    if (self.status === PENDING) {
      self.status = REJECTED;
      self.reason = reason;
      self.onRejected.forEach((fn) => fn());
    }
  }

  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    reject(new TypeError("Chaining cycle"));
  }

  if (x && (typeof x === "object" || typeof x === "function")) {
    let used = false;
    try {
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (res) => {
            if (used) {
              return;
            }
            used = true;
            resolvePromise(promise, res, resolve, reject);
          },
          (error) => {
            if (used) {
              return;
            }
            used = true;
            reject(error);
          }
        );
      } else {
        if (used) {
          return;
        }
        used = true;
        resolve(x);
      }
    } catch (error) {
      if (used) {
        return;
      }
      used = true;
      reject(error);
    }
  } else {
    resolve(x);
  }
}

_Promise.prototype.then = function (onFulfilled, onRejected) {
  const self = this;

  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;

  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  const promise = new _Promise((resolve, reject) => {
    if (self.status === PENDING) {
      self.onFulfilled.push(() => {
        setTimeout(() => {
          try {
            const x = onFulfilled(self.value);
            resolvePromise(promise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });

      self.onRejected.push(() => {
        setTimeout(() => {
          try {
            const x = onRejected(self.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });
    } else if (self.status === FULFILLED) {
      setTimeout(() => {
        try {
          const x = onFulfilled(self.value);
          resolvePromise(promise, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    } else if (self.status === REJECTED) {
      setTimeout(() => {
        try {
          const x = onRejected(self.reason);
          resolvePromise(promise, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    }
  });

  return promise;
};

_Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

_Promise.resolve = function (params) {
  if (params instanceof _Promise) {
    return params;
  }

  return new _Promise((resolve, reject) => {
    if (params && params.then && typeof params.then === "function") {
      setTimeout(() => {
        params.then(resolve, reject);
      });
    } else {
      resolve(params);
    }
  });
};

_Promise.reject = function (params) {
  return new _Promise((resolve, reject) => reject(params));
};

_Promise.prototype.finally = function (callback) {
  return this.then(
    (value) => _Promise.resolve(callback()).then(() => value),
    (error) =>
      _Promise.resolve(callback()).then(() => {
        throw error;
      })
  );
};

// _Promise.all = function (params) {
//   return new _Promise((resolve, reject) => {
//     let index = 0;
//     let result = [];
//     if (params.length === 0) {
//       resolve(result);
//     } else {
//       function processValue(i, data) {
//         result[i] = data;
//         if (++index === params.length) {
//           resolve(result);
//         }
//       }

//       for (let i = 0; i < params.length; i++) {
//         _Promise.resolve(params[i]).then(
//           (res) => processValue(i, res),
//           (error) => {
//             reject(error);
//             return;
//           }
//         );
//       }
//     }
//   });
// };

_Promise.all = function (params) {
  const promises = Array.from(params);
  const len = promises.length;
  const resultList = new Array(len);
  let count = 0;
  return new _Promise((resolve, reject) => {
    if (!len) {
      resolve(resultList);
    } else {
      promises.forEach((item, index) => {
        _Promise
          .resolve(item)
          .then((value) => {
            // 保存这个promise实例的value
            resultList[index] = value;
            // 通过计数器，标记是否所有实例均 fulfilled
            if (++count === len) {
              resolve(resultList);
            }
          })
          .catch(reject);
      });
    }
  });
};

// _Promise.race = function (params) {
//   const promises = Array.from(params);
//   return new _Promise((resolve, reject) => {
//     if (!promises || (promises && promises.length === 0)) {
//       return;
//     } else {
//       for (let i = 0; i < promises.length; i++) {
//         _Promise.resolve(promises[i]).then(
//           (res) => {
//             resolve(res);
//             return;
//           },
//           (error) => {
//             reject(error);
//             return;
//           }
//         );
//       }
//     }
//   });
// };

_Promise.race = function (params) {
  const promises = Array.from(params);
  return new _Promise((resolve, reject) => {
    if (!promises || (promises && promises.length === 0)) {
      return;
    } else {
      promises.forEach((item) => _Promise.resolve(item).then(resolve, reject));
    }
  });
};

// 只要参数实例有一个变成fulfilled状态，包装实例就会变成fulfilled状态；如果所有参数实例都变成rejected状态，包装实例就会变成rejected状态。
_Promise.any = function (params) {
  const promises = Array.from(params);
  const len = promises.length;
  const rejectedList = new Array(len);
  let count = 0;
  return new _Promise((resolve, reject) => {
    promises.forEach((item, index) => {
      _Promise
        .resolve(item)
        .then((value) => resolve(value))
        .catch((error) => {
          rejectedList[index] = error;
          if (++count === len) {
            reject(rejectedList);
          }
        });
    });
  });
};

function formatSettledResult(result, value) {
  return result
    ? { status: FULFILLED, value }
    : { status: REJECTED, reason: value };
}

// 只有等到所有这些参数实例都返回结果，不管是fulfilled还是rejected，包装实例才会结束
_Promise.allSettled = function (params) {
  const promises = Array.from(params);
  const len = promise.length;
  const settledList = new Array(len);
  let count = 0;
  return new _Promise((resolve, reject) => {
    promises.forEach((item, index) => {
      _Promise
        .resolve(item)
        .then((value) => {
          settledList[index] = formatSettledResult(true, value);
          if (++count === len) {
            resolve(settledList);
          }
        })
        .catch((error) => {
          settledList[index] = formatSettledResult(false, error);
          if (++count === len) {
            resolve(settledList);
          }
        });
    });
  });
};

module.exports = _Promise;
