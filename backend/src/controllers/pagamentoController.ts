// src/controllers/pagamentoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
// Importação do modelo principal
import Pagamento from '../models/Pagamento';
// Importação de interfaces relacionadas
import { IPagamento } from '../models/Pagamento';
// @ts-ignore - Contorna o erro de tipagem
import { IHistoricoStatusPagamento } from '../models/Pagamento';

// O tipo HydrateDocument é usado pelo Mongoose para representar documentos que foram hidratados a
// partir do banco de dados, matendo a tipagem correta e os métodos de instância disponíveis
import { HydratedDocument } from 'mongoose';

// Importação de enumerações
import { PagamentoStatusEnum, PagamentoMetodoEnum } from '../models/Pagamento';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import { TipoUsuarioEnum } from '../models/User';
// Exemplo: Importar um serviço/SDK para interagir com a API Fintech real
// import fintechService from '../services/fintechService';

// --- Funções do Controller ---

/**
 * Processa uma tentativa de pagamento para uma Contratacao.
 * Cria um registro de Pagamento, chama a API Fintech, e atualiza o histórico de status.
 * Requer que o usuário logado seja o Comprador da Contratacao.
 */
export const processarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica usuário logado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  const { contratacaoId, metodo } = req.body as { contratacaoId: string, metodo: PagamentoMetodoEnum }; // Exemplo de tipagem do body

  // Validação básica de entrada (idealmente feita por middleware)
  if (!contratacaoId || !mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido ou ausente.' });
    return;
  }
  if (!metodo || !Object.values(PagamentoMetodoEnum).includes(metodo)) {
    res.status(400).json({ message: `Método de pagamento inválido: ${metodo}.` });
    return;
  }

  let novoPagamento: HydratedDocument<IPagamento> | null = null; // Variável para o documento de pagamento

  try {
    // 1. Busca a Contratação e valida permissão e status
    const contratacao = await Contratacao.findById(contratacaoId);
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    if (contratacao.buyerId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não é o comprador desta contratação.' });
      return;
    }
    // Exemplo: Só permite pagar se estiver 'Aceita' ou 'Pendente'? Ajustar regra.
    if (![ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(contratacao.status)) {
      res.status(400).json({ message: `Não é possível pagar uma contratação com status '${contratacao.status}'.` });
      return;
    }
    // TODO: Verificar se já existe um pagamento 'aprovado' para esta contratação?

    // 2. Cria o registro inicial do Pagamento no banco
    novoPagamento = new Pagamento({
      contratacaoId: contratacao._id,
      valor: contratacao.valorTotal, // Pega o valor da contratação
      metodo: metodo,
      historicoStatus: [{ // Adiciona o status inicial
        status: PagamentoStatusEnum.CRIADO, // Ou PENDENTE? Depende do fluxo da Fintech
        timestamp: new Date()
      }]
      // transacaoId será adicionado após resposta da Fintech
    });
    await novoPagamento.save();

    // 3. Chama a API da Fintech REAL (substituir simulação)
    console.log(`Iniciando pagamento ${novoPagamento._id} para contratação ${contratacaoId} via ${metodo}`);
    // const resultadoFintech = await fintechService.criarPagamento({
    //     pagamentoIdInterno: novoPagamento._id.toString(),
    //     valor: novoPagamento.valor,
    //     metodo: novoPagamento.metodo,
    //     // ... outros dados necessários pela Fintech (dados do comprador, etc.)
    // });
    // --- SIMULAÇÃO ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
    const resultadoFintech = { // Simulação de resposta
      success: novoPagamento.valor > 0 && Math.random() > 0.1, // 90% de chance de aprovar se valor > 0
      transacaoId: novoPagamento.valor > 0 ? `FINTECH_${new Date().getTime()}` : undefined,
      message: novoPagamento.valor > 0 ? (Math.random() > 0.1 ? 'Pagamento aprovado pela Fintech' : 'Pagamento recusado pela Fintech') : 'Valor zero não processado',
      errorCode: null // Exemplo
    };
    // --- FIM SIMULAÇÃO ---

    // 4. Atualiza o histórico de status do Pagamento com o resultado da Fintech
    let novoStatus: IHistoricoStatusPagamento;
    if (resultadoFintech.success) {
      novoStatus = {
        status: PagamentoStatusEnum.APROVADO,
        timestamp: new Date(),
        motivo: resultadoFintech.message,
        metadata: { fintechTransacaoId: resultadoFintech.transacaoId } // Exemplo metadata
      };
      novoPagamento.transacaoId = resultadoFintech.transacaoId; // Salva ID externo
      // TODO: Atualizar status da Contratacao? Enviar notificações?
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.RECUSADO, // Ou ERRO dependendo da resposta
        timestamp: new Date(),
        motivo: resultadoFintech.message || 'Recusado pela Fintech.',
        metadata: { errorCode: resultadoFintech.errorCode } // Exemplo metadata
      };
      // TODO: Enviar notificação de falha?
    }
    novoPagamento.historicoStatus.push(novoStatus);
    await novoPagamento.save();

    res.status(200).json({ message: 'Processamento de pagamento concluído.', pagamento: novoPagamento });

  } catch (error) {
    // Se deu erro após criar o registro de Pagamento inicial, adiciona um status de erro
    if (novoPagamento && novoPagamento.statusAtual !== PagamentoStatusEnum.ERRO) {
      try {
        novoPagamento.historicoStatus.push({
          status: PagamentoStatusEnum.ERRO,
          timestamp: new Date(),
          motivo: (error as Error).message || 'Erro interno ao processar pagamento.'
        });
        await novoPagamento.save();
      } catch (saveError) {
        console.error("Erro ao salvar status de erro no pagamento:", saveError);
      }
    }
    next(error); // Delega para o handler centralizado
  }
};

/**
 * Solicita o estorno (refund) de um pagamento existente.
 * Requer autorização (ex: Admin ou Comprador sob certas condições).
 */
export const estornarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica usuário logado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;
  const userType = req.user.tipoUsuario;
  const { pagamentoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(pagamentoId)) {
    res.status(400).json({ message: 'ID do pagamento inválido.' });
    return;
  }

  try {
    const pagamento = await Pagamento.findById(pagamentoId).populate('contratacaoId');
    if (!pagamento) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }

    // --- AUTORIZAÇÃO ---
    // Exemplo: Apenas Admin pode estornar OU o Comprador se a contratação foi cancelada?
    const contratacao = pagamento.contratacaoId as HydratedDocument<IContratacao>; // Type assertion após populate
    const isBuyer = contratacao?.buyerId.toString() === userId;
    const isAdmin = userType === TipoUsuarioEnum.ADMIN;

    // Regra de Exemplo: (Ajustar conforme necessário)
    let podeEstornar = false;
    if (isAdmin) {
      podeEstornar = true;
    } else if (isBuyer && contratacao?.status === ContratacaoStatusEnum.CANCELADO_BUYER /* ou outros status */) {
      podeEstornar = true;
    }

    if (!podeEstornar) {
      res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para estornar este pagamento.' });
      return;
    }
    // ---------------------

    // Verifica se o pagamento já está em status final ou pode ser estornado
    if (pagamento.statusAtual !== PagamentoStatusEnum.APROVADO) {
      res.status(400).json({ message: `Não é possível estornar um pagamento com status '${pagamento.statusAtual}'.` });
      return;
    }
    if (!pagamento.transacaoId) {
      res.status(400).json({ message: 'Não é possível estornar: ID da transação externa não encontrado.' });
      return;
    }


    // Chama a API da Fintech REAL para solicitar o estorno
    console.log(`Solicitando estorno para pagamento ${pagamentoId}, transação ${pagamento.transacaoId}`);
    // const resultadoEstorno = await fintechService.criarEstorno(pagamento.transacaoId, { motivo: req.body.motivo || 'Solicitado pelo usuário' });
    // --- SIMULAÇÃO ---
    await new Promise(resolve => setTimeout(resolve, 500));
    const resultadoEstorno = { success: true, message: 'Estorno processado pela Fintech' };
    // --- FIM SIMULAÇÃO ---

    // Atualiza o histórico de status do Pagamento
    let novoStatus: IHistoricoStatusPagamento;
    if (resultadoEstorno.success) {
      novoStatus = {
        status: PagamentoStatusEnum.REEMBOLSADO,
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Estorno realizado.'
      };
      // TODO: Atualizar status da Contratacao? Enviar notificações?
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.ERRO, // Mantém aprovado mas registra erro no estorno? Ou volta pra aprovado? Depende.
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Falha ao solicitar estorno na Fintech.'
      };
      // TODO: Enviar notificação de falha no estorno?
    }
    pagamento.historicoStatus.push(novoStatus);
    const pagamentoAtualizado = await pagamento.save();

    res.status(200).json({ message: `Resultado do estorno: ${resultadoEstorno.message}`, pagamento: pagamentoAtualizado });

  } catch (error) {
    next(error);
  }
};

// --- Funções Faltantes (Placeholders) ---

export const listarMeusPagamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para buscar Pagamentos onde o req.user.userId seja o comprador (via contratacaoId)
  // Adicionar filtros (status, data), paginação, ordenação.
  res.status(501).json({ message: 'Endpoint não implementado.'});
};

export const obterDetalhesPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para buscar Pagamento por ID (:pagamentoId)
  // Validar se o req.user (buyer ou prestador da contratacao associada, ou admin) tem permissão para ver.
  res.status(501).json({ message: 'Endpoint não implementado.'});
};

export const handleWebhookFintech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para receber e validar webhooks da API Fintech
  // 1. Validar a autenticidade da requisição (ex: verificar assinatura HMAC, IP de origem).
  // 2. Parsear o corpo do webhook para identificar o evento (ex: pagamento_confirmado, pagamento_falhou, estorno_efetuado).
  // 3. Extrair o ID da transação ou ID do pagamento interno.
  // 4. Buscar o documento Pagamento correspondente no banco.
  // 5. Adicionar um novo status ao historicoStatus baseado no evento do webhook.
  // 6. Salvar o documento Pagamento.
  // 7. Disparar lógica adicional se necessário (atualizar Contratacao, enviar notificações).
  // 8. Retornar status 200 OK para a Fintech confirmar recebimento.

  console.log("Webhook Recebido:", req.body); // Log inicial
  // É crucial responder rapidamente com 200 OK para a Fintech
  res.status(200).send('Webhook recebido.');
};

// Exporta todas as funções
// (Alternativa: export default { processarPagamento, ... })