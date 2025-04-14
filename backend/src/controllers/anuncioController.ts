// src/controllers/anuncioController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Anuncio, { IAnuncio, AnuncioStatusEnum } from '../models/Anuncio'; // Importa modelo e interface/enum
import User, { TipoUsuarioEnum } from '../models/User'; // Importa enum e talvez modelo do User se precisar popular

// --- Funções do Controller ---

// =============================================
// == Funções para Anunciantes (JÁ EXISTIAM) ==
// =============================================

/**
 * Cria um novo anúncio com status inicial 'rascunho'.
 * Requer que o usuário seja um Anunciante. (CU7 - Criação)
 */
export const criarAnuncio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está logado e é um anunciante
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido: Apenas anunciantes podem criar anúncios.' });
    return;
  }

  // TODO: Implementar validação robusta do req.body com Joi ou express-validator
  const { titulo, conteudo, imagens, link, tipoAnuncio, dataInicioExibicao, dataFimExibicao, segmentacao } = req.body;

  try {
    // Validação básica de campos obrigatórios
    if (!titulo || !conteudo) {
      res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
      return;
    }
    // TODO: Adicionar mais validações (formato de datas, URL do link, estrutura da segmentação, etc.)

    const novoAnuncio = new Anuncio({
      anuncianteId: req.user.userId, // Associa o anúncio ao usuário logado
      titulo,
      conteudo,
      imagens,
      link,
      tipoAnuncio,
      dataInicioExibicao: dataInicioExibicao ? new Date(dataInicioExibicao) : undefined,
      dataFimExibicao: dataFimExibicao ? new Date(dataFimExibicao) : undefined,
      segmentacao,
      status: AnuncioStatusEnum.RASCUNHO // Status inicial padrão
    });

    const anuncioSalvo = await novoAnuncio.save();
    res.status(201).json({ message: 'Anúncio criado como rascunho com sucesso.', anuncio: anuncioSalvo });

  } catch (error) {
    // Se houver erro (ex: validação do Mongoose falhar), passa para o middleware de erro
    next(error);
  }
};

/**
 * Anunciante submete um anúncio em 'rascunho' para revisão. (Não estava nos erros, mas incluída)
 * Muda o status para 'pendente_aprovacao'.
 */
export const submeterParaRevisao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido: Apenas anunciantes podem submeter anúncios.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    // Busca o anúncio e verifica se pertence ao usuário logado
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    // Só pode submeter se estiver em rascunho
    if (anuncio.status !== AnuncioStatusEnum.RASCUNHO) {
      res.status(400).json({ message: `Não é possível submeter para revisão um anúncio com status '${anuncio.status}'. Só anúncios em Rascunho.` });
      return;
    }

    // TODO: Adicionar verificações adicionais se necessário antes de submeter

    anuncio.status = AnuncioStatusEnum.PENDENTE_APROVACAO;
    const anuncioAtualizado = await anuncio.save();

    // TODO: Implementar lógica para notificar administradores (opcional)

    res.status(200).json({ message: 'Anúncio submetido para revisão com sucesso.', anuncio: anuncioAtualizado });

  } catch (error) {
    next(error);
  }
};


/**
 * Lista os anúncios pertencentes ao anunciante logado.
 */
export const listarMeusAnuncios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido: Apenas anunciantes podem listar seus anúncios.' });
    return;
  }
  try {
    // TODO: Implementar paginação (ex: req.query.page, req.query.limit)
    // TODO: Implementar filtros opcionais (ex: req.query.status)
    const anuncios = await Anuncio.find({ anuncianteId: req.user.userId })
      .sort({ createdAt: -1 }); // Ordena pelos mais recentes primeiro

    res.status(200).json(anuncios);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtém detalhes de um anúncio específico pertencente ao anunciante logado.
 */
export const obterMeuAnuncioDetalhes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;

  // Valida se o ID é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    // Busca o anúncio pelo ID e verifica se pertence ao anunciante logado
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      // Retorna 404 se não encontrar ou se não pertencer ao usuário
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    res.status(200).json(anuncio);
  } catch(error) {
    next(error);
  }
};


/**
 * Atualiza os dados de um anúncio existente.
 * Geralmente permitido enquanto em 'rascunho' ou talvez 'pausado'.
 * Requer que o usuário seja o anunciante dono.
 */
export const atualizarAnuncio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;
  const updates = req.body; // Dados para atualizar

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  // Campos que podem ser atualizados (exemplo, ajuste conforme necessário)
  const allowedUpdates = ['titulo', 'conteudo', 'imagens', 'link', 'tipoAnuncio', 'dataInicioExibicao', 'dataFimExibicao', 'segmentacao'];
  const receivedUpdates = Object.keys(updates);
  const isValidOperation = receivedUpdates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    res.status(400).json({ message: 'Atualização inválida! Campos não permitidos fornecidos.' });
    return ;

  }

  try {
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    // Regra de Negócio: Só permite editar se estiver em Rascunho ou Pausado (Exemplo)
    if (![AnuncioStatusEnum.RASCUNHO, AnuncioStatusEnum.PAUSADO].includes(anuncio.status)) {
      res.status(400).json({ message: `Não é possível editar um anúncio com status '${anuncio.status}'.` });
      return;
    }

    // Aplica as atualizações no documento encontrado
    receivedUpdates.forEach(update => (anuncio as any)[update] = updates[update]);

    // Atualiza datas se fornecidas
    if (updates.dataInicioExibicao) anuncio.dataInicioExibicao = new Date(updates.dataInicioExibicao);
    if (updates.dataFimExibicao) anuncio.dataFimExibicao = new Date(updates.dataFimExibicao);

    // Salva o documento atualizado (isso dispara validações do Mongoose)
    const anuncioAtualizado = await anuncio.save();

    res.status(200).json({ message: 'Anúncio atualizado com sucesso.', anuncio: anuncioAtualizado });

  } catch (error) {
    // Pode ser um erro de validação do Mongoose
    if ((error as any).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação.', errors: (error as any).errors });
      return;
    }
    next(error);
  }
};

// =============================================
// == Funções Públicas (ESTAVAM FALTANDO)    ==
// =============================================

/**
 * Lista anúncios públicos aprovados/ativos. (CU7 - Visualização)
 */
export const listarAnunciosPublicos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implementar filtros mais avançados (req.query: tipo, regiao, etc.)
    // TODO: Implementar paginação (req.query: page, limit)
    // TODO: Considerar não mostrar anúncios com data de exibição futura ou passada, se aplicável

    const query = {
      status: AnuncioStatusEnum.APROVADO, // Somente anúncios aprovados
      // Opcional: Filtrar por data de exibição, se necessário
      // dataInicioExibicao: { $lte: new Date() },
      // dataFimExibicao: { $gte: new Date() },
    };

    const anuncios = await Anuncio.find(query)
      .select('-historicoStatus -rejeicaoMotivo') // Exclui campos internos/sensíveis
      .populate('anuncianteId', 'nome foto') // Exemplo: Puxa nome e foto do anunciante
      .sort({ createdAt: -1 }); // Ou por relevância, etc.

    res.status(200).json(anuncios);

  } catch (error) {
    next(error);
  }
};

/**
 * Vê detalhes de um anúncio público específico.
 */
export const obterDetalhesAnuncioPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { anuncioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    const anuncio = await Anuncio.findOne({
      _id: anuncioId,
      status: AnuncioStatusEnum.APROVADO // Garante que só busca aprovados
    })
      .select('-historicoStatus -rejeicaoMotivo') // Exclui campos internos
      .populate('anuncianteId', 'nome email foto'); // Puxa dados do anunciante

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não está ativo.' });
      return;
    }

    // TODO: Incrementar contador de visualizações se necessário
    // anuncio.visualizacoes = (anuncio.visualizacoes || 0) + 1;
    // await anuncio.save(); // Cuidado com concorrência aqui

    res.status(200).json(anuncio);

  } catch (error) {
    next(error);
  }
};

// ============================================================
// == Funções Anunciante (Status/Delete - ESTAVAM FALTANDO) ==
// ============================================================

/**
 * Anunciante atualiza o status de seu anúncio (ex: pausar, reativar).
 */
export const atualizarStatusAnuncioAnunciante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;
  const { status } = req.body; // Novo status desejado

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  // Valida se o status recebido é um dos valores permitidos pelo Enum
  if (!status || !Object.values(AnuncioStatusEnum).includes(status as AnuncioStatusEnum)) {
    res.status(400).json({ message: 'Status inválido ou não fornecido.' });
    return;
  }

  // TODO: Definir quais transições de status são permitidas para o ANUNCIANTE
  // Ex: Anunciante pode mudar de APROVADO para PAUSADO, ou de PAUSADO para APROVADO?
  //     Anunciante pode mudar de RASCUNHO para PENDENTE? (Talvez usar submeterParaRevisao)
  const allowedTransitions: { [key in AnuncioStatusEnum]?: AnuncioStatusEnum[] } = {
    [AnuncioStatusEnum.APROVADO]: [AnuncioStatusEnum.PAUSADO],
    [AnuncioStatusEnum.PAUSADO]: [AnuncioStatusEnum.APROVADO], // Exemplo: permitir reativar
    // Rascunho -> Pendente é feito por 'submeterParaRevisao'
  };

  try {
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    const currentStatus = anuncio.status;
    const targetStatus = status as AnuncioStatusEnum;

    // Verifica se a transição é permitida para o anunciante
    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      res.status(400).json({ message: `Mudança de status de '${currentStatus}' para '${targetStatus}' não permitida por você.` });
      return;
    }

    // Atualiza o status e salva
    anuncio.status = targetStatus;
    // Limpa motivo de rejeição se estiver sendo reativado/aprovado pelo anunciante (se aplicável)
    if (targetStatus === AnuncioStatusEnum.APROVADO) {
      anuncio.rejeicaoMotivo = undefined;
    }
    const anuncioAtualizado = await anuncio.save(); // Dispara hooks e validações

    res.status(200).json({ message: `Status do anúncio atualizado para '${targetStatus}'.`, anuncio: anuncioAtualizado });

  } catch (error) {
    next(error);
  }
};

/**
 * Deleta um anúncio. (CU?).
 * Requer que o usuário seja o anunciante dono.
 */
export const deletarAnuncio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    // Encontra e deleta o anúncio se pertencer ao usuário
    const result = await Anuncio.findOneAndDelete({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!result) {
      // Se não encontrou nada para deletar (ou não pertence ao usuário)
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    // TODO: Deletar imagens associadas do S3/Cloudinary, se houver

    res.status(200).json({ message: 'Anúncio deletado com sucesso.' });

  } catch (error) {
    next(error);
  }
};


// =============================================
// == Funções de Administração (ESTAVAM FALTANDO) ==
// =============================================

/**
 * Admin lista anúncios pendentes de aprovação. (CU20)
 */
export const listarAnunciosPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está logado E é um ADMIN
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido: Apenas administradores.' });
    return;
  }

  try {
    // TODO: Implementar paginação (req.query: page, limit)
    const anunciosPendentes = await Anuncio.find({ status: AnuncioStatusEnum.PENDENTE_APROVACAO })
      .populate('anuncianteId', 'nome email') // Puxa dados do anunciante para o admin ver
      .sort({ createdAt: 1 }); // Ordena pelos mais antigos primeiro

    res.status(200).json(anunciosPendentes);

  } catch (error) {
    next(error);
  }
};

/**
 * Admin aprova ou rejeita um anúncio pendente. (CU20)
 */
export const revisarAnuncio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está logado E é um ADMIN
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido: Apenas administradores.' });
    return;
  }

  const { anuncioId } = req.params;
  const { acao, motivo } = req.body; // 'acao' deve ser 'aprovar' ou 'rejeitar', 'motivo' obrigatório se rejeitar

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  // Valida a ação recebida
  if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
    res.status(400).json({ message: "Ação inválida. Use 'aprovar' ou 'rejeitar'." });
    return;
  }

  // Valida o motivo se a ação for rejeitar
  if (acao === 'rejeitar' && !motivo) {
    res.status(400).json({ message: 'Motivo da rejeição é obrigatório.' });
    return;
  }

  try {
    const anuncio = await Anuncio.findById(anuncioId);

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado.' });
      return;
    }

    // Verifica se o anúncio está realmente pendente
    if (anuncio.status !== AnuncioStatusEnum.PENDENTE_APROVACAO) {
      res.status(400).json({ message: `Este anúncio não está pendente de aprovação (status atual: ${anuncio.status}).` });
      return;
    }

    // Aplica a revisão
    if (acao === 'aprovar') {
      anuncio.status = AnuncioStatusEnum.APROVADO;
      anuncio.rejeicaoMotivo = undefined; // Limpa motivo anterior, se houver
      // TODO: Definir data de aprovação se necessário: anuncio.dataAprovacao = new Date();
    } else { // acao === 'rejeitar'
      anuncio.status = AnuncioStatusEnum.REJEITADO;
      anuncio.rejeicaoMotivo = motivo;
      // TODO: Definir data de rejeição se necessário: anuncio.dataRejeicao = new Date();
    }

    // Adiciona ao histórico (exemplo)
    // anuncio.historicoStatus.push({ status: anuncio.status, data: new Date(), adminId: req.user.userId });

    const anuncioRevisado = await anuncio.save();

    // TODO: Notificar o anunciante sobre o resultado da revisão (opcional)

    res.status(200).json({ message: `Anúncio ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso.`, anuncio: anuncioRevisado });

  } catch (error) {
    next(error);
  }
};