import express from 'express';
import { PORT } from './config/env.js'

import User from './models/user.model.js';
import userRouter from './routes/user.routes.js'
import connectToDatabase from './database/mongodb.js';
import errorMiddleware from './middlewares/error.middlewares.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

const cors = require('cors');
const allowedOrigins = [
  'http://localhost:3000',      // Your local dev server
  'https://personal-schedule-opal.vercel.app/' // Your actual Vercel deployment URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // Allow cookies/auth headers if needed
}));

app.use('/api/v1/users',userRouter);
app.use(errorMiddleware);

app.get('/', (req,res) => {
    res.send("Hello, World!");
});

app.listen(PORT,async()=>{
    console.log("Server is running at port " + PORT);

    await connectToDatabase();
    await User.syncIndexes();
});