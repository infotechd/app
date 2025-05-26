// 1. Carrega variáveis de ambiente do arquivo .env (Deve ser uma das primeiras linhas!)
// Importa e configura o dotenv para acessar as variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

// 2. Importa os módulos essenciais para o funcionamento da aplicação
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import http from 'http';
import { Server, Socket } from 'socket.io'; // Importa os tipos do Socket.IO para comunicação em tempo real
import jwt, { JwtPayload } from 'jsonwebtoken'; // Importa os tipos do jsonwebtoken para autenticação
import { TipoUsuarioEnum } from './models/User'; // Importa o enum que define os tipos de usuário
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
import uploadRoutes from './routes/uploadRoutes';
import errorMiddleware from './middlewares/errorMiddleware';
import path from 'path';


// Importa o módulo para tratamento de erros assíncronos
import 'express-async-errors';

// Importa o manipulador de lógica do Socket.IO para comunicação em tempo real
import initializeSocketIO from './socketHandler';

// Importa as rotas de autenticação da API
import authRoutes from './routes/authRoutes';

// Define uma interface para o payload decodificado do JWT
export interface DecodedUserToken extends JwtPayload {
  userId: string;
  tipoUsuario: TipoUsuarioEnum;
}

// Estende a interface do Socket para incluir nossa propriedade 'user'
declare module 'socket.io' {
  interface Socket {
    user?: DecodedUserToken; // Adiciona a propriedade 'user' ao objeto Socket para acesso às informações do usuário
  }
}


// 3. Validação inicial das variáveis de ambiente críticas para o funcionamento da aplicação
const MONGO_URI = process.env.MONGO_URI as string;
const JWT_SECRET = process.env.JWT_SECRET as string;
const CLIENT_URL = process.env.CLIENT_URL; // URL do cliente, pode ser indefinida e será tratada na configuração do CORS
const PORT = process.env.PORT || '3000'; // Porta padrão como string, será convertida para número posteriormente

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

// 4. Cria a instância do Express com tipagem adequada
const app: Express = express();

// 5. Configuração dos middlewares globais da aplicação
// Importa as configurações CORS do arquivo de configuração
import corsOptions from './config/cors';
// Configura o CORS para permitir requisições do cliente
app.use(cors(corsOptions));
// Configura o middleware para interpretar requisições com corpo JSON
app.use(express.json());
// Configura o middleware para interpretar cookies
app.use(cookieParser());
// Configura o middleware para servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware para registrar logs de todas as requisições recebidas
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// 6. Estabelece conexão com o banco de dados MongoDB
// Utiliza uma função auto-executável assíncrona para permitir o uso de await no nível superior
(async () => {
  try {
    await mongoose.connect(MONGO_URI); // Conecta ao MongoDB usando a URI definida nas variáveis de ambiente
    console.log('MongoDB Conectado com Sucesso.');
  } catch (err) {
    console.error('Erro fatal na conexão com MongoDB:', err);
    process.exit(1); // Encerra a aplicação em caso de falha na conexão
  }
})();


// 7. Configuração das rotas da API para os diferentes recursos da aplicação

// Endpoint de saúde para verificação de conectividade
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
});

app.use('/api/auth', authRoutes); // Rotas de autenticação
app.use('/api/ofertas', ofertaRoutes); // Rotas para gerenciamento de ofertas
app.use('/api/contratacoes', contratacaoRoutes); // Rotas para gerenciamento de contratações
app.use('/api/comentarios', comentarioRoutes); // Rotas para gerenciamento de comentários
app.use('/api/curtidas', curtidaRoutes); // Rotas para gerenciamento de curtidas
app.use('/api/bloqueios-agenda', bloqueioAgendaRoutes); // Rotas para gerenciamento de bloqueios na agenda
app.use('/api/curriculos', curriculoRoutes); // Rotas para gerenciamento de currículos
app.use('/api/negociacoes', negociacaoRoutes); // Rotas para gerenciamento de negociações
app.use('/api/publicacoes-comunidade', publicacaoComunidade); // Rotas para gerenciamento de publicações na comunidade
app.use('/api/notificacoes', notificacaoRoutes); // Rotas para gerenciamento de notificações
app.use('/api/relatorios', relatorioRoutes); // Rotas para geração de relatórios
app.use('/api/treinamentos', treinamentoRoutes); // Rotas para gerenciamento de treinamentos
app.use('/api/agenda', agendaRoutes); // Rotas para gerenciamento de agenda
app.use('/api/upload', uploadRoutes); // Rotas para upload de arquivos

// 8. Criação do servidor HTTP e configuração do Socket.IO para comunicação em tempo real
const server = http.createServer(app); // Cria o servidor HTTP utilizando a aplicação Express

const io = new Server(server, {
  cors: corsOptions // Usa a mesma configuração CORS do Express
  // Para escalar horizontalmente, seria necessário configurar um adaptador aqui
});

// Middleware de autenticação para conexões Socket.IO
io.use((socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token as string | undefined; // Obtém o token de autenticação do handshake
  if (!token) {
    return next(new Error("Falha na autenticação: Token não fornecido."));
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
    if (err || !decoded || typeof decoded === 'string') { // Verifica se há erro ou se o token decodificado não é válido
      return next(new Error("Falha na autenticação: Token inválido."));
    }
    // Anexa as informações do usuário autenticado ao objeto socket
    socket.user = decoded as DecodedUserToken; // Converte o payload decodificado para o tipo DecodedUserToken
    next(); // Permite que a conexão prossiga
  });
});

// Inicializa o gerenciador de eventos do Socket.IO com a instância configurada
initializeSocketIO(io);


// 9. Configuração do middleware centralizado para tratamento de erros
// Este middleware deve ser registrado após todas as rotas e antes da inicialização do servidor
app.use(errorMiddleware);


// 10. Inicialização do servidor com mecanismo de recuperação para porta em uso
const startServer = (port: number) => {
  server.listen(port, () => {
    console.log(`Servidor backend rodando na porta ${port}`);
    console.log(`Frontend esperado em: ${CLIENT_URL || '(URL não definida!)'}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Porta ${port} já está em uso, tentando porta ${port + 1}...`);
      startServer(port + 1); // Tenta iniciar o servidor na próxima porta disponível
    } else {
      console.error('Erro ao iniciar o servidor:', err);
    }
  });
};

// Inicia o servidor na porta configurada
startServer(parseInt(PORT, 10));

// 11. Configuração para encerramento gracioso do servidor
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(async () => { // Função assíncrona para permitir o uso de await
    console.log('Servidor HTTP encerrado.');
    try {
      await mongoose.connection.close(false); // Fecha a conexão com o MongoDB de forma limpa
      console.log('Conexão MongoDB encerrada.');
    } catch (err) {
      console.error('Erro ao fechar conexão MongoDB:', err);
    } finally {
      process.exit(0); // Encerra o processo com código de sucesso
    }
  });
});
