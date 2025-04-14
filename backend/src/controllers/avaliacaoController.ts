// src/controllers/avaliacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Avaliacao, { IAvaliacao } from '../models/Avaliacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import { TipoUsuarioEnum } from '../models/User';

// --- Tipos para Payloads (Exemplo) ---
interface RegistrarAvaliacaoBody {
  contratacaoId: string;
  nota: number;
  comentario?: string;
}

interface EditarAvaliacaoBody {
  nota?: number;
  comentario?: string;
}

// --- Funções do Controller ---

/**
 * Registra uma nova avaliação para uma Contratacao concluída (CU10).
 * Valida se o autor participou, se a contratação está concluída,
 * e se já não existe avaliação para essa combinação.
 */
export const registrarAvaliacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica usuário logado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const autorId = req.user.userId;
  const { contratacaoId, nota, comentario } = req.body as RegistrarAvaliacaoBody;

  // Validação básica do input
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
    // 1. Busca a Contratação
    const contratacao = await Contratacao.findById(contratacaoId);
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }

    // 2. Valida Status da Contratação
    if (contratacao.status !== ContratacaoStatusEnum.CONCLUIDO) {
      res.status(400).json({ message: 'Só é possível avaliar contratações concluídas.' });
      return;
    }

    // 3. Determina Autor e Receptor e Valida Participação
    let receptorId: mongoose.Types.ObjectId | null = null;
    if (contratacao.buyerId.toString() === autorId) {
      receptorId = contratacao.prestadorId as unknown as mongoose.Types.ObjectId; // Buyer está avaliando Prestador
    } else if (contratacao.prestadorId.toString() === autorId) {
      receptorId = contratacao.buyerId as unknown as mongoose.Types.ObjectId; // Prestador está avaliando Buyer
    } else {
      // Se o usuário logado não for nem buyer nem prestador desta contratação
      res.status(403).json({ message: 'Acesso proibido: Você não participou desta contratação.' });
      return;
    }

    // 4. Verifica Avaliação Duplicada (usando o índice unique)
    const avaliacaoExistente = await Avaliacao.findOne({
      autor: autorId,
      receptor: receptorId,
      contratacaoId: contratacaoId
    });
    if (avaliacaoExistente) {
      res.status(409).json({ message: 'Você já avaliou esta parte para esta contratação.' }); // 409 Conflict
      return;
    }

    // 5. Cria e Salva a Nova Avaliação
    const novaAvaliacao = new Avaliacao({
      contratacaoId: contratacaoId,
      autor: autorId,
      receptor: receptorId,
      nota: nota,
      comentario: comentario
    });

    const avaliacaoSalva = await novaAvaliacao.save();

    // TODO: Opcional: Calcular e atualizar a nota média do usuário 'receptor' no modelo User?
    //       (Pode ser custoso fazer a cada avaliação, talvez calcular sob demanda ao buscar perfil)

    // TODO: Enviar notificação para o 'receptor' sobre a nova avaliação?

    res.status(201).json({ message: 'Avaliação registrada com sucesso.', avaliacao: avaliacaoSalva });

  } catch (error) {
    // O índice unique do Mongoose pode gerar um erro específico (código 11000)
    if ((error as any).code === 11000) {
      res.status(409).json({ message: 'Erro: Avaliação duplicada detectada.' });
      return;
    }
    next(error); // Delega para o error handler central
  }
};

/**
 * Edita uma avaliação existente.
 * Requer que o usuário logado seja o autor original da avaliação.
 * ATENÇÃO: Avaliar a política de negócio sobre permitir edição.
 */
export const editarAvaliacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const autorId = req.user.userId;
  const { avaliacaoId } = req.params;
  const { nota, comentario } = req.body as EditarAvaliacaoBody;

  if (!mongoose.Types.ObjectId.isValid(avaliacaoId)) {
    res.status(400).json({ message: 'ID da avaliação inválido.' });
    return;
  }

  // Validação básica do input
  const updates: Partial<Pick<IAvaliacao, 'nota' | 'comentario'>> = {};
  if (nota !== undefined) {
    if (typeof nota !== 'number' || nota < 1 || nota > 5) {
      res.status(400).json({ message: 'Nota inválida. Deve ser um número entre 1 e 5.' });
      return;
    }
    updates.nota = nota;
  }
  if (comentario !== undefined) { // Permite enviar comentário vazio para limpar? Ou validar minLength?
    if (typeof comentario !== 'string') {
      res.status(400).json({ message: 'Comentário inválido.' });
      return;
    }
    updates.comentario = comentario;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido (nota ou comentario).' });
    return;
  }

  // TODO: Implementar regra de negócio sobre TEMPO limite para edição, se houver.
  // const avaliacaoOriginal = await Avaliacao.findOne({ _id: avaliacaoId, autor: autorId });
  // if (avaliacaoOriginal && (Date.now() - avaliacaoOriginal.createdAt.getTime()) > TEMPO_LIMITE_MS) {
  //   return res.status(403).json({ message: 'Prazo para edição expirado.' });
  // }

  try {
    // Atualiza apenas se a avaliação existir E pertencer ao autor logado
    const avaliacaoAtualizada = await Avaliacao.findOneAndUpdate(
      { _id: avaliacaoId, autor: autorId }, // Condição de busca e autorização
      { $set: updates }, // Atualiza apenas os campos fornecidos
      { new: true, runValidators: true, context: 'query' } // Opções
    );

    if (!avaliacaoAtualizada) {
      res.status(404).json({ message: 'Avaliação não encontrada ou você não tem permissão para editá-la.' });
      return;
    }

    // TODO: Recalcular nota média do receptor se a nota foi alterada?

    res.status(200).json({ message: 'Avaliação atualizada com sucesso.', avaliacao: avaliacaoAtualizada });

  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da avaliação inválido.' });
      return;
    }
    next(error);
  }
};

// --- Funções Faltantes (Placeholders) ---

export const listarAvaliacoesRecebidas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'ID do usuário inválido.' });
    return;
  }
  // TODO: Implementar busca por avaliações onde 'receptor' === userId
  // Adicionar paginação, ordenação (ex: por createdAt desc)
  // Popular 'autor' com dados selecionados?
  try {
    const avaliacoes = await Avaliacao.find({ receptor: userId })
      .sort({ createdAt: -1 })
      .populate('autor', 'nome foto'); // Exemplo
    res.status(200).json(avaliacoes);
  } catch(error) {
    next(error);
  }
};

export const listarAvaliacoesDaContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { // Requer login para ver avaliações de uma contratação? Ou é público? Definir regra.
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { contratacaoId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }
  // TODO: Validar se o usuário logado participou da contratação (se não for público)
  try {
    const avaliacoes = await Avaliacao.find({ contratacaoId: contratacaoId })
      .populate('autor', 'nome foto')
      .populate('receptor', 'nome foto');
    res.status(200).json(avaliacoes);
  } catch(error) {
    next(error);
  }
};

// TODO: Implementar deleteAvaliacao (se necessário) com verificações de permissão