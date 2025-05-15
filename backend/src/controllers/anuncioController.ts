// src/controllers/anuncioController.ts
// Controlador responsável por gerenciar todas as operações relacionadas a anúncios
// Inclui funções para criação, edição, listagem, aprovação e exclusão de anúncios

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Anuncio, { IAnuncio, AnuncioStatusEnum } from '../models/Anuncio'; // Importa modelo e interface/enum
import User, { TipoUsuarioEnum } from '../models/User'; // Importa enum e talvez modelo do User se precisar popular

// --- Funções do Controller ---
// Este arquivo contém todas as funções de controle para gerenciamento de anúncios
// Inclui operações para anunciantes, administradores e visualizações públicas

// =============================================
// == Funções para Anunciantes (JÁ EXISTIAM) ==
// =============================================

/**
 * Cria um novo anúncio com status inicial 'rascunho'.
 * Requer que o usuário seja um Anunciante. (CU7 - Criação)
 * Esta função valida o usuário, extrai dados do corpo da requisição e cria um novo anúncio no banco de dados.
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

    // Cria uma nova instância do modelo de Anúncio com os dados fornecidos
    const novoAnuncio = new Anuncio({
      anuncianteId: req.user.userId, // Associa o anúncio ao usuário logado
      titulo,
      conteudo,
      imagens, // Array de URLs de imagens
      link, // Link externo opcional
      tipoAnuncio, // Tipo/categoria do anúncio
      dataInicioExibicao: dataInicioExibicao ? new Date(dataInicioExibicao) : undefined, // Converte string para objeto Date
      dataFimExibicao: dataFimExibicao ? new Date(dataFimExibicao) : undefined, // Converte string para objeto Date
      segmentacao, // Informações de segmentação do público-alvo
      status: AnuncioStatusEnum.RASCUNHO // Status inicial sempre como rascunho
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
 * Esta função permite que um anunciante envie um anúncio em estado de rascunho para ser revisado pelos administradores.
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
    // Busca o anúncio no banco de dados e verifica se pertence ao usuário logado
    // Isso garante que um anunciante só possa submeter seus próprios anúncios
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    // Verifica se o anúncio está no estado correto para submissão
    // Só permite submeter para revisão anúncios que estejam em estado de rascunho
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
 * Esta função recupera todos os anúncios criados pelo anunciante atual, ordenados por data de criação.
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
 * Esta função busca informações detalhadas de um anúncio específico, verificando se o anunciante tem permissão para acessá-lo.
 */
export const obterMeuAnuncioDetalhes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { anuncioId } = req.params;
  const anuncianteId = req.user.userId;

  // Valida se o ID fornecido é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    // Busca o anúncio pelo ID e verifica se pertence ao anunciante logado
    // Usa uma única consulta que combina o ID do anúncio e o ID do anunciante
    const anuncio = await Anuncio.findOne({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!anuncio) {
      // Retorna 404 se não encontrar ou se não pertencer ao usuário
      // Não especifica qual dos dois casos ocorreu por questões de segurança
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
 * Esta função permite modificar os campos de um anúncio existente, com validações de permissão e estado.
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

  // Define quais campos do anúncio podem ser atualizados pelo anunciante
  const allowedUpdates = ['titulo', 'conteudo', 'imagens', 'link', 'tipoAnuncio', 'dataInicioExibicao', 'dataFimExibicao', 'segmentacao'];
  const receivedUpdates = Object.keys(updates); // Obtém os campos que o anunciante está tentando atualizar
  const isValidOperation = receivedUpdates.every(update => allowedUpdates.includes(update)); // Verifica se todos os campos são permitidos

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
// Estas funções permitem acesso público aos anúncios aprovados
// São utilizadas para exibição de anúncios aos usuários finais

/**
 * Lista anúncios públicos aprovados/ativos. (CU7 - Visualização)
 * Esta função retorna todos os anúncios que foram aprovados e estão disponíveis para visualização pública.
 */
export const listarAnunciosPublicos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implementar filtros mais avançados (req.query: tipo, regiao, etc.)
    // TODO: Implementar paginação (req.query: page, limit)
    // TODO: Considerar não mostrar anúncios com data de exibição futura ou passada, se aplicável

    // Define os critérios de busca para anúncios públicos
    const query = {
      status: AnuncioStatusEnum.APROVADO, // Somente anúncios aprovados
      // Opcional: Filtrar por data de exibição, se necessário
      // dataInicioExibicao: { $lte: new Date() }, // Data de início menor ou igual a agora
      // dataFimExibicao: { $gte: new Date() }, // Data de fim maior ou igual a agora
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
 * Esta função recupera informações detalhadas de um anúncio aprovado específico para visualização pública.
 */
export const obterDetalhesAnuncioPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { anuncioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(anuncioId)) {
    res.status(400).json({ message: 'ID do anúncio inválido.' });
    return;
  }

  try {
    // Busca o anúncio no banco de dados, garantindo que esteja aprovado
    const anuncio = await Anuncio.findOne({
      _id: anuncioId,
      status: AnuncioStatusEnum.APROVADO // Garante que só busca anúncios aprovados para visualização pública
    })
      .select('-historicoStatus -rejeicaoMotivo') // Exclui campos internos/administrativos da resposta
      .populate('anuncianteId', 'nome email foto'); // Inclui dados básicos do anunciante na resposta

    if (!anuncio) {
      res.status(404).json({ message: 'Anúncio não encontrado ou não está ativo.' });
      return;
    }

    // TODO: Incrementar contador de visualizações se necessário
    // anuncio.visualizacoes = (anuncio.visualizacoes || 0) + 1;
    // await anuncio.save(); // Cuidado com problemas de concorrência aqui

    res.status(200).json(anuncio);

  } catch (error) {
    next(error);
  }
};

// ============================================================
// == Funções Anunciante (Status/Delete - ESTAVAM FALTANDO) ==
// ============================================================
// Estas funções permitem que anunciantes gerenciem o status de seus anúncios
// e também possam excluir anúncios quando necessário

/**
 * Anunciante atualiza o status de seu anúncio (ex: pausar, reativar).
 * Esta função permite que um anunciante altere o status de seus próprios anúncios,
 * com validações para garantir que apenas transições permitidas sejam realizadas.
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
  // Exemplo: Anunciante pode mudar de APROVADO para PAUSADO, ou de PAUSADO para APROVADO?
  // Anunciante pode mudar de RASCUNHO para PENDENTE? (Talvez usar submeterParaRevisao)
  // Define as transições de status permitidas para o anunciante
  // Mapeia cada status atual para os status para os quais ele pode ser alterado
  const allowedTransitions: { [key in AnuncioStatusEnum]?: AnuncioStatusEnum[] } = {
    [AnuncioStatusEnum.APROVADO]: [AnuncioStatusEnum.PAUSADO], // Anunciante pode pausar um anúncio ativo
    [AnuncioStatusEnum.PAUSADO]: [AnuncioStatusEnum.APROVADO], // Anunciante pode reativar um anúncio pausado
    // Rascunho -> Pendente é feito pela função 'submeterParaRevisao'
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
 * Esta função permite que um anunciante exclua permanentemente um de seus anúncios do sistema.
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
    // Busca e remove o anúncio do banco de dados em uma única operação
    // Garante que apenas o proprietário do anúncio possa excluí-lo
    const result = await Anuncio.findOneAndDelete({ _id: anuncioId, anuncianteId: anuncianteId });

    if (!result) {
      // Se não encontrou nada para deletar (ou não pertence ao usuário)
      res.status(404).json({ message: 'Anúncio não encontrado ou não pertence a você.' });
      return;
    }

    // TODO: Implementar limpeza de recursos associados (imagens no S3/Cloudinary, etc)

    res.status(200).json({ message: 'Anúncio deletado com sucesso.' });

  } catch (error) {
    next(error);
  }
};


// =============================================
// == Funções de Administração (ESTAVAM FALTANDO) ==
// =============================================
// Estas funções são exclusivas para administradores do sistema
// Permitem gerenciar o processo de aprovação de anúncios

/**
 * Admin lista anúncios pendentes de aprovação. (CU20)
 * Esta função retorna todos os anúncios que estão aguardando revisão por um administrador.
 */
export const listarAnunciosPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está logado E é um ADMIN
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido: Apenas administradores.' });
    return;
  }

  try {
    // TODO: Implementar paginação (req.query: page, limit)
    // Busca todos os anúncios com status pendente de aprovação
    const anunciosPendentes = await Anuncio.find({ status: AnuncioStatusEnum.PENDENTE_APROVACAO })
      .populate('anuncianteId', 'nome email') // Inclui dados do anunciante para o administrador identificar a origem
      .sort({ createdAt: 1 }); // Ordena pelos mais antigos primeiro (fila de aprovação)

    res.status(200).json(anunciosPendentes);

  } catch (error) {
    next(error);
  }
};

/**
 * Admin aprova ou rejeita um anúncio pendente. (CU20)
 * Esta função permite que um administrador revise um anúncio pendente e decida se ele deve ser aprovado ou rejeitado.
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

    // Aplica a decisão de revisão (aprovação ou rejeição)
    if (acao === 'aprovar') {
      anuncio.status = AnuncioStatusEnum.APROVADO;
      anuncio.rejeicaoMotivo = undefined; // Limpa motivo de rejeição anterior, se houver
      // TODO: Definir data de aprovação se necessário: anuncio.dataAprovacao = new Date();
    } else { // acao === 'rejeitar'
      anuncio.status = AnuncioStatusEnum.REJEITADO;
      anuncio.rejeicaoMotivo = motivo; // Armazena o motivo da rejeição para feedback ao anunciante
      // TODO: Definir data de rejeição se necessário: anuncio.dataRejeicao = new Date();
    }

    // Opção para adicionar ao histórico de status do anúncio
    // anuncio.historicoStatus.push({ status: anuncio.status, data: new Date(), adminId: req.user.userId });

    // Salva as alterações no banco de dados
    const anuncioRevisado = await anuncio.save();

    // TODO: Implementar notificação ao anunciante sobre o resultado da revisão (opcional)

    res.status(200).json({ message: `Anúncio ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso.`, anuncio: anuncioRevisado });

  } catch (error) {
    next(error);
  }
};
