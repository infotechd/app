// 1. Carrega variáveis de ambiente do .env (Deve ser uma das primeiras linhas!)
// Usando import para carregar e configurar dotenv
import dotenv from 'dotenv';
dotenv.config();

// 2. Importa Módulos Essenciais usando sintaxe ES Module (import)
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import http from 'http';
import { Server, Socket } from 'socket.io'; // Importa tipos do Socket.IO
import jwt, { JwtPayload } from 'jsonwebtoken'; // Importa tipos do jsonwebtoken
import { TipoUsuarioEnum } from './models/User'; // Importa o enum de tipos de usuário
import comentarioRoutes from './routes/comentarioRoutes';
import curtidaRoutes from './routes/curtidaRoutes';
import bloqueioAgendaRoutes from './routes/bloqueioAgendaRoutes';
import curriculoRoutes from './routes/curriculoRoutes';
import ofertaRoutes from './routes/ofertaRoutes';
import contratacaoRoutes from './routes/contratacaoRoutes';
import negociacaoRoutes from './routes/negociacaoRoutes';
import publicacaoComunidade from './routes/publicacaoComunidadeRoutes';
import notificacaoRoutes from './routes/notificacaoRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import treinamentoRoutes from './routes/treinamentoRoutes';
import agendaRoutes from './routes/agendaRoutes';
import errorMiddleware from './middlewares/errorMiddleware';


// Importa o handler de erros assíncronos (executa o código do módulo)
import 'express-async-errors';

// Importa o manipulador de lógica do Socket.IO (assumindo que foi convertido para TS também)
// Se socketHandler.ts exportar uma função default:
import initializeSocketIO from './socketHandler';
// Se exportar uma função nomeada: import { initializeSocketIO } from './socketHandler';

// Importa as rotas da API (assumindo que foram convertidas para TS e exportam o router)
import authRoutes from './routes/authRoutes';
// Exemplo: import ofertaRoutes from './routes/ofertaRoutes';
// ... outras rotas

// Define uma interface para o payload decodificado do JWT
export interface DecodedUserToken extends JwtPayload {
  userId: string;
  tipoUsuario: TipoUsuarioEnum;
}

// Estende a interface do Socket para incluir nossa propriedade 'user'
declare module 'socket.io' {
  interface Socket {
    user?: DecodedUserToken; // Torna a propriedade 'user' conhecida pelo TypeScript no objeto Socket
  }
}


// 3. Validação inicial de variáveis de ambiente críticas (com type assertion)
const MONGO_URI = process.env.MONGO_URI as string;
const JWT_SECRET = process.env.JWT_SECRET as string;
const CLIENT_URL = process.env.CLIENT_URL; // Pode ser undefined, tratado no CORS
const PORT = process.env.PORT || '3000'; // Default como string, será parseado depois

if (!MONGO_URI) {
  console.error("ERRO FATAL: MONGO_URI não definida no .env");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("ERRO FATAL: JWT_SECRET não definida no .env");
  process.exit(1);
}
if (!CLIENT_URL) {
  console.warn("AVISO: CLIENT_URL não definida no .env. CORS pode não funcionar como esperado.");
}

// 4. Cria a Instância do Express com Tipagem
const app: Express = express();

// 5. Configuração de Middlewares Globais com Tipagem
// Configura CORS
app.use(cors({
  origin: CLIENT_URL || '*', // Permite origem do .env ou qualquer origem se não definido (CUIDADO em produção!)
  credentials: true,
}));
// Interpreta JSON
app.use(express.json());
// Interpreta cookies
app.use(cookieParser());

// Middleware simples de log de requisições com tipos
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// 6. Conexão com o Banco de Dados (MongoDB) - Async/Await é uma boa prática aqui
// (Função auto-executável para usar await no nível superior)
(async () => {
  try {
    await mongoose.connect(MONGO_URI); // Opções não são mais necessárias
    console.log('MongoDB Conectado com Sucesso.');
  } catch (err) {
    console.error('Erro fatal na conexão com MongoDB:', err);
    process.exit(1);
  }
})();


// 7. Configuração das Rotas da API
// Assumindo que authRoutes é um express.Router()
app.use('/api/auth', authRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api/contratacao', contratacaoRoutes);
app.use('/api/contratacoes', contratacaoRoutes);
// ... registrar outras rotas aqui
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/comentario', comentarioRoutes);
app.use('/api/curtidas', curtidaRoutes);
app.use('/api/bloqueios-agenda', bloqueioAgendaRoutes); // Ou o prefixo que preferir
app.use('/api/curriculos', curriculoRoutes);
app.use('/api/negociacoes', negociacaoRoutes);
app.use('/api/publicacao-comunidade', publicacaoComunidade);
app.use('/api/publicacoes-comunidade', publicacaoComunidade);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/treinamentos', treinamentoRoutes);
app.use('/api/agenda', agendaRoutes);

// 8. Criação do Servidor HTTP e Configuração do Socket.IO
const server = http.createServer(app); // Servidor HTTP usando o app Express

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL || '*',
    credentials: true
  }
  // NOTA: Adapter para escalar...
});

// Middleware de Autenticação para Socket.IO com tipos
io.use((socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token as string | undefined; // Pega o token
  if (!token) {
    return next(new Error("Falha na autenticação: Token não fornecido."));
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
    if (err || !decoded || typeof decoded === 'string') { // Verifica se err existe ou se decoded não é um objeto esperado
      return next(new Error("Falha na autenticação: Token inválido."));
    }
    // Anexa informações do usuário ao objeto socket com tipo definido
    socket.user = decoded as DecodedUserToken; // Faz type assertion após verificar
    next(); // Permite a conexão
  });
});

// Inicializa a lógica de manipulação de eventos do Socket.IO
// Passa a instância 'io' tipada como Server
initializeSocketIO(io);


// 9. Middleware de Tratamento de Erros Centralizado com tipos
// Precisa estar depois das rotas e antes do server.listen
app.use(errorMiddleware);


// 10. Inicialização do Servidor
server.listen(parseInt(PORT, 10), () => { // Faz parse do PORT para número
  console.log(`Servidor backend rodando na porta ${PORT}`);
  console.log(`Frontend esperado em: ${CLIENT_URL || '(URL não definida!)'}`);
});

// 11. (Opcional) Tratamento para encerramento gracioso
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(async () => { // Adiciona async para usar await no mongoose.close
    console.log('Servidor HTTP encerrado.');
    try {
      await mongoose.connection.close(false); // Usa await para fechar mongoose
      console.log('Conexão MongoDB encerrada.');
    } catch (err) {
      console.error('Erro ao fechar conexão MongoDB:', err);
    } finally {
      process.exit(0);
    }
  });
});
