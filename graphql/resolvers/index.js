const productResolvers = require('./products');
const authResolvers = require('./auth');
const reviewResolvers = require('./review');

module.exports = {
    Query: {
        ...productResolvers.Query,
        ...reviewResolvers.Query,
        ...authResolvers.Query
    },
    Mutation: {
        ...productResolvers.Mutation,
        ...authResolvers.Mutation,
        ...reviewResolvers.Mutation
    }
}