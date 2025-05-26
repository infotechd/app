// src/controllers/notificacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Notificacao, { INotificacao, NotificacaoTipoEnum, NotificacaoOrigemEnum, EntidadeTipoEnum } from '../models/Notificacao';
import { TipoUsuarioEnum } from '../models/User';

// Interface que define a estrutura de dados para criação de notificações pelo Admin ou Sistema
interface CreateNotificacaoPayload {
  usuarioId: string; // ID do usuário que receberá a notificação
  titulo: string; // Título da notificação
  mensagem: string; // Conteúdo da mensagem
  // Campos adicionais do modelo
  origem?: NotificacaoOrigemEnum; // Origem da notificação (sistema, admin, usuário)
  remetenteId?: string; // ID do usuário que enviou a notificação (quando aplicável)
  tipoNotificacao: NotificacaoTipoEnum; // Tipo da notificação
  linkRelacionado?: string; // Link relacionado à notificação
  entidadeRelacionada?: {
    id: string; // ID da entidade relacionada
    tipo: EntidadeTipoEnum; // Tipo da entidade relacionada
  };
}

// --- Funções do Controller ---

/**
 * Cria uma nova notificação no sistema.
 * IMPORTANTE: Esta função NÃO deve ser exposta diretamente a usuários comuns via API.
 * Deve ser chamada internamente pelo sistema ou por uma rota protegida para Administradores.
 */
export const createNotificacaoInterna = async (payload: Omit<CreateNotificacaoPayload, 'origem'> & { origem: NotificacaoOrigemEnum }): Promise<INotificacao | null> => {
  // Função interna chamada por outros serviços ou controllers do sistema
  try {
    // Realiza validação básica dos dados recebidos
    if (!payload.usuarioId || !payload.titulo || !payload.mensagem || !payload.tipoNotificacao) {
      console.error("Dados incompletos para criar notificação interna:", payload);
      return null; // Retorna nulo em caso de dados inválidos
    }

    const novaNotificacao = new Notificacao({
      usuarioId: payload.usuarioId,
      titulo: payload.titulo,
      mensagem: payload.mensagem,
      lida: false, // Valor padrão é falso no modelo
      origem: payload.origem,
      remetenteId: payload.remetenteId, // Será indefinido se a origem não for 'usuario'
      tipoNotificacao: payload.tipoNotificacao,
      linkRelacionado: payload.linkRelacionado,
      entidadeRelacionada: payload.entidadeRelacionada && mongoose.Types.ObjectId.isValid(payload.entidadeRelacionada.id)
        ? { id: payload.entidadeRelacionada.id, tipo: payload.entidadeRelacionada.tipo }
        : undefined,
    });

    // Salva a notificação no banco de dados
    const notificacaoSalva = await novaNotificacao.save();
    console.log(`Notificação criada para ${payload.usuarioId}: ${payload.titulo}`);

    // TODO: Implementar disparo de evento para enviar via WebSocket/Push Notification, quando necessário
    // eventEmitter.emit('novaNotificacao', notificacaoSalva);

    // Retorna a notificação salva
    return notificacaoSalva;

  } catch (error) {
    console.error('Erro interno ao criar notificação:', error);
    // Poderia lançar o erro para ser tratado por quem chamou a função, mas optamos por logar e retornar null
    // throw error;
    return null;
  }
};

// Rota que permite administradores criarem notificações no sistema
export const adminCreateNotificacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário é administrador (middleware de autenticação já deve ter verificado)
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  // TODO: Implementar validação completa dos dados enviados pelo administrador
  const payload = req.body as CreateNotificacaoPayload;
  payload.origem = NotificacaoOrigemEnum.ADMIN; // Define a origem como sendo do administrador

  try {
    // Chama a função interna para criar a notificação
    const notificacaoSalva = await createNotificacaoInterna(payload as Omit<CreateNotificacaoPayload, 'origem'> & { origem: NotificacaoOrigemEnum.ADMIN });
    if (!notificacaoSalva) {
      res.status(400).json({ message: 'Não foi possível criar a notificação (verifique os dados).'}); return;
    }
    // Retorna sucesso com a notificação criada
    res.status(201).json({ message: 'Notificação criada com sucesso.', notificacao: notificacaoSalva });
  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};


/**
 * Lista as notificações do usuário autenticado, com suporte a paginação e filtro por status de leitura.
 */
export const getNotificacoes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;

  try {
    // Parâmetros de paginação e filtro
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const lidaFilter = req.query.lida; // Exemplo: ?lida=false para filtrar não lidas

    // Monta a consulta base filtrando pelo usuário atual
    const query: mongoose.FilterQuery<INotificacao> = { usuarioId: usuarioId };
    if (lidaFilter === 'true' || lidaFilter === 'false') {
      query.lida = lidaFilter === 'true'; // Adiciona filtro por status de leitura
    }

    // Executa consulta de notificações e contagem total em paralelo
    const [notificacoes, total] = await Promise.all([
      Notificacao.find(query)
        .sort({ createdAt: -1 }) // Ordena por data de criação (mais recentes primeiro)
        .skip(skip)
        .limit(limit),
      Notificacao.countDocuments(query)
    ]);

    // Conta notificações não lidas para exibição de badge/contador
    const naoLidasCount = lidaFilter === 'false' ? total : await Notificacao.countDocuments({ usuarioId: usuarioId, lida: false });

    // Retorna resultado com metadados de paginação
    res.status(200).json({
      notificacoes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalNotificacoes: total,
      naoLidasCount // Contador de notificações não lidas
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Marca uma notificação específica do usuário logado como lida.
 * Utiliza método PATCH na rota /read.
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({message: 'Não autorizado.'});
    return;
  }
  const usuarioId = req.user.userId;
  const { notificacaoId } = req.params;

  // Valida se o ID da notificação é um ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(notificacaoId)) {
    res.status(400).json({ message: 'ID da notificação inválido.' }); return;
  }

  try {
    // Busca e atualiza a notificação, garantindo que pertença ao usuário logado
    const notificacao = await Notificacao.findOneAndUpdate(
      { _id: notificacaoId, usuarioId: usuarioId },
      { $set: { lida: true } }, // Utiliza $set para atualização parcial do documento
      { new: true } // Configura para retornar o documento após a atualização
    );

    // Verifica se a notificação foi encontrada
    if (!notificacao) {
      res.status(404).json({ message: 'Notificação não encontrada ou não pertence a você.' });
      return;
    }

    // Retorna sucesso com a notificação atualizada
    res.status(200).json({ message: 'Notificação marcada como lida.', notificacao });

  } catch (error) {
    // Trata erro específico de formato inválido de ID
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da notificação inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Marca TODAS as notificações não lidas do usuário logado como lidas.
 * Útil para funcionalidade de "Marcar todas como lidas".
 */
export const marcarTodasComoLidas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;

  try {
    // Atualiza todas as notificações não lidas do usuário para status "lida"
    const result = await Notificacao.updateMany(
      { usuarioId: usuarioId, lida: false }, // Filtra por usuário e status não lida
      { $set: { lida: true } } // Define todas como lidas
    );

    // Retorna mensagem de sucesso com o número de notificações atualizadas
    res.status(200).json({ message: `${result.modifiedCount} notificações marcadas como lidas.` });

  } catch (error) {
    next(error);
  }
};


/**
 * Exclui uma notificação específica do usuário logado.
 * Permite que o usuário remova permanentemente uma notificação do sistema.
 */
export const deleteNotificacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const usuarioId = req.user.userId;
  const { notificacaoId } = req.params;

  // Valida se o ID da notificação é um ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(notificacaoId)) {
    res.status(400).json({ message: 'ID da notificação inválido.' }); return;
  }

  try {
    // Busca e exclui a notificação, garantindo que pertença ao usuário logado
    const result = await Notificacao.findOneAndDelete({ _id: notificacaoId, usuarioId: usuarioId });

    // Verifica se a notificação foi encontrada e excluída
    if (!result) {
      res.status(404).json({ message: 'Notificação não encontrada ou não pertence a você.' });
      return;
    }

    // Retorna mensagem de sucesso
    res.status(200).json({ message: 'Notificação excluída com sucesso.' });

  } catch (error) {
    // Trata erro específico de formato inválido de ID
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da notificação inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};
