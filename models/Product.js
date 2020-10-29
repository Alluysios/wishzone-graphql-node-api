const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, 'Product must have a name']
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        lowercase: true,
    },
    price: {
        type: Number,
    },
    sale: Number,
    featured: {
        type: Boolean,
        default: false
    },
    ratingAverage: {
        type: Number,
        min: [1, 'Rating must be above 0'],
        max: [5, 'Rating must be below 5'],
        default: 5,
        set: val => Math.round(val * 10) / 10
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    imageCover: {
        type: String,
        default: 'productDefault.jpeg'
    },
    sizes: [String],
    images: [String],
    slug: String
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSchema.index({ ratingAverage: -1 });
productSchema.index({ price: 1 });
productSchema.index({ slug: 1 });

// Virtual populate
productSchema.virtual('review', {
    // name of the model
    ref:'Review',
    // field name of the other model (where the id is in this case it's blog)
    foreignField: 'product',
    localField: '_id'
})

productSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {
        lower: true
    });

    next();
})

const Product = mongoose.model('Product', productSchema);

module.exports = Product;