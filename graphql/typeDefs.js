const { gql } = require('apollo-server');

const typeDefs = gql`
    type User {
        id: ID!
        firstname: String!
        lastname: String!
        email: String!
        image: String
        token: String!
        date: String
    }
    type Review {
        id: ID!
        rating: Int!
        review: String!
        createdAt: String!
        user: User!,
        product: ID
    }
    type Product {
        id: ID!
        name: String!
        description: String!
        category: String!
        price: Float!
        sale: Int
        featured: Boolean
        ratingAverage: Float
        createdAt: String!
        slug: String
        review: [Review]
        imageCover: String
    }
    input RegisterInput {
        firstname: String!
        lastname: String!
        email: String!
        password: String!
        passwordConfirm: String!
    }
    input LoginInput {
        email: String!
        password: String!
    }
    input ProductInput {
        name: String!
        description: String!
        category: String!
        price: Float!
        sale: Int
        featured: Boolean
        ratingAverage: Float
        imageCover: String
    }
    input ReviewInput {
        rating: Int!
        review: String!
        productId: ID!
    }
    type Query {
        getProducts: [Product!]!
        getProduct(slug: String!): Product!
        getReviews: [Review!]!
        authorize: User!
    }
    type Mutation {
        register(registerInput: RegisterInput): User!
        login(loginInput: LoginInput): User!
        createProduct(productInput: ProductInput): Product!
        writeReview(reviewInput: ReviewInput): Review!
    }
`;

module.exports = typeDefs;