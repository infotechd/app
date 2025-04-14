// src/controllers/curriculoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Curriculo, { ICurriculo, IExperiencia, IProjeto } from '../models/Curriculo'; // Importa modelo e interfaces
import { TipoUsuarioEnum } from '../models/User'; // Importa enum do User

// Interface para o payload de criação/atualização (exemplo)
interface CurriculoPayload {
  resumoProfissional?: string;
  experiencias?: IExperiencia[];
  habilidades?: string[];
  projetos?: IProjeto[];
}

// --- Funções do Controller ---

/**
 * Cria o currículo para o prestador logado.
 * Retorna erro 409 se o prestador já possuir um currículo.
 */
export const createCurriculo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido: Apenas prestadores podem criar currículos.' });
    return;
  }
  const prestadorId = req.user.userId;

  // TODO: Validar a estrutura de req.body (experiencias, habilidades, projetos) com Joi/express-validator
  const { resumoProfissional, experiencias, habilidades, projetos } = req.body as CurriculoPayload;

  try {
    // Verifica se já existe um currículo (alternativa ao try/catch do erro 11000)
    const existingCurriculo = await Curriculo.findOne({ prestadorId });
    if (existingCurriculo) {
      res.status(409).json({ message: 'Conflito: Já existe um currículo para este prestador.' });
      return;
    }

    const novoCurriculo = new Curriculo({
      prestadorId,
      resumoProfissional,
      experiencias, // Assume que o body já vem com a estrutura correta do array de subdocumentos
      habilidades, // Assume que o body já vem com o array de strings
      projetos // Assume que o body já vem com a estrutura correta do array de subdocumentos
    });

    const curriculoSalvo = await novoCurriculo.save();
    res.status(201).json({ message: 'Currículo cadastrado com sucesso.', curriculo: curriculoSalvo });

  } catch (error) {
    // Trata erro de chave duplicada caso a verificação acima falhe por concorrência
    if ((error as any).code === 11000) {
      res.status(409).json({ message: 'Conflito: Já existe um currículo para este prestador (erro BD).' });
      return;
    }
    next(error); // Delega outros erros
  }
};

/**
 * Obtém o currículo do prestador logado.
 */
export const getCurriculoByPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const prestadorId = req.user.userId;

  try {
    const curriculo = await Curriculo.findOne({ prestadorId: prestadorId })
      .populate('prestadorId', 'nome email foto'); // Popula dados do User

    if (!curriculo) {
      // Não é necessariamente um erro, o prestador pode não ter criado ainda
      res.status(404).json({ message: 'Nenhum currículo encontrado para este prestador.' });
      return;
    }
    res.status(200).json(curriculo); // Retorna o currículo populado

  } catch (error) {
    next(error);
  }
};

/**
 * Atualiza o currículo do prestador logado.
 * Substitui completamente os campos fornecidos (experiencias, habilidades, projetos).
 */
export const updateCurriculo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const prestadorId = req.user.userId;
  // TODO: Validar a estrutura de req.body
  const { resumoProfissional, experiencias, habilidades, projetos } = req.body as CurriculoPayload;

  // Cria objeto apenas com os campos que podem ser atualizados
  const updates: Partial<ICurriculo> = {};
  if (resumoProfissional !== undefined) updates.resumoProfissional = resumoProfissional;
  if (experiencias !== undefined) updates.experiencias = experiencias; // Substitui todo o array
  if (habilidades !== undefined) updates.habilidades = habilidades; // Substitui todo o array
  if (projetos !== undefined) updates.projetos = projetos; // Substitui todo o array

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }

  try {
    // Encontra e atualiza o currículo pelo prestadorId
    // Usar findOneAndUpdate é seguro aqui pois a condição de busca já garante a propriedade
    const curriculoAtualizado = await Curriculo.findOneAndUpdate(
      { prestadorId: prestadorId },
      { $set: updates }, // Usa $set para atualizar apenas os campos fornecidos
      { new: true, runValidators: true, context: 'query', upsert: false } // upsert: false para não criar se não existir
    );

    if (!curriculoAtualizado) {
      // Se não achou, o prestador ainda não tem currículo (deveria criar primeiro via POST)
      res.status(404).json({ message: 'Currículo não encontrado para este prestador. Crie um primeiro.' });
      return;
    }

    res.status(200).json({ message: 'Currículo atualizado com sucesso.', curriculo: curriculoAtualizado });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém o currículo público de um prestador específico pelo ID.
 */
export const getPublicCurriculoByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { prestadorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
    res.status(400).json({ message: 'ID do prestador inválido.' });
    return;
  }

  try {
    const curriculo = await Curriculo.findOne({ prestadorId: prestadorId })
      // Popula dados públicos do prestador associado
      .populate('prestadorId', 'nome foto tipoUsuario'); // Exemplo

    if (!curriculo) {
      res.status(404).json({ message: 'Currículo não encontrado para este prestador.' });
      return;
    }

    // Retorna o currículo encontrado (com dados do prestador populados)
    res.status(200).json(curriculo);

  } catch (error) {
    next(error);
  }
};


// TODO: Implementar deleteCurriculo se necessário
// export const deleteCurriculo = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... }