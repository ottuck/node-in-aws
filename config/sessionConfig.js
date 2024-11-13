// config/sessionConfig.js
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redisConfig.js';
import dotenv from 'dotenv';

dotenv.config();

const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
};

export const sessionMiddleware = session(sessionConfig);
