// src/controllers/pagamentoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
// Importação do modelo principal
import Pagamento from '../models/Pagamento';
// Importação de interfaces relacionadas
import { IPagamento, IHistoricoStatusPagamento } from '../models/Pagamento';

// O tipo HydratedDocument é usado pelo Mongoose para representar documentos que foram hidratados a
// partir do banco de dados, matendo a tipagem correta e os métodos de instância disponíveis
import { HydratedDocument } from 'mongoose';

// Importação de enumerações
import { PagamentoStatusEnum, PagamentoMetodoEnum } from '../models/Pagamento';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
import { TipoUsuarioEnum } from '../models/User';
// Importação do serviço para integração com API de pagamento
// import fintechService from '../services/fintechService';

// --- Funções do Controller ---

/**
 * Processa uma tentativa de pagamento para uma Contratação.
 * Cria um registro de Pagamento, chama a API de pagamento, e atualiza o histórico de status.
 * Requer que o usuário logado seja o Comprador da Contratação.
 */
export const processarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  const { contratacaoId, metodo } = req.body as { contratacaoId: string, metodo: PagamentoMetodoEnum }; // Extrai e tipifica os dados do corpo da requisição

  // Realiza validação básica dos dados de entrada
  if (!contratacaoId || !mongoose.Types.ObjectId.isValid(contratacaoId)) {
    res.status(400).json({ message: 'ID da contratação inválido ou ausente.' });
    return;
  }
  if (!metodo || !Object.values(PagamentoMetodoEnum).includes(metodo)) {
    res.status(400).json({ message: `Método de pagamento inválido: ${metodo}.` });
    return;
  }

  let novoPagamento: HydratedDocument<IPagamento> | null = null; // Variável para armazenar o documento de pagamento

  try {
    // 1. Busca a Contratação no banco de dados e valida permissões e status
    const contratacao = await Contratacao.findById(contratacaoId);
    if (!contratacao) {
      res.status(404).json({ message: 'Contratação não encontrada.' });
      return;
    }
    if (contratacao.buyerId.toString() !== userId) {
      res.status(403).json({ message: 'Acesso proibido: Você não é o comprador desta contratação.' });
      return;
    }
    // Verifica se o status da contratação permite pagamento
    if (![ContratacaoStatusEnum.PENDENTE, ContratacaoStatusEnum.ACEITA].includes(contratacao.status)) {
      res.status(400).json({ message: `Não é possível pagar uma contratação com status '${contratacao.status}'.` });
      return;
    }
    // TODO: Verificar se já existe um pagamento 'aprovado' para esta contratação

    // 2. Cria o registro inicial do Pagamento no banco de dados
    novoPagamento = new Pagamento({
      contratacaoId: contratacao._id,
      valor: contratacao.valorTotal, // Utiliza o valor total da contratação
      metodo: metodo,
      historicoStatus: [{ // Adiciona o primeiro status ao histórico
        status: PagamentoStatusEnum.CRIADO, // Status inicial do pagamento
        timestamp: new Date()
      }]
      // O ID da transação será adicionado após resposta do serviço de pagamento
    });
    await novoPagamento.save();

    // 3. Integração com o serviço de pagamento (API externa)
    console.log(`Iniciando pagamento ${novoPagamento._id} para contratação ${contratacaoId} via ${metodo}`);
    // const resultadoFintech = await fintechService.criarPagamento({
    //     pagamentoIdInterno: novoPagamento._id.toString(),
    //     valor: novoPagamento.valor,
    //     metodo: novoPagamento.metodo,
    //     // ... outros dados necessários pelo serviço de pagamento
    // });
    // --- SIMULAÇÃO DE INTEGRAÇÃO ---
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula tempo de resposta da API
    const resultadoFintech = { // Simulação de resposta do serviço
      success: novoPagamento.valor > 0 && Math.random() > 0.1, // 90% de chance de aprovar se valor > 0
      transacaoId: novoPagamento.valor > 0 ? `FINTECH_${new Date().getTime()}` : undefined,
      message: novoPagamento.valor > 0 ? (Math.random() > 0.1 ? 'Pagamento aprovado pela Fintech' : 'Pagamento recusado pela Fintech') : 'Valor zero não processado',
      errorCode: null // Código de erro (se houver)
    };
    // --- FIM DA SIMULAÇÃO ---

    // 4. Atualiza o histórico de status do Pagamento com o resultado do processamento
    let novoStatus: IHistoricoStatusPagamento;
    if (resultadoFintech.success) {
      novoStatus = {
        status: PagamentoStatusEnum.APROVADO,
        timestamp: new Date(),
        motivo: resultadoFintech.message,
        metadata: { fintechTransacaoId: resultadoFintech.transacaoId } // Dados adicionais da transação
      };
      novoPagamento.transacaoId = resultadoFintech.transacaoId; // Armazena o ID da transação externa
      // TODO: Atualizar status da Contratação e enviar notificações
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.RECUSADO, // Define status como recusado
        timestamp: new Date(),
        motivo: resultadoFintech.message || 'Recusado pelo serviço de pagamento.',
        metadata: { errorCode: resultadoFintech.errorCode } // Armazena código de erro
      };
      // TODO: Enviar notificação sobre falha no pagamento
    }
    novoPagamento.historicoStatus.push(novoStatus);
    await novoPagamento.save();

    res.status(200).json({ message: 'Processamento de pagamento concluído.', pagamento: novoPagamento });

  } catch (error) {
    // Tratamento de erros durante o processamento
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
    next(error); // Encaminha o erro para o manipulador global
  }
};

/**
 * Solicita o estorno (reembolso) de um pagamento existente.
 * Requer autorização específica (Administrador ou Comprador em condições específicas).
 */
export const estornarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
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

    // --- VERIFICAÇÃO DE AUTORIZAÇÃO ---
    // Verifica se o usuário tem permissão para solicitar estorno
    const contratacao = pagamento.contratacaoId as HydratedDocument<IContratacao>; // Conversão de tipo após populate
    const isBuyer = contratacao?.buyerId.toString() === userId;
    const isAdmin = userType === TipoUsuarioEnum.ADMIN;

    // Regras de autorização para estorno
    let podeEstornar = false;
    if (isAdmin) {
      podeEstornar = true;
    } else if (isBuyer && contratacao?.status === ContratacaoStatusEnum.CANCELADO_BUYER /* ou outros status permitidos */) {
      podeEstornar = true;
    }

    if (!podeEstornar) {
      res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para estornar este pagamento.' });
      return;
    }
    // ---------------------

    // Verifica se o pagamento está em um estado que permite estorno
    if (pagamento.statusAtual !== PagamentoStatusEnum.APROVADO) {
      res.status(400).json({ message: `Não é possível estornar um pagamento com status '${pagamento.statusAtual}'.` });
      return;
    }
    if (!pagamento.transacaoId) {
      res.status(400).json({ message: 'Não é possível estornar: ID da transação externa não encontrado.' });
      return;
    }


    // Integração com o serviço de pagamento para solicitar o estorno
    console.log(`Solicitando estorno para pagamento ${pagamentoId}, transação ${pagamento.transacaoId}`);
    // const resultadoEstorno = await fintechService.criarEstorno(pagamento.transacaoId, { motivo: req.body.motivo || 'Solicitado pelo usuário' });
    // --- SIMULAÇÃO DE INTEGRAÇÃO ---
    await new Promise(resolve => setTimeout(resolve, 500));
    const resultadoEstorno = { success: true, message: 'Estorno processado pela Fintech' };
    // --- FIM DA SIMULAÇÃO ---

    // Atualiza o histórico de status do pagamento com o resultado do estorno
    let novoStatus: IHistoricoStatusPagamento;
    if (resultadoEstorno.success) {
      novoStatus = {
        status: PagamentoStatusEnum.REEMBOLSADO,
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Estorno realizado com sucesso.'
      };
      // TODO: Atualizar status da Contratação e enviar notificações
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.ERRO, // Registra erro no processo de estorno
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Falha ao solicitar estorno no serviço de pagamento.'
      };
      // TODO: Enviar notificação sobre falha no estorno
    }
    pagamento.historicoStatus.push(novoStatus);
    const pagamentoAtualizado = await pagamento.save();

    res.status(200).json({ message: `Resultado do estorno: ${resultadoEstorno.message}`, pagamento: pagamentoAtualizado });

  } catch (error) {
    next(error); // Encaminha o erro para o manipulador global
  }
};

// --- Funções Adicionais ---

export const listarMeusPagamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para buscar pagamentos onde o usuário logado seja o comprador (via contratacaoId)
  // Adicionar filtros por status, data, paginação e ordenação
  res.status(501).json({ message: 'Endpoint não implementado.'});
};

export const obterDetalhesPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para buscar um pagamento específico pelo ID
  // Validar se o usuário logado (comprador, prestador da contratação associada ou administrador) tem permissão para visualizar
  res.status(501).json({ message: 'Endpoint não implementado.'});
};

export const handleWebhookFintech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar lógica para receber e processar notificações (webhooks) do serviço de pagamento
  // 1. Validar a autenticidade da requisição (verificar assinatura, IP de origem, etc)
  // 2. Analisar o corpo da requisição para identificar o tipo de evento (pagamento confirmado, falha, estorno, etc)
  // 3. Extrair o identificador da transação ou do pagamento interno
  // 4. Localizar o registro de pagamento correspondente no banco de dados
  // 5. Adicionar novo status ao histórico baseado no evento recebido
  // 6. Salvar as atualizações no registro de pagamento
  // 7. Executar ações adicionais quando necessário (atualizar contratação, enviar notificações)
  // 8. Retornar status 200 para confirmar o recebimento da notificação

  console.log("Webhook Recebido:", req.body); // Registra dados recebidos
  // Importante responder rapidamente com status 200 para o serviço de pagamento
  res.status(200).send('Webhook recebido.');
};

// Exporta todas as funções do controlador
// (Alternativa: export default { processarPagamento, ... })
