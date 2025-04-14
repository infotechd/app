// src/controllers/relatorioController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose, { PipelineStage } from 'mongoose'; // Importar PipelineStage para tipar agregações
import User, { IUser, TipoUsuarioEnum } from '../models/User';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum } from '../models/PublicacaoComunidade';
import Anuncio, { IAnuncio, AnuncioStatusEnum } from '../models/Anuncio';
import Pagamento, { IPagamento, PagamentoStatusEnum } from '../models/Pagamento';

// --- Funções Específicas de Relatório ---

/**
 * [ADMIN] Gera relatório de demografia de usuários.
 */
export const gerarRelatorioDemografiaAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Autorização já deve ter sido feita por middleware isAdmin
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  try {
    // TODO: Ler parâmetros de data (req.query.startDate, req.query.endDate) se necessário filtrar por período de cadastro

    // Agrupa usuários por tipo
    const usuariosPorTipoPipeline: PipelineStage[] = [
      // { $match: { createdAt: { $gte: startDate, $lte: endDate } } }, // Exemplo filtro de data
      { $group: { _id: "$tipoUsuario", count: { $sum: 1 } } },
      { $sort: { _id: 1 } } // Ordena por tipo
    ];
    const usuariosPorTipo = await User.aggregate(usuariosPorTipoPipeline);

    // TODO: Adicionar outras métricas demográficas (ex: por localização, se disponível)

    const relatorio = {
      geradoEm: new Date(),
      tipo: 'Demografia de Usuários',
      dados: { usuariosPorTipo }
    };
    res.status(200).json(relatorio);

  } catch (error) {
    next(error);
  }
};

/**
 * [ADMIN] Gera relatório de engajamento na comunidade.
 */
export const gerarRelatorioEngajamentoAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  try {
    const { startDate, endDate } = req.query; // Exemplo: pegar datas da query
    const matchPeriodo: mongoose.FilterQuery<any> = {};
    if (startDate) matchPeriodo.createdAt = { ...matchPeriodo.createdAt, $gte: new Date(startDate as string) };
    if (endDate) matchPeriodo.createdAt = { ...matchPeriodo.createdAt, $lte: new Date(endDate as string) };

    // Pipeline para publicações
    const publicacoesPipeline: PipelineStage[] = [
      { $match: { ...matchPeriodo, status: PublicacaoStatusEnum.APROVADO } },
      { $group: {
          _id: null, // Agrupa tudo
          totalPublicacoes: { $sum: 1 },
          totalLikes: { $sum: "$contagemLikes" },
          totalComentarios: { $sum: "$contagemComentarios" },
          avgLikes: { $avg: "$contagemLikes" },
          avgComentarios: { $avg: "$contagemComentarios" }
        }}
    ];

    // TODO: Adicionar agregação para comentários e curtidas totais no período, usuários ativos, etc.

    const [statsPublicacoes] = await PublicacaoComunidade.aggregate(publicacoesPipeline);
    // Adicionar outras agregações aqui...

    const relatorio = {
      geradoEm: new Date(),
      periodo: { inicio: startDate, fim: endDate },
      tipo: 'Engajamento na Comunidade',
      dados: {
        publicacoesAprovadas: statsPublicacoes?.totalPublicacoes ?? 0,
        curtidasEmPublicacoes: statsPublicacoes?.totalLikes ?? 0,
        comentariosEmPublicacoes: statsPublicacoes?.totalComentarios ?? 0,
        mediaCurtidasPorPublicacao: statsPublicacoes?.avgLikes ?? 0,
        mediaComentariosPorPublicacao: statsPublicacoes?.avgComentarios ?? 0,
        // ... outras métricas
      }
    };
    res.status(200).json(relatorio);

  } catch (error) {
    next(error);
  }
};

/**
 * [PRESTADOR] Gera relatório de vendas/contratações do prestador logado.
 */
export const gerarRelatorioVendasPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  const prestadorId = req.user.userId;
  // TODO: Ler parâmetros de período (req.query.startDate, req.query.endDate)

  try {
    // TODO: Implementar agregação na coleção Contratacao (e talvez Pagamento)
    // Filtrar por prestadorId e período de data (ex: dataConclusao?)
    // Agrupar por status, calcular valor total concluído, etc.
    // Exemplo MUITO básico: contar por status
    const contratacoesPorStatus = await Contratacao.aggregate([
      { $match: { prestadorId: new mongoose.Types.ObjectId(prestadorId) /* , dataConclusao: { $gte: ..., $lte: ... } */ } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    // Exemplo: Valor total de contratações concluídas
    const valorTotalConcluido = await Contratacao.aggregate([
      { $match: { prestadorId: new mongoose.Types.ObjectId(prestadorId), status: ContratacaoStatusEnum.CONCLUIDO /* , dataConclusao no período */ } },
      { $group: { _id: null, total: { $sum: "$valorTotal" } } }
    ]);

    const relatorio = {
      geradoEm: new Date(),
      prestadorId: prestadorId,
      tipo: 'Desempenho do Prestador',
      dados: {
        contratacoesPorStatus,
        valorTotalGanho: valorTotalConcluido.length > 0 ? valorTotalConcluido[0].total : 0
        // Adicionar outras métricas: avaliações médias recebidas, etc.
      }
    };
    res.status(200).json(relatorio);

  } catch (error) {
    next(error);
  }
};


// --- Placeholders para Outros Relatórios ---

export const gerarRelatorioPerformanceAnuncios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  const anuncianteId = req.user.userId;
  // TODO: Ler parâmetros de período (req.query)
  // TODO: Implementar agregação em Anuncio (e talvez coleção de Analytics/Cliques?)
  // Filtrar por anuncianteId e período. Calcular visualizações, cliques, CTR, etc. por anúncio ou geral.
  res.status(501).json({ message: 'Endpoint gerarRelatorioPerformanceAnuncios não implementado.' });
};

// Exporta as funções específicas (a genérica gerarRelatorio foi removida)