// routes/chatRoutes.js
import express from 'express';

export const chatRouter = express.Router();

chatRouter.get('/', (req, res) => {
  res.sendFile('chat.html', { root: './public' });
});
