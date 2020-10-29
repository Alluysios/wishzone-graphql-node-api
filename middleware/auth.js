const jwt = require('jsonwebtoken');
const User = require('../models/User');

// authorization login required.
exports.protect = async({ req }) => {
    let token;
    const authHeader = req.headers.authorization;
    // if there is a header of authorization then grab the token
    if(authHeader) {
        token = req.headers.authorization.split(' ')[1];
        if(token) {
            try {
                // decode jwt and check if current user exist
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
                const currentUser = await User.findById(decoded._id).select('-password');
        
                if(!currentUser) throw new Error('User belong to this token does no longer exist')
                req.user = currentUser;
                return {
                    token,
                    ...currentUser._doc
                };
            } catch(err) {
                throw new Error('Invalid token');
            }
        }
        throw new Error('Must be Bearer Token');
    }
    throw new Error('Authorization header must be provided');
}

exports.onlyFor = (...roles) => {
    return ({req, res}, next) => {
        return (req.user.role.includes(...roles)) ? next() : res.status(401).json({ errors: [{ msg: 'You are not authorized to perform the action' }]});
    }
}