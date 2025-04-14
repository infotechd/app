// index.ts
// Esse arquivo pode ser usado para importar módulos adicionais, iniciar serviços ou realizar configurações
// necessárias antes do servidor principal (server.ts) ser iniciado.
// ATENÇÃO: Verifique se este arquivo é realmente necessário ou se a lógica não pertence a server.ts.

console.log("Backend (index.ts) inicializado.");

// Exemplo: Se você tivesse inicializações complexas aqui:
// import database from './src/config/database';
// import setupMonitoring from './src/config/monitoring';
//
// async function initialize() {
//   await database.connect(); // Exemplo
//   setupMonitoring();       // Exemplo
//   console.log("Pré-inicializações concluídas.");
//   // Agora, como iniciar o server.ts a partir daqui? É mais comum o contrário.
// }
//
// initialize().catch(err => {
//   console.error("Falha na pré-inicialização:", err);
//   process.exit(1);
// });

// Exportar algo (geralmente não necessário para um script de inicialização puro)
// export {}; // Para tratar como módulo se não houver imports/exports