// src/config/logger.ts

/**
 * Configuração do logger Winston para a aplicação.
 * Logs para console e arquivos rotacionados diariamente.
 */
import winston, { format, LoggerOptions, transport, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Importação ES Module
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors } = format;

// --- Criação do diretório de logs ---
const logDirectory = path.resolve(process.cwd(), 'logs'); // Define o caminho absoluto para logs na raiz do projeto backend
if (!fs.existsSync(logDirectory)) {
  try {
    fs.mkdirSync(logDirectory);
    console.log(`Diretório de logs criado em: ${logDirectory}`);
  } catch (err) {
    console.error(`Falha ao criar diretório de logs em ${logDirectory}:`, err);
    // Considerar lançar erro ou logar apenas no console se não conseguir criar
  }
}


// --- Formato dos Logs ---

// Formato para o console (com cores)
const consoleLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Formato de timestamp customizado
  colorize(), // Adiciona cores baseadas no nível do log
  printf(({ level, message, timestamp, stack }) => {
    // Inclui stack trace se for um log de erro
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Formato para arquivos (JSON é geralmente melhor para processamento)
const fileLogFormat = combine(
  timestamp(), // Timestamp padrão ISO 8601
  errors({ stack: true }), // Garante que stack traces de erros sejam incluídos
  format.json() // Formata a linha inteira como JSON
);

// --- Configuração dos Transports ---

// Transport para Console (com formato colorido)
const consoleTransport = new winston.transports.Console({
  format: consoleLogFormat,
  level: process.env.LOG_LEVEL || 'info', // Nível configurável via .env (default: info)
});

// Transport para Arquivo de Erros (rotacionado)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDirectory, 'error-%DATE%.log'), // Caminho completo
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error', // Apenas erros
  format: fileLogFormat, // Formato JSON para arquivos
});

// Transport para Arquivo Combinado (rotacionado)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logDirectory, 'combined-%DATE%.log'), // Caminho completo
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: process.env.LOG_LEVEL || 'info', // Usa o mesmo nível do console
  format: fileLogFormat, // Formato JSON para arquivos
});


// --- Criação do Logger ---

// Opções do logger
const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info', // Nível base (embora cada transport possa ter o seu)
  format: fileLogFormat, // Default format (embora transports usem os seus específicos)
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport
  ],
  exitOnError: false, // Não sai da aplicação em erros não tratados pelo Winston
};

// Cria a instância do logger
const logger: Logger = winston.createLogger(loggerOptions);

// Adiciona um log inicial para confirmar que o logger foi configurado
logger.info('Logger Winston inicializado.');
logger.debug('Log de Debug habilitado (se LOG_LEVEL=debug).');


// --- Exportação ---
export default logger;