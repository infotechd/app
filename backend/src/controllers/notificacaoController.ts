// src/controllers/notificacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Notificacao, { INotificacao, NotificacaoTipoEnum, NotificacaoOrigemEnum, EntidadeTipoEnum } from '../models/Notificacao';
import { TipoUsuarioEnum } from '../models/User';

// Interface para Payload de Criação (se usado por Admin/Sistema)
interface CreateNotificacaoPayload {
  usuarioId: string; // Destinatário
  titulo: string;
  mensagem: string;
  // Campos do modelo revisado
  origem?: NotificacaoOrigemEnum;
  remetenteId?: string;
  tipoNotificacao: NotificacaoTipoEnum;
  linkRelacionado?: string;
  entidadeRelacionada?: {
    id: string;
    tipo: EntidadeTipoEnum;
  };
}

// --- Funções do Controller ---

/**
 * Cria uma nova notificação.
 * IMPORTANTE: Esta função NÃO deve ser exposta diretamente a usuários comuns via API.
 * Deve ser chamada internamente pelo sistema ou por uma rota protegida para Admins.
 */
export const createNotificacaoInterna = async (payload: Omit<CreateNotificacaoPayload, 'origem'> & { origem: NotificacaoOrigemEnum }): Promise<INotificacao | null> => {
  // Esta função seria chamada por outros serviços/controllers
  try {
    // Validação básica interna
    if (!payload.usuarioId || !payload.titulo || !payload.mensagem || !payload.tipoNotificacao) {
      console.error("Dados incompletos para criar notificação interna:", payload);
      return null; // Ou lançar erro interno
    }

    const novaNotificacao = new Notificacao({
      usuarioId: payload.usuarioId,
      titulo: payload.titulo,
      mensagem: payload.mensagem,
      lida: false, // Default já é false no modelo
      origem: payload.origem,
      remetenteId: payload.remetenteId, // Será undefined se origem não for 'usuario'
      tipoNotificacao: payload.tipoNotificacao,
      linkRelacionado: payload.linkRelacionado,
      entidadeRelacionada: payload.entidadeRelacionada && mongoose.Types.ObjectId.isValid(payload.entidadeRelacionada.id)
        ? { id: payload.entidadeRelacionada.id, tipo: payload.entidadeRelacionada.tipo }
        : undefined,
    });

    const notificacaoSalva = await novaNotificacao.save();
    console.log(`Notificação criada para ${payload.usuarioId}: ${payload.titulo}`);

    // TODO: Disparar evento para enviar via WebSocket/Push Notification, se necessário
    // eventEmitter.emit('novaNotificacao', notificacaoSalva);

    return notificacaoSalva;

  } catch (error) {
    console.error('Erro interno ao criar notificação:', error);
    // Lançar o erro para quem chamou tratar, ou logar e retornar null
    // throw error;
    return null;
  }
};

// Exemplo de rota para Admin criar notificação (se necessário)
export const adminCreateNotificacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Middleware isAdmin já deve ter verificado
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  // TODO: Validar o payload do Admin (req.body)
  const payload = req.body as CreateNotificacaoPayload;
  payload.origem = NotificacaoOrigemEnum.ADMIN; // Define a origem

  try {
    const notificacaoSalva = await createNotificacaoInterna(payload as Omit<CreateNotificacaoPayload, 'origem'> & { origem: NotificacaoOrigemEnum.ADMIN });
    if (!notificacaoSalva) {
      res.status(400).json({ message: 'Não foi possível criar a notificação (verifique os dados).'}); return;
    }
    res.status(201).json({ message: 'Notificação criada com sucesso.', notificacao: notificacaoSalva });
  } catch (error) {
    next(error);
  }
};


/**
 * Lista as notificações do usuário autenticado, com paginação e filtro de lida.
 */
export const getNotificacoes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const lidaFilter = req.query.lida; // Ex: ?lida=false

    const query: mongoose.FilterQuery<INotificacao> = { usuarioId: usuarioId };
    if (lidaFilter === 'true' || lidaFilter === 'false') {
      query.lida = lidaFilter === 'true'; // Filtra por lida/não lida
    }

    const [notificacoes, total] = await Promise.all([
      Notificacao.find(query)
        .sort({ createdAt: -1 }) // Usa createdAt para ordenar
        .skip(skip)
        .limit(limit),
      Notificacao.countDocuments(query)
    ]);

    // Opcional: Contar não lidas separadamente para badge
    const naoLidasCount = lidaFilter === 'false' ? total : await Notificacao.countDocuments({ usuarioId: usuarioId, lida: false });

    res.status(200).json({
      notificacoes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalNotificacoes: total,
      naoLidasCount // Envia contagem de não lidas
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Marca uma notificação específica do usuário logado como lida.
 * Usa PATCH e rota /read.
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  if (!req.user) {
    res.status(401).json({message: 'Não autorizado.'});
    return;
  }
  const usuarioId = req.user.userId;
  const { notificacaoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificacaoId)) {
    res.status(400).json({ message: 'ID da notificação inválido.' }); return;
  }

  try {
    // Atualiza apenas se a notificação existir E pertencer ao usuário logado
    const notificacao = await Notificacao.findOneAndUpdate(
      { _id: notificacaoId, usuarioId: usuarioId },
      { $set: { lida: true } }, // Usa $set para atualização parcial
      { new: true } // Retorna o documento atualizado
    );

    if (!notificacao) {
      res.status(404).json({ message: 'Notificação não encontrada ou não pertence a você.' });
      return;
    }

    res.status(200).json({ message: 'Notificação marcada como lida.', notificacao });

  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da notificação inválido.' }); return;
    }
    next(error);
  }
};

/**
 * Marca TODAS as notificações NÃO LIDAS do usuário logado como lidas.
 */
export const marcarTodasComoLidas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;

  try {
    const result = await Notificacao.updateMany(
      { usuarioId: usuarioId, lida: false }, // Condição
      { $set: { lida: true } } // Atualização
    );

    res.status(200).json({ message: `${result.modifiedCount} notificações marcadas como lidas.` });

  } catch (error) {
    next(error);
  }
};


/**
 * Exclui uma notificação específica do usuário logado.
 */
export const deleteNotificacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;
  const { notificacaoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificacaoId)) {
    res.status(400).json({ message: 'ID da notificação inválido.' }); return;
  }

  try {
    // Deleta apenas se pertencer ao usuário logado
    const result = await Notificacao.findOneAndDelete({ _id: notificacaoId, usuarioId: usuarioId });

    if (!result) {
      res.status(404).json({ message: 'Notificação não encontrada ou não pertence a você.' });
      return;
    }

    res.status(200).json({ message: 'Notificação excluída com sucesso.' });

  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da notificação inválido.' }); return;
    }
    next(error);
  }
};