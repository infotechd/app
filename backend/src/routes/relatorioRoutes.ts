// src/routes/relatorioRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as relatorioController from '../controllers/relatorioController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isAdmin } from '../middlewares/authorizationMiddleware';
// import { isPrestador } from '../middlewares/authorizationMiddleware';
// import { isAnunciante } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE RELATÓRIOS ===
// Abordagem com rota única (menos recomendada, exige lógica complexa no controller)

// GET /api/relatorios : Gera um relatório baseado em parâmetros de query
// Controller deve:
// 1. Verificar req.user.tipoUsuario para autorização.
// 2. Ler req.query para determinar o tipo de relatório e parâmetros (datas, IDs, etc.).
// 3. Gerar e retornar o relatório apropriado se autorizado.
/*router.get(
  '/',
  authMiddleware, // Garante login, mas não autorização específica
  relatorioController.gerarRelatorio // Controller complexo com lógica de autorização e despacho
);*/


// === ROTAS DE RELATÓRIOS (Abordagem Recomendada com Rotas Específicas) ===
// Descomente e adapte estas rotas conforme os relatórios exatos necessários

/*
// --- Relatórios de Admin ---
router.get(
    '/admin/demografia',
    authMiddleware,
    // isAdmin, // Middleware OBRIGATÓRIO
    relatorioController.gerarRelatorioDemografia // Função específica
);
router.get(
    '/admin/engajamento-comunidade',
    authMiddleware,
    // isAdmin,
    relatorioController.gerarRelatorioEngajamento // Função específica
);

// --- Relatórios de Prestador ---
router.get(
    '/prestador/minhas-vendas', // Rota para o prestador logado ver suas vendas
    authMiddleware,
    // isPrestador, // Middleware OBRIGATÓRIO
    relatorioController.gerarRelatorioVendasPrestador // Função específica (usa req.user.userId)
);

// --- Relatórios de Anunciante ---
router.get(
    '/anunciante/meus-anuncios/performance', // Rota para anunciante ver performance geral
    authMiddleware,
    // isAnunciante, // Middleware OBRIGATÓRIO
    relatorioController.gerarRelatorioPerformanceAnuncios // Função específica (usa req.user.userId)
);
router.get(
    '/anunciante/anuncio/:anuncioId/performance', // Performance de um anúncio específico
    authMiddleware,
    // isAnunciante,
    // isAnuncioOwner, // Middleware OBRIGATÓRIO (verifica propriedade)
    relatorioController.gerarRelatorioPerformanceAnuncioUnico // Função específica
);
*/


// Exporta o router configurado
export default router;