"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const error_middleware_1 = require("./app/middlewares/error.middleware");
const routes_1 = __importDefault(require("./app/routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '100000kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100000kb' }));
app.use((0, cookie_parser_1.default)());
// Enable CORS
app.use((0, cors_1.default)());
app.options('*', (0, cors_1.default)());
// 2) ROUTES
app.get("/", (req, res) => {
    res.send("Welcome To YMA Bouncy Castle API V1");
});
app.use(routes_1.default);
// 3) ERROR HANDLING
app.use(error_middleware_1.errorConverter);
app.use(error_middleware_1.errorHandler);
exports.default = app;
