"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireAdmin = requireAdmin;
exports.generateToken = generateToken;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_js_1 = require("../config.js");
// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_js_1.config.jwt.secret);
        req.user = {
            walletAddress: decoded.walletAddress,
            isAdmin: decoded.isAdmin || false,
        };
        next();
    }
    catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
// Middleware to require admin access
function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
// Generate a JWT token for a wallet address
function generateToken(walletAddress, isAdmin = false) {
    return jsonwebtoken_1.default.sign({ walletAddress, isAdmin }, config_js_1.config.jwt.secret, {
        expiresIn: config_js_1.config.jwt.expiresIn,
    });
}
// Middleware to optionally authenticate (doesn't require auth but will use it if present)
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_js_1.config.jwt.secret);
            req.user = {
                walletAddress: decoded.walletAddress,
                isAdmin: decoded.isAdmin || false,
            };
        }
        catch {
            // Invalid token, but continue without auth
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map