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