
// What the fuck I did:
// Here I wrapped the a function (controller) into an anonymous function, which does this:
// 1. applies catch();
// 2. Returns the function
// Then I assigned that anonymous function as the previous controller.
// What happens? result of async function is a promise, if error happens, promise will be rejected and caught in catch();
// By passing "err" to next(), all middle wares will be skipped and err will reach the error handling middleware.
module.exports = function (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(err));
  };
};
