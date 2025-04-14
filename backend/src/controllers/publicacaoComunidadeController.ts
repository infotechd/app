// src/controllers/publicacaoComunidadeController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum, PublicacaoTipoEnum } from '../models/PublicacaoComunidade';
import Comentario from '../models/Comentario'; // Importar para deletar comentários associados
import Curtida from '../models/Curtida'; // Importar para deletar curtidas associadas
import { TipoUsuarioEnum } from '../models/User';

// Interface para Payload (exemplo)
interface PublicacaoPayload {
  conteudo: string;
  tipo?: PublicacaoTipoEnum;
  imagens?: string[];
  dataEvento?: string | Date;
  localEvento?: string;
}

// --- Funções do Controller ---

/**
 * Cria uma nova publicação (post ou evento).
 * Status inicial definido conforme a política de moderação (ex: PENDENTE ou APROVADO).
 */
export const createPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }

  // TODO: Validar req.body (Joi/express-validator)
  const {
    conteudo,
    tipo = PublicacaoTipoEnum.POST, // Default para post se não especificado
    imagens,
    dataEvento,
    localEvento
  } = req.body as PublicacaoPayload;

  try {
    // Validação básica
    if (!conteudo) {
      res.status(400).json({ message: 'Conteúdo é obrigatório.' }); return;
    }
    if (tipo === PublicacaoTipoEnum.EVENTO && (!dataEvento || !localEvento)) {
      res.status(400).json({ message: 'Data e local são obrigatórios para eventos.' }); return;
    }
    // TODO: Validar formato da dataEvento

    const novaPublicacao = new PublicacaoComunidade({
      autorId: req.user.userId,
      conteudo,
      tipo,
      imagens: imagens || [],
      dataEvento: dataEvento ? new Date(dataEvento) : undefined,
      localEvento,
      status: PublicacaoStatusEnum.PENDENTE_APROVACAO, // Ou APROVADO se não houver moderação prévia
      contagemLikes: 0, // Inicializa contadores
      contagemComentarios: 0
    });

    const publicacaoSalva = await novaPublicacao.save();

    // TODO: Notificar admins se status for PENDENTE_APROVACAO?

    res.status(201).json({ message: 'Publicação criada com sucesso.', publicacao: publicacaoSalva });

  } catch (error) {
    next(error);
  }
};

/**
 * Lista publicações aprovadas para o feed principal.
 * Implementa paginação básica.
 */
export const getPublicacoesAprovadas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: mongoose.FilterQuery<IPublicacaoComunidade> = { status: PublicacaoStatusEnum.APROVADO };
    // TODO: Adicionar filtros por tipo (post/evento), data, etc. (req.query)

    const [publicacoes, total] = await Promise.all([
      PublicacaoComunidade.find(query)
        .populate('autorId', 'nome foto') // Popula dados do autor
        .sort({ createdAt: -1 }) // Ordena pelas mais recentes
        .skip(skip)
        .limit(limit),
      PublicacaoComunidade.countDocuments(query)
    ]);

    res.status(200).json({
      publicacoes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPublicacoes: total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtém detalhes de uma publicação específica aprovada.
 */
export const getPublicacaoAprovadaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { publicacaoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }
  try {
    const publicacao = await PublicacaoComunidade.findOne({
      _id: publicacaoId,
      status: PublicacaoStatusEnum.APROVADO
    }).populate('autorId', 'nome foto'); // Popula autor

    if (!publicacao) {
      res.status(404).json({ message: 'Publicação não encontrada ou não está aprovada.' }); return;
    }
    // TODO: Registrar visualização?
    res.status(200).json(publicacao);
  } catch (error) {
    next(error);
  }
};


/**
 * Autor edita sua própria publicação (se permitido e status for RASCUNHO ou talvez REJEITADO).
 */
export const updateMinhaPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }
  const { publicacaoId } = req.params;
  const autorId = req.user.userId;
  // TODO: Validar req.body
  const updates = req.body as Partial<PublicacaoPayload>;

  // Filtrar campos que o autor PODE editar (ex: não pode mudar status aqui)
  const allowedUpdates: Partial<IPublicacaoComunidade> = {};
  const editableFields: (keyof PublicacaoPayload)[] = ['conteudo', 'imagens', 'tipo', 'dataEvento', 'localEvento'];
  editableFields.forEach(field => {
    if (updates[field] !== undefined) {
      // Adicionar validações/conversões específicas aqui
      (allowedUpdates as any)[field] = updates[field];
    }
  });

  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' }); return;
  }
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  try {
    // Atualiza apenas se for o autor e o status permitir
    const publicacaoAtualizada = await PublicacaoComunidade.findOneAndUpdate(
      { _id: publicacaoId, autorId: autorId, status: { $in: [PublicacaoStatusEnum.RASCUNHO, PublicacaoStatusEnum.REJEITADO] } }, // Permite editar rascunho ou rejeitado?
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!publicacaoAtualizada) {
      res.status(404).json({ message: 'Publicação não encontrada, não pertence a você ou não pode ser editada no status atual.' }); return;
    }
    res.status(200).json({ message: 'Publicação atualizada com sucesso.', publicacao: publicacaoAtualizada });
  } catch (error) {
    next(error);
  }
};

/**
 * Autor ou Admin deleta uma publicação.
 * IMPORTANTE: Precisa deletar comentários e curtidas associados!
 */
export const deletePublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }
  const { publicacaoId } = req.params;
  const userId = req.user.userId;
  const userType = req.user.tipoUsuario;

  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const query: mongoose.FilterQuery<IPublicacaoComunidade> = { _id: publicacaoId };
    // Se não for admin, só pode deletar a própria publicação
    if (userType !== TipoUsuarioEnum.ADMIN) {
      query.autorId = userId;
    }

    const publicacaoDeletada = await PublicacaoComunidade.findOneAndDelete(query).session(session);

    if (!publicacaoDeletada) {
      await session.abortTransaction(); session.endSession();
      res.status(404).json({ message: 'Publicação não encontrada ou você não tem permissão para excluí-la.' }); return;
    }

    // --- Limpeza de Dados Associados (ESSENCIAL) ---
    // Deleta comentários associados
    await Comentario.deleteMany({ publicacaoId: publicacaoId }).session(session);
    // Deleta curtidas associadas
    await Curtida.deleteMany({ itemCurtidoId: publicacaoId, tipoItemCurtido: 'PublicacaoComunidade' }).session(session);
    // --------------------------------------------

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Publicação e seus comentários/curtidas associados foram excluídos com sucesso.' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Admin modera uma publicação (aprova, rejeita, oculta).
 */
export const moderarPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido: Apenas administradores podem moderar.' }); return;
  }
  const { publicacaoId } = req.params;
  const { status: novoStatus, motivo } = req.body as { status: PublicacaoStatusEnum, motivo?: string };

  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }
  // Valida o status recebido
  const statusValidosParaAdmin: PublicacaoStatusEnum[] = [PublicacaoStatusEnum.APROVADO, PublicacaoStatusEnum.REJEITADO, PublicacaoStatusEnum.OCULTO_PELO_ADMIN];
  if (!novoStatus || !statusValidosParaAdmin.includes(novoStatus)) {
    res.status(400).json({ message: `Status inválido fornecido para moderação: ${novoStatus}. Válidos: ${statusValidosParaAdmin.join(', ')}` }); return;
  }
  if (novoStatus === PublicacaoStatusEnum.REJEITADO && !motivo) {
    res.status(400).json({ message: 'Motivo é obrigatório ao rejeitar.' }); return;
  }

  try {
    // Busca e atualiza (não precisa checar dono, pois é admin)
    const publicacao = await PublicacaoComunidade.findByIdAndUpdate(
      publicacaoId,
      {
        status: novoStatus,
        motivoReprovacaoOuOcultacao: novoStatus === PublicacaoStatusEnum.REJEITADO ? motivo : undefined // Só salva motivo se rejeitar
      },
      { new: true, runValidators: true }
    );

    if (!publicacao) {
      res.status(404).json({ message: 'Publicação não encontrada.' }); return;
    }

    // TODO: Notificar o autor sobre o resultado da moderação

    res.status(200).json({ message: `Publicação atualizada para status '${novoStatus}'.`, publicacao });

  } catch (error) {
    next(error);
  }
};

// Placeholders para outras funções se necessário (ex: listar pendentes)
export const listarPublicacoesPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }
  // TODO: Implementar busca por status PENDENTE_APROVACAO com paginação.
  res.status(501).json({ message: 'Endpoint listarPublicacoesPendentes não implementado.'});
};