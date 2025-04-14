// src/controllers/bloqueioAgendaController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import BloqueioAgenda, { IBloqueioAgenda } from '../models/BloqueioAgenda';
import logger from '../config/logger'; // Importa o logger

// Interface para Payload de Criação/Atualização
interface BloqueioAgendaPayload {
  dataInicio: string | Date;
  dataFim: string | Date;
  motivo?: string;
}

// --- Funções do Controller ---

/**
 * Cria um novo bloqueio de tempo na agenda do prestador logado.
 * Requer que o usuário seja um Prestador (verificado por middleware isPrestador).
 */
export const criarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // req.user é garantido pelo authMiddleware e tipo é garantido pelo isPrestador
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;

  // TODO: Validar req.body (Joi/express-validator)
  const { dataInicio, dataFim, motivo } = req.body as BloqueioAgendaPayload;

  try {
    // Validação básica (mover para middleware/validador)
    if (!dataInicio || !dataFim) {
      res.status(400).json({ message: 'Data de início e Data de fim são obrigatórias.' }); return;
    }
    const dtInicio = new Date(dataInicio);
    const dtFim = new Date(dataFim);
    if (isNaN(dtInicio.getTime()) || isNaN(dtFim.getTime())) {
      res.status(400).json({ message: 'Formato de data inválido.' }); return;
    }
    if (dtFim < dtInicio) {
      res.status(400).json({ message: 'A data de fim deve ser igual ou posterior à data de início.' }); return;
    }
    // TODO: Adicionar verificação de sobreposição com Contratacoes ou outros Bloqueios existentes?
    //       Isso pode ser complexo e talvez melhor tratado na UI ou com validação mais sofisticada.

    const novoBloqueio = new BloqueioAgenda({
      prestadorId: prestadorId,
      dataInicio: dtInicio,
      dataFim: dtFim,
      motivo: motivo?.trim()
    });

    const bloqueioSalvo = await novoBloqueio.save();
    logger.info(`[Bloqueio Agenda] Novo bloqueio criado por ${prestadorId} de ${dtInicio.toISOString()} a ${dtFim.toISOString()}`);
    res.status(201).json({ message: 'Bloqueio de agenda criado com sucesso.', bloqueio: bloqueioSalvo });

  } catch (error) {
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors }); return;
    }
    next(error);
  }
};

/**
 * Lista os bloqueios de tempo do prestador logado.
 * Permite filtrar por intervalo de datas via query params (?startDate=...&endDate=...).
 * Requer que o usuário seja um Prestador (verificado por middleware isPrestador).
 */
export const listarMeusBloqueios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;
  const { startDate, endDate } = req.query as { startDate?: string, endDate?: string };

  try {
    const query: mongoose.FilterQuery<IBloqueioAgenda> = { prestadorId: prestadorId };

    // Adiciona filtro de data se fornecido
    const matchDate: any = {};
    if (startDate) {
      try { matchDate.$gte = new Date(startDate); } catch { /* Ignora data inválida */ }
    }
    if (endDate) {
      try { matchDate.$lte = new Date(endDate); } catch { /* Ignora data inválida */ }
    }
    // Aplica filtro complexo para encontrar bloqueios que *interceptam* o período
    if (matchDate.$gte || matchDate.$lte) {
      query.$and = [
        // Bloqueio termina DEPOIS do início do período ou não tem início
        { dataFim: matchDate.$gte ? { $gte: matchDate.$gte } : { $exists: true } },
        // Bloqueio começa ANTES do fim do período ou não tem fim
        { dataInicio: matchDate.$lte ? { $lte: matchDate.$lte } : { $exists: true } }
      ];
    }

    // TODO: Adicionar paginação se a lista puder ficar muito grande
    const bloqueios = await BloqueioAgenda.find(query)
      .sort({ dataInicio: 1 }); // Ordena por data de início

    res.status(200).json(bloqueios);

  } catch (error) {
    next(error);
  }
};


/**
 * Deleta um bloqueio de tempo específico.
 * Requer que o usuário seja o Prestador dono do bloqueio.
 */
export const deletarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;
  const { bloqueioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bloqueioId)) {
    res.status(400).json({ message: 'ID do bloqueio inválido.' }); return;
  }

  try {
    // Deleta apenas se o ID existir E pertencer ao prestador logado
    const result = await BloqueioAgenda.findOneAndDelete({
      _id: bloqueioId,
      prestadorId: prestadorId // Garante propriedade
    });

    if (!result) {
      res.status(404).json({ message: 'Bloqueio não encontrado ou você não tem permissão para excluí-lo.' });
      return;
    }

    logger.info(`[Bloqueio Agenda] Bloqueio ${bloqueioId} deletado por ${prestadorId}`);
    res.status(200).json({ message: 'Bloqueio excluído com sucesso.' });

  } catch (error) {
    if ((error as Error).name === 'CastError') { // Segurança extra para ID inválido
      res.status(400).json({ message: 'ID do bloqueio inválido.' }); return;
    }
    next(error);
  }
};

// Opcional: Função para atualizar um bloqueio existente
// export const atualizarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     // Lógica similar a deletar (verificar dono) e criar (validar dados)
// }