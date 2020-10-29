const Review = require('../../models/Review');
const {protect} = require('../../middleware/auth');

module.exports = {
    Query: {
        async getReviews() {
            try {
                let filter = {};
                const reviews = await Review.find(filter);
                return reviews;
            } catch (err) {
                throw new Error(err);
            }
        }
    },
    Mutation: {
        async writeReview(_,
        {
            reviewInput: { rating, review, productId }
        },
        context) {
            const user = await protect(context);
            // Check if user already review the product
            const check = await Review.findOne({ user: user._id, product: productId });
            if(check) throw new Error('You already review this product!');

            const newReview = await Review.create({
                rating,
                review,
                product: productId,
                user: user._id
            });

            return {
                id: newReview._id,
                ...newReview._doc
            }
        }
    }
}