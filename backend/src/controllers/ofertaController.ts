// Controlador de Ofertas de Serviço

import { Request, Response, NextFunction } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import OfertaServico, { IOfertaServico, OfertaStatusEnum, IDisponibilidade } from '../models/OfertaServico'; // Importa modelo e interface/enum
import { extractPaginationParams, paginatedQuery } from '../utils/paginationUtils'; // Importa utilitários de paginação
import User, { IUser } from '../models/User'; // Importa modelo de usuário para filtro por tipo de prestador
// Import for TipoUsuarioEnum removed as it's no longer used

// Interface que define a estrutura de dados para criação/atualização de ofertas
interface OfertaPayload {
  descricao: string;
  preco: number;
  status?: OfertaStatusEnum; // Status é geralmente controlado pelo fluxo do sistema
  disponibilidade?: IDisponibilidade;
  categorias?: string[];
  localizacao?: {
    estado: string;
    cidade?: string;
  };
}

// --- Funções do Controller para Prestadores ---

/**
 * Cria uma nova oferta de serviço (CU3)
 * Requer que o usuário seja um Prestador. Status inicial é RASCUNHO.
 */
export const createOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return;
  }

  // Com a unificação dos tipos de usuário, qualquer usuário autenticado pode criar ofertas
  // Não é mais necessário verificar o papel específico do usuário

  // TODO: Validar robustamente o req.body (Joi, express-validator) incluindo a estrutura de disponibilidade
  // Extrai os dados da requisição
  const { descricao, preco, disponibilidade, status, categorias, localizacao } = req.body as OfertaPayload;

  try {
    // Realiza validação básica dos campos obrigatórios
    if (!descricao || preco === undefined || preco === null || preco < 0) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes ou inválidos: descricao, preco (deve ser >= 0).' });
      return;
    }

    // Valida categorias
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      res.status(400).json({ message: 'Pelo menos uma categoria é obrigatória.' });
      return;
    }

    // Valida localização
    if (!localizacao || !localizacao.estado) {
      res.status(400).json({ message: 'Localização é obrigatória e deve incluir um estado.' });
      return;
    }

    // TODO: Validar estrutura de disponibilidade (formato de horas, dias da semana 0-6, etc.)

    // Define o mapeamento de status do frontend para o backend
    const statusMapping: Record<string, OfertaStatusEnum> = {
      'draft': OfertaStatusEnum.RASCUNHO,
      'ready': OfertaStatusEnum.DISPONIVEL,
      'inactive': OfertaStatusEnum.PAUSADO,
      'archived': OfertaStatusEnum.ENCERRADO
    };

    // Inicializa o status da oferta como rascunho por padrão
    let ofertaStatus = OfertaStatusEnum.RASCUNHO;

    // Processa o status recebido, se houver
    if (status) {
      // Verifica se o status está no mapeamento e usa o valor correspondente
      if (statusMapping[status]) {
        ofertaStatus = statusMapping[status];
      } 
      // Verifica se o status já é um valor válido do enum
      else if (Object.values(OfertaStatusEnum).includes(status as OfertaStatusEnum)) {
        ofertaStatus = status as OfertaStatusEnum;
      }
    }

    console.log('Status recebido:', status);
    console.log('Criando oferta com status mapeado:', ofertaStatus);

    // Cria uma nova instância de oferta com os dados fornecidos
    const novaOferta = new OfertaServico({
      prestadorId: req.user.userId,
      descricao,
      preco,
      status: ofertaStatus,
      disponibilidade,
      categorias,
      localizacao
    });

    // Salva a oferta no banco de dados
    const ofertaSalva = await novaOferta.save();

    // Cria uma mensagem personalizada baseada no status da oferta
    const statusMessage = ofertaSalva.status === OfertaStatusEnum.RASCUNHO 
      ? 'Oferta criada como rascunho com sucesso.' 
      : 'Oferta criada e publicada com sucesso.';

    // Retorna resposta de sucesso com os dados da oferta criada
    res.status(201).json({ 
      message: statusMessage, 
      oferta: ofertaSalva,
      success: true 
    });

  } catch (error) {
    // Trata erros específicos de validação do Mongoose
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors });
      return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Lista todas as ofertas criadas pelo prestador logado (CU3).
 * Implementa paginação padronizada para melhor performance e escalabilidade.
 */
export const listOfertasByPrestador = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return;
  }

  // Com a unificação dos tipos de usuário, qualquer usuário autenticado pode listar suas ofertas
  // Não é mais necessário verificar o papel específico do usuário
  try {
    // Extrai e valida parâmetros de paginação usando o utilitário padronizado
    const { page, limit } = extractPaginationParams(req, {
      defaultLimit: 10,
      maxLimit: 50
    });

    const statusFilter = req.query.status as string | undefined;

    // Constrói a query para buscar ofertas do prestador logado
    const query: mongoose.FilterQuery<IOfertaServico> = { prestadorId: req.user.userId };

    // Adiciona filtro por status, se fornecido e válido
    if (statusFilter && Object.values(OfertaStatusEnum).includes(statusFilter as OfertaStatusEnum)) {
      query.status = statusFilter as OfertaStatusEnum;
    }

    // Usa o utilitário de consulta paginada para obter resultados consistentes
    const result = await paginatedQuery<IOfertaServico>(
      OfertaServico,
      query,
      page,
      limit,
      {
        sort: { createdAt: -1 } // Ordena por data de criação (mais recentes primeiro)
      }
    );

    // Retorna os resultados formatados com informações de paginação padronizadas
    res.status(200).json({
      offers: result.data,
      pagination: result.pagination,
      totalOffers: result.pagination.totalItems
    });

  } catch (error) {
    // Passa erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Obtém detalhes de uma oferta específica pertencente ao prestador logado.
 */
export const getOwnOfertaDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return;
  }

  // Com a unificação dos tipos de usuário, qualquer usuário autenticado pode ver detalhes de suas ofertas
  // Não é mais necessário verificar o papel específico do usuário
  // Extrai o ID da oferta dos parâmetros da requisição
  const { ofertaId } = req.params;
  // Obtém o ID do prestador logado
  const prestadorId = req.user.userId;

  // Valida se o ID da oferta é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    // Busca a oferta que corresponde ao ID fornecido e pertence ao prestador logado
    const oferta = await OfertaServico.findOne({ _id: ofertaId, prestadorId: prestadorId });

    // Verifica se a oferta foi encontrada
    if (!oferta) {
      res.status(404).json({ message: 'Oferta não encontrada ou não pertence a você.' });
      return;
    }
    // Retorna os detalhes da oferta encontrada
    res.status(200).json(oferta);
  } catch (error) {
    // Passa erros para o middleware de tratamento de erros
    next(error);
  }
};


/**
 * Atualiza uma oferta existente do prestador logado (CU3).
 * Permite atualizar apenas campos específicos e talvez apenas certos status.
 */
export const updateOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return;
  }

  // Com a unificação dos tipos de usuário, qualquer usuário autenticado pode atualizar suas ofertas
  // Não é mais necessário verificar o papel específico do usuário

  // Extrai o ID da oferta dos parâmetros da requisição
  const { ofertaId } = req.params;
  // Obtém o ID do prestador logado
  const prestadorId = req.user.userId;
  // TODO: Validar req.body
  // Extrai os campos a serem atualizados do corpo da requisição
  const receivedUpdates = req.body as Partial<OfertaPayload>;

  // Define o mapeamento de status do frontend para o backend
  const statusMapping: Record<string, OfertaStatusEnum> = {
    'draft': OfertaStatusEnum.RASCUNHO,
    'ready': OfertaStatusEnum.DISPONIVEL,
    'inactive': OfertaStatusEnum.PAUSADO,
    'archived': OfertaStatusEnum.ENCERRADO
  };

  // Prepara objeto para armazenar apenas os campos permitidos para atualização
  const allowedUpdates: Partial<IOfertaServico> = {};
  // Define quais campos podem ser atualizados pelo prestador
  const updatableFields: (keyof OfertaPayload)[] = ['descricao', 'preco', 'disponibilidade', 'status'];

  // Processa cada campo atualizado
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      // Tratamento especial para o campo status
      if (field === 'status') {
        const receivedStatus = receivedUpdates.status as string;

        // Verifica se o status está no mapeamento e converte para o valor do backend
        if (statusMapping[receivedStatus]) {
          (allowedUpdates as any)[field] = statusMapping[receivedStatus];
          console.log(`Status atualizado de frontend '${receivedStatus}' para backend '${statusMapping[receivedStatus]}'`);
        } 
        // Verifica se o status já é um valor válido do enum do backend
        else if (Object.values(OfertaStatusEnum).includes(receivedStatus as OfertaStatusEnum)) {
          (allowedUpdates as any)[field] = receivedStatus;
          console.log(`Status já é um valor válido do backend: '${receivedStatus}'`);
        }
        // Ignora status inválido
        else {
          console.log(`Status inválido ignorado: '${receivedStatus}'`);
        }
      } 
      // Validação específica para o campo preço
      else if (field === 'preco' && (typeof receivedUpdates.preco !== 'number' || receivedUpdates.preco < 0)) {
        // Ignora preço inválido (negativo ou não numérico)
        console.log('Preço inválido ignorado');
      } 
      // Processa outros campos normalmente
      else {
        (allowedUpdates as any)[field] = receivedUpdates[field];
      }
    }
  });

  // Verifica se há campos válidos para atualizar
  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }

  // Valida se o ID da oferta é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    // Encontra e atualiza a oferta, garantindo que pertence ao prestador logado
    // TODO: Adicionar verificação de status atual se a edição for restrita (ex: só pode editar rascunho)
    const ofertaAtualizada = await OfertaServico.findOneAndUpdate(
      { _id: ofertaId, prestadorId: prestadorId /* , status: OfertaStatusEnum.RASCUNHO */ },
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' }
    );

    // Verifica se a oferta foi encontrada e atualizada
    if (!ofertaAtualizada) {
      res.status(404).json({ message: 'Oferta não encontrada, não pertence a você ou não pode ser editada no status atual.' });
      return;
    }

    // Retorna resposta de sucesso com os dados da oferta atualizada
    res.status(200).json({ message: 'Oferta atualizada com sucesso.', oferta: ofertaAtualizada });

  } catch (error) {
    // Trata erros específicos de validação do Mongoose
    if ((error as Error).name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação', errors: (error as any).errors }); return;
    }
    // Trata erros de conversão de tipos
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Deleta uma oferta do prestador logado (CU3).
 */
export const deleteOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Autenticação necessária.' });
    return;
  }

  // Com a unificação dos tipos de usuário, qualquer usuário autenticado pode excluir suas ofertas
  // Não é mais necessário verificar o papel específico do usuário
  // Extrai o ID da oferta dos parâmetros da requisição
  const { ofertaId } = req.params;
  // Obtém o ID do prestador logado
  const prestadorId = req.user.userId;

  // Valida se o ID da oferta é um ObjectId válido do MongoDB
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

    // Busca e remove a oferta, garantindo que pertence ao prestador logado
    const result = await OfertaServico.findOneAndDelete({ _id: ofertaId, prestadorId: prestadorId });

    // Verifica se a oferta foi encontrada e excluída
    if (!result) {
      res.status(404).json({ message: 'Oferta não encontrada ou você não tem permissão para excluí-la.' });
      return;
    }

    // Retorna resposta de sucesso
    res.status(200).json({ message: 'Oferta excluída com sucesso.' });

  } catch (error) {
    // Trata erros de conversão de tipos
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};

// --- Funções do Controller para Compradores/Público ---

/**
 * Busca/Lista ofertas públicas (status 'disponível') (CU4)
 * Implementa paginação padronizada para melhor performance e escalabilidade.
 */
export const searchPublicOfertas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extrai e valida parâmetros de paginação usando o utilitário padronizado
    const { page, limit } = extractPaginationParams(req, {
      defaultLimit: 10,
      maxLimit: 50
    });

    // Extrai outros parâmetros de filtro e ordenação
    const sort = (req.query.sort as string) || '-createdAt'; // Ordenação padrão: mais recentes primeiro
    const precoMax = req.query.precoMax ? Number(req.query.precoMax) : undefined;
    const textoPesquisa = req.query.textoPesquisa as string | undefined;
    const tipoPrestador = req.query.tipoPrestador as string | undefined;

    // Extrai filtros de categoria e localização
    const categorias = req.query.categorias as string | string[] | undefined;
    const estado = req.query.estado as string | undefined;
    const cidade = req.query.cidade as string | undefined;

    const prestadorIdFilter: FilterQuery<IOfertaServico> = {};

    if (tipoPrestador) {
        // 1. Monta a query para o modelo User com os campos corretos
        const userQuery: FilterQuery<IUser> = {
            isPrestador: true, // Garante que estamos buscando apenas usuários com o perfil de prestador
        };

        // 2. Adiciona o critério de CPF ou CNPJ usando Expressão Regular (Regex)
        if (tipoPrestador === 'pessoa_fisica') {
            // Busca por strings que contenham EXATAMENTE 11 dígitos
            userQuery.cpfCnpj = /^\d{11}$/;
        } else if (tipoPrestador === 'pessoa_juridica') {
            // Busca por strings que contenham EXATAMENTE 14 dígitos
            userQuery.cpfCnpj = /^\d{14}$/;
        }

        // 3. Executa a busca pelos IDs dos prestadores
        const prestadorIds = await User.find(userQuery, '_id').lean();

        // 4. Se nenhum prestador for encontrado, encerra a busca e retorna um array vazio.
        if (prestadorIds.length === 0) {
            res.status(200).json({
                ofertas: [],
                pagination: { totalItems: 0, totalPages: 0, currentPage: 1, limit: 10 },
                totalOfertas: 0
            });
            return;
        }

        // 5. Adiciona o filtro de IDs à query principal de ofertas.
        prestadorIdFilter.prestadorId = { $in: prestadorIds.map(p => p._id) };
    }

    // Constrói a query base para buscar apenas ofertas disponíveis
    const query: FilterQuery<IOfertaServico> = {
      status: OfertaStatusEnum.DISPONIVEL,
      ...prestadorIdFilter, // Mescla o novo filtro aqui
    };

    // Aplica filtro de preço máximo, se fornecido
    if (precoMax !== undefined && !isNaN(precoMax) && precoMax >= 0) {
      query.preco = { $lte: precoMax };
    }

    // Aplica filtro de texto de pesquisa, se fornecido
    if (textoPesquisa) {
      // Cria expressão regular escapando caracteres especiais e ignorando maiúsculas/minúsculas
      const regex = new RegExp(textoPesquisa.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      // Busca no título OU na descrição
      query.$or = [
        { titulo: regex }, // Busca no título (se existir no modelo)
        { descricao: regex } // Busca na descrição
      ];
    }

    // Aplica filtro de categorias, se fornecido
    if (categorias) {
      if (Array.isArray(categorias)) {
        // Se for um array, filtra por ofertas que contenham pelo menos uma das categorias
        query.categorias = { $in: categorias };
      } else {
        // Se for uma string única, filtra por ofertas que contenham essa categoria
        query.categorias = categorias;
      }
    }

    // Aplica filtro de localização (estado e cidade), se fornecido
    if (estado) {
      query['localizacao.estado'] = estado;

      // Adiciona filtro de cidade apenas se o estado também for fornecido
      if (cidade) {
        query['localizacao.cidade'] = cidade;
      }
    }

    // Converte string de ordenação para objeto de ordenação do MongoDB
    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      const sortFields = sort.split(',');
      for (const field of sortFields) {
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.substring(1) : field;
        sortObj[fieldName] = isDesc ? -1 : 1;
      }
    }
    // Se nenhum campo de ordenação foi especificado, usa createdAt descendente
    if (Object.keys(sortObj).length === 0) {
      sortObj.createdAt = -1;
    }

    // Usa o utilitário de consulta paginada para obter resultados consistentes
    const result = await paginatedQuery<IOfertaServico>(
      OfertaServico,
      query,
      page,
      limit,
      {
        sort: sortObj,
        select: '-disponibilidade.recorrenciaSemanal._id', // Exclui IDs internos desnecessários
        populate: { path: 'prestadorId', select: 'nome foto avaliacaoMedia' } // Inclui dados do prestador na resposta
      }
    );

    // Retorna os resultados formatados com informações de paginação padronizadas
    res.status(200).json({
      ofertas: result.data,
      pagination: result.pagination,
      totalOfertas: result.pagination.totalItems
    });

  } catch (error) {
    // Passa erros para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Obtém detalhes de uma oferta pública específica (status 'disponível') (CU4)
 */
export const getPublicOfertaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrai o ID da oferta dos parâmetros da requisição
  const { ofertaId } = req.params;

  // Valida se o ID da oferta é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido.' }); return;
  }

  try {
    // Busca a oferta pelo ID, garantindo que esteja com status disponível
    const oferta = await OfertaServico.findOne({
      _id: ofertaId,
      status: OfertaStatusEnum.DISPONIVEL // Garante que só retorna ofertas disponíveis
    })
      // Inclui dados do prestador na resposta para exibição na página de detalhes
      .populate('prestadorId', 'nome email foto telefone tipoUsuario createdAt');

    // Verifica se a oferta foi encontrada
    if (!oferta) {
      res.status(404).json({ message: 'Oferta não encontrada ou não está disponível.' }); return;
    }

    // Retorna os detalhes da oferta encontrada
    res.status(200).json(oferta);

  } catch (error) {
    // Trata erros de conversão de tipos
    if ((error as Error).name === 'CastError') {
      res.status(400).json({ message: 'ID da oferta inválido.' }); return;
    }
    // Passa outros erros para o middleware de tratamento de erros
    next(error);
  }
};
