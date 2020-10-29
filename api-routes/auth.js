const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

/**
 * 
 * @param {User} user - User Object
 * @param {Number} statusCode - HTTP response status code
 * @param {HTTP Response} res - HTTP response when gets an HTTP Request
 */
const sendToken = (user, statusCode, res) => {
    // Get user id
    const { _id } = user;

    // JWT Sign for token
    const token = jwt.sign({ _id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Set cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 25 * 60 * 60 * 1000),
        httpOnly: true
    }

    // cookie will send encrypt version (only in https)
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // Set cookie jwt (additional security)
    res.cookie('jwt', token, cookieOptions);

    // Remove password from the output
    user.password = undefined;

    // Return JSON
    res.status(statusCode).json({
        token,
        user
    });
}


// @route   GET /
// @desc    Authenticated user only || Logged in user only
// @access  Private
router.get('/', protect, (req, res) => {
    res.status(200).json({
        user: req.user
    })
})

// @route   POST api/v1/auth/signUp
// @desc    Creates a user
// @access  public
router.post('/signUp', [
    // firstname and lastname must be not empty
    check('firstname').not().isEmpty().withMessage('firstname is required'),
    check('lastname').not().isEmpty().withMessage('lastname is required'),
    // email must be an email
    check('email').isEmail().withMessage('not recognize as email'),
    // password in only min of 6 char and max of 16 char
    check('password').isLength({ min: 6, max: 16 }).withMessage('Password must be at least minimum of 6 char and max of 16')
], async(req, res) => {
    const errors = validationResult(req);
    // Check if user exist and return error msg if it does
    const checkUser = await User.findOne({ email: req.body.email });
    if(checkUser) return res.status(400).json({ errors: [{ msg: 'Email already exist' }]})
    // Sign Up User
    const { firstname, lastname, email, password, passwordConfirm } = req.body;
    if(password !== passwordConfirm) return res.status(401).json({ errors: [{ msg: 'Password not the same.' }]});
    
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    } else {
        const user = await User.create({
            firstname, lastname, email, password
        });

        // Send token
        sendToken(user, 201, res);
    }
});

// @route   POST api/v1/auth/login
// @desc    Logins a user
// @access  public
router.post('/signIn', async(req, res) => {
    const { email, password } = req.body;
    // check if email and password exists
    // msg: incorrect email and password (security reasons)
    if(!email || !password) return res.status(400).json({ errors: [{ msg: 'Incorrect email or password' }]});

    // check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password');
    if(!user) {
        return res.status(401).json({ errors: [{ msg: 'Incorrect email or password' }] });
    }
    if(!user || !await user.comparePassword(password, user.password)) return res.status(400).json({ errors: [{ msg: 'Incorrect email or password' }]});
    // send token
    sendToken(user, 200, res);
});

// @route   POST api/v1/auth/signOut
// @desc    Sign Out a user
// @access  public
router.get('/signOut', async(req, res, next) => {
    delete req.header('Authorization');
    res.cookie('jwt', 'im done logging out!!!');
    res.status(200).json()
});


module.exports = router;