// src/controllers/curtidaController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose, { Types, ClientSession } from 'mongoose';
import Curtida, { ICurtida, TipoItemCurtidoEnum } from '../models/Curtida';

// --- PLACEHOLDER: Importar modelos pai ---
// Substitua pelos caminhos e nomes corretos dos seus modelos
// É ESSENCIAL que estes modelos tenham um campo como 'contagemLikes: { type: Number, default: 0 }'
import PublicacaoComunidade from '../models/PublicacaoComunidade'; // Exemplo
import Comentario from '../models/Comentario';             // Exemplo
// --- FIM PLACEHOLDER ---

// Helper para obter o modelo pai com base no tipo
const getParentModel = (tipo: TipoItemCurtidoEnum) => {
  switch (tipo) {
    case TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE:
      return PublicacaoComunidade; // Substitua se necessário
    case TipoItemCurtidoEnum.COMENTARIO:
      return Comentario;             // Substitua se necessário
    // Adicionar outros casos se houver mais tipos
    default:
      return null;
  }
};

// Helper para atualizar contagem no item pai (usado em transações)
const updateParentLikeCount = async (
  session: ClientSession,
  tipoItemCurtido: TipoItemCurtidoEnum,
  itemCurtidoId: Types.ObjectId,
  incrementValue: 1 | -1 // +1 para curtir, -1 para descurtir
): Promise<boolean> => {
  const ParentModel = getParentModel(tipoItemCurtido);
  if (!ParentModel) {
    console.error(`Modelo pai não encontrado para o tipo: ${tipoItemCurtido}`);
    return false; // Ou lançar um erro específico
  }

  try {
    const updateResult = await (ParentModel as any).updateOne(
      { _id: itemCurtidoId },
      { $inc: { contagemLikes: incrementValue } }, // Assume que o campo se chama 'contagemLikes'
      { session } // IMPORTANTE: Execut)ar dentro da sessão/transação
    );

    // Verifica se um documento foi realmente encontrado e modificado
    // updateResult.matchedCount > 0 seria suficiente se o $inc não pudesse falhar
    // updateResult.modifiedCount > 0 garante que o valor mudou (útil para decremento)
    // updateResult.acknowledged garante que a operação foi reconhecida pelo db
    // Para $inc, matchedCount é um bom indicador se o item existe.
    if (updateResult.matchedCount === 0) {
      console.warn(`Item pai ${tipoItemCurtido} com ID ${itemCurtidoId} não encontrado para ${incrementValue === 1 ? 'incrementar' : 'decrementar'} contagem.`);
      return false; // Item pai não existe
    }

    // Se chegou aqui e matchedCount > 0, a operação $inc foi aplicada (ou tentada) no item existente.
    return true;

  } catch (error) {
    console.error(`Erro ao atualizar contagemLikes para ${tipoItemCurtido} ${itemCurtidoId}:`, error);
    // Lançar o erro para abortar a transação
    throw error;
  }
};


// --- Controller Methods ---

const curtidaController = {
  /**
   * @description Usuário curte um item (Publicacao ou Comentario)
   * @route POST /api/curtidas
   * @access Private (requer autenticação)
   * @expects { itemCurtidoId: string, tipoItemCurtido: TipoItemCurtidoEnum } in body
   * @responds 201 (Created), 400 (Bad Request), 404 (Not Found - item pai), 409 (Conflict - já curtido), 500 (Server Error)
   */
  curtirItem: async (req: Request, res: Response, next: NextFunction) => {
    // Assume que o authMiddleware adiciona o ID do usuário logado em req.usuarioId
    const usuarioId = (req as any).usuarioId; // Ajuste conforme sua implementação do authMiddleware
    const { itemCurtidoId, tipoItemCurtido } = req.body;

    // 1. Validação básica de entrada
    if (!usuarioId || !itemCurtidoId || !tipoItemCurtido) {
      return res.status(400).json({ message: 'Dados incompletos (usuarioId, itemCurtidoId, tipoItemCurtido são obrigatórios).' });
    }
    if (!Types.ObjectId.isValid(itemCurtidoId)) {
      return res.status(400).json({ message: 'Formato inválido para itemCurtidoId.' });
    }
    if (!Object.values(TipoItemCurtidoEnum).includes(tipoItemCurtido)) {
      return res.status(400).json({ message: `Tipo de item curtido inválido: ${tipoItemCurtido}.` });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Tentar criar a curtida (o índice único cuidará de duplicatas)
      const novaCurtidaData = {
        usuarioId: new Types.ObjectId(usuarioId),
        itemCurtidoId: new Types.ObjectId(itemCurtidoId),
        tipoItemCurtido: tipoItemCurtido,
      };

      // Tenta criar o documento Curtida dentro da sessão
      // Usamos create com array para que ele retorne o documento criado
      const [novaCurtida] = await Curtida.create([novaCurtidaData], { session });

      // Se a curtida foi criada com sucesso (sem erro de duplicata), incrementar contador no pai
      const parentUpdateSuccess = await updateParentLikeCount(session, tipoItemCurtido, novaCurtida.itemCurtidoId, 1);

      if (!parentUpdateSuccess) {
        // Se o item pai não foi encontrado para incrementar, algo está errado. Abortar.
        throw new Error(`Item pai ${tipoItemCurtido} com ID ${itemCurtidoId} não encontrado.`);
      }

      // Se tudo deu certo, comitar a transação
      await session.commitTransaction();
      res.status(201).json(novaCurtida);

    } catch (error: any) {
      await session.abortTransaction();

      // Verificar erro de chave duplicada (usuário já curtiu)
      if (error.code === 11000) { // Código de erro do MongoDB para Duplicate Key
        // Buscar a curtida existente para retornar (opcional, mas pode ser útil)
        const curtidaExistente = await Curtida.findOne({
          usuarioId: new Types.ObjectId(usuarioId),
          itemCurtidoId: new Types.ObjectId(itemCurtidoId),
          tipoItemCurtido: tipoItemCurtido
        });
        return res.status(409).json({ message: 'Usuário já curtiu este item.', curtida: curtidaExistente });
      }

      // Verificar se foi o erro lançado por item pai não encontrado
      if (error.message.includes('Item pai') && error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      // Outros erros
      console.error("Erro ao curtir item:", error);
      next(error); // Passa para o middleware de erro do Express

    } finally {
      session.endSession();
    }
  },

  /**
   * @description Usuário descurte um item (Publicacao ou Comentario)
   * @route DELETE /api/curtidas
   * @access Private
   * @expects { itemCurtidoId: string, tipoItemCurtido: TipoItemCurtidoEnum } in body (ou query)
   * @responds 200 (OK), 400 (Bad Request), 404 (Not Found - curtida ou item pai), 500 (Server Error)
   */
  descurtirItem: async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = (req as any).usuarioId; // Ajuste conforme sua implementação
    // Permitir buscar de body ou query params
    const itemCurtidoId = req.body.itemCurtidoId || req.query.itemCurtidoId;
    const tipoItemCurtido = req.body.tipoItemCurtido || req.query.tipoItemCurtido;

    // 1. Validação básica de entrada
    if (!usuarioId || !itemCurtidoId || !tipoItemCurtido) {
      return res.status(400).json({ message: 'Dados incompletos (usuarioId, itemCurtidoId, tipoItemCurtido são obrigatórios).' });
    }
    if (!Types.ObjectId.isValid(itemCurtidoId)) {
      return res.status(400).json({ message: 'Formato inválido para itemCurtidoId.' });
    }
    if (!Object.values(TipoItemCurtidoEnum).includes(tipoItemCurtido)) {
      return res.status(400).json({ message: `Tipo de item curtido inválido: ${tipoItemCurtido}.` });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Tentar deletar a curtida
      const deleteResult = await Curtida.deleteOne(
        {
          usuarioId: new Types.ObjectId(usuarioId),
          itemCurtidoId: new Types.ObjectId(itemCurtidoId),
          tipoItemCurtido: tipoItemCurtido
        },
        { session } // IMPORTANTE: Executar dentro da sessão
      );

      // Verificar se alguma curtida foi realmente deletada
      if (deleteResult.deletedCount === 0) {
        // Se nada foi deletado, significa que o usuário não tinha curtido este item.
        // Não é necessariamente um erro, a ação foi "idempotente".
        // Pode retornar 404 se quiser ser estrito, ou 200/204 indicando sucesso no estado final.
        await session.abortTransaction(); // Nada a fazer, abortar.
        return res.status(404).json({ message: 'Curtida não encontrada para este usuário e item.' });
      }

      // Se a curtida foi deletada, decrementar o contador no item pai
      const parentUpdateSuccess = await updateParentLikeCount(
        session,
        tipoItemCurtido,
        new Types.ObjectId(itemCurtidoId),
        -1 // Decrementar
      );

      if (!parentUpdateSuccess) {
        // Embora a curtida existisse, o item pai não foi encontrado para decrementar.
        // Isso indica uma possível inconsistência de dados, mas a curtida FOI removida.
        // Decidir se aborta ou comita. Abortar pode ser mais seguro para investigar.
        console.warn(`Curtida removida, mas item pai ${tipoItemCurtido} com ID ${itemCurtidoId} não encontrado para decrementar contagem.`);
        // Poderia comitar mesmo assim, ou lançar erro. Lançar é mais seguro:
        throw new Error(`Item pai ${tipoItemCurtido} com ID ${itemCurtidoId} não encontrado para decrementar após remover curtida.`);
      }

      // Se a deleção e o decremento ocorreram, comitar
      await session.commitTransaction();
      res.status(200).json({ message: 'Item descurtido com sucesso.' }); // Ou 204 No Content

    } catch (error: any) {
      await session.abortTransaction();
      // Verificar se foi o erro lançado por item pai não encontrado
      if (error.message.includes('Item pai') && error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); // O item pai não foi encontrado durante o decremento
      }
      console.error("Erro ao descurtir item:", error);
      next(error);
    } finally {
      session.endSession();
    }
  },

  /**
   * @description Verifica se o usuário logado curtiu um item específico
   * @route GET /api/curtidas/item?itemCurtidoId=...&tipoItemCurtido=...
   * @access Private
   * @expects itemCurtidoId, tipoItemCurtido in query params
   * @responds 200 (OK com { curtiu: boolean, curtida?: ICurtida }), 400, 500
   */
  verificarCurtida: async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = (req as any).usuarioId;
    const { itemCurtidoId, tipoItemCurtido } = req.query;

    if (!usuarioId || !itemCurtidoId || !tipoItemCurtido) {
      return res.status(400).json({ message: 'Parâmetros query incompletos (itemCurtidoId, tipoItemCurtido são obrigatórios).' });
    }
    if (!Types.ObjectId.isValid(itemCurtidoId as string)) {
      return res.status(400).json({ message: 'Formato inválido para itemCurtidoId.' });
    }
    if (!Object.values(TipoItemCurtidoEnum).includes(tipoItemCurtido as TipoItemCurtidoEnum)) {
      return res.status(400).json({ message: `Tipo de item curtido inválido: ${tipoItemCurtido}.` });
    }

    try {
      const curtida = await Curtida.findOne({
        usuarioId: new Types.ObjectId(usuarioId),
        itemCurtidoId: new Types.ObjectId(itemCurtidoId as string),
        tipoItemCurtido: tipoItemCurtido as TipoItemCurtidoEnum
      });

      if (curtida) {
        res.status(200).json({ curtiu: true, curtida: curtida });
      } else {
        res.status(200).json({ curtiu: false });
      }
    } catch (error) {
      console.error("Erro ao verificar curtida:", error);
      next(error);
    }
  },

  /**
   * @description Lista itens curtidos por um usuário específico
   * @route GET /api/curtidas/user/:userId
   * @access Private (com verificação de permissão opcional)
   * @expects userId in path params, pagination (page, limit) in query params
   * @responds 200 (OK com array de curtidas), 400, 403 (Forbidden), 500
   */
  listarItensCurtidosPeloUsuario: async (req: Request, res: Response, next: NextFunction) => {
    const usuarioLogadoId = (req as any).usuarioId;
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Formato inválido para userId.' });
    }

    // --- Verificação de Permissão (Exemplo) ---
    // Descomente e ajuste conforme suas regras de negócio
    // const podeVer = usuarioLogadoId === userId; // Ex: Só pode ver as próprias curtidas
    // if (!podeVer) {
    //   return res.status(403).json({ message: 'Você não tem permissão para ver as curtidas deste usuário.' });
    // }
    // --- Fim Verificação ---

    try {
      const query = { usuarioId: new Types.ObjectId(userId) };
      const totalCurtidas = await Curtida.countDocuments(query);
      const curtidas = await Curtida.find(query)
        .sort({ createdAt: -1 }) // Ordenar pelas mais recentes
        .skip(skip)
        .limit(limit);
      // .populate('itemCurtidoId'); // CUIDADO: Populando aqui é complexo devido à polimorfia

      res.status(200).json({
        data: curtidas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCurtidas / limit),
          totalItems: totalCurtidas,
          limit: limit
        }
      });
    } catch (error) {
      console.error("Erro ao listar itens curtidos pelo usuário:", error);
      next(error);
    }
  },

  /**
   * @description Lista usuários que curtiram um item específico
   * @route GET /api/curtidas/item/:tipoItemCurtido/:itemCurtidoId/users
   * @access Private or Public (depende da regra de negócio)
   * @expects tipoItemCurtido, itemCurtidoId in path params, pagination (page, limit) in query params
   * @responds 200 (OK com array de usuários), 400, 404 (Not Found), 500
   */
  listarUsuariosQueCurtiramItem: async (req: Request, res: Response, next: NextFunction) => {
    const { tipoItemCurtido, itemCurtidoId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!Types.ObjectId.isValid(itemCurtidoId)) {
      return res.status(400).json({ message: 'Formato inválido para itemCurtidoId.' });
    }
    if (!Object.values(TipoItemCurtidoEnum).includes(tipoItemCurtido as TipoItemCurtidoEnum)) {
      return res.status(400).json({ message: `Tipo de item curtido inválido: ${tipoItemCurtido}.` });
    }

    try {
      // Verificar se o item pai existe (opcional, mas bom)
      const ParentModel = getParentModel(tipoItemCurtido as TipoItemCurtidoEnum);
      if(!ParentModel){
        return res.status(400).json({ message: `Tipo de item pai inválido: ${tipoItemCurtido}.` });
      }
      const parentExists = await (ParentModel as any).findById(itemCurtidoId).lean(); // .lean() para performance
      if (!parentExists) {
        return res.status(404).json({ message: `Item ${tipoItemCurtido} com ID ${itemCurtidoId} não encontrado.` });
      }


      const query = {
        itemCurtidoId: new Types.ObjectId(itemCurtidoId),
        tipoItemCurtido: tipoItemCurtido as TipoItemCurtidoEnum
      };

      const totalUsuarios = await Curtida.countDocuments(query);
      const curtidas = await Curtida.find(query)
        .populate({
          path: 'usuarioId',
          select: 'nome email avatarUrl _id' // Selecionar apenas campos públicos/necessários do usuário
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Mapear para retornar apenas os dados do usuário, se preferir
      const usuarios = curtidas.map(c => c.usuarioId);

      res.status(200).json({
        data: usuarios, // Retorna a lista de usuários populados
        // ou data: curtidas, // Retorna os documentos Curtida com usuário populado
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsuarios / limit),
          totalItems: totalUsuarios,
          limit: limit
        }
      });
    } catch (error) {
      console.error("Erro ao listar usuários que curtiram item:", error);
      next(error);
    }
  },
};

export default curtidaController;