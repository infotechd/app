// Arquivo de rotas para gerenciamento de contratações

import { Router } from 'express';
// Importação dos controladores e middlewares necessários
import * as contratacaoController from '../controllers/contratacaoController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate, validateParams, validateQuery } from '../middlewares/zodValidationMiddleware';
import { 
  criarContratacaoSchema, 
  atualizarStatusContratacaoSchema, 
  contratacaoParamsSchema,
  listarContratacoesQuerySchema
} from '../schemas/contratacaoSchema';
// Middlewares de autorização que podem ser utilizados futuramente:
// import { isBuyer } from '../middlewares/authorizationMiddleware';
// import { isParticipant } from '../middlewares/authorizationMiddleware'; // Verifica se o usuário é comprador OU prestador da contratação
// import { isPrestadorOfContratacao } from '../middlewares/authorizationMiddleware'; // Verifica se o usuário é o prestador da contratação específica

// Inicialização do roteador
const router: Router = Router();

// --- ROTAS DE CONTRATAÇÃO (Todas protegidas por authMiddleware) ---
// A autorização específica (é Comprador? é Prestador? é participante?) deve ser verificada
// dentro dos controllers ou em middlewares de autorização adicionais.

// Rota: POST /api/contratacoes
// Descrição: Permite que um comprador contrate uma oferta
// Caso de uso: CU5
// Observação: O controller deve verificar se req.user.tipoUsuario === 'comprador'
router.post(
  '/',
  authMiddleware,
  // isBuyer, // Middleware opcional para verificação de tipo de usuário
  validate(criarContratacaoSchema),
  contratacaoController.contratarOferta
);

// Rota: GET /api/contratacoes
// Descrição: Lista as contratações do usuário logado (Comprador ou Prestador)
// Observação: O controller deve buscar baseado no req.user.userId (seja como buyerId ou prestadorId)
router.get(
  '/',
  authMiddleware,
  validateQuery(listarContratacoesQuerySchema),
  contratacaoController.listarMinhasContratacoes // Função a ser implementada
);

// Rota: GET /api/contratacoes/:contratacaoId
// Descrição: Obtém detalhes de uma contratação específica
// Observação: O controller deve verificar se o usuário é participante (comprador ou prestador) da contratação
router.get(
  '/:contratacaoId',
  authMiddleware,
  // isParticipant, // Middleware opcional para verificação de participação
  validateParams(contratacaoParamsSchema),
  contratacaoController.obterDetalhesContratacao // Função a ser implementada
);

// Rota: PATCH /api/contratacoes/:contratacaoId/status
// Descrição: Atualiza o status da contratação
// Observação: O controller deve verificar se o usuário é participante E tem permissão para mudar para o novo status
// Exemplos: Prestador aceita, Prestador conclui, Comprador/Prestador cancela
router.patch(
  '/:contratacaoId/status',
  authMiddleware,
  // isParticipant, // Middleware opcional para verificação de participação
  // canUpdateStatus(targetStatus), // Middleware mais complexo opcional para verificação de permissão
  validateParams(contratacaoParamsSchema),
  validate(atualizarStatusContratacaoSchema),
  contratacaoController.atualizarStatusContratacao // Função a ser implementada
);

// Rotas alternativas/adicionais mais específicas para mudança de status:

// Rota: POST /api/contratacoes/:contratacaoId/accept
// Descrição: Permite que o prestador aceite a contratação
// router.post('/:contratacaoId/accept', authMiddleware, isPrestadorOfContratacao, contratacaoController.aceitarContratacao);

// Rota: POST /api/contratacoes/:contratacaoId/complete
// Descrição: Permite que o prestador marque a contratação como concluída
// Caso de uso: CU16
// router.post('/:contratacaoId/complete', authMiddleware, isPrestadorOfContratacao, contratacaoController.marcarComoConcluido);

// Rota: POST /api/contratacoes/:contratacaoId/cancel
// Descrição: Permite que o comprador ou prestador cancele a contratação
// router.post('/:contratacaoId/cancel', authMiddleware, isParticipant, contratacaoController.cancelarContratacao);


// Exportação do roteador configurado
export default router;
