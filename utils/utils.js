exports.filterObj = (obj, ...options) => {
  let newObj = {};
  options.forEach((ele) => {
    if (obj[ele]) {
      newObj[ele] = obj[ele];
    }
  });
  return newObj;
};
