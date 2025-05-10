// src/controllers/negociacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Negociacao, { NegociacaoStatusEnum, HistoricoNegociacaoTipoEnum } from '../models/Negociacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import { TipoUsuarioEnum } from '../models/User';

// --- Funções do Controller ---

/**
 * Cria/Inicia uma nova negociação para uma Contratacao existente.
 * Apenas o Comprador da Contratacao pode iniciar.
 */
export const criarNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica usuário logado e tipo
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.COMPRADOR) {
    res.status(403).json({ message: 'Acesso proibido: Apenas compradores podem iniciar negociações.' });
    return;
  }

  const { contratacaoId, proposta } = req.body; // Espera { novoPreco?, novoPrazo?, observacoes } em 'proposta'
  const buyerId = req.user.userId;

  // Validação básica de entrada
  if (!contratacaoId || !mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido ou ausente.' });
    return;
  }
  if (!proposta || !proposta.observacoes) {
    res.status(400).json({ message: 'Dados da proposta inicial inválidos (observacoes são obrigatórias).' });
    return;
  }
  if (proposta.novoPreco !== undefined && (typeof proposta.novoPreco !== 'number' || proposta.novoPreco < 0)) {
    res.status(400).json({ message: 'Novo preço inválido.' });
    return;
  }
  if (proposta.novoPrazo !== undefined && isNaN(Date.parse(proposta.novoPrazo))) {
    res.status(400).json({ message: 'Novo prazo (data) inválido.' });
    return;
  }


  try {
    // Busca a contratação original
    const contratacao = await Contratacao.findById(contratacaoId);

    // Validações de Negócio
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    if (contratacao.buyerId.toString() !== buyerId) {
      res.status(403).json({ message: 'Acesso proibido: Você não é o comprador desta contratação.' });
      return;
    }
    // Exemplo: Só permite negociar se estiver Pendente ou Aceita? Ajuste conforme regra.
    if (![ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(contratacao.status)) {
      res.status(400).json({ message: `Não é possível negociar uma contratação com status '${contratacao.status}'.` });
      return;
    }
    // TODO: Verificar se já existe uma Negociacao *ativa* para esta Contratacao?

    // Cria a primeira entrada do histórico
    const historicoInicial = [{
      autorId: buyerId,
      tipo: HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER,
      dados: {
        novoPreco: proposta.novoPreco,
        novoPrazo: proposta.novoPrazo ? new Date(proposta.novoPrazo) : undefined,
        observacoes: proposta.observacoes
      },
      timestamp: new Date()
    }];

    // Cria a nova negociação
    const novaNegociacao = new Negociacao({
      contratacaoId: contratacao._id,
      buyerId: buyerId,
      prestadorId: contratacao.prestadorId, // Pega da contratação
      historico: historicoInicial,
      status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR // Status inicial após proposta do buyer
    });

    await novaNegociacao.save();

    // TODO: Enviar notificação ao Prestador sobre a nova proposta

    res.status(201).json({ message: 'Negociação iniciada com sucesso.', negociacao: novaNegociacao });

  } catch (error) {
    next(error);
  }
};

/**
 * Adiciona uma resposta (Prestador) ou uma mensagem simples (Buyer/Prestador) ao histórico.
 */
export const responderNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const { tipo, dados } = req.body; // tipo = 'resposta_prestador' ou 'mensagem_simples'; dados = { novoPreco?, novoPrazo?, observacoes }
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }
  if (!tipo || !Object.values(HistoricoNegociacaoTipoEnum).includes(tipo as HistoricoNegociacaoTipoEnum)) {
    res.status(400).json({ message: 'Tipo de resposta inválido.'});
    return;
  }
  if (!dados || !dados.observacoes) {
    res.status(400).json({ message: 'Dados da resposta inválidos (observacoes são obrigatórias).' });
    return;
  }
  // TODO: Validar novoPreco, novoPrazo se existirem em 'dados'

  try {
    const negociacao = await Negociacao.findById(negociacaoId);

    if (!negociacao) {
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // --- AUTORIZAÇÃO ---
    const isBuyer = negociacao.buyerId.toString() === userId;
    const isPrestador = negociacao.prestadorId.toString() === userId;

    if (!isBuyer && !isPrestador) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta negociação.' });
      return;
    }

    // Verifica permissão para o tipo de resposta e status atual
    let novoStatusNegociacao: NegociacaoStatusEnum | null = null;
    if (tipo === HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR) {
      if (!isPrestador) {
        res.status(403).json({ message: 'Apenas o prestador pode enviar uma resposta/contraproposta.' });
        return;
      }
      if (negociacao.status !== NegociacaoStatusEnum.AGUARDANDO_PRESTADOR) {
        res.status(400).json({ message: `Não é possível responder. Status atual: ${negociacao.status}.` });
        return;
      }
      novoStatusNegociacao = NegociacaoStatusEnum.AGUARDANDO_BUYER; // Muda status após resposta do prestador
    } else if (tipo === HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER) {
      if (!isBuyer) {
        res.status(403).json({ message: 'Apenas o comprador pode enviar uma nova proposta.' });
        return;
      }
      if (negociacao.status !== NegociacaoStatusEnum.AGUARDANDO_BUYER) { // Buyer só propõe após resposta do prestador? Ou a qualquer momento? Ajustar regra
        res.status(400).json({ message: `Não é possível propor agora. Status atual: ${negociacao.status}.` });
        return;
      }
      novoStatusNegociacao = NegociacaoStatusEnum.AGUARDANDO_PRESTADOR;
    }
    // Se for MENSAGEM_SIMPLES, geralmente não muda o status principal

    // ---------------------

    // Adiciona item ao histórico
    const novoItemHistorico = {
      autorId: userId,
      tipo: tipo as HistoricoNegociacaoTipoEnum,
      dados: {
        novoPreco: dados.novoPreco,
        novoPrazo: dados.novoPrazo ? new Date(dados.novoPrazo) : undefined,
        observacoes: dados.observacoes
      },
      timestamp: new Date() // Timestamp é gerado aqui, não vem do cliente
    };

    negociacao.historico.push(novoItemHistorico as any); // 'as any' pode ser necessário ou criar um tipo/interface correto para o subdocumento
    if (novoStatusNegociacao) {
      negociacao.status = novoStatusNegociacao;
    }

    const negociacaoAtualizada = await negociacao.save();

    // TODO: Enviar notificação para a outra parte

    res.status(200).json({ message: 'Resposta/Mensagem adicionada à negociação.', negociacao: negociacaoAtualizada });

  } catch (error) {
    next(error);
  }
};


/**
 * Finaliza uma negociação (Aceita ou Rejeita).
 * Ação geralmente feita pelo Buyer após resposta do Prestador, ou por qualquer um para rejeitar.
 */
export const finalizarNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const { acao } = req.body; // Espera { acao: 'aceitar' | 'rejeitar' }
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }
  if (acao !== 'aceitar' && acao !== 'rejeitar') {
    res.status(400).json({ message: 'Ação inválida. Use "aceitar" ou "rejeitar".' });
    return;
  }

  // Usar sessão Mongoose para garantir atomicidade entre Negociacao e Contratacao
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const negociacao = await Negociacao.findById(negociacaoId).session(session);

    if (!negociacao) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // --- AUTORIZAÇÃO e Validação de Status ---
    const isBuyer = negociacao.buyerId.toString() === userId;
    const isPrestador = negociacao.prestadorId.toString() === userId;

    if (!isBuyer && !isPrestador) { // Só participantes podem finalizar
      throw new Error('Acesso proibido: Você não participa desta negociação.'); // Erro interno para abortar transação
    }

    // Quem pode aceitar/rejeitar e em qual status? Exemplo:
    if (negociacao.status === NegociacaoStatusEnum.AGUARDANDO_BUYER && !isBuyer) {
      throw new Error('Apenas o comprador pode aceitar/rejeitar neste momento.');
    }
    if (negociacao.status === NegociacaoStatusEnum.AGUARDANDO_PRESTADOR && !isPrestador && acao === 'aceitar') { // Prestador não pode aceitar sua própria proposta implícita
      throw new Error('Apenas o prestador pode rejeitar neste momento.');
    }
    // Não pode finalizar se já foi aceita/rejeitada/cancelada
    if ([NegociacaoStatusEnum.ACEITA, NegociacaoStatusEnum.REJEITADA, NegociacaoStatusEnum.CANCELADA].includes(negociacao.status)) {
      throw new Error(`Não é possível ${acao}. Negociação já finalizada com status '${negociacao.status}'.`);
    }
    // --------------------------------------------

    // Atualiza status da Negociação
    const novoStatusFinal = acao === 'aceitar' ? NegociacaoStatusEnum.ACEITA : NegociacaoStatusEnum.REJEITADA;
    negociacao.status = novoStatusFinal;

    // Adiciona entrada final ao histórico (opcional, mas informativo)
    negociacao.historico.push({
      autorId: userId,
      tipo: HistoricoNegociacaoTipoEnum.MENSAGEM_SIMPLES, // Ou um tipo 'finalizacao'?
      dados: { observacoes: `Negociação ${novoStatusFinal} por ${isBuyer ? 'Comprador' : 'Prestador'}.`},
      timestamp: new Date()
    } as any); // 'as any' pode ser necessário ou criar tipo/interface

    let contratacaoAtualizada = null;

    // Se foi ACEITA, atualiza a Contratacao
    if (novoStatusFinal === NegociacaoStatusEnum.ACEITA) {
      // Encontra os últimos termos propostos no histórico
      const ultimoItemProposta = [...negociacao.historico].reverse().find(item =>
        item.tipo === HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER || item.tipo === HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR
      );

      if (!ultimoItemProposta) {
        throw new Error('Não foi possível encontrar os termos finais na negociação.');
      }

      const updatesContratacao: Partial<Pick<IContratacao, 'valorTotal' | 'dataInicioServico' | 'dataFimServico'>> = {};
      let termosAplicados = false;

      if (ultimoItemProposta.dados.novoPreco !== undefined && ultimoItemProposta.dados.novoPreco !== null) {
        updatesContratacao.valorTotal = ultimoItemProposta.dados.novoPreco;
        termosAplicados = true;
      }
      if (ultimoItemProposta.dados.novoPrazo) {
        // Assumindo que novoPrazo é a data final. Ajustar se for data inicial.
        updatesContratacao.dataFimServico = ultimoItemProposta.dados.novoPrazo;
        // Poderia ajustar dataInicioServico também se relevante
        termosAplicados = true;
      }

      if (termosAplicados) {
        // Atualiza a Contratacao DENTRO da transação
        contratacaoAtualizada = await Contratacao.findByIdAndUpdate(
          negociacao.contratacaoId,
          { $set: updatesContratacao },
          { new: true, session: session } // Usa a sessão da transação
        );
        if (!contratacaoAtualizada) {
          throw new Error('Erro ao atualizar a contratação com os termos negociados.');
        }
        // Salva os termos finais na negociação para referência (opcional)
        negociacao.termosFinais = {
          precoFinal: updatesContratacao.valorTotal,
          prazoFinal: updatesContratacao.dataFimServico
        };

      } else {
        // Se aceitou mas não havia novos termos (só mensagem), apenas marca como aceita
        console.log(`Negociação ${negociacao._id} aceita sem alteração de termos.`);
      }
    }

    await negociacao.save({ session }); // Salva a negociação na transação

    // Commita a transação
    await session.commitTransaction();
    session.endSession();

    // TODO: Enviar notificação para a outra parte sobre o resultado

    res.status(200).json({
      message: `Negociação ${novoStatusFinal} com sucesso.`,
      negociacao,
      contratacao: contratacaoAtualizada // Retorna a contratação atualizada se houve mudança
    });

  } catch (error) {
    // Aborta a transação em caso de erro
    await session.abortTransaction();
    session.endSession();
    next(error); // Passa para o handler de erro centralizado
  }
};


// --- Funções de Leitura (Placeholders) ---

export const listarNegociacoesPorContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { contratacaoId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }

  try {
    // Verifica se o usuário é participante da contratação antes de listar
    const contratacao = await Contratacao.findById(contratacaoId).select('buyerId prestadorId');
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    if (contratacao.buyerId.toString() !== userId && contratacao.prestadorId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta contratação.' });
      return;
    }

    // Busca negociações daquela contratação
    // TODO: Adicionar paginação/ordenação se necessário
    const negociacoes = await Negociacao.find({ contratacaoId: contratacaoId })
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .populate('historico.autorId', 'nome foto'); // Popula autor no histórico

    res.status(200).json(negociacoes);

  } catch (error) {
    next(error);
  }
};

export const obterDetalhesNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }

  try {
    const negociacao = await Negociacao.findById(negociacaoId)
      .populate('historico.autorId', 'nome foto')
      .populate('buyerId', 'nome foto')
      .populate('prestadorId', 'nome foto');

    if (!negociacao) {
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // Autorização: Verifica se o usuário logado é participante
    // Alternativa sem populate
    if (negociacao.buyerId.toString() !== userId && negociacao.prestadorId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta negociação.' });
      return;
    }

    res.status(200).json(negociacao);

  } catch (error) {
    next(error);
  }
};