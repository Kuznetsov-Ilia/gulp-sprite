/**
 * @author RubaXa <trash@rubaxa.org>
 * @license MIT
 */
/**
 * Fastest Deferred.
 * @returns {Deferred}
 */

function deferred() {
  var
  _doneFn = [],
    _failFn = [],
    dfd = {
      done: function (fn) {
        _doneFn.push(fn);
        return dfd;
      },

      fail: function (fn) {
        _failFn.push(fn);
        return dfd;
      },

      then: function (doneFn, failFn) {
        return dfd.done(doneFn).fail(failFn);
      },

      always: function (fn) {
        return dfd.done(fn).fail(fn);
      },

      resolve: _setState(true),
      reject: _setState(false)
    };


  function _setState(state) {
    var lastReturn;
    return function (input) {
      lastReturn = input; //arguments;

      dfd.done =
        dfd.fail =
        dfd.resolve =
        dfd.reject = function () {
          return dfd;
      };

      dfd[state ? 'done' : 'fail'] = function (fn) {
        if (typeof fn === 'function') {
          lastReturn = fn.call(dfd, lastReturn);
        }
        return dfd;
      };

      var
      fn, fns = state ? _doneFn : _failFn,
        i = 0,
        n = fns.length;

      for (; i < n; i++) {
        fn = fns[i];
        if (typeof fn === 'function') {
          var _return = fn.call(dfd, lastReturn);
          if (isset(_return)) {
            lastReturn = _return;
          }
        }
      }

      fns = _doneFn = _failFn = null;

      return dfd;
    }
  }

  return dfd;
}


/**
 * @param {Array} args
 * @returns {defer|*}
 */
deferred.when = function (args) {
  var
  dfd = deferred(),
    d, i = args.length,
    remain = i || 1,
    _doneFn = function () {
      if (--remain === 0) {
        dfd.resolve();
      }
    };

  if (i === 0) {
    _doneFn();
  } else {
    while (i--) {
      d = args[i];
      if (isset(d) && isset(d.then)) {
        d.then(_doneFn, dfd.reject);
      }
    }
  }

  return dfd;
};

function isset(val) {
  return typeof val != 'undefined'
}

module.exports = deferred
