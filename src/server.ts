// src/server.ts
import dotenv from 'dotenv';
dotenv.config();
import app from './app';

const PORT: number = Number(process.env.PORT) || 3000;

console.log('PORT:', process.env.PORT);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});