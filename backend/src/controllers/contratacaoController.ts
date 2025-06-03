// src/controllers/contratacaoController.ts

import { Request, Response, NextFunction } from 'express';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao'; // Importa modelo e interface/enum
import OfertaServico, { IOfertaServico, OfertaStatusEnum } from '../models/OfertaServico'; // Importa modelo e interface/enum
// No longer need to import TipoUsuarioEnum
import mongoose, { HydratedDocument } from "mongoose"; // Para checar ObjectId válido

// --- Função para Criar Contratação ---

/**
 * Cria uma nova contratação a partir de uma oferta (CU5).
 * Apenas usuários 'comprador' podem iniciar.
 */
export const contratarOferta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se há usuário logado e se é comprador
  if (!req.user || !req.user.isComprador) {
    res.status(403).json({ message: 'Acesso proibido: Apenas compradores podem contratar ofertas.' });
    return;
  }

  const { ofertaId } = req.body; // Espera ofertaId no corpo da requisição

  // Validação básica do input (idealmente feita por middleware)
  if (!ofertaId || !mongoose.Types.ObjectId.isValid(ofertaId)) {
    res.status(400).json({ message: 'ID da oferta inválido ou ausente.' });
    return;
  }

  try {
    // Busca a oferta e verifica se está disponível
    const oferta: HydratedDocument<IOfertaServico> | null = await OfertaServico.findById(ofertaId);

    // Verifica se a oferta existe e se o status é DISPONIVEL (do Enum)
    if (!oferta || oferta.status !== OfertaStatusEnum.DISPONIVEL) {
      res.status(400).json({ message: 'Oferta não encontrada ou não está disponível para contratação.' });
      return;
    }

    // Verifica se o comprador não está tentando contratar a própria oferta (regra de negócio)
    if (oferta.prestadorId.toString() === req.user.userId) {
      res.status(400).json({ message: 'Você não pode contratar sua própria oferta.' });
      return;
    }

    // Verificar se já existe uma contratação 'Pendente', 'Aceita' ou 'Em andamento' para esta oferta/comprador
    const contratacaoExistente = await Contratacao.findOne({
      buyerId: req.user.userId,
      ofertaId: oferta._id,
      status: { 
        $in: [
          ContratacaoStatusEnum.PENDENTE, 
          ContratacaoStatusEnum.ACEITA, 
          ContratacaoStatusEnum.EM_ANDAMENTO
        ] 
      }
    });

    if (contratacaoExistente) {
      res.status(400).json({ 
        message: 'Você já possui uma contratação pendente ou em andamento para esta oferta.' 
      });
      return;
    }

    // Cria a nova contratação
    const novaContratacao = new Contratacao({
      buyerId: req.user.userId,
      prestadorId: oferta.prestadorId, // Pega da oferta
      ofertaId: oferta._id,
      valorTotal: oferta.preco, // Define o valorTotal inicial com o preço da oferta
      status: ContratacaoStatusEnum.PENDENTE // Status inicial (ou outro conforme regra)
      // dataInicioServico e dataFimServico podem ser definidos depois (ex: pelo prestador ao aceitar)
    });

    // Salva no banco
    const contratacaoSalva: IContratacao = await novaContratacao.save();

    // TODO: Enviar notificações para o Comprador e Prestador
    // Isso seria implementado com um serviço de notificações

    res.status(201).json({ message: 'Oferta contratada com sucesso. Aguardando aceite do prestador.', contratacao: contratacaoSalva });

  } catch (error) {
    next(error); // Delega para o tratador de erros central
  }
};

// --- Funções Adicionais ---

/**
 * Lista as contratações onde o usuário logado é Comprador ou Prestador.
 * Aceita filtros por status via query params (ex: /api/contratacoes?status=Em+andamento)
 */
export const listarMinhasContratacoes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const userId = req.user.userId;
  const { status } = req.query; // Pega filtro de status da query string

  try {
    const query: mongoose.FilterQuery<IContratacao> = {
      $or: [{ buyerId: userId }, { prestadorId: userId }] // Onde o usuário é comprador OU prestador
    };

    if (status && typeof status === 'string' && Object.values(ContratacaoStatusEnum).includes(status as ContratacaoStatusEnum)) {
      query.status = status as ContratacaoStatusEnum; // Adiciona filtro de status se válido
    }

    // TODO: Adicionar paginação e ordenação
    const contratacoes = await Contratacao.find(query)
      .populate('ofertaId', 'titulo descricao') // Popula alguns dados da oferta
      .populate('buyerId', 'nome foto') // Popula dados do comprador
      .populate('prestadorId', 'nome foto') // Popula dados do prestador
      .sort({ createdAt: -1 }); // Ordena pelas mais recentes

    res.status(200).json({ contratacoes });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém os detalhes de uma contratação específica.
 * Requer que o usuário logado seja participante (Comprador ou Prestador).
 */
export const obterDetalhesContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const userId = req.user.userId;
  const { contratacaoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }

  try {
    const contratacao = await Contratacao.findById(contratacaoId)
      .populate('ofertaId')
      .populate('buyerId', 'nome email foto telefone')
      .populate('prestadorId', 'nome email foto telefone');

    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
      // Remover ISSO DEPOIS DE TESTAR CORRETO
    // --- DEBUG --- Adicione estas linhas ---
    console.log('--- DEBUG AUTORIZACAO CONTRATACAO ---');
    console.log('User ID do Token (userId):', userId);
    console.log('Tipo do userId:', typeof userId);
    console.log('Buyer ID da Contratacao (string):', contratacao.buyerId?.toString());
    console.log('Tipo do Buyer ID (string):', typeof contratacao.buyerId?.toString());
    console.log('Prestador ID da Contratacao (string):', contratacao.prestadorId?.toString());
    console.log('Tipo do Prestador ID (string):', typeof contratacao.prestadorId?.toString());
    console.log('Match com Buyer:', contratacao.buyerId?.toString() === userId);
    console.log('Match com Prestador:', contratacao.prestadorId?.toString() === userId);
    console.log('--- FIM DEBUG ---');
    // --- Fim do DEBUG ---


    // --- AUTORIZAÇÃO: Verifica se o usuário logado é participante ---
    // --- VERIFICAÇÃO DE AUTORIZAÇÃO (CORRIGIDA) ---
    // Acessa o _id DENTRO do objeto populado antes de converter para string
    if (contratacao.buyerId?._id?.toString() !== userId && contratacao.prestadorId?._id?.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta contratação.' });
      return;
    }
    // -------------------------------------------
    // --------------------------------------------------------------

    res.status(200).json(contratacao);

  } catch (error) {
    next(error);
  }
};

/**
 * Atualiza o status de uma contratação.
 * Requer que o usuário logado seja participante e tenha permissão para a mudança de status.
 */
export const atualizarStatusContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const userId = req.user.userId;
  const { contratacaoId } = req.params;
  const { status: novoStatus, ...outrosDados } = req.body; // Pega novo status do corpo

  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }

  // Valida o novo status
  if (!novoStatus || !Object.values(ContratacaoStatusEnum).includes(novoStatus as ContratacaoStatusEnum)) {
    res.status(400).json({ message: `Status inválido fornecido: ${novoStatus}` });
    return;
  }

  try {
    const contratacao = await Contratacao.findById(contratacaoId);

    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }

    // --- LÓGICA DE AUTORIZAÇÃO E TRANSIÇÃO DE STATUS ---
    // Exemplo: Quem pode mudar para qual status?
    const statusAtual = contratacao.status;
    let permissaoConcedida = false;

    switch (novoStatus) {
      case ContratacaoStatusEnum.ACEITA:
        permissaoConcedida = (req.user.isPrestador === true && contratacao.prestadorId.toString() === userId && statusAtual === ContratacaoStatusEnum.PENDENTE);
        // Ao aceitar, definir dataInicioServico se vier no body
        if (novoStatus === ContratacaoStatusEnum.ACEITA && outrosDados.dataInicioServico) {
          contratacao.dataInicioServico = new Date(outrosDados.dataInicioServico);
        }
        break;
      case ContratacaoStatusEnum.EM_ANDAMENTO:
        permissaoConcedida = (req.user.isPrestador === true && contratacao.prestadorId.toString() === userId && statusAtual === ContratacaoStatusEnum.ACEITA);
        // Registrar dataInicioServico se não estiver definido
        if (!contratacao.dataInicioServico) {
          contratacao.dataInicioServico = new Date();
        }
        break;
      case ContratacaoStatusEnum.CONCLUIDO: // CU16
        permissaoConcedida = (req.user.isPrestador === true && contratacao.prestadorId.toString() === userId && statusAtual === ContratacaoStatusEnum.EM_ANDAMENTO);
        // Registrar dataFimServico
        contratacao.dataFimServico = new Date();
        // TODO: Liberar fluxo de pagamento/avaliação em um serviço separado
        break;
      case ContratacaoStatusEnum.CANCELADO_BUYER:
        permissaoConcedida = (req.user.isComprador === true && contratacao.buyerId.toString() === userId && [ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(statusAtual)); // Exemplo: só pode cancelar antes de iniciar
        break;
      case ContratacaoStatusEnum.CANCELADO_PRESTADOR:
        permissaoConcedida = (req.user.isPrestador === true && contratacao.prestadorId.toString() === userId && [ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(statusAtual)); // Exemplo
        break;
      // Adicionar lógica para DISPUTA, etc.
      default:
        permissaoConcedida = false;
    }

    if (!permissaoConcedida) {
      res.status(403).json({ message: `Ação não permitida: Impossível mudar status de ${statusAtual} para ${novoStatus} ou você não tem permissão.` });
      return;
    }
    // ----------------------------------------------------

    // Atualiza o status (e potencialmente outras datas)
    contratacao.status = novoStatus as ContratacaoStatusEnum;
    if (novoStatus === ContratacaoStatusEnum.EM_ANDAMENTO && !contratacao.dataInicioServico) {
      contratacao.dataInicioServico = new Date();
    }
    if (novoStatus === ContratacaoStatusEnum.CONCLUIDO && !contratacao.dataFimServico) {
      contratacao.dataFimServico = new Date();
    }
    // Atualizar outros campos se vierem em 'outrosDados' e forem permitidos

    const contratacaoAtualizada = await contratacao.save();

    // TODO: Enviar notificação sobre mudança de status
    // Isso seria implementado com um serviço de notificações

    res.status(200).json({ message: 'Status da contratação atualizado.', contratacao: contratacaoAtualizada });

  } catch (error) {
    next(error);
  }
};

// TODO: Implementar outras funções necessárias (aceitar, marcarConcluido, cancelar, etc.)
// que podem ser chamadas por rotas mais específicas ou encapsuladas em atualizarStatusContratacao.
