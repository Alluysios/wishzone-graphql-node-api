const express = require('express');
const app = express();
const helmet = require('helmet')
const cors = require('cors');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');

const { ApolloServer } = require('apollo-server-express');
const parser = require('./utils/cloudinary')

// TypeDefs and Resolvers
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers')

app.enable('trust proxy');
app.use(compression());
/*
==================
MIDDLEWARE
==================
*/
app.use(cors());
app.options('*', cors());

// Secure http headers
app.use(helmet({ contentSecurityPolicy: (process.env.NODE_ENV === 'production') ? undefined : false }));
// Data sanitazation
app.use(xss());
app.use(cookieParser());

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution (1 >) (ex: price=250, price=200)
app.use(
    hpp({
        whitelist: [
            'price',
            'category',
            'name'
        ]
    })
);
// Serve static files
app.use('/uploads', express.static('uploads'))
// Body parser, reading data from the body into the req.body (limit 10kb)
app.use(express.json({ limit: '10kb' }));
// parse data from urlencoded form (files), {extended: true} = pass complex data
app.use(express.urlencoded({ extended: true }));

app.use('/graphql', parser.single('imageCover'));

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({ req }) => ({ req })
})
server.applyMiddleware({ app });

module.exports = app;