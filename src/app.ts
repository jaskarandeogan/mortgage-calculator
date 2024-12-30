// src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import ejsLayouts from 'express-ejs-layouts';  // Add this import
import mortgageRoutes from './routes/mortgageRoutes';
import path from 'path';

const app: Application = express();

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts); 
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// APIs
app.use('/api/mortgage', mortgageRoutes);

// Pages
app.get('/mortgage/calculator', (_, res) => {
    res.render('mortgage/calculator', {
        title: 'Mortgage Calculator',
        scripts: ['/js/mortgage-calculator.js']
    });
});

app.get('/', (_, res) => {
    res.render('home/home', {
        title: 'Home'
    });
});

export default app;