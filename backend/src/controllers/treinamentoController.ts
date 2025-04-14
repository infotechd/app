// src/controllers/treinamentoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Treinamento, { ITreinamento, TreinamentoStatusEnum, TreinamentoFormatoEnum } from '../models/Treinamento'; // Importa modelo e interface/enum
import { TipoUsuarioEnum } from '../models/User'; // Importa enum do User

// Interface para o payload de criação/atualização (exemplo)
interface TreinamentoPayload {
  titulo: string;
  descricao: string;
  formato: TreinamentoFormatoEnum;
  conteudoUrl: string;
  dataHora?: string | Date;
  preco?: number;
  // Status não deve vir do cliente na criação/update geral
  // Campos adicionais podem ser incluídos aqui
}


// --- Funções do Controller para Anunciantes ---

/**
 * Cria um novo treinamento com status 'rascunho'.
 * Requer que o usuário seja um Anunciante.
 */
export const createTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido: Apenas anunciantes podem criar treinamentos.' });
    return;
  }

  // TODO: Validar o req.body com Joi ou express-validator
  const {
    titulo,
    descricao,
    formato,
    conteudoUrl, // Campo obrigatório adicionado
    dataHora,
    preco
  } = req.body as TreinamentoPayload;

  try {
    // Validação básica (exemplos)
    if (!titulo || !descricao || !formato || !conteudoUrl) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes: titulo, descricao, formato, conteudoUrl.' });
      return;
    }
    if (!Object.values(TreinamentoFormatoEnum).includes(formato)) {
      res.status(400).json({ message: `Formato inválido: ${formato}`});
      return;
    }
    if (preco !== undefined && (typeof preco !== 'number' || preco < 0)) {
      res.status(400).json({ message: 'Preço inválido.' });
      return;
    }
    // TODO: Validar URL, dataHora (se formato for webinar)

    const novoTreinamento = new Treinamento({
      anuncianteId: req.user.userId, // Nome correto
      titulo,
      descricao,
      formato,
      conteudoUrl,
      dataHora: dataHora ? new Date(dataHora) : undefined,
      preco: preco ?? 0, // Usa ?? para permitir 0 explícito
      status: TreinamentoStatusEnum.RASCUNHO // Inicia como rascunho
    });

    const treinamentoSalvo = await novoTreinamento.save();
    res.status(201).json({ message: 'Treinamento criado como rascunho.', treinamento: treinamentoSalvo });

  } catch (error) {
    next(error);
  }
};

/**
 * Atualiza um treinamento existente (enquanto em 'rascunho' ou talvez 'rejeitado'?).
 * Requer que o usuário seja o anunciante dono.
 */
export const updateTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { treinamentoId } = req.params;
  const anuncianteId = req.user.userId;
  const receivedUpdates = req.body as Partial<TreinamentoPayload>;

  if (!mongoose.Types.ObjectId.isValid(treinamentoId)) {
    res.status(400).json({ message: 'ID do treinamento inválido.' });
    return;
  }

  // Filtra campos permitidos para atualização pelo anunciante
  const allowedUpdates: Partial<ITreinamento> = {};
  const updatableFields: (keyof TreinamentoPayload)[] = [
    'titulo', 'descricao', 'formato', 'conteudoUrl', 'dataHora', 'preco'
    // Não permite mudar status diretamente aqui, exceto talvez submeter para revisão
  ];
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      if (field === 'dataHora' && receivedUpdates[field]) {
        (allowedUpdates as any)[field] = new Date(receivedUpdates[field] as string);
      } else if (field === 'preco') {
        if (typeof receivedUpdates[field] === 'number' && (receivedUpdates[field] as number) >= 0) {
          (allowedUpdates as any)[field] = receivedUpdates[field];
        } // Ignora preço inválido
      } else {
        (allowedUpdates as any)[field] = receivedUpdates[field];
      }
    }
  });

  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }
  // TODO: Validar os dados em allowedUpdates (formato, enum, etc.)

  try {
    // Encontra e atualiza apenas se for o dono E se o status permitir (ex: Rascunho)
    const treinamentoAtualizado = await Treinamento.findOneAndUpdate(
      {
        _id: treinamentoId,
        anuncianteId: anuncianteId,
        status: { $in: [TreinamentoStatusEnum.RASCUNHO, TreinamentoStatusEnum.REJEITADO] } // Permite editar se rascunho ou rejeitado? Definir regra.
      },
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!treinamentoAtualizado) {
      res.status(404).json({ message: 'Treinamento não encontrado, não pertence a você, ou não pode ser editado no status atual.' });
      return;
    }
    res.status(200).json({ message: 'Treinamento atualizado com sucesso.', treinamento: treinamentoAtualizado });

  } catch (error) {
    next(error);
  }
};

// --- Placeholders para Funções Faltantes ---

/**
 * Anunciante lista seus próprios treinamentos (todos os status).
 */
export const listarMeusTreinamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }
  // TODO: Implementar busca por treinamentos com anuncianteId = req.user.userId
  // Adicionar filtros (req.query), paginação, ordenação.
  res.status(501).json({ message: 'Endpoint listarMeusTreinamentos não implementado.'});
};

/**
 * Anunciante (ou Admin) deleta um treinamento.
 */
export const deleteTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }
  const { treinamentoId } = req.params;
  // TODO: Implementar lógica de deleção, verificando se req.user é dono ou Admin.
  // Considerar o que fazer com InscricoesTreinamento existentes (soft delete?).
  res.status(501).json({ message: 'Endpoint deleteTreinamento não implementado.'});
};

/**
 * Anunciante submete treinamento para revisão ou publica diretamente (se não houver revisão).
 */
export const submeterOuPublicarTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }
  const { treinamentoId } = req.params;
  // TODO: Implementar lógica:
  // 1. Buscar treinamento pelo ID e verificar se pertence ao usuário e se está em RASCUNHO ou REJEITADO.
  // 2. Se houver fluxo de revisão: Mudar status para PENDENTE_REVISAO.
  // 3. Se NÃO houver fluxo de revisão: Mudar status para PUBLICADO.
  // 4. Salvar e retornar.
  res.status(501).json({ message: 'Endpoint submeterOuPublicarTreinamento não implementado.'});
};


// --- Funções do Controller para Público ---

/**
 * Lista treinamentos públicos (status 'publicado').
 * Aceita filtros, paginação, ordenação via req.query.
 */
export const getPublicTreinamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implementar busca por status PUBLICADO.
    // Adicionar filtros (categoria, formato?), paginação, ordenação.
    // Selecionar campos públicos, popular anuncianteId (nome/foto)?
    const treinamentos = await Treinamento.find({ status: TreinamentoStatusEnum.PUBLICADO })
      .sort({ createdAt: -1 })
      .limit(20); // Exemplo limite
    res.status(200).json({ treinamentos });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtém detalhes de um treinamento público específico (status 'publicado').
 */
export const getPublicTreinamentoById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { treinamentoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(treinamentoId)) {
    res.status(400).json({ message: 'ID do treinamento inválido.' });
    return;
  }
  try {
    const treinamento = await Treinamento.findOne({
      _id: treinamentoId,
      status: TreinamentoStatusEnum.PUBLICADO // Garante que só retorne publicado
    }).populate('anuncianteId', 'nome foto'); // Exemplo: popula dados públicos do anunciante

    if (!treinamento) {
      res.status(404).json({ message: 'Treinamento não encontrado ou não está publicado.' });
      return;
    }
    res.status(200).json(treinamento);
  } catch (error) {
    next(error);
  }
};


// --- Funções do Controller para Admin (Se houver moderação) ---

export const listarTreinamentosPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar busca por status PENDENTE_REVISAO. Requer Admin.
  res.status(501).json({ message: 'Endpoint listarTreinamentosPendentes não implementado.' });
};

export const revisarTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para Admin aprovar/rejeitar (mudar status, setar motivoRejeicao). Requer Admin.
  res.status(501).json({ message: 'Endpoint revisarTreinamento não implementado.' });
};

// Exporta as funções (ajuste se usar export default object)