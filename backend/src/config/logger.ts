// src/config/logger.ts

/**
 * Configuração do logger Winston para a aplicação.
 * Logs para console e arquivos rotacionados diariamente.
 */
import winston, { format, LoggerOptions, transport, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Módulo para rotação diária de arquivos de log
import path from 'path';
import fs from 'fs';

// Desestruturação das funções de formatação do Winston
const { combine, timestamp, printf, colorize, errors } = format;

// --- Criação do diretório de logs ---
// Define o caminho absoluto para a pasta de logs na raiz do projeto backend
const logDirectory = path.resolve(process.cwd(), 'logs'); 
// Verifica se o diretório de logs existe, caso contrário, cria
if (!fs.existsSync(logDirectory)) {
  try {
    fs.mkdirSync(logDirectory);
    console.log(`Diretório de logs criado em: ${logDirectory}`);
  } catch (err) {
    console.error(`Falha ao criar diretório de logs em ${logDirectory}:`, err);
    // Podemos considerar lançar erro ou logar apenas no console se não conseguir criar
  }
}


// --- Formato dos Logs ---

// Formato para o console (com cores para melhor visualização)
const consoleLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Formato de data e hora personalizado
  colorize(), // Adiciona cores diferentes para cada nível de log
  printf(({ level, message, timestamp, stack }) => {
    // Inclui informações de stack trace quando disponíveis (útil para erros)
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Formato para arquivos (em JSON para facilitar análise posterior)
const fileLogFormat = combine(
  timestamp(), // Usa o formato padrão ISO 8601 para timestamp
  errors({ stack: true }), // Garante que os stack traces de erros sejam incluídos no log
  format.json() // Formata toda a entrada de log como um objeto JSON
);

// --- Configuração dos Transportes de Log ---

// Transporte para Console (com formato colorido para facilitar leitura)
const consoleTransport = new winston.transports.Console({
  format: consoleLogFormat,
  level: process.env.LOG_LEVEL || 'info', // Nível de log configurável via variável de ambiente
});

// Transporte para Arquivo de Erros (com rotação diária)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDirectory, 'error-%DATE%.log'), // Nome do arquivo com data
  datePattern: 'YYYY-MM-DD', // Padrão de data para rotação
  zippedArchive: true, // Compacta arquivos antigos
  maxSize: '20m', // Tamanho máximo do arquivo antes de rotacionar
  maxFiles: '14d', // Mantém logs por 14 dias
  level: 'error', // Registra apenas mensagens de erro
  format: fileLogFormat, // Usa o formato JSON para os arquivos
});

// Transporte para Arquivo Combinado (todos os níveis de log)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logDirectory, 'combined-%DATE%.log'), // Nome do arquivo com data
  datePattern: 'YYYY-MM-DD', // Padrão de data para rotação
  zippedArchive: true, // Compacta arquivos antigos
  maxSize: '20m', // Tamanho máximo do arquivo antes de rotacionar
  maxFiles: '14d', // Mantém logs por 14 dias
  level: process.env.LOG_LEVEL || 'info', // Usa o mesmo nível configurado para o console
  format: fileLogFormat, // Usa o formato JSON para os arquivos
});


// --- Criação do Logger ---

// Configurações gerais do logger
const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info', // Nível base de log para toda a aplicação
  format: fileLogFormat, // Formato padrão (cada transporte pode sobrescrever)
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport
  ],
  exitOnError: false, // Impede que a aplicação seja encerrada em caso de erros no logger
};

// Cria a instância do logger com as configurações definidas
const logger: Logger = winston.createLogger(loggerOptions);

// Logs iniciais para confirmar a inicialização do logger
logger.info('Logger Winston inicializado.');
logger.debug('Log de Debug habilitado (se LOG_LEVEL=debug).');


// --- Exportação ---
// Exporta o logger configurado para ser usado em toda a aplicação
export default logger;
