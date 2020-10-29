const Product = require('../../models/Product');
const {protect} = require('../../middleware/auth');

module.exports = {
    Query: {
        async getProducts() {
            try {
                const products = await Product.find().populate({
                    path: 'review',
                    select: 'rating review createdAt'
                })
                return products;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getProduct(_, { slug }) {
            const product = await Product.findOne({ slug: slug }).populate({
                path: 'review',
                select: 'rating review createdAt'
            });
        
            if (!product) {
                throw new Error('No product found with that ID');
            }
            
            return {
                ...product
            };
        }
    },
    Mutation: {
        async createProduct(_, { 
            productInput: {
                name,
                description,
                category,
                price,
                sale,
                featured,
                ratingAverage
            }
        }, 
        context) {
            const user = await protect(context)

            const newProduct = new Product({
                name,
                description,
                category,
                price,
                sale,
                featured,
                ratingAverage
            })

            const product = await newProduct.save();

            return {
                ...product._doc,
                id: product._id
            }
        }
    }
}