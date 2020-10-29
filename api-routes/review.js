const express = require('express');

const Review = require('../models/Review');
const Product = require('../models/Product');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

/*******
 *  baseURL: /products/:pid
********/

// Get all reviews
router.get('/', async(req, res, next) => {
    let filter = {};
    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        reviews
    })
});

const calcAverageRatings = async (productId, review) => {
    const stats = await Review.aggregate([
        {
            // first field = id
            $group: {
                _id: '$product',
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    const products = stats.find(product => product._id.toString() === productId.toString());

    if(products) {
        await Product.findByIdAndUpdate(productId, {
            ratingAverage: products.avgRating
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            ratingAverage: review.rating
        });
    }
};

// Create review
router.post('/', protect, async(req, res) => {
    if(!req.body.user) req.body.user = req.user;
    if(!req.body.product) req.body.product = req.params.pid;

    // const product = await Product.findOne({ product: req.params.pid });
    // const { rating } = product;
    

    const user = await Review.findOne({ user: req.user, product: req.params.pid });
    if(user) return res.status(400).json({ errors: [{ msg: 'You already reviewed this product' }]});
    
    const review = await Review.create(req.body);
    calcAverageRatings(req.params.pid, review);

    res.status(200).json({
        status: 'success',
        review
    })
})

// Get review
router.get('/', async(req, res, next) => {
    const review = await Review.findById(req.rid);

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    })
});

module.exports = router;