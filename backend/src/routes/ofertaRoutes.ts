// src/routes/ofertaRoutes.ts

import { Router } from 'express';
// Importa os controladores de oferta e middleware de autenticação
import  * as ofertaController from '../controllers/ofertaController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/zodValidationMiddleware';
import { searchPublicOfertasSchema } from '../schemas/ofertaSchema';
// Middlewares de autorização que podem ser implementados futuramente
// import { isPrestador } from '../middlewares/authorizationMiddleware';
// import { isOfertaOwner } from '../middlewares/authorizationMiddleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     Disponibilidade:
 *       type: object
 *       properties:
 *         recorrenciaSemanal:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               diaSemana:
 *                 type: number
 *                 description: Dia da semana (0-6, onde 0 é domingo)
 *               horarios:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inicio:
 *                       type: string
 *                       format: time
 *                       example: "09:00"
 *                     fim:
 *                       type: string
 *                       format: time
 *                       example: "17:00"
 *     Localizacao:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           description: Estado onde o serviço é oferecido
 *         cidade:
 *           type: string
 *           description: Cidade onde o serviço é oferecido
 *     OfertaInput:
 *       type: object
 *       required:
 *         - descricao
 *         - preco
 *         - categorias
 *         - localizacao
 *       properties:
 *         descricao:
 *           type: string
 *           description: Descrição detalhada da oferta de serviço
 *         preco:
 *           type: number
 *           description: Preço do serviço
 *           minimum: 0
 *         status:
 *           type: string
 *           enum: [draft, ready, inactive, archived]
 *           description: Status da oferta (rascunho, disponível, pausado, encerrado)
 *         disponibilidade:
 *           $ref: '#/components/schemas/Disponibilidade'
 *         categorias:
 *           type: array
 *           items:
 *             type: string
 *           description: Categorias às quais a oferta pertence
 *         localizacao:
 *           $ref: '#/components/schemas/Localizacao'
 *     Oferta:
 *       allOf:
 *         - $ref: '#/components/schemas/OfertaInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: ID único da oferta
 *             prestadorId:
 *               type: string
 *               description: ID do prestador que criou a oferta
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Data de criação da oferta
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Data da última atualização da oferta
 *   responses:
 *     UnauthorizedError:
 *       description: Acesso não autorizado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Autenticação necessária.
 *     NotFoundError:
 *       description: Recurso não encontrado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Oferta não encontrada.
 *     ValidationError:
 *       description: Erro de validação
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Erro de validação
 *               errors:
 *                 type: object
 *
 * tags:
 *   - name: Ofertas
 *     description: Operações relacionadas a ofertas de serviço
 */

// Inicializa o roteador Express
const router: Router = Router();

// === ROTAS PÚBLICAS / PARA COMPRADORES ===

/**
 * @swagger
 * /ofertas/search:
 *   get:
 *     summary: Busca e lista ofertas disponíveis para o público
 *     description: Retorna uma lista paginada de ofertas de serviço disponíveis, com opções de filtro e ordenação.
 *     tags: [Ofertas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página para paginação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "-createdAt"
 *         description: Campo e direção de ordenação (prefixo - para descendente)
 *       - in: query
 *         name: precoMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Preço máximo para filtrar ofertas
 *       - in: query
 *         name: textoPesquisa
 *         schema:
 *           type: string
 *         description: Texto para buscar no título e descrição das ofertas
 *       - in: query
 *         name: categorias
 *         schema:
 *           type: string or array
 *         description: Categoria(s) para filtrar ofertas
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Estado para filtrar ofertas por localização
 *       - in: query
 *         name: cidade
 *         schema:
 *           type: string
 *         description: Cidade para filtrar ofertas por localização (requer estado)
 *     responses:
 *       200:
 *         description: Lista paginada de ofertas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ofertas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Oferta'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                 totalOfertas:
 *                   type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/search', validate({ query: searchPublicOfertasSchema }), ofertaController.searchPublicOfertas);

/**
 * @swagger
 * /ofertas/{ofertaId}/public:
 *   get:
 *     summary: Obtém detalhes públicos de uma oferta específica
 *     description: Retorna os detalhes completos de uma oferta disponível pelo seu ID.
 *     tags: [Ofertas]
 *     parameters:
 *       - in: path
 *         name: ofertaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da oferta a ser consultada
 *     responses:
 *       200:
 *         description: Detalhes da oferta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Oferta'
 *       400:
 *         description: ID da oferta inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID da oferta inválido.
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:ofertaId/public', /* authMiddleware (opcional), */ ofertaController.getPublicOfertaById);


// === ROTAS PRIVADAS / PARA PRESTADORES ===
// Todas as rotas a seguir necessitam que o usuário esteja autenticado (authMiddleware)
// A verificação de permissões (ser Prestador e/ou Dono da oferta) deve ser implementada nos controladores ou middlewares específicos

/**
 * @swagger
 * /ofertas:
 *   post:
 *     summary: Cria uma nova oferta de serviço
 *     description: Permite que um prestador crie uma nova oferta de serviço.
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfertaInput'
 *           example:
 *             descricao: "Serviço de manutenção elétrica residencial"
 *             preco: 150.00
 *             status: "ready"
 *             categorias: ["Elétrica", "Manutenção"]
 *             localizacao:
 *               estado: "São Paulo"
 *               cidade: "São Paulo"
 *             disponibilidade:
 *               recorrenciaSemanal:
 *                 - diaSemana: 1
 *                   horarios:
 *                     - inicio: "09:00"
 *                       fim: "17:00"
 *                 - diaSemana: 2
 *                   horarios:
 *                     - inicio: "09:00"
 *                       fim: "17:00"
 *     responses:
 *       201:
 *         description: Oferta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta criada e publicada com sucesso.
 *                 oferta:
 *                   $ref: '#/components/schemas/Oferta'
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  '/',
  authMiddleware,
  // isPrestador, // Middleware de autorização que pode ser implementado
  ofertaController.createOferta
);

/**
 * @swagger
 * /ofertas/my-offers:
 *   get:
 *     summary: Lista ofertas do prestador autenticado
 *     description: Retorna uma lista paginada de todas as ofertas criadas pelo prestador autenticado.
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página para paginação
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RASCUNHO, DISPONIVEL, PAUSADO, ENCERRADO]
 *         description: Filtro por status da oferta
 *     responses:
 *       200:
 *         description: Lista paginada de ofertas do prestador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Oferta'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                 totalOffers:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  '/my-offers',
  authMiddleware,
  // isPrestador, // Middleware de autorização que pode ser implementado
  ofertaController.listOfertasByPrestador
);

/**
 * @swagger
 * /ofertas/{ofertaId}:
 *   get:
 *     summary: Obtém detalhes de uma oferta específica do prestador
 *     description: Retorna os detalhes completos de uma oferta específica pertencente ao prestador autenticado.
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ofertaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da oferta a ser consultada
 *     responses:
 *       200:
 *         description: Detalhes da oferta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Oferta'
 *       400:
 *         description: ID da oferta inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID da oferta inválido.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Oferta não encontrada ou não pertence ao prestador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta não encontrada ou não pertence a você.
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.getOwnOfertaDetails
);


/**
 * @swagger
 * /ofertas/{ofertaId}:
 *   put:
 *     summary: Atualiza uma oferta existente
 *     description: Permite que um prestador atualize uma oferta de serviço existente.
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ofertaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da oferta a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *                 minimum: 0
 *               status:
 *                 type: string
 *                 enum: [draft, ready, inactive, archived]
 *               disponibilidade:
 *                 $ref: '#/components/schemas/Disponibilidade'
 *           example:
 *             descricao: "Serviço de manutenção elétrica residencial atualizado"
 *             preco: 180.00
 *             status: "ready"
 *     responses:
 *       200:
 *         description: Oferta atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta atualizada com sucesso.
 *                 oferta:
 *                   $ref: '#/components/schemas/Oferta'
 *       400:
 *         description: Erro de validação ou ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erro de validação ou ID da oferta inválido.
 *                 errors:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Oferta não encontrada ou não pertence ao prestador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta não encontrada, não pertence a você ou não pode ser editada no status atual.
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.updateOferta
);

/**
 * @swagger
 * /ofertas/{ofertaId}:
 *   delete:
 *     summary: Remove uma oferta existente
 *     description: Permite que um prestador exclua uma oferta de serviço existente.
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ofertaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da oferta a ser excluída
 *     responses:
 *       200:
 *         description: Oferta excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta excluída com sucesso.
 *       400:
 *         description: ID da oferta inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID da oferta inválido.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Oferta não encontrada ou não pertence ao prestador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Oferta não encontrada ou você não tem permissão para excluí-la.
 *       500:
 *         description: Erro interno do servidor
 */
router.delete(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.deleteOferta
);


// Exporta o roteador configurado para uso no aplicativo
export default router;
