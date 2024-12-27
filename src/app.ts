// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import mortgageRoutes from './routes/mortgageRoutes';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api/mortgage', mortgageRoutes);

export default app;

