const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * @description promise实现
 * @author xieww
 * @date 2020-07-22
 * @param {*} executor
 */
function Promise(executor) {
  let self = this;
  self.status = PENDING; // 初始状态
  self.onFulfilled = []; // 成功的回调
  self.onRejected = []; // 失败的回调

  //PromiseA+ 2.1
  function resolve(value) {
    if (self.status === PENDING) {
      self.status = FULFILLED;
      self.value = value;
      self.onFulfilled.forEach((fn) => fn()); //PromiseA+ 2.2.6.1
    }
  }

  function reject(reason) {
    if (self.status === PENDING) {
      self.status = REJECTED;
      self.reason = reason;
      self.onRejected.forEach((fn) => fn()); //PromiseA+ 2.2.6.2
    }
  }

  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(pro, x, resolve, reject) {
  let self = this;
  //PromiseA+ 2.3.1
  if (pro === x) {
    reject(new TypeError("Chaining cycle"));
  }

  if ((x && typeof x === "object") || typeof x === "function") {
    let used; //PromiseA+2.3.3.3.3 只能调用一次
    try {
      let then = x.then;
      if (typeof then === "function") {
        //PromiseA+2.3.3
        then.call(
          x,
          (res) => {
            //PromiseA+2.3.3.1
            if (used) {
              return;
            }
            used = true;
            resolvePromise(pro, res, resolve, reject);
          },
          (rej) => {
            //PromiseA+2.3.3.2
            if (used) {
              return;
            }
            used = true;
            reject(rej);
          }
        );
      } else {
        //PromiseA+2.3.3.4
        if (used) {
          return;
        }
        used = true;
        resolve(x);
      }
    } catch (error) {
      //PromiseA+ 2.3.3.2
      if (used) {
        return;
      }
      used = true;
      reject(error);
    }
  } else {
    //PromiseA+ 2.3.3.4
    resolve(x);
  }
}

/**
 * @description then方法
 * @author xieww
 * @date 2020-07-22
 * @param {*} onFulfilled
 * @param {*} onRejected
 */
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this;

  //PromiseA+ 2.2.1 / PromiseA+ 2.2.5 / PromiseA+ 2.2.7.3 / PromiseA+ 2.2.7.4
  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  //PromiseA+ 2.2.7
  const tmpPromise = new Promise((resolve, reject) => {
    if (self.status === PENDING) {
      self.onFulfilled.push(() => {
        setTimeout(() => {
          try {
            const x = onFulfilled(self.value);
            resolvePromise(tmpPromise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });

      self.onRejected.push(() => {
        setTimeout(() => {
          try {
            const x = onRejected(self.reason);
            resolvePromise(tmpPromise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });
    }
    if (self.status === FULFILLED) {
      //PromiseA+ 2.2.2
      //PromiseA+ 2.2.4 --- setTimeout
      setTimeout(() => {
        try {
          const x = onFulfilled(self.value); //PromiseA+ 2.2.7.1
          resolvePromise(tmpPromise, x, resolve, reject);
        } catch (error) {
          reject(error); //PromiseA+ 2.2.7.2
        }
      });
    } else if (self.status === REJECTED) {
      //PromiseA+ 2.2.3
      setTimeout(() => {
        try {
          const x = onRejected(self.reason);
          resolvePromise(tmpPromise, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    }
  });

  return tmpPromise;
};

/**
 * @description 异常捕获
 * @author xieww
 * @date 2020-07-22
 * @param {*} onRejected
 * @returns
 */
Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

/**
 * @description 将实例对象状态改为resolved
 * @author xieww
 * @date 2020-07-22
 * @param {*} params
 * @returns
 */
Promise.resolve = function (params) {
  if (params instanceof Promise) {
    return params;
  }

  return new Promise((resolve, reject) => {
    if (params && params.then && typeof params.then === "function") {
      setTimeout(() => {
        params.then(resolve, reject);
      });
    } else {
      resolve(params);
    }
  });
};

/**
 * @description 将实例对象状态改为rejected
 * @author xieww
 * @date 2020-07-22
 * @param {*} params
 * @returns
 */
Promise.reject = function (params) {
  return new Promise((resolve, reject) => {
    reject(params);
  });
};

/**
 * @description
 * @author xieww
 * @date 2020-07-22
 * @param {*} callback
 */
Promise.prototype.finally = function Finally(callback) {
  return this.then(
    (value) => Promise.resolve(callback()).then(() => value),
    (error) =>
      Promise.resolve(callback()).then(() => {
        throw error;
      })
  );
};

/**
 * @description
 * @author xieww
 * @date 2020-07-22
 * @param {*} params
 * @returns
 */
Promise.all = function (params) {
  return new Promise((resolve, reject) => {
    let index = 0;
    let result = [];
    if (params.length === 0) {
      resolve(result);
    } else {
      function processValue(i, data) {
        result[i] = data;
        if (++index === params.length) {
          resolve(result);
        }
      }

      for (let i = 0; i < params.length; i++) {
        Promise.resolve(params[i]).then(
          (r) => processValue(i, r),
          (error) => {
            reject(error);
            return;
          }
        );
      }
    }
  });
};

Promise.race = function Race(params) {
  return new Promise((resolve, reject) => {
    if (params.length === 0) {
      return;
    } else {
      for (let i = 0; i < params.length; i++) {
        Promise.resolve(params[i]).then(
          (res) => {
            resolve(res);
            return;
          },
          (error) => {
            reject(error);
            return;
          }
        );
      }
    }
  });
};

module.exports = Promise;
