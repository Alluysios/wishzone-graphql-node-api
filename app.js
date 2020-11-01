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
const whitelist = ['https://wishzone.netlify.app'];
const corsOptions = {
  origin: function(origin, callback) {
    if(whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}
app.use(cors());

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

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // Serve static files
app.use('/uploads', express.static('uploads'))
// Body parser, reading data from the body into the req.body (limit 10kb)
app.use(express.json({ limit: '10kb' }));
// parse data from urlencoded form (files), {extended: true} = pass complex data
app.use(express.urlencoded({ extended: true }));

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    context: ({ req }) => ({ req })
})
server.applyMiddleware({ app });

app.post('/create-checkout-session', async (req, res) => {
  const { cart } = req.body;
  const products = cart.products.map(prod => {
      return {
        price_data: {
          currency: 'cad',
          product_data: {
            name: prod.name
          },
          unit_amount: prod.price * 100,
        },
        quantity: prod.quantity,
      }
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: products,
    mode: 'payment',
    success_url: 'https://wishzone.netlify.app/shop',
    cancel_url: 'https://wishzone.netlify.app/',
  });

  res.json({ id: session.id });
});

module.exports = app;