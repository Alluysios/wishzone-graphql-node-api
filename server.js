process.on('uncaughtException', err => {
    console.log('UNHANDLER EXCEPTION SHUTDOWN...');
    console.log(err.name, err.message);
    process.exit(1);
})
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const server = require('./app');

const db = process.env.DATABASE_WZ;

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('DATABASE CONNECTED');
    return server.listen({ port: 8000 });
}).then((res) => {
    console.log(`Server running at port ${res.url}`)
})

// SERVER ERROR EX: NOT CONNECTED TO DATABASE
process.on('unhandledRejection', err => {
    console.log('UNHANDLER REJECTION SHUTDOWN...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
});
