import { CorsOptions } from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const corsOptions: CorsOptions = {
  origin: process.env.CLIENT_URL?.split(','), // Divide as URLs em um array
  credentials: true,
};

export default corsOptions;