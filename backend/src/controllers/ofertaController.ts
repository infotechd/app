// src/controllers/ofertaController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import OfertaServico, { IOfertaServico, OfertaStatusEnum, IDisponibilidade } from '../models/OfertaServico'; // Importa modelo e interface/enum
import { TipoUsuarioEnum } from '../models/User'; // Importa enum do User

// Interface para Payload (exemplo)
interface OfertaPayload {
  descricao: string;
  preco: number;
  status?: OfertaStatusEnum; // Status geralmente é controlado pelo fluxo, não direto pelo user
  disponibilidade?: IDisponibilidade;
}

// --- Funções do Controller para Prestadores ---

/**
 * Cria uma nova oferta de serviço (CU3)
 * Requer que o usuário seja um Prestador. Status inicial é RASCUNHO.
 */
export const createOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido: Apenas prestadores podem criar ofertas.' });
    return;
  }

  // TODO: Validar robustamente o req.body (Joi, express-validator) incluindo a estrutura de disponibilidade
  const { descricao, preco, disponibilidade, status } = req.body as OfertaPayload;

  try {
    // Validação básica
    if (!descricao || preco === undefined || preco === null || preco < 0) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes ou inválidos: descricao, preco (deve ser >= 0).' });
      return;
    }
    // TODO: Validar estrutura de disponibilidade (formato de horas, dias da semana 0-6, etc.)

    // Mapeia os status do frontend para os status do backend
    const statusMapping: Record<string, OfertaStatusEnum> = {
      'draft': OfertaStatusEnum.RASCUNHO,
      'ready': OfertaStatusEnum.DISPONIVEL,
      'inactive': OfertaStatusEnum.PAUSADO,
      'archived': OfertaStatusEnum.ENCERRADO
    };

    // Verifica se o status fornecido é válido e faz o mapeamento
    let ofertaStatus = OfertaStatusEnum.RASCUNHO; // Default para rascunho se não for fornecido

    if (status) {
      // Se o status está no mapeamento, usa o valor mapeado
      if (statusMapping[status]) {
        ofertaStatus = statusMapping[status];
      } 
      // Se o status já é um valor válido do enum (caso de uso direto do valor do backend)
      else if (Object.values(OfertaStatusEnum).includes(status as OfertaStatusEnum)) {
        ofertaStatus = status as OfertaStatusEnum;
      }
    }

    console.log('Status recebido:', status);
    console.log('Criando oferta com status mapeado:', ofertaStatus);

    const novaOferta = new OfertaServico({
      prestadorId: req.user.userId,
      descricao,
      preco,
      status: ofertaStatus, // Usa o status fornecido ou o default
      disponibilidade // Passa o objeto validado
    });

    const ofertaSalva = await novaOferta.save();

    // Mensagem dinâmica baseada no status
    const statusMessage = ofertaSalva.status === OfertaStatusEnum.RASCUNHO 
      ? 'Oferta criada como rascunho com sucesso.' 
      : 'Oferta criada e publicada com sucesso.';

    res.status(201).json({ 
      message: statusMessage, 
      oferta: ofertaSalva,
      success: true 
    });

  } catch (error) {
    // Tratar erros de validação do Mongoose
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors });
      return;
    }
    next(error);
  }
};

/**
 * Lista todas as ofertas criadas pelo prestador logado (CU3).
 */
export const listOfertasByPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;

    const query: mongoose.FilterQuery<IOfertaServico> = { prestadorId: req.user.userId };
    if (statusFilter && Object.values(OfertaStatusEnum).includes(statusFilter as OfertaStatusEnum)) {
      query.status = statusFilter as OfertaStatusEnum; // Filtra por status se fornecido
    }

    const [ofertas, total] = await Promise.all([
      OfertaServico.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OfertaServico.countDocuments(query)
    ]);

    res.status(200).json({
      offers: ofertas,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalOffers: total
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém detalhes de uma oferta específica pertencente ao prestador logado.
 */
export const getOwnOfertaDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { ofertaId } = req.params;
  const prestadorId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    const oferta = await OfertaServico.findOne({ _id: ofertaId, prestadorId: prestadorId });

    if (!oferta) {
      res.status(404).json({ message: 'Oferta não encontrada ou não pertence a você.' });
      return;
    }
    res.status(200).json(oferta);
  } catch (error) {
    next(error);
  }
};


/**
 * Atualiza uma oferta existente do prestador logado (CU3).
 * Permite atualizar apenas campos específicos e talvez apenas certos status.
 */
export const updateOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }

  const { ofertaId } = req.params;
  const prestadorId = req.user.userId;
  // TODO: Validar req.body
  const receivedUpdates = req.body as Partial<OfertaPayload>; // Campos que podem vir

  // Mapeia os status do frontend para os status do backend
  const statusMapping: Record<string, OfertaStatusEnum> = {
    'draft': OfertaStatusEnum.RASCUNHO,
    'ready': OfertaStatusEnum.DISPONIVEL,
    'inactive': OfertaStatusEnum.PAUSADO,
    'archived': OfertaStatusEnum.ENCERRADO
  };

  // Filtra campos permitidos para atualização pelo prestador
  const allowedUpdates: Partial<IOfertaServico> = {};
  const updatableFields: (keyof OfertaPayload)[] = ['descricao', 'preco', 'disponibilidade', 'status']; // Status pode ser mudado aqui? Ex: rascunho -> disponivel? pausado -> disponivel?
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      // Tratamento especial para o campo status
      if (field === 'status') {
        const receivedStatus = receivedUpdates.status as string;

        // Verifica se o status está no mapeamento
        if (statusMapping[receivedStatus]) {
          (allowedUpdates as any)[field] = statusMapping[receivedStatus];
          console.log(`Status atualizado de frontend '${receivedStatus}' para backend '${statusMapping[receivedStatus]}'`);
        } 
        // Verifica se o status já é um valor válido do enum
        else if (Object.values(OfertaStatusEnum).includes(receivedStatus as OfertaStatusEnum)) {
          (allowedUpdates as any)[field] = receivedStatus;
          console.log(`Status já é um valor válido do backend: '${receivedStatus}'`);
        }
        // Status inválido
        else {
          console.log(`Status inválido ignorado: '${receivedStatus}'`);
        }
      } 
      // Validação para preço
      else if (field === 'preco' && (typeof receivedUpdates.preco !== 'number' || receivedUpdates.preco < 0)) {
        // Ignora preço inválido
        console.log('Preço inválido ignorado');
      } 
      // Outros campos
      else {
        (allowedUpdates as any)[field] = receivedUpdates[field];
      }
    }
  });

  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    // Encontra e atualiza apenas se for o dono
    // TODO: Adicionar verificação de status atual se a edição for restrita (ex: só pode editar rascunho)
    const ofertaAtualizada = await OfertaServico.findOneAndUpdate(
      { _id: ofertaId, prestadorId: prestadorId /* , status: OfertaStatusEnum.RASCUNHO */ }, // Garante propriedade e status editável (opcional)
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!ofertaAtualizada) {
      res.status(404).json({ message: 'Oferta não encontrada, não pertence a você ou não pode ser editada no status atual.' });
      return;
    }

    res.status(200).json({ message: 'Oferta atualizada com sucesso.', oferta: ofertaAtualizada });

  } catch (error) {
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors }); return;
    }
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    next(error);
  }
};

/**
 * Deleta uma oferta do prestador logado (CU3).
 */
export const deleteOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.PRESTADOR) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }
  const { ofertaId } = req.params;
  const prestadorId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    // TODO: VERIFICAR se existem CONTRATACOES ativas ('Pendente', 'Aceita', 'Em andamento') para esta ofertaId ANTES de deletar.
    // Se existirem, talvez impedir a deleção ou forçar o cancelamento das contratações primeiro.
    // const contratacoesAtivas = await Contratacao.countDocuments({ ofertaId: ofertaId, status: { $in: [...] } });
    // if (contratacoesAtivas > 0) {
    //   return res.status(400).json({ message: 'Não é possível excluir a oferta pois existem contratações ativas associadas.' });
    // }

    // Garante que só o dono pode deletar
    const result = await OfertaServico.findOneAndDelete({ _id: ofertaId, prestadorId: prestadorId });

    if (!result) {
      res.status(404).json({ message: 'Oferta não encontrada ou você não tem permissão para excluí-la.' });
      return;
    }

    res.status(200).json({ message: 'Oferta excluída com sucesso.' });

  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    next(error);
  }
};

// --- Funções do Controller para Compradores/Público (Mantidas da conversão anterior) ---

/**
 * Busca/Lista ofertas públicas (status 'disponível') (CU4)
 */
export const searchPublicOfertas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || '-createdAt'; // Default: mais recentes
    const precoMax = req.query.precoMax ? Number(req.query.precoMax) : undefined;
    const textoPesquisa = req.query.textoPesquisa as string | undefined;
    // TODO: Receber outros filtros: categoria, localização (lat/lon/raio?), etc.

    const query: mongoose.FilterQuery<IOfertaServico> = {
      status: OfertaStatusEnum.DISPONIVEL // Usa Enum correto
    };

    // Aplica filtros da query string
    if (precoMax !== undefined && !isNaN(precoMax) && precoMax >= 0) {
      query.preco = { $lte: precoMax };
    }
    if (textoPesquisa) {
      const regex = new RegExp(textoPesquisa.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'); // Escapa regex e case-insensitive
      // Busca no título OU na descrição (ou conteúdo, se o campo mudou)
      query.$or = [
        { titulo: regex }, // Adicionar se tiver título no modelo Oferta
        { descricao: regex } // Usar 'conteudo' se for o nome correto do campo
      ];
    }
    // TODO: Adicionar filtro de localização se usar APIGeolocalizacao

    const options = {
      page: page,
      limit: limit,
      sort: sort,
      populate: { path: 'prestadorId', select: 'nome foto avaliacaoMedia' }, // Exemplo: popular dados públicos do prestador
      select: '-disponibilidade.recorrenciaSemanal._id' // Exemplo: Ocultar IDs de subdocumentos
    };

    const [ofertas, total] = await Promise.all([
      OfertaServico.find(query)
        .sort(options.sort)
        .skip(skip)
        .limit(options.limit)
        .select(options.select)
        .populate(options.populate),
      OfertaServico.countDocuments(query)
    ]);

    res.status(200).json({
      ofertas,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalOfertas: total
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém detalhes de uma oferta pública específica (status 'disponível') (CU4)
 */
export const getPublicOfertaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { ofertaId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }
  try {
    const oferta = await OfertaServico.findOne({
      _id: ofertaId,
      status: OfertaStatusEnum.DISPONIVEL // Garante que só retorna disponível
    })
      // Popula mais dados do prestador para a página de detalhes
      .populate('prestadorId', 'nome email foto telefone tipoUsuario createdAt'); // Adicionar campos públicos relevantes

    if (!oferta) {
      res.status(404).json({ message: 'Oferta não encontrada ou não está disponível.' }); return;
    }
    res.status(200).json(oferta);

  } catch (error) {
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    next(error);
  }
};
