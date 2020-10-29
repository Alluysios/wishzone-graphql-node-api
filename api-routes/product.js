const express = require('express');
const router = express.Router();
const APIFeatures = require('../utils/apiFeatures');
const Product = require('../models/Product');
const slugify = require('slugify');
const { protect } = require('../middleware/auth');
const { resizeUploadedImages, uploadImages } = require('../middleware/uploader');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

const reviewRoutes = require('./review');
router.use('/:pid/reviews', reviewRoutes);

// Get all Products
router.get('/', async(req, res) => {
    let filter = {}

    const features = new APIFeatures(Product.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    
    const products = await features.query.populate('review');

    res.status(200).json({
        status: 'success',
        results: products.length,
        products
    })
});

// Get all product by category
router.get('/ct/:catfield', async (req, res) => {

    let filter = { category: req.params.catfield }
    const features = new APIFeatures(Product.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const products = await features.query.populate('review');

    res.status(200).json({
        status: 'success',
        results: products.length,
        products
    })
})

// Get Product
router.get('/:slug', async(req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate({
        path: 'review',
        select: 'rating review createdAt'
    });

    if (!product) {
        return res.status(404).json({ error: [{ msg: 'No product with that ID'}]})
    }

    res.status(200).json({
        status: 'success',
        product
    })
});

// Create Product
router.post('/', 
    protect,
    uploadImages,
    resizeUploadedImages, 
    async(req, res) => {
    const product = await Product.create(req.body);

    res.status(201).json({
        status: 'success',
        product
    })
})

// Update Product
router.put('/:pid', async(req, res, next) => {
    if(req.body.slug) req.body.slug = slugify(req.body.name, { lower: true });
    const product = await Product.findByIdAndUpdate(req.params.pid, req.body, {
        upsert: true,
        new: true,
        runValidators: true
    });

    if (!product) {
        return res.status(404).json({ error: [{ msg: 'No product with that ID'}]})
    }

    res.status(200).json({
        status: 'updated',
        product
    })
})
// Delete Product
router.delete('/:pid', async(req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.pid);

    if (!product) {
        return res.status(404).json({ error: [{ msg: 'No product with that ID'}]})
    }

    res.json({
        status: 'success',
        id: req.params.pid
    })
});

router.post('/checkout', async(req, res) => {
    let error;
    let status;
    
    try {
        const { token, price } = req.body;

        const customer = await stripe.customers.create({
            email: token.email,
            source: token.id
        });

        const idempotencyKey = uuidv4();
        const charge = await stripe.charges.create({
            amount: price * 100,
            currency: "cad",
            customer: customer.id,
            receipt_email: token.email,
            description: `Arriba Fashion and Beauty`,
            shipping: {
                name: token.card.name,
                address: {
                    line1: token.card.address_line1,
                    line2: token.card.address_line2,
                    city: token.card.address_city,
                    country: token.card.address_country,
                    postal_code: token.card.address_zip
                }
            }
        },
        {
            idempotencyKey
        });
        // console.log('charge:', { charge });
        status = 'Success';
    } catch (err) {
        console.error('Error', err);
        status = 'failure';
    }

    res.json({ error, status })
})

module.exports = router;