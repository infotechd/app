// src/routes/contratacaoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as contratacaoController from '../controllers/contratacaoController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate, validateParams, validateQuery } from '../middlewares/zodValidationMiddleware';
import { 
  criarContratacaoSchema, 
  atualizarStatusContratacaoSchema, 
  contratacaoParamsSchema,
  listarContratacoesQuerySchema
} from '../schemas/contratacaoSchema';
// Exemplo: Importar middlewares de autorização específicos
// import { isBuyer } from '../middlewares/authorizationMiddleware';
// import { isParticipant } from '../middlewares/authorizationMiddleware'; // Verifica se é buyer OU prestador da contratação
// import { isPrestadorOfContratacao } from '../middlewares/authorizationMiddleware'; // Verifica se é o prestador da contratação

const router: Router = Router();

// --- ROTAS DE CONTRATAÇÃO (Todas protegidas por authMiddleware) ---
// A AUTORIZAÇÃO específica (é Buyer? é Prestador? é participante?) deve ser verificada
// dentro dos controllers ou em middlewares de autorização adicionais.

// POST /api/contratacoes : Buyer contrata uma oferta (CU5)
// Controller deve verificar se req.user.tipoUsuario === 'comprador'
router.post(
  '/',
  authMiddleware,
  // isBuyer, // Middleware opcional
  validate(criarContratacaoSchema),
  contratacaoController.contratarOferta
);

// GET /api/contratacoes : Lista as contratações do usuário logado (Buyer ou Prestador)
// Controller deve buscar baseado no req.user.userId (seja como buyerId ou prestadorId)
router.get(
  '/',
  authMiddleware,
  validateQuery(listarContratacoesQuerySchema),
  contratacaoController.listarMinhasContratacoes // Função a ser criada
);

// GET /api/contratacoes/:contratacaoId : Obtém detalhes de uma contratação específica
// Controller deve verificar se req.user é participante (buyer ou prestador) da contratacaoId
router.get(
  '/:contratacaoId',
  authMiddleware,
  // isParticipant, // Middleware opcional
  validateParams(contratacaoParamsSchema),
  contratacaoController.obterDetalhesContratacao // Função a ser criada
);

// PATCH /api/contratacoes/:contratacaoId/status : Atualiza o status da contratação
// Controller deve verificar se req.user é participante E tem permissão para mudar para o novo status
// Ex: Prestador aceita, Prestador conclui, Buyer/Prestador cancela?
router.patch(
  '/:contratacaoId/status',
  authMiddleware,
  // isParticipant, // Middleware opcional
  // canUpdateStatus(targetStatus), // Middleware mais complexo opcional
  validateParams(contratacaoParamsSchema),
  validate(atualizarStatusContratacaoSchema),
  contratacaoController.atualizarStatusContratacao // Função a ser criada
);

// (Alternativa/Adicional) Rotas mais específicas para mudança de status:
// POST /api/contratacoes/:contratacaoId/accept : Prestador aceita a contratação
// router.post('/:contratacaoId/accept', authMiddleware, isPrestadorOfContratacao, contratacaoController.aceitarContratacao);

// POST /api/contratacoes/:contratacaoId/complete : Prestador marca como concluída (CU16)
// router.post('/:contratacaoId/complete', authMiddleware, isPrestadorOfContratacao, contratacaoController.marcarComoConcluido);

// POST /api/contratacoes/:contratacaoId/cancel : Buyer ou Prestador cancela
// router.post('/:contratacaoId/cancel', authMiddleware, isParticipant, contratacaoController.cancelarContratacao);


// Exporta o router configurado
export default router;
