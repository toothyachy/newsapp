module.exports = function wrapAsync(fn, sta, msg) {
    return function (req, res, next) {
      fn(req, res, next).catch(e => {
        e.status = sta;
        e.message = msg;
        next(e);
      })
    }
  }
