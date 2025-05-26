// src/controllers/curriculoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Curriculo, { ICurriculo, IExperiencia, IProjeto } from '../models/Curriculo'; // Importa modelo e interfaces
import { TipoUsuarioEnum } from '../models/User'; // Importa enum do User

// Interface que define a estrutura de dados para criação ou atualização de um currículo
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
    // Verifica se já existe um currículo para evitar duplicação
    const existingCurriculo = await Curriculo.findOne({ prestadorId });
    if (existingCurriculo) {
      res.status(409).json({ message: 'Conflito: Já existe um currículo para este prestador.' });
      return;
    }

    const novoCurriculo = new Curriculo({
      prestadorId,
      resumoProfissional,
      experiencias, // Considera que os dados já estão na estrutura correta do array de subdocumentos
      habilidades, // Considera que os dados já estão no formato de array de strings
      projetos // Considera que os dados já estão na estrutura correta do array de subdocumentos
    });

    const curriculoSalvo = await novoCurriculo.save();
    res.status(201).json({ message: 'Currículo cadastrado com sucesso.', curriculo: curriculoSalvo });

  } catch (error) {
    // Trata erro de chave duplicada caso ocorra concorrência na verificação anterior
    if ((error as any).code === 11000) {
      res.status(409).json({ message: 'Conflito: Já existe um currículo para este prestador (erro BD).' });
      return;
    }
    next(error); // Encaminha outros erros para o middleware de tratamento
  }
};

/**
 * Obtém o currículo do prestador que está autenticado no sistema.
 */
export const getCurriculoByPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const prestadorId = req.user.userId;

  try {
    const curriculo = await Curriculo.findOne({ prestadorId: prestadorId })
      .populate('prestadorId', 'nome email foto'); // Carrega os dados do usuário prestador junto com o currículo

    if (!curriculo) {
      // Não é considerado um erro, pois o prestador pode ainda não ter criado um currículo
      res.status(404).json({ message: 'Nenhum currículo encontrado para este prestador.' });
      return;
    }
    res.status(200).json(curriculo); // Retorna o currículo com os dados do prestador incluídos

  } catch (error) {
    next(error);
  }
};

/**
 * Atualiza o currículo do prestador autenticado.
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

  // Cria objeto contendo apenas os campos que serão atualizados
  const updates: Partial<ICurriculo> = {};
  if (resumoProfissional !== undefined) updates.resumoProfissional = resumoProfissional;
  if (experiencias !== undefined) updates.experiencias = experiencias; // Substitui o array completo
  if (habilidades !== undefined) updates.habilidades = habilidades; // Substitui o array completo
  if (projetos !== undefined) updates.projetos = projetos; // Substitui o array completo

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }

  try {
    // Localiza e atualiza o currículo pelo ID do prestador
    // O método findOneAndUpdate é apropriado aqui pois a condição de busca garante a segurança da operação
    const curriculoAtualizado = await Curriculo.findOneAndUpdate(
      { prestadorId: prestadorId },
      { $set: updates }, // Utiliza $set para atualizar apenas os campos fornecidos
      { new: true, runValidators: true, context: 'query', upsert: false } // upsert: false impede a criação caso não exista
    );

    if (!curriculoAtualizado) {
      // Se não encontrou, significa que o prestador ainda não possui um currículo cadastrado
      res.status(404).json({ message: 'Currículo não encontrado para este prestador. Crie um primeiro.' });
      return;
    }

    res.status(200).json({ message: 'Currículo atualizado com sucesso.', curriculo: curriculoAtualizado });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém o currículo público de um prestador específico através do seu ID.
 */
export const getPublicCurriculoByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { prestadorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
    res.status(400).json({ message: 'ID do prestador inválido.' });
    return;
  }

  try {
    const curriculo = await Curriculo.findOne({ prestadorId: prestadorId })
      // Carrega apenas os dados públicos do prestador associado ao currículo
      .populate('prestadorId', 'nome foto tipoUsuario');

    if (!curriculo) {
      res.status(404).json({ message: 'Currículo não encontrado para este prestador.' });
      return;
    }

    // Retorna o currículo com os dados básicos do prestador incluídos
    res.status(200).json(curriculo);

  } catch (error) {
    next(error);
  }
};


// TODO: Implementar função deleteCurriculo se for necessário
// export const deleteCurriculo = async (req: Request, res: Response, next: NextFunction): Promise<void> => { ... }
