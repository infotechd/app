// src/controllers/negociacaoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Negociacao, { NegociacaoStatusEnum, HistoricoNegociacaoTipoEnum } from '../models/Negociacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';

// --- Funções do Controller ---

/**
 * Cria/Inicia uma nova negociação para uma Contratação existente.
 * Apenas o Comprador da Contratação pode iniciar.
 */
export const criarNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está logado e se tem capacidade de comprador
  if (!req.user || !req.user.isComprador) {
    res.status(403).json({ message: 'Acesso proibido: Apenas compradores podem iniciar negociações.' });
    return;
  }

  const { contratacaoId, proposta } = req.body; // Extrai dados do corpo da requisição: proposta contém novoPreco, novoPrazo e observacoes
  const buyerId = req.user.userId;

  // Realiza validações básicas dos dados de entrada
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
    // Busca a contratação original no banco de dados
    const contratacao = await Contratacao.findById(contratacaoId);

    // Realiza validações de regras de negócio
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    if (contratacao.buyerId.toString() !== buyerId) {
      res.status(403).json({ message: 'Acesso proibido: Você não é o comprador desta contratação.' });
      return;
    }
    // Verifica se o status da contratação permite iniciar uma negociação
    if (![ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(contratacao.status)) {
      res.status(400).json({ message: `Não é possível negociar uma contratação com status '${contratacao.status}'.` });
      return;
    }
    // TODO: Verificar se já existe uma Negociação ativa para esta Contratação

    // Cria o primeiro registro no histórico da negociação
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

    // Cria um novo objeto de negociação no banco de dados
    const novaNegociacao = new Negociacao({
      contratacaoId: contratacao._id,
      buyerId: buyerId,
      prestadorId: contratacao.prestadorId, // Obtém o ID do prestador da contratação
      historico: historicoInicial,
      status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR // Define o status inicial após a proposta do comprador
    });

    await novaNegociacao.save();

    // TODO: Enviar notificação ao Prestador sobre a nova proposta

    res.status(201).json({ message: 'Negociação iniciada com sucesso.', negociacao: novaNegociacao });

  } catch (error) {
    next(error);
  }
};

/**
 * Adiciona uma resposta (Prestador) ou uma mensagem simples (Comprador/Prestador) ao histórico da negociação.
 */
export const responderNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const { tipo, dados } = req.body; // tipo pode ser 'resposta_prestador' ou 'mensagem_simples'; dados contém novoPreco, novoPrazo e observacoes
  const userId = req.user.userId;

  // Validação do ID da negociação
  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }
  // Validação do tipo de resposta
  if (!tipo || !Object.values(HistoricoNegociacaoTipoEnum).includes(tipo as HistoricoNegociacaoTipoEnum)) {
    res.status(400).json({ message: 'Tipo de resposta inválido.'});
    return;
  }
  // Validação dos dados da resposta
  if (!dados || !dados.observacoes) {
    res.status(400).json({ message: 'Dados da resposta inválidos (observacoes são obrigatórias).' });
    return;
  }
  // TODO: Validar novoPreco, novoPrazo se existirem em 'dados'

  try {
    // Busca a negociação no banco de dados
    const negociacao = await Negociacao.findById(negociacaoId);

    if (!negociacao) {
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // --- Verificação de autorização ---
    const isBuyer = negociacao.buyerId.toString() === userId;
    const isPrestador = negociacao.prestadorId.toString() === userId;

    // Verifica se o usuário participa da negociação
    if (!isBuyer && !isPrestador) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta negociação.' });
      return;
    }

    // Verifica permissões e regras de negócio para o tipo de resposta e status atual
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
      novoStatusNegociacao = NegociacaoStatusEnum.AGUARDANDO_BUYER; // Atualiza o status após resposta do prestador
    } else if (tipo === HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER) {
      if (!isBuyer) {
        res.status(403).json({ message: 'Apenas o comprador pode enviar uma nova proposta.' });
        return;
      }
      if (negociacao.status !== NegociacaoStatusEnum.AGUARDANDO_BUYER) { // Verifica se o status atual permite nova proposta do comprador
        res.status(400).json({ message: `Não é possível propor agora. Status atual: ${negociacao.status}.` });
        return;
      }
      novoStatusNegociacao = NegociacaoStatusEnum.AGUARDANDO_PRESTADOR;
    }
    // Mensagens simples geralmente não alteram o status da negociação

    // --- Criação e adição do novo item ao histórico ---
    const novoItemHistorico = {
      autorId: userId,
      tipo: tipo as HistoricoNegociacaoTipoEnum,
      dados: {
        novoPreco: dados.novoPreco,
        novoPrazo: dados.novoPrazo ? new Date(dados.novoPrazo) : undefined,
        observacoes: dados.observacoes
      },
      timestamp: new Date() // O timestamp é gerado no servidor, não vem do cliente
    };

    // Adiciona o novo item ao histórico da negociação
    negociacao.historico.push(novoItemHistorico as any); // Conversão de tipo necessária para o subdocumento

    // Atualiza o status da negociação se necessário
    if (novoStatusNegociacao) {
      negociacao.status = novoStatusNegociacao;
    }

    // Salva as alterações no banco de dados
    const negociacaoAtualizada = await negociacao.save();

    // TODO: Enviar notificação para a outra parte

    res.status(200).json({ message: 'Resposta/Mensagem adicionada à negociação.', negociacao: negociacaoAtualizada });

  } catch (error) {
    next(error);
  }
};


/**
 * Finaliza uma negociação (Aceita ou Rejeita).
 * Ação geralmente realizada pelo Comprador após resposta do Prestador, ou por qualquer um para rejeitar.
 */
export const finalizarNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const { acao } = req.body; // Recebe a ação desejada: 'aceitar' ou 'rejeitar'
  const userId = req.user.userId;

  // Validação do ID da negociação
  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }
  // Validação da ação solicitada
  if (acao !== 'aceitar' && acao !== 'rejeitar') {
    res.status(400).json({ message: 'Ação inválida. Use "aceitar" ou "rejeitar".' });
    return;
  }

  // Inicia uma sessão do Mongoose para garantir atomicidade entre as operações de Negociação e Contratação
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Busca a negociação usando a sessão de transação
    const negociacao = await Negociacao.findById(negociacaoId).session(session);

    if (!negociacao) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // --- Verificação de autorização e validação de status ---
    const isBuyer = negociacao.buyerId.toString() === userId;
    const isPrestador = negociacao.prestadorId.toString() === userId;

    // Verifica se o usuário é participante da negociação
    if (!isBuyer && !isPrestador) {
      throw new Error('Acesso proibido: Você não participa desta negociação.'); // Erro para abortar a transação
    }

    // Verifica as regras de negócio para quem pode aceitar/rejeitar em cada status
    if (negociacao.status === NegociacaoStatusEnum.AGUARDANDO_BUYER && !isBuyer) {
      throw new Error('Apenas o comprador pode aceitar/rejeitar neste momento.');
    }
    if (negociacao.status === NegociacaoStatusEnum.AGUARDANDO_PRESTADOR && !isPrestador && acao === 'aceitar') {
      throw new Error('Apenas o prestador pode rejeitar neste momento.');
    }
    // Verifica se a negociação já foi finalizada anteriormente
    if ([NegociacaoStatusEnum.ACEITA, NegociacaoStatusEnum.REJEITADA, NegociacaoStatusEnum.CANCELADA].includes(negociacao.status)) {
      throw new Error(`Não é possível ${acao}. Negociação já finalizada com status '${negociacao.status}'.`);
    }
    // --------------------------------------------

    // Atualiza o status da negociação conforme a ação solicitada
    const novoStatusFinal = acao === 'aceitar' ? NegociacaoStatusEnum.ACEITA : NegociacaoStatusEnum.REJEITADA;
    negociacao.status = novoStatusFinal;

    // Adiciona um registro no histórico sobre a finalização
    negociacao.historico.push({
      autorId: userId,
      tipo: HistoricoNegociacaoTipoEnum.MENSAGEM_SIMPLES,
      dados: { observacoes: `Negociação ${novoStatusFinal} por ${isBuyer ? 'Comprador' : 'Prestador'}.`},
      timestamp: new Date()
    } as any); // Conversão de tipo necessária para o subdocumento

    let contratacaoAtualizada = null;

    // Se a negociação foi aceita, atualiza a contratação com os novos termos
    if (novoStatusFinal === NegociacaoStatusEnum.ACEITA) {
      // Busca os últimos termos propostos no histórico da negociação
      const ultimoItemProposta = [...negociacao.historico].reverse().find(item =>
        item.tipo === HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER || item.tipo === HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR
      );

      if (!ultimoItemProposta) {
        throw new Error('Não foi possível encontrar os termos finais na negociação.');
      }

      // Prepara as atualizações para a contratação
      const updatesContratacao: Partial<Pick<IContratacao, 'valorTotal' | 'dataInicioServico' | 'dataFimServico'>> = {};
      let termosAplicados = false;

      // Verifica se há um novo preço a ser aplicado
      if (ultimoItemProposta.dados.novoPreco !== undefined && ultimoItemProposta.dados.novoPreco !== null) {
        updatesContratacao.valorTotal = ultimoItemProposta.dados.novoPreco;
        termosAplicados = true;
      }
      // Verifica se há um novo prazo a ser aplicado
      if (ultimoItemProposta.dados.novoPrazo) {
        // Define a data final do serviço com o novo prazo
        updatesContratacao.dataFimServico = ultimoItemProposta.dados.novoPrazo;
        termosAplicados = true;
      }

      // Se houve alterações nos termos, atualiza a contratação
      if (termosAplicados) {
        // Atualiza a contratação dentro da transação
        contratacaoAtualizada = await Contratacao.findByIdAndUpdate(
          negociacao.contratacaoId,
          { $set: updatesContratacao },
          { new: true, session: session } // Usa a mesma sessão da transação
        );
        if (!contratacaoAtualizada) {
          throw new Error('Erro ao atualizar a contratação com os termos negociados.');
        }
        // Registra os termos finais na negociação para referência futura
        negociacao.termosFinais = {
          precoFinal: updatesContratacao.valorTotal,
          prazoFinal: updatesContratacao.dataFimServico
        };

      } else {
        // Caso a negociação tenha sido aceita sem alterações nos termos
        console.log(`Negociação ${negociacao._id} aceita sem alteração de termos.`);
      }
    }

    // Salva as alterações na negociação dentro da transação
    await negociacao.save({ session });

    // Finaliza a transação com sucesso
    await session.commitTransaction();
    session.endSession();

    // TODO: Enviar notificação para a outra parte sobre o resultado da negociação

    // Retorna a resposta com os dados atualizados
    res.status(200).json({
      message: `Negociação ${novoStatusFinal} com sucesso.`,
      negociacao,
      contratacao: contratacaoAtualizada // Inclui a contratação atualizada se houve mudança
    });

  } catch (error) {
    // Em caso de erro, cancela a transação
    await session.abortTransaction();
    session.endSession();
    next(error); // Encaminha o erro para o tratador centralizado
  }
};


// --- Funções de Consulta ---

/**
 * Lista todas as negociações relacionadas a uma contratação específica.
 * Apenas participantes da contratação podem visualizar suas negociações.
 */
export const listarNegociacoesPorContratacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { contratacaoId } = req.params;
  const userId = req.user.userId;

  // Validação do ID da contratação
  if (!mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido.' });
    return;
  }

  try {
    // Verifica se o usuário é participante da contratação antes de listar as negociações
    const contratacao = await Contratacao.findById(contratacaoId).select('buyerId prestadorId');
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    // Verifica se o usuário é o comprador ou o prestador da contratação
    if (contratacao.buyerId.toString() !== userId && contratacao.prestadorId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta contratação.' });
      return;
    }

    // Busca todas as negociações relacionadas à contratação especificada
    // TODO: Adicionar paginação e opções de ordenação quando necessário
    const negociacoes = await Negociacao.find({ contratacaoId: contratacaoId })
      .sort({ createdAt: -1 }) // Ordena pelas mais recentes primeiro
      .populate('historico.autorId', 'nome foto'); // Carrega informações do autor de cada item do histórico

    res.status(200).json(negociacoes);

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém os detalhes completos de uma negociação específica.
 * Apenas participantes da negociação podem visualizar seus detalhes.
 */
export const obterDetalhesNegociacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.'});
    return;
  }
  const { negociacaoId } = req.params;
  const userId = req.user.userId;

  // Validação do ID da negociação
  if (!mongoose.Types.ObjectId.isValid(negociacaoId)) {
    res.status(400).json({ message: 'ID da negociação inválido.' });
    return;
  }

  try {
    // Busca a negociação com todos os dados relacionados (comprador, prestador e autores do histórico)
    const negociacao = await Negociacao.findById(negociacaoId)
      .populate('historico.autorId', 'nome foto')
      .populate('buyerId', 'nome foto')
      .populate('prestadorId', 'nome foto');

    if (!negociacao) {
      res.status(404).json({ message: 'Negociação não encontrada.' });
      return;
    }

    // Verifica se o usuário logado é participante da negociação
    if (negociacao.buyerId.toString() !== userId && negociacao.prestadorId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não participa desta negociação.' });
      return;
    }

    // Retorna os detalhes completos da negociação
    res.status(200).json(negociacao);

  } catch (error) {
    next(error);
  }
};
