class APIFeatures {
  constructor(mongooseQuery, expressQueryStr) {
    this.mongooseQuery = mongooseQuery;
    this.expressQueryStr = expressQueryStr;
  }

  filter() {
    // Removing unwanted options in query object.
    const queryObj = { ...this.expressQueryStr };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    // Example: Converting "gte" in query object to "$gte"
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matched) => `$${matched}`
    );

    // Result will be available on "this.mongooseQuery" and at the end we await for that.
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryString));

    return this; // Allow chaining.
  }

  sort() {
    if (this.expressQueryStr.sort) {
      // Converting "field1,field2" to "field1 field2"
      const sortBy = this.expressQueryStr.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      // default sorting (reverse time)
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this; // Allow chaining.
  }

  limitFields() {
    if (this.expressQueryStr.fields) {
      const fields = this.expressQueryStr.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery.select('-__v'); // "-" -> excludes __v in all responses.
    }
    return this;
  }

  paginate() {
    const page = this.expressQueryStr.page * 1 || 1; // converting to number and setting the default to 1;
    const limit = this.expressQueryStr.limit * 1 || 100; // converting to number and setting the default to 100;
    const howManySkip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(howManySkip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
