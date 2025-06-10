// src/routes/relatorioRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares necessários para as rotas de relatórios
//import * as relatorioController from '../controllers/relatorioController';
//import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser utilizados (comentados até implementação)
// import { isAdmin } from '../middlewares/authorizationMiddleware';
// import { isPrestador } from '../middlewares/authorizationMiddleware';
// import { isAnunciante } from '../middlewares/authorizationMiddleware';

// Inicializa o roteador Express
const router: Router = Router();

// === ROTAS DE RELATÓRIOS ===
// Abordagem com rota única (menos recomendada, pois exige lógica complexa no controlador)

// GET /api/relatorios : Gera um relatório baseado em parâmetros de consulta
// O controlador deve:
// 1. Verificar req.user.tipoUsuario para autorização.
// 2. Ler req.query para determinar o tipo de relatório e parâmetros (datas, IDs, etc.).
// 3. Gerar e retornar o relatório apropriado se autorizado.
/*router.get(
  '/',
  authMiddleware, // Garante que o usuário está autenticado, mas não verifica autorização específica
  relatorioController.gerarRelatorio // Controlador que contém lógica de autorização e processamento
);*/


// === ROTAS DE RELATÓRIOS (Abordagem Recomendada com Rotas Específicas) ===
// Descomente e adapte estas rotas conforme os relatórios necessários para o sistema

/*
// --- Relatórios de Administrador ---
router.get(
    '/admin/demografia',
    authMiddleware,
    // isAdmin, // Middleware obrigatório para verificar se o usuário é administrador
    relatorioController.gerarRelatorioDemografia // Função que gera relatório demográfico dos usuários
);
router.get(
    '/admin/engajamento-comunidade',
    authMiddleware,
    // isAdmin, // Middleware obrigatório para verificar se o usuário é administrador
    relatorioController.gerarRelatorioEngajamento // Função que gera relatório de engajamento na comunidade
);

// --- Relatórios de Prestador de Serviço ---
router.get(
    '/prestador/minhas-vendas', // Rota para o prestador visualizar o histórico de suas vendas
    authMiddleware,
    // isPrestador, // Middleware obrigatório para verificar se o usuário é prestador
    relatorioController.gerarRelatorioVendasPrestador // Função que gera relatório usando o ID do usuário logado
);

// --- Relatórios de Anunciante ---
router.get(
    '/anunciante/meus-anuncios/performance', // Rota para anunciante visualizar desempenho geral de seus anúncios
    authMiddleware,
    // isAnunciante, // Middleware obrigatório para verificar se o usuário é anunciante
    relatorioController.gerarRelatorioPerformanceAnuncios // Função que gera relatório usando o ID do usuário logado
);
router.get(
    '/anunciante/anuncio/:anuncioId/performance', // Rota para visualizar desempenho de um anúncio específico
    authMiddleware,
    // isAnunciante, // Middleware para verificar se o usuário é anunciante
    // isAnuncioOwner, // Middleware obrigatório para verificar se o usuário é proprietário do anúncio
    relatorioController.gerarRelatorioPerformanceAnuncioUnico // Função que gera relatório para um anúncio específico
);
*/


// Exporta o roteador configurado para ser utilizado na aplicação
export default router;
