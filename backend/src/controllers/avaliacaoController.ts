// src/controllers/avaliacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import { TipoUsuarioEnum } from '../models/User';

// --- Interfaces para os dados de entrada ---
// Interface que define a estrutura dos dados para registrar uma nova avaliação
interface RegistrarAvaliacaoBody {
  contratacaoId: string;  // ID da contratação que está sendo avaliada
  nota: number;           // Nota da avaliação (1-5)
  comentario?: string;    // Comentário opcional sobre a avaliação
}

// Interface que define a estrutura dos dados para editar uma avaliação existente
interface EditarAvaliacaoBody {
  nota?: number;          // Nova nota opcional
  comentario?: string;    // Novo comentário opcional
}

// --- Funções do Controller ---

/**
 * Registra uma nova avaliação para uma Contratação concluída (CU10).
 * Valida se o autor participou da contratação, se a contratação está concluída,
 * e se não existe avaliação prévia para essa combinação de autor/receptor/contratação.
 */
export const registrarAvaliacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const autorId = req.user.userId;
  const { contratacaoId, nota, comentario } = req.body as RegistrarAvaliacaoBody;

  // Validação dos dados de entrada
  if (!contratacaoId || !mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido ou ausente.' });
    return;
  }
  if (nota === undefined || nota === null || nota < 1 || nota > 5) {
    res.status(400).json({ message: 'Nota inválida. Deve ser um número entre 1 e 5.' });
    return;
  }
  if (comentario && typeof comentario !== 'string') {
    res.status(400).json({ message: 'Comentário inválido.' });
    return;
  }

  try {
    // 1. Busca a contratação no banco de dados
    const contratacao = await Contratacao.findById(contratacaoId);
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }

    // 2. Verifica se a contratação está concluída
    if (contratacao.status !== ContratacaoStatusEnum.CONCLUIDO) {
      res.status(400).json({ message: 'Só é possível avaliar contratações concluídas.' });
      return;
    }

    // 3. Identifica quem é o autor e o receptor da avaliação e valida a participação
    let receptorId: mongoose.Types.ObjectId | null = null;
    if (contratacao.buyerId.toString() === autorId) {
      receptorId = contratacao.prestadorId as unknown as mongoose.Types.ObjectId; // Comprador está avaliando o Prestador
    } else if (contratacao.prestadorId.toString() === autorId) {
      receptorId = contratacao.buyerId as unknown as mongoose.Types.ObjectId; // Prestador está avaliando o Comprador
    } else {
      // Usuário não participou desta contratação
      res.status(403).json({ message: 'Acesso proibido: Você não participou desta contratação.' });
      return;
    }

    // 4. Verifica se já existe uma avaliação para esta combinação de autor/receptor/contratação
    const avaliacaoExistente = await Avaliacao.findOne({
      autor: autorId,
      receptor: receptorId,
      contratacaoId: contratacaoId
    });
    if (avaliacaoExistente) {
      res.status(409).json({ message: 'Você já avaliou esta parte para esta contratação.' }); // 409 Conflito
      return;
    }

    // 5. Cria e salva a nova avaliação no banco de dados
    const novaAvaliacao = new Avaliacao({
      contratacaoId: contratacaoId,
      autor: autorId,
      receptor: receptorId,
      nota: nota,
      comentario: comentario
    });

    const avaliacaoSalva = await novaAvaliacao.save();

    // TODO: Calcular e atualizar a nota média do usuário receptor no modelo User
    //       (Pode ser custoso fazer a cada avaliação, considerar calcular sob demanda ao buscar perfil)

    // TODO: Implementar envio de notificação para o receptor sobre a nova avaliação

    res.status(201).json({ message: 'Avaliação registrada com sucesso.', avaliacao: avaliacaoSalva });

  } catch (error) {
    // Tratamento para erro de duplicidade (índice único do MongoDB)
    if ((error as any).code === 11000) {
      res.status(409).json({ message: 'Erro: Avaliação duplicada detectada.' });
      return;
    }
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

/**
 * Edita uma avaliação existente.
 * Requer que o usuário logado seja o autor original da avaliação.
 * Observação: É necessário definir a política de negócio sobre permitir edição.
 */
export const editarAvaliacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const autorId = req.user.userId;
  const { avaliacaoId } = req.params;
  const { nota, comentario } = req.body as EditarAvaliacaoBody;

  // Verifica se o ID da avaliação é válido
  if (!mongoose.Types.ObjectId.isValid(avaliacaoId)) {
    res.status(400).json({ message: 'ID da avaliação inválido.' });
    return;
  }

  // Validação dos dados de entrada e preparação das atualizações
  const updates: Partial<Pick<IAvaliacao, 'nota' | 'comentario'>> = {};
  if (nota !== undefined) {
    if (typeof nota !== 'number' || nota < 1 || nota > 5) {
      res.status(400).json({ message: 'Nota inválida. Deve ser um número entre 1 e 5.' });
      return;
    }
    updates.nota = nota;
  }
  if (comentario !== undefined) { // Permite enviar comentário vazio para limpar o campo
    if (typeof comentario !== 'string') {
      res.status(400).json({ message: 'Comentário inválido.' });
      return;
    }
    updates.comentario = comentario;
  }

  // Verifica se há campos para atualizar
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido (nota ou comentario).' });
    return;
  }

  // TODO: Implementar regra de negócio sobre tempo limite para edição, se necessário.
  // const avaliacaoOriginal = await Avaliacao.findOne({ _id: avaliacaoId, autor: autorId });
  // if (avaliacaoOriginal && (Date.now() - avaliacaoOriginal.createdAt.getTime()) > TEMPO_LIMITE_MS) {
  //   return res.status(403).json({ message: 'Prazo para edição expirado.' });
  // }

  try {
    // Busca e atualiza a avaliação, garantindo que pertença ao autor logado
    const avaliacaoAtualizada = await Avaliacao.findOneAndUpdate(
      { _id: avaliacaoId, autor: autorId }, // Condição que garante que apenas o autor pode editar
      { $set: updates }, // Atualiza apenas os campos fornecidos
      { new: true, runValidators: true, context: 'query' } // Opções para retornar o documento atualizado
    );

    // Verifica se a avaliação foi encontrada e atualizada
    if (!avaliacaoAtualizada) {
      res.status(404).json({ message: 'Avaliação não encontrada ou você não tem permissão para editá-la.' });
      return;
    }

    // TODO: Implementar recálculo da nota média do receptor se a nota foi alterada

    // Retorna sucesso com a avaliação atualizada
    res.status(200).json({ message: 'Avaliação atualizada com sucesso.', avaliacao: avaliacaoAtualizada });

  } catch (error) {
    // Tratamento de erro específico para ID inválido
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da avaliação inválido.' });
      return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

// --- Funções Adicionais ---

/**
 * Lista todas as avaliações recebidas por um usuário específico.
 * Retorna as avaliações ordenadas por data de criação (mais recentes primeiro).
 */
export const listarAvaliacoesRecebidas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.params;
  // Verifica se o ID do usuário é válido
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'ID do usuário inválido.' });
    return;
  }

  // Busca todas as avaliações onde o usuário é o receptor
  try {
    const avaliacoes = await Avaliacao.find({ receptor: userId })
      .sort({ createdAt: -1 }) // Ordena por data de criação (mais recentes primeiro)
      .populate('autor', 'nome foto'); // Inclui informações básicas do autor

    res.status(200).json(avaliacoes);
  } catch(error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

/**
 * Lista todas as avaliações relacionadas a uma contratação específica.
 * Requer autenticação do usuário.
 */
export const listarAvaliacoesDaContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { // Requer login para ver avaliações de uma contratação
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { contratacaoId } = req.params;
  const userId = req.user.userId;

  // Verifica se o ID da contratação é válido
  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }

  // TODO: Implementar validação para verificar se o usuário logado participou da contratação (caso não seja público)

  // Busca todas as avaliações relacionadas à contratação
  try {
    const avaliacoes = await Avaliacao.find({ contratacaoId: contratacaoId })
      .populate('autor', 'nome foto') // Inclui informações básicas do autor
      .populate('receptor', 'nome foto'); // Inclui informações básicas do receptor

    res.status(200).json(avaliacoes);
  } catch(error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

// TODO: Implementar função para excluir avaliação (se necessário) com verificações de permissão do usuário
