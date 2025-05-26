// src/controllers/comentarioController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose, { ClientSession, Types, HydratedDocument } from 'mongoose'; // Importa o mongoose e seus tipos
import Comentario, { IComentario, ComentarioStatusEnum } from '../models/Comentario';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum } from '../models/PublicacaoComunidade';
import Curtida, { TipoItemCurtidoEnum } from '../models/Curtida';
import { TipoUsuarioEnum } from '../models/User';
import logger from '../config/logger';

// Interface que define a estrutura de dados para criação de comentários
interface CriarComentarioPayload {
  publicacaoId: string;
  conteudo: string;
  respostaParaComentarioId?: string;
}

// Interface que define a estrutura de dados para edição de comentários
interface EditarComentarioPayload {
  conteudo: string;
}

// Interface que define a estrutura de dados para moderação de comentários
interface ModerarComentarioPayload {
  status: ComentarioStatusEnum;
}

// --- Funções do Controlador ---

/**
 * Cria um novo comentário em uma publicação.
 * Valida os dados de entrada, verifica permissões e cria o comentário na base de dados.
 * Incrementa o contador de comentários na publicação pai.
 */
export const criarComentario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Autenticação necessária para comentar.' }); return; }
  const { publicacaoId, conteudo, respostaParaComentarioId } = req.body as CriarComentarioPayload;
  const autorId = req.user.userId;
  if (!publicacaoId || !mongoose.Types.ObjectId.isValid(publicacaoId)) { res.status(400).json({ message: 'ID da publicação inválido ou ausente.' }); return; }
  if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length === 0 || conteudo.length > 2000) { res.status(400).json({ message: 'Conteúdo do comentário inválido (1-2000 caracteres).' }); return; }
  if (respostaParaComentarioId && !mongoose.Types.ObjectId.isValid(respostaParaComentarioId)) { res.status(400).json({ message: 'ID do comentário pai inválido.' }); return; }
  const session = await mongoose.startSession(); session.startTransaction();
  try {
    const publicacaoPai = await PublicacaoComunidade.findById(publicacaoId).session(session);
    if (!publicacaoPai || publicacaoPai.status !== PublicacaoStatusEnum.APROVADO) { throw { status: 404, message: 'Publicação não encontrada ou não permite comentários.' }; }
    if (respostaParaComentarioId) {
      const comentarioPai = await Comentario.findOne({ _id: respostaParaComentarioId, publicacaoId: publicacaoId, status: ComentarioStatusEnum.APROVADO }).session(session);
      if (!comentarioPai) { throw { status: 404, message: 'Comentário pai não encontrado, foi removido ou não pode ser respondido.' }; }
    }
    const novoComentario = new Comentario({ publicacaoId, autorId, conteudo: conteudo.trim(), respostaParaComentarioId: respostaParaComentarioId || null, status: ComentarioStatusEnum.APROVADO, contagemLikes: 0 });
    let comentarioSalvo = await novoComentario.save({ session });
    await PublicacaoComunidade.findByIdAndUpdate(publicacaoId, { $inc: { contagemComentarios: 1 } }, { session, runValidators: false });
    await session.commitTransaction(); session.endSession();
    comentarioSalvo = await comentarioSalvo.populate('autorId', 'nome foto');
    res.status(201).json({ message: 'Comentário adicionado com sucesso.', comentario: comentarioSalvo });
  } catch (error: any) { await session.abortTransaction(); session.endSession(); logger.error("Erro ao criar comentário:", error); if (error.status) { res.status(error.status).json({ message: error.message }); } else if ((error as Error).name === 'ValidationError') { res.status(400).json({ message: 'Erro de validação ao salvar comentário.', errors: error.errors }); } else { next(new Error('Falha ao criar comentário.')); } }
};

/**
 * Lista todos os comentários de uma publicação específica.
 * Implementa paginação e retorna apenas comentários aprovados.
 * Retorna apenas comentários principais (não respostas) ordenados por data de criação.
 */
export const listarComentariosPorPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { publicacaoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) { res.status(400).json({ message: 'ID da publicação inválido.' }); return; }
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const publicacaoExiste = await PublicacaoComunidade.exists({ _id: publicacaoId });
    if (!publicacaoExiste) { res.status(404).json({ message: 'Publicação não encontrada.' }); return; }
    const query: mongoose.FilterQuery<IComentario> = { publicacaoId: publicacaoId, status: ComentarioStatusEnum.APROVADO, respostaParaComentarioId: null };
    const [comentarios, total] = await Promise.all([ Comentario.find(query).populate('autorId', 'nome foto').sort({ createdAt: 1 }).skip(skip).limit(limit), Comentario.countDocuments(query) ]);
    res.status(200).json({ comentarios, totalPages: Math.ceil(total / limit), currentPage: page, totalComentariosPrincipais: total });
  } catch (error) { next(error); }
};

/**
 * Edita o conteúdo de um comentário existente.
 * Permite apenas que o autor do comentário faça a edição.
 * Limita a edição a um período de 15 minutos após a criação do comentário.
 */
export const editarComentario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const { comentarioId } = req.params;
  const autorId = req.user.userId;
  const { conteudo } = req.body as EditarComentarioPayload;
  if (!mongoose.Types.ObjectId.isValid(comentarioId)) { res.status(400).json({ message: 'ID do comentário inválido.' }); return; }
  if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length === 0 || conteudo.length > 2000) { res.status(400).json({ message: 'Conteúdo do comentário inválido (1-2000 caracteres).' }); return; }
  const agora = new Date(); const limiteEdicaoMinutos = 15; const tempoLimite = new Date(agora.getTime() - limiteEdicaoMinutos * 60 * 1000);
  try { const comentarioAtualizado = await Comentario.findOneAndUpdate( { _id: comentarioId, autorId: autorId, status: ComentarioStatusEnum.APROVADO, createdAt: { $gte: tempoLimite } }, { $set: { conteudo: conteudo.trim() } }, { new: true, runValidators: true } ).populate('autorId', 'nome foto'); if (!comentarioAtualizado) { res.status(404).json({ message: 'Comentário não encontrado, não pertence a você ou não pode mais ser editado.' }); return; } res.status(200).json({ message: 'Comentário atualizado.', comentario: comentarioAtualizado }); } catch (error) { if ((error as Error).name === 'CastError') { res.status(400).json({ message: 'ID do comentário inválido.' }); return; } if ((error as Error).name === 'ValidationError') { res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors }); return; } next(error); }
};

/**
 * Deleta um comentário (Autor ou Admin).
 * Usa transação para deletar o comentário, suas respostas, curtidas associadas e decrementar o contador.
 * Utiliza abordagem de busca recursiva de IDs corrigida.
 */
export const deletarComentario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se usuário está logado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' }); return;
  }
  const { comentarioId } = req.params;
  const userId = req.user.userId;
  const userType = req.user.tipoUsuario;

  // Valida o ID do comentário
  if (!mongoose.Types.ObjectId.isValid(comentarioId)) {
    res.status(400).json({ message: 'ID do comentário inválido.' }); return;
  }

  const session = await mongoose.startSession(); // Inicia a sessão para transação
  session.startTransaction();
  try {
    // Busca o comentário principal para validação e para obter ID da publicação
    // Tipagem explícita aqui ajuda na verificação de tipos
    const comentario: HydratedDocument<IComentario> | null = await Comentario.findById(comentarioId).session(session);
    if (!comentario) {
      throw { status: 404, message: 'Comentário não encontrado.' }; // Lança erro para abortar transação
    }

    // Autorização: Admin OU o próprio autor do comentário
    if (userType !== TipoUsuarioEnum.ADMIN && comentario.autorId.toString() !== userId) {
      throw { status: 403, message: 'Acesso proibido: Permissão negada para excluir este comentário.' }; // Lança erro
    }

    // --- Lógica de Exclusão e Limpeza ---

    // 1. Função Recursiva para encontrar IDs de Respostas (com tipagem correta)
    const encontrarIdsDeRespostas = async (parentId: mongoose.Types.ObjectId, currentSession: ClientSession): Promise<mongoose.Types.ObjectId[]> => {
      const idsEncontrados: mongoose.Types.ObjectId[] = [];
      // Busca respostas, seleciona apenas _id e usa .lean() para objetos JS simples
      const respostas = await Comentario.find({ respostaParaComentarioId: parentId })
        .select('_id')
        .lean() // Retorna objetos JavaScript simples
        .session(currentSession);

      for (const resposta of respostas) {
        // Conversão explícita do _id para garantir compatibilidade com ObjectId
        const respostaId = resposta._id as unknown as mongoose.Types.ObjectId;

        // Adiciona ID da resposta atual
        idsEncontrados.push(respostaId);

        // Busca respostas das respostas (com o ID convertido)
        const idsAninhados = await encontrarIdsDeRespostas(respostaId, currentSession);

        // Adiciona IDs encontrados recursivamente
        idsEncontrados.push(...idsAninhados);
      }
      return idsEncontrados;
    };

    // 2. Coleta todos os IDs a serem deletados (principal + todas as respostas aninhadas)
    const idsRespostas = await encontrarIdsDeRespostas(comentario._id as unknown as mongoose.Types.ObjectId, session);
    const todosIdsParaDeletar: mongoose.Types.ObjectId[] = [comentario._id as unknown as mongoose.Types.ObjectId, ...idsRespostas as unknown as mongoose.Types.ObjectId[]]; // Junta todos os IDs

    // 3. Deleta todos os comentários (principal + respostas) usando os IDs coletados
    logger.debug(`[Delete Comentario] Deletando IDs: ${todosIdsParaDeletar.map(id => id.toString()).join(', ')}`);
    await Comentario.deleteMany({ _id: { $in: todosIdsParaDeletar } }).session(session);

    // 4. Deleta todas as curtidas associadas a esses comentários
    logger.debug(`[Delete Comentario] Deletando curtidas para comentários: ${todosIdsParaDeletar.map(id => id.toString()).join(', ')}`);
    await Curtida.deleteMany({
      itemCurtidoId: { $in: todosIdsParaDeletar },
      tipoItemCurtido: TipoItemCurtidoEnum.COMENTARIO // Usa o Enum para tipo de item
    }).session(session);

    // 5. Decrementa o contador na publicação pai pelo número total de comentários deletados
    const numDeletados = todosIdsParaDeletar.length;
    logger.debug(`[Delete Comentario] Decrementando contagem (${numDeletados}) em Publicacao ${comentario.publicacaoId}`);
    const updateResult = await PublicacaoComunidade.findByIdAndUpdate(
      comentario.publicacaoId,
      { $inc: { contagemComentarios: -numDeletados } },
      { session, runValidators: false } // Não executa validadores da publicação
    ).orFail(new Error(`Publicacao ${comentario.publicacaoId} não encontrada ao decrementar contador.`)); // Lança erro se não encontrar

    // Garante que a contagem não seja negativa (opcional, mas seguro)
    await PublicacaoComunidade.updateOne(
      { _id: comentario.publicacaoId, contagemComentarios: { $lt: 0 } },
      { $set: { contagemComentarios: 0 } },
      { session }
    );
    // ------------------------------------

    await session.commitTransaction(); // Confirma todas as operações na transação
    session.endSession();

    res.status(200).json({ message: 'Comentário(s) excluído(s) com sucesso.' });

  } catch (error: any) {
    await session.abortTransaction(); // Desfaz todas as operações em caso de erro
    session.endSession();
    logger.error("Erro ao deletar comentário:", error);
    if (error.status) { // Trata erros lançados com status/message específicos
      res.status(error.status).json({ message: error.message });
    } else {
      next(error); // Encaminha outros erros para o manipulador central de erros
    }
  }
};


/**
 * Modera comentários, permitindo aprovar ou ocultar comentários.
 * Função exclusiva para administradores do sistema.
 * Permite alterar o status de um comentário entre aprovado e oculto pelo admin.
 */
export const moderarComentario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) { res.status(403).json({ message: 'Acesso proibido: Apenas administradores podem moderar.' }); return; }
  const { comentarioId } = req.params;
  const { status: novoStatus } = req.body as ModerarComentarioPayload;
  if (!mongoose.Types.ObjectId.isValid(comentarioId)) { res.status(400).json({ message: 'ID do comentário inválido.' }); return; }
  const statusValidosParaAdmin: ComentarioStatusEnum[] = [ ComentarioStatusEnum.APROVADO, ComentarioStatusEnum.OCULTO_PELO_ADMIN ];
  if (!novoStatus || !statusValidosParaAdmin.includes(novoStatus)) { res.status(400).json({ message: `Status inválido fornecido para moderação: ${novoStatus}.` }); return; }
  try { const comentarioAtualizado = await Comentario.findByIdAndUpdate( comentarioId, { $set: { status: novoStatus } }, { new: true, runValidators: true } ).populate('autorId', 'nome foto'); if (!comentarioAtualizado) { res.status(404).json({ message: 'Comentário não encontrado.' }); return; } res.status(200).json({ message: `Comentário atualizado para status '${novoStatus}'.`, comentario: comentarioAtualizado }); } catch (error) { next(error); }
};
