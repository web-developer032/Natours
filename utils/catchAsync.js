module.exports = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch(next); // catch will automatically pass error in next function
  };
};
