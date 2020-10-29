class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludeFields = ['limit', 'sort', 'field', 'page'];
        excludeFields.forEach(el => delete queryObj[el]);

        // advanced
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, match => {
            return `$${match}`
        });

        this.query = this.query.find(JSON.parse(queryString));

        return this;
    }

    sort() {
        if(this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt')
        }

        return this;
    }

    limitFields() {
        if(this.queryString.field) {
            const fields = this.queryString.field.split(',').join(' ');
            this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 10
        const skip = (page -1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;