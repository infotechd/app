// Importa o tipo CorsOptions do pacote cors para tipar a configuração
import { CorsOptions } from 'cors';
// Importa o pacote dotenv para carregar variáveis de ambiente
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Define as opções de configuração CORS
const corsOptions: CorsOptions = {
  // Define as origens permitidas, dividindo a string de URLs em um array
  origin: process.env.CLIENT_URL?.split(','),
  // Permite o envio de credenciais (cookies, cabeçalhos de autenticação) nas requisições
  credentials: true,
};

// Exporta as configurações CORS para uso em outros módulos
export default corsOptions;
