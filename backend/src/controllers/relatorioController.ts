// src/controllers/relatorioController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose, { PipelineStage } from 'mongoose'; // Importa PipelineStage para tipagem de agregações
import User, { IUser, TipoUsuarioEnum } from '../models/User';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum } from '../models/PublicacaoComunidade';
import Anuncio, { IAnuncio, AnuncioStatusEnum } from '../models/Anuncio';
import Pagamento, { IPagamento, PagamentoStatusEnum } from '../models/Pagamento';

// --- Funções Específicas de Relatório ---

/**
 * [ADMIN] Função que gera relatório de demografia de usuários para administradores.
 * Permite visualizar a distribuição de usuários por tipo na plataforma.
 */
export const gerarRelatorioDemografiaAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se a autorização já foi realizada pelo middleware isAdmin
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  try {
    // TODO: Implementar leitura de parâmetros de data (req.query.startDate, req.query.endDate) para filtrar por período de cadastro

    // Pipeline de agregação que conta usuários por capacidade
    const usuariosPorTipoPipeline: PipelineStage[] = [
      // { $match: { createdAt: { $gte: startDate, $lte: endDate } } }, // Exemplo de filtro por data
      { 
        $facet: {
          admins: [
            { $match: { isAdmin: true } },
            { $count: "total" }
          ],
          prestadores: [
            { $match: { isPrestador: true } },
            { $count: "total" }
          ],
          anunciantes: [
            { $match: { isAnunciante: true } },
            { $count: "total" }
          ],
          compradores: [
            { $match: { isComprador: true } },
            { $count: "total" }
          ],
          total: [
            { $count: "total" }
          ]
        }
      }
    ];
    const [usuariosPorTipo] = await User.aggregate(usuariosPorTipoPipeline);

    // TODO: Implementar outras métricas demográficas (exemplo: por localização, se disponível)

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
 * [ADMIN] Função que gera relatório de engajamento na comunidade para administradores.
 * Permite analisar métricas de interação dos usuários com o conteúdo da plataforma.
 */
export const gerarRelatorioEngajamentoAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  try {
    const { startDate, endDate } = req.query; // Obtém as datas de início e fim da consulta
    const matchPeriodo: mongoose.FilterQuery<any> = {};
    if (startDate) matchPeriodo.createdAt = { ...matchPeriodo.createdAt, $gte: new Date(startDate as string) };
    if (endDate) matchPeriodo.createdAt = { ...matchPeriodo.createdAt, $lte: new Date(endDate as string) };

    // Pipeline de agregação para análise de publicações
    const publicacoesPipeline: PipelineStage[] = [
      { $match: { ...matchPeriodo, status: PublicacaoStatusEnum.APROVADO } },
      { $group: {
          _id: null, // Agrupa todos os resultados
          totalPublicacoes: { $sum: 1 },
          totalLikes: { $sum: "$contagemLikes" },
          totalComentarios: { $sum: "$contagemComentarios" },
          avgLikes: { $avg: "$contagemLikes" },
          avgComentarios: { $avg: "$contagemComentarios" }
        }}
    ];

    // TODO: Implementar agregação adicional para comentários e curtidas totais no período, usuários ativos, etc.

    const [statsPublicacoes] = await PublicacaoComunidade.aggregate(publicacoesPipeline);
    // Adicionar outras agregações de dados aqui...

    // Estrutura do relatório com os dados coletados
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
        // ... outras métricas a serem implementadas
      }
    };
    res.status(200).json(relatorio);

  } catch (error) {
    next(error);
  }
};

/**
 * [PRESTADOR] Função que gera relatório de vendas e contratações para o prestador logado.
 * Permite ao prestador visualizar suas métricas de desempenho e faturamento.
 */
export const gerarRelatorioVendasPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.isPrestador) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  const prestadorId = req.user.userId;
  // TODO: Implementar leitura de parâmetros de período (req.query.startDate, req.query.endDate)

  try {
    // TODO: Implementar agregação completa na coleção Contratacao (e possivelmente Pagamento)
    // Filtrar por prestadorId e período de data (exemplo: dataConclusao)
    // Agrupar por status, calcular valor total de serviços concluídos, etc.

    // Agregação que conta contratações por status
    const contratacoesPorStatus = await Contratacao.aggregate([
      { $match: { prestadorId: new mongoose.Types.ObjectId(prestadorId) /* , dataConclusao: { $gte: ..., $lte: ... } */ } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Agregação que calcula o valor total de contratações concluídas
    const valorTotalConcluido = await Contratacao.aggregate([
      { $match: { prestadorId: new mongoose.Types.ObjectId(prestadorId), status: ContratacaoStatusEnum.CONCLUIDO /* , dataConclusao no período */ } },
      { $group: { _id: null, total: { $sum: "$valorTotal" } } }
    ]);

    // Estrutura do relatório com os dados de desempenho do prestador
    const relatorio = {
      geradoEm: new Date(),
      prestadorId: prestadorId,
      tipo: 'Desempenho do Prestador',
      dados: {
        contratacoesPorStatus,
        valorTotalGanho: valorTotalConcluido.length > 0 ? valorTotalConcluido[0].total : 0
        // TODO: Adicionar outras métricas como avaliações médias recebidas, etc.
      }
    };
    res.status(200).json(relatorio);

  } catch (error) {
    next(error);
  }
};


// --- Funções de Relatório Pendentes de Implementação ---

/**
 * [ANUNCIANTE] Função que gera relatório de performance dos anúncios para o anunciante logado.
 * Permite ao anunciante analisar o desempenho de suas campanhas publicitárias.
 */
export const gerarRelatorioPerformanceAnuncios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.isAnunciante) {
    res.status(403).json({ message: 'Acesso proibido.' }); return;
  }
  const anuncianteId = req.user.userId;
  // TODO: Implementar leitura de parâmetros de período (req.query)
  // TODO: Implementar agregação na coleção Anuncio (e possivelmente na coleção de Analytics/Cliques)
  // Filtrar por anuncianteId e período específico
  // Calcular métricas como visualizações, cliques, taxa de conversão (CTR), etc. por anúncio ou geral
  res.status(501).json({ message: 'Endpoint gerarRelatorioPerformanceAnuncios não implementado.' });
};

// Exporta as funções específicas de relatório (a função genérica gerarRelatorio foi removida)
