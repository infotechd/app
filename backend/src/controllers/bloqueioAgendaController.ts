// src/controllers/bloqueioAgendaController.ts
// Arquivo responsável pelo gerenciamento de bloqueios na agenda dos prestadores de serviço

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import BloqueioAgenda, { IBloqueioAgenda } from '../models/BloqueioAgenda';
import logger from '../config/logger'; // Importa o logger para registrar eventos importantes

// Interface que define a estrutura de dados para criação ou atualização de bloqueios na agenda
interface BloqueioAgendaPayload {
  dataInicio: string | Date;  // Data e hora de início do bloqueio
  dataFim: string | Date;     // Data e hora de término do bloqueio
  motivo?: string;            // Motivo opcional do bloqueio
}

// --- Funções do Controller ---

/**
 * Cria um novo bloqueio de tempo na agenda do prestador logado.
 * Requer que o usuário seja um Prestador (verificado por middleware isPrestador).
 */
export const criarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado (garantido pelo authMiddleware e isPrestador)
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;

  // TODO: Implementar validação do corpo da requisição usando bibliotecas como Joi ou express-validator
  const { dataInicio, dataFim, motivo } = req.body as BloqueioAgendaPayload;

  try {
    // Realiza validações básicas dos dados recebidos
    if (!dataInicio || !dataFim) {
      res.status(400).json({ message: 'Data de início e Data de fim são obrigatórias.' }); return;
    }
    const dtInicio = new Date(dataInicio);
    const dtFim = new Date(dataFim);

    // Verifica se as datas são válidas
    if (isNaN(dtInicio.getTime()) || isNaN(dtFim.getTime())) {
      res.status(400).json({ message: 'Formato de data inválido.' }); return;
    }

    // Verifica se a data de fim é posterior à data de início
    if (dtFim < dtInicio) {
      res.status(400).json({ message: 'A data de fim deve ser igual ou posterior à data de início.' }); return;
    }

    // TODO: Implementar verificação de sobreposição com Contratações ou outros Bloqueios existentes
    //       Esta verificação pode ser complexa e talvez seja melhor tratada na interface ou com validação mais avançada

    // Cria um novo objeto de bloqueio com os dados validados
    const novoBloqueio = new BloqueioAgenda({
      prestadorId: prestadorId,
      dataInicio: dtInicio,
      dataFim: dtFim,
      motivo: motivo?.trim()
    });

    // Salva o bloqueio no banco de dados
    const bloqueioSalvo = await novoBloqueio.save();

    // Registra a criação do bloqueio no log do sistema
    logger.info(`[Bloqueio Agenda] Novo bloqueio criado por ${prestadorId} de ${dtInicio.toISOString()} a ${dtFim.toISOString()}`);

    // Retorna resposta de sucesso com o bloqueio criado
    res.status(201).json({ message: 'Bloqueio de agenda criado com sucesso.', bloqueio: bloqueioSalvo });

  } catch (error) {
    // Trata erros de validação do modelo
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Lista os bloqueios de tempo do prestador logado.
 * Permite filtrar por intervalo de datas via parâmetros de consulta (?startDate=...&endDate=...).
 * Requer que o usuário seja um Prestador (verificado por middleware isPrestador).
 */
export const listarMeusBloqueios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;

  // Extrai parâmetros de consulta para filtragem por data
  const { startDate, endDate } = req.query as { startDate?: string, endDate?: string };

  try {
    // Inicia a construção da consulta filtrando pelo ID do prestador
    const query: mongoose.FilterQuery<IBloqueioAgenda> = { prestadorId: prestadorId };

    // Prepara objeto para armazenar filtros de data
    const matchDate: any = {};

    // Processa data de início se fornecida
    if (startDate) {
      try { matchDate.$gte = new Date(startDate); } catch { /* Ignora data inválida */ }
    }

    // Processa data de fim se fornecida
    if (endDate) {
      try { matchDate.$lte = new Date(endDate); } catch { /* Ignora data inválida */ }
    }

    // Aplica filtro complexo para encontrar bloqueios que interceptam o período especificado
    if (matchDate.$gte || matchDate.$lte) {
      query.$and = [
        // Bloqueio termina DEPOIS do início do período ou não tem início definido
        { dataFim: matchDate.$gte ? { $gte: matchDate.$gte } : { $exists: true } },
        // Bloqueio começa ANTES do fim do período ou não tem fim definido
        { dataInicio: matchDate.$lte ? { $lte: matchDate.$lte } : { $exists: true } }
      ];
    }

    // TODO: Implementar paginação para lidar com grandes volumes de dados

    // Busca bloqueios no banco de dados e ordena por data de início
    const bloqueios = await BloqueioAgenda.find(query)
      .sort({ dataInicio: 1 }); // Ordena por data de início em ordem crescente

    // Retorna os bloqueios encontrados
    res.status(200).json(bloqueios);

  } catch (error) {
    // Passa erros para o middleware de tratamento de erros
    next(error);
  }
};


/**
 * Remove um bloqueio de tempo específico.
 * Requer que o usuário seja o Prestador proprietário do bloqueio.
 */
export const deletarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }
  const prestadorId = req.user.userId;

  // Obtém o ID do bloqueio a ser removido dos parâmetros da rota
  const { bloqueioId } = req.params;

  // Valida se o ID do bloqueio é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(bloqueioId)) {
    res.status(400).json({ message: 'ID do bloqueio inválido.' }); return;
  }

  try {
    // Busca e remove o bloqueio, garantindo que pertence ao prestador logado
    const result = await BloqueioAgenda.findOneAndDelete({
      _id: bloqueioId,
      prestadorId: prestadorId // Garante que apenas o proprietário pode excluir
    });

    // Verifica se o bloqueio foi encontrado e removido
    if (!result) {
      res.status(404).json({ message: 'Bloqueio não encontrado ou você não tem permissão para excluí-lo.' });
      return;
    }

    // Registra a remoção do bloqueio no log do sistema
    logger.info(`[Bloqueio Agenda] Bloqueio ${bloqueioId} deletado por ${prestadorId}`);

    // Retorna resposta de sucesso
    res.status(200).json({ message: 'Bloqueio excluído com sucesso.' });

  } catch (error) {
    // Trata erros específicos de formato de ID
    if ((error as Error).name === 'CastError') { // Segurança adicional para ID inválido
      res.status(400).json({ message: 'ID do bloqueio inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

// Função opcional para atualizar um bloqueio existente (não implementada)
// export const atualizarBloqueio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     // Lógica semelhante às funções de deletar (verificar proprietário) e criar (validar dados)
// }
