// src/controllers/pagamentoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
// Importação do modelo principal
import Pagamento from '../models/Pagamento';
// Importação de interfaces relacionadas
import { IPagamento, IHistoricoStatusPagamento, IHistoricoStatusPagamentoInput } from '../models/Pagamento';

// O tipo HydratedDocument é usado pelo Mongoose para representar documentos que foram hidratados a
// partir do banco de dados, matendo a tipagem correta e os métodos de instância disponíveis
import { HydratedDocument } from 'mongoose';

// Importação de enumerações
import { PagamentoStatusEnum, PagamentoMetodoEnum } from '../models/Pagamento';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../models/Contratacao';
// Importação do serviço para integração com API de pagamento
// import fintechService from '../services/fintechService';

// --- Funções do Controller ---

/**
 * Processa uma tentativa de pagamento para uma Contratação.
 * 
 * Este endpoint realiza as seguintes operações:
 * 1. Valida os dados de entrada e permissões do usuário
 * 2. Verifica se já existe um pagamento aprovado para a contratação
 * 3. Cria um registro de Pagamento no banco de dados
 * 4. Integra com o serviço de pagamento externo (ou simulação)
 * 5. Atualiza o histórico de status do Pagamento com o resultado
 * 6. Atualiza o status da Contratação quando o pagamento é aprovado
 * 
 * @param {Request} req - Objeto de requisição Express contendo:
 *   - req.user - Dados do usuário autenticado (userId, isAdmin, etc.)
 *   - req.body.contratacaoId - ID da contratação a ser paga
 *   - req.body.metodo - Método de pagamento (enum PagamentoMetodoEnum)
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função next do Express para tratamento de erros
 * 
 * @returns {Promise<void>} - Retorna void, mas envia resposta JSON com:
 *   - Em caso de sucesso: status 200 com detalhes do pagamento
 *   - Em caso de erro: status apropriado (400, 401, 403, 404, 500) com mensagem
 * 
 * @throws {Error} - Erros são capturados e tratados internamente
 * 
 * @requires Autenticação - Usuário deve estar autenticado
 * @requires Autorização - Usuário deve ser o comprador da contratação
 */
export const processarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  // Extrai e tipifica os dados do corpo da requisição
  const { contratacaoId, metodo } = req.body as { contratacaoId: string, metodo: PagamentoMetodoEnum };

  // Validação reforçada dos dados de entrada
  // 1. Validação do ID da contratação
  if (!contratacaoId) {
    res.status(400).json({ message: 'ID da contratação é obrigatório.' });
    return;
  }

  // Sanitiza e valida o formato do ID
  const sanitizedContratacaoId = contratacaoId.trim();
  if (!mongoose.Types.ObjectId.isValid(sanitizedContratacaoId)) {
    res.status(400).json({ message: 'Formato do ID da contratação é inválido.' });
    return;
  }

  // 2. Validação do método de pagamento
  if (!metodo) {
    res.status(400).json({ message: 'Método de pagamento é obrigatório.' });
    return;
  }

  // Verifica se o método está entre os valores permitidos
  if (!Object.values(PagamentoMetodoEnum).includes(metodo)) {
    res.status(400).json({ 
      message: `Método de pagamento inválido: ${metodo}.`,
      metodosPermitidos: Object.values(PagamentoMetodoEnum)
    });
    return;
  }

  // 3. Validação adicional para evitar ataques de injeção ou XSS
  // Verifica se há outros campos inesperados no corpo da requisição
  const camposPermitidos = ['contratacaoId', 'metodo'];
  const camposExtras = Object.keys(req.body).filter(campo => !camposPermitidos.includes(campo));

  if (camposExtras.length > 0) {
    console.warn(`Campos não esperados na requisição de pagamento: ${camposExtras.join(', ')}`);
    // Não rejeita a requisição, mas registra para monitoramento de segurança
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
    // Verifica se já existe um pagamento 'aprovado' para esta contratação
    const pagamentoExistente = await Pagamento.findOne({
      contratacaoId: contratacaoId,
      'historicoStatus.status': PagamentoStatusEnum.APROVADO
    });

    if (pagamentoExistente) {
      res.status(400).json({ 
        message: 'Já existe um pagamento aprovado para esta contratação.',
        pagamentoId: pagamentoExistente._id
      });
      return;
    }

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
    let novoStatus: IHistoricoStatusPagamentoInput;
    if (resultadoFintech.success) {
      novoStatus = {
        status: PagamentoStatusEnum.APROVADO,
        timestamp: new Date(),
        motivo: resultadoFintech.message,
        metadata: resultadoFintech.transacaoId ? { transacaoId: resultadoFintech.transacaoId } as any : undefined // Dados adicionais da transação
      };
      novoPagamento.transacaoId = resultadoFintech.transacaoId; // Armazena o ID da transação externa

      // Atualiza o status da Contratação para EM_ANDAMENTO quando o pagamento é aprovado
      try {
        const contratacaoAtualizada = await Contratacao.findByIdAndUpdate(
          contratacao._id,
          { 
            status: ContratacaoStatusEnum.EM_ANDAMENTO,
            // Se a data de início ainda não foi definida, define como a data atual
            ...(contratacao.dataInicioServico ? {} : { dataInicioServico: new Date() })
          },
          { new: true }
        );

        if (!contratacaoAtualizada) {
          console.error(`Não foi possível atualizar a contratação ${contratacao._id} após pagamento aprovado`);
        } else {
          console.log(`Contratação ${contratacao._id} atualizada para status ${ContratacaoStatusEnum.EM_ANDAMENTO}`);
        }
      } catch (updateError) {
        console.error('Erro ao atualizar status da contratação:', updateError);
        // Não interrompe o fluxo principal em caso de erro na atualização da contratação
      }

      // Enviar notificações sobre pagamento aprovado
      try {
        // Aqui seria implementada a integração com um serviço de notificações
        // Por exemplo, enviar e-mail, push notification, ou mensagem no sistema
        console.log(`Notificação: Pagamento ${novoPagamento._id} aprovado para contratação ${contratacao._id}`);

        // Exemplo de estrutura de dados para notificação
        const notificacaoData = {
          tipo: 'pagamento_aprovado',
          pagamentoId: novoPagamento._id,
          contratacaoId: contratacao._id,
          buyerId: contratacao.buyerId,
          prestadorId: contratacao.prestadorId,
          valor: novoPagamento.valor,
          dataAprovacao: new Date(),
          // Outros dados relevantes
        };

        // Em uma implementação real, chamaríamos um serviço de notificação
        // await notificacaoService.enviarNotificacao(notificacaoData);
      } catch (notifError) {
        // Registra erro mas não interrompe o fluxo principal
        console.error('Erro ao enviar notificação de pagamento aprovado:', notifError);
      }
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.RECUSADO, // Define status como recusado
        timestamp: new Date(),
        motivo: resultadoFintech.message || 'Recusado pelo serviço de pagamento.',
        metadata: resultadoFintech.errorCode ? { errorCode: resultadoFintech.errorCode } as any : undefined // Armazena código de erro
      };
      // Enviar notificação sobre falha no pagamento
      try {
        // Aqui seria implementada a integração com um serviço de notificações
        console.log(`Notificação: Pagamento ${novoPagamento._id} recusado para contratação ${contratacao._id}`);

        // Exemplo de estrutura de dados para notificação
        const notificacaoData = {
          tipo: 'pagamento_recusado',
          pagamentoId: novoPagamento._id,
          contratacaoId: contratacao._id,
          buyerId: contratacao.buyerId,
          prestadorId: contratacao.prestadorId,
          valor: novoPagamento.valor,
          dataRecusa: new Date(),
          motivo: resultadoFintech.message || 'Recusado pelo serviço de pagamento',
          // Outros dados relevantes
        };

        // Em uma implementação real, chamaríamos um serviço de notificação
        // await notificacaoService.enviarNotificacao(notificacaoData);
      } catch (notifError) {
        // Registra erro mas não interrompe o fluxo principal
        console.error('Erro ao enviar notificação de pagamento recusado:', notifError);
      }
    }
    novoPagamento.historicoStatus.push(novoStatus);
    await novoPagamento.save();

    res.status(200).json({ message: 'Processamento de pagamento concluído.', pagamento: novoPagamento });

  } catch (error) {
    // Tratamento de erros durante o processamento
    console.error('Erro ao processar pagamento:', error);

    // Tenta registrar o erro no histórico do pagamento se ele já foi criado
    if (novoPagamento && novoPagamento.statusAtual !== PagamentoStatusEnum.ERRO) {
      try {
        // Determina uma mensagem de erro amigável para o usuário
        let mensagemErro = 'Erro interno ao processar pagamento.';

        if (error instanceof Error) {
          // Registra o erro original para debug, mas apresenta uma mensagem mais amigável
          console.error('Detalhes do erro:', error.message);

          // Personaliza mensagens para erros conhecidos
          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            mensagemErro = 'Tempo limite excedido ao comunicar com o serviço de pagamento. Tente novamente mais tarde.';
          } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            mensagemErro = 'Erro de conexão com o serviço de pagamento. Verifique sua conexão e tente novamente.';
          } else if (error.message.includes('validation')) {
            mensagemErro = 'Dados de pagamento inválidos. Verifique as informações e tente novamente.';
          }
        }

        // Adiciona o status de erro ao histórico
        novoPagamento.historicoStatus.push({
          status: PagamentoStatusEnum.ERRO,
          timestamp: new Date(),
          motivo: mensagemErro,
          metadata: { 
            errorDetails: error instanceof Error ? error.message : 'Erro desconhecido',
            errorStack: error instanceof Error && process.env.NODE_ENV !== 'production' ? error.stack : undefined
          } as any
        } as IHistoricoStatusPagamentoInput);

        await novoPagamento.save();

        // Retorna uma resposta de erro mais informativa para o cliente
        res.status(500).json({ 
          message: mensagemErro,
          pagamentoId: novoPagamento._id,
          status: PagamentoStatusEnum.ERRO
        });

      } catch (saveError) {
        console.error("Erro ao salvar status de erro no pagamento:", saveError);
        // Se não conseguir salvar o erro no pagamento, retorna um erro genérico
        res.status(500).json({ message: 'Erro ao processar pagamento e ao registrar o erro.' });
      }
    } else {
      // Se o pagamento nem chegou a ser criado, retorna um erro genérico
      res.status(500).json({ message: 'Erro ao iniciar o processamento do pagamento.' });
    }

    // Não chama next(error) pois já respondemos ao cliente
  }
};

/**
 * Solicita o estorno (reembolso) de um pagamento existente.
 * 
 * Este endpoint realiza as seguintes operações:
 * 1. Valida os dados de entrada e permissões do usuário
 * 2. Verifica se o pagamento está em um estado que permite estorno
 * 3. Integra com o serviço de pagamento externo para solicitar o estorno
 * 4. Atualiza o histórico de status do Pagamento com o resultado
 * 5. Atualiza o status da Contratação quando o estorno é aprovado
 * 
 * @param {Request} req - Objeto de requisição Express contendo:
 *   - req.user - Dados do usuário autenticado (userId, isAdmin, etc.)
 *   - req.params.pagamentoId - ID do pagamento a ser estornado
 *   - req.body.motivo - Motivo opcional do estorno
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função next do Express para tratamento de erros
 * 
 * @returns {Promise<void>} - Retorna void, mas envia resposta JSON com:
 *   - Em caso de sucesso: status 200 com detalhes do pagamento atualizado
 *   - Em caso de erro: status apropriado (400, 401, 403, 404, 500) com mensagem
 * 
 * @throws {Error} - Erros são capturados e tratados internamente
 * 
 * @requires Autenticação - Usuário deve estar autenticado
 * @requires Autorização - Usuário deve ser administrador ou o comprador da contratação em condições específicas
 */
export const estornarPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;
  const isAdmin = req.user.isAdmin;
  // Extrai e valida o ID do pagamento
  const { pagamentoId } = req.params;

  // Validação reforçada do ID do pagamento
  if (!pagamentoId) {
    res.status(400).json({ message: 'ID do pagamento é obrigatório.' });
    return;
  }

  // Sanitiza e valida o formato do ID
  const sanitizedPagamentoId = pagamentoId.trim();
  if (!mongoose.Types.ObjectId.isValid(sanitizedPagamentoId)) {
    res.status(400).json({ message: 'Formato do ID do pagamento é inválido.' });
    return;
  }

  // Validação adicional para evitar ataques de injeção ou XSS
  // Verifica se há campos inesperados no corpo da requisição
  if (Object.keys(req.body).length > 0) {
    const camposPermitidos = ['motivo'];
    const camposExtras = Object.keys(req.body).filter(campo => !camposPermitidos.includes(campo));

    if (camposExtras.length > 0) {
      console.warn(`Campos não esperados na requisição de estorno: ${camposExtras.join(', ')}`);
      // Não rejeita a requisição, mas registra para monitoramento de segurança
    }

    // Sanitiza o campo motivo se estiver presente
    if (req.body.motivo) {
      req.body.motivo = req.body.motivo.trim().substring(0, 500); // Limita o tamanho do motivo
    }
  }

  // Declaração da variável pagamento fora do bloco try para que seja acessível no catch
  let pagamento: HydratedDocument<IPagamento> | null = null;

  try {
    pagamento = await Pagamento.findById(pagamentoId).populate('contratacaoId');
    if (!pagamento) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }

    // --- VERIFICAÇÃO DE AUTORIZAÇÃO ---
    // Verifica se o usuário tem permissão para solicitar estorno
    const contratacao = pagamento.contratacaoId as HydratedDocument<IContratacao>; // Conversão de tipo após populate
    const isBuyer = contratacao?.buyerId.toString() === userId;

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
    let novoStatus: IHistoricoStatusPagamentoInput;
    if (resultadoEstorno.success) {
      novoStatus = {
        status: PagamentoStatusEnum.REEMBOLSADO,
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Estorno realizado com sucesso.',
        metadata: pagamento.transacaoId ? { transacaoId: pagamento.transacaoId } as any : undefined
      };

      // Atualiza o status da Contratação quando o pagamento é reembolsado
      try {
        // Obtém a contratação atual para verificar seu status
        const contratacao = await Contratacao.findById(pagamento.contratacaoId);

        if (contratacao) {
          // Define o novo status com base no status atual e em quem solicitou o estorno
          let novoStatusContratacao = contratacao.status;

          // Se a contratação estiver em andamento ou pendente, atualiza para o status de cancelamento apropriado
          if ([ContratacaoStatusEnum.EM_ANDAMENTO, ContratacaoStatusEnum.ACEITA, ContratacaoStatusEnum.PENDENTE].includes(contratacao.status)) {
            // Determina quem solicitou o estorno com base no usuário atual
            novoStatusContratacao = isBuyer 
              ? ContratacaoStatusEnum.CANCELADO_BUYER 
              : ContratacaoStatusEnum.CANCELADO_PRESTADOR;
          }

          // Atualiza a contratação
          const contratacaoAtualizada = await Contratacao.findByIdAndUpdate(
            contratacao._id,
            { status: novoStatusContratacao },
            { new: true }
          );

          if (!contratacaoAtualizada) {
            console.error(`Não foi possível atualizar a contratação ${contratacao._id} após estorno`);
          } else {
            console.log(`Contratação ${contratacao._id} atualizada para status ${novoStatusContratacao}`);
          }
        } else {
          console.error(`Contratação não encontrada para o pagamento ${pagamento._id}`);
        }
      } catch (updateError) {
        console.error('Erro ao atualizar status da contratação após estorno:', updateError);
        // Não interrompe o fluxo principal em caso de erro na atualização da contratação
      }

      // Enviar notificações sobre estorno realizado
      try {
        // Aqui seria implementada a integração com um serviço de notificações
        console.log(`Notificação: Pagamento ${pagamento._id} estornado`);

        // Obtém os IDs do comprador e prestador da contratação
        const contratacao = await Contratacao.findById(pagamento.contratacaoId);

        if (contratacao) {
          // Exemplo de estrutura de dados para notificação
          const notificacaoData = {
            tipo: 'pagamento_estornado',
            pagamentoId: pagamento._id,
            contratacaoId: pagamento.contratacaoId,
            buyerId: contratacao.buyerId,
            prestadorId: contratacao.prestadorId,
            valor: pagamento.valor,
            dataEstorno: new Date(),
            motivo: resultadoEstorno.message || 'Estorno realizado com sucesso',
            solicitadoPor: isBuyer ? 'comprador' : (isAdmin ? 'administrador' : 'prestador'),
            // Outros dados relevantes
          };

          // Em uma implementação real, chamaríamos um serviço de notificação
          // await notificacaoService.enviarNotificacao(notificacaoData);
        }
      } catch (notifError) {
        // Registra erro mas não interrompe o fluxo principal
        console.error('Erro ao enviar notificação de estorno:', notifError);
      }
    } else {
      novoStatus = {
        status: PagamentoStatusEnum.ERRO, // Registra erro no processo de estorno
        timestamp: new Date(),
        motivo: resultadoEstorno.message || 'Falha ao solicitar estorno no serviço de pagamento.',
        metadata: { errorMessage: 'Falha no processamento do estorno' } as any
      };
      // Enviar notificação sobre falha no estorno
      try {
        // Aqui seria implementada a integração com um serviço de notificações
        console.log(`Notificação: Falha no estorno do pagamento ${pagamento._id}`);

        // Obtém os dados da contratação para a notificação
        const contratacao = await Contratacao.findById(pagamento.contratacaoId);

        if (contratacao) {
          // Exemplo de estrutura de dados para notificação
          const notificacaoData = {
            tipo: 'pagamento_estorno_falha',
            pagamentoId: pagamento._id,
            contratacaoId: pagamento.contratacaoId,
            buyerId: contratacao.buyerId,
            prestadorId: contratacao.prestadorId,
            valor: pagamento.valor,
            dataFalha: new Date(),
            motivo: resultadoEstorno.message || 'Falha ao solicitar estorno no serviço de pagamento',
            solicitadoPor: isBuyer ? 'comprador' : (isAdmin ? 'administrador' : 'prestador'),
            // Outros dados relevantes
          };

          // Em uma implementação real, chamaríamos um serviço de notificação
          // await notificacaoService.enviarNotificacao(notificacaoData);
        }
      } catch (notifError) {
        // Registra erro mas não interrompe o fluxo principal
        console.error('Erro ao enviar notificação de falha no estorno:', notifError);
      }
    }
    pagamento.historicoStatus.push(novoStatus);
    const pagamentoAtualizado = await pagamento.save();

    res.status(200).json({ message: `Resultado do estorno: ${resultadoEstorno.message}`, pagamento: pagamentoAtualizado });

  } catch (error) {
    console.error('Erro ao processar estorno:', error);

    // Tenta registrar o erro no histórico do pagamento
    if (pagamento) {
      try {
        // Determina uma mensagem de erro amigável para o usuário
        let mensagemErro = 'Erro interno ao processar estorno.';

        if (error instanceof Error) {
          // Registra o erro original para debug, mas apresenta uma mensagem mais amigável
          console.error('Detalhes do erro:', error.message);

          // Personaliza mensagens para erros conhecidos
          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            mensagemErro = 'Tempo limite excedido ao comunicar com o serviço de pagamento. Tente novamente mais tarde.';
          } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
            mensagemErro = 'Erro de conexão com o serviço de pagamento. Verifique sua conexão e tente novamente.';
          } else if (error.message.includes('validation')) {
            mensagemErro = 'Dados de estorno inválidos. Verifique as informações e tente novamente.';
          }
        }

        // Adiciona o status de erro ao histórico
        pagamento.historicoStatus.push({
          status: PagamentoStatusEnum.ERRO,
          timestamp: new Date(),
          motivo: mensagemErro,
          metadata: { 
            operacao: 'estorno',
            errorDetails: error instanceof Error ? error.message : 'Erro desconhecido',
            errorStack: error instanceof Error && process.env.NODE_ENV !== 'production' ? error.stack : undefined
          } as any
        } as IHistoricoStatusPagamentoInput);

        await pagamento.save();

        // Retorna uma resposta de erro mais informativa para o cliente
        res.status(500).json({ 
          message: mensagemErro,
          pagamentoId: pagamento._id,
          status: PagamentoStatusEnum.ERRO
        });

      } catch (saveError) {
        console.error("Erro ao salvar status de erro no pagamento:", saveError);
        // Se não conseguir salvar o erro no pagamento, retorna um erro genérico
        res.status(500).json({ message: 'Erro ao processar estorno e ao registrar o erro.' });
      }
    } else {
      // Se o pagamento não foi encontrado, retorna um erro genérico
      res.status(500).json({ message: 'Erro ao processar o estorno do pagamento.' });
    }

    // Não chama next(error) pois já respondemos ao cliente
  }
};

// --- Funções Adicionais ---

/**
 * Lista os pagamentos do usuário autenticado com opções de filtro e paginação.
 * 
 * Este endpoint realiza as seguintes operações:
 * 1. Verifica a autenticação do usuário
 * 2. Busca contratações onde o usuário é o comprador
 * 3. Filtra pagamentos associados a essas contratações
 * 4. Aplica filtros adicionais (status, data, método)
 * 5. Implementa paginação e ordenação dos resultados
 * 
 * @param {Request} req - Objeto de requisição Express contendo:
 *   - req.user - Dados do usuário autenticado
 *   - req.query - Parâmetros de consulta para filtros, paginação e ordenação:
 *     - status - Filtro por status do pagamento (opcional)
 *     - dataInicio - Filtro por data inicial (opcional)
 *     - dataFim - Filtro por data final (opcional)
 *     - metodo - Filtro por método de pagamento (opcional)
 *     - page - Número da página (padrão: 1)
 *     - limit - Itens por página (padrão: 10)
 *     - sort - Campo para ordenação (padrão: 'createdAt')
 *     - order - Direção da ordenação ('asc' ou 'desc', padrão: 'desc')
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função next do Express para tratamento de erros
 * 
 * @returns {Promise<void>} - Retorna void, mas envia resposta JSON com:
 *   - pagamentos - Array de pagamentos
 *   - total - Total de pagamentos encontrados
 *   - page - Página atual
 *   - totalPages - Total de páginas
 * 
 * @requires Autenticação - Usuário deve estar autenticado
 */
export const listarMeusPagamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  try {
    // Extrai parâmetros de consulta para filtros, paginação e ordenação
    const { 
      status, 
      dataInicio, 
      dataFim, 
      metodo,
      page = 1, 
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Constrói o objeto de consulta
    const query: any = {};

    // Busca contratações onde o usuário é o comprador
    const contratacoes = await Contratacao.find({ buyerId: userId }, '_id');
    const contratacaoIds = contratacoes.map(c => c._id);

    // Filtra por contratações do usuário
    if (contratacaoIds.length === 0) {
      // Se o usuário não tem contratações, retorna lista vazia
      res.status(200).json({ 
        pagamentos: [],
        total: 0,
        page: parseInt(page as string),
        totalPages: 0
      });
      return;
    }

    query.contratacaoId = { $in: contratacaoIds };

    // Aplica filtros adicionais se fornecidos
    if (status && Object.values(PagamentoStatusEnum).includes(status as PagamentoStatusEnum)) {
      // Filtra por status atual (último status no histórico)
      query['historicoStatus.status'] = status;
    }

    if (metodo && Object.values(PagamentoMetodoEnum).includes(metodo as PagamentoMetodoEnum)) {
      query.metodo = metodo;
    }

    // Filtro por período de criação
    if (dataInicio || dataFim) {
      query.createdAt = {};

      if (dataInicio) {
        query.createdAt.$gte = new Date(dataInicio as string);
      }

      if (dataFim) {
        query.createdAt.$lte = new Date(dataFim as string);
      }
    }

    // Calcula paginação
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Determina ordenação
    const sortField = (sort as string) || 'createdAt';
    const sortOrder = (order as string) === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortField] = sortOrder;

    // Executa a consulta com paginação e ordenação
    const [pagamentos, total] = await Promise.all([
      Pagamento.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .populate('contratacaoId', 'valorTotal status dataInicioServico dataFimServico'),

      Pagamento.countDocuments(query)
    ]);

    // Calcula o total de páginas
    const totalPages = Math.ceil(total / pageSize);

    // Retorna os resultados
    res.status(200).json({
      pagamentos,
      total,
      page: pageNumber,
      totalPages
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém os detalhes de um pagamento específico.
 * 
 * Este endpoint realiza as seguintes operações:
 * 1. Verifica a autenticação do usuário
 * 2. Valida o ID do pagamento
 * 3. Busca o pagamento com detalhes da contratação
 * 4. Verifica permissões de acesso (comprador, prestador ou admin)
 * 5. Retorna os detalhes do pagamento
 * 
 * @param {Request} req - Objeto de requisição Express contendo:
 *   - req.user - Dados do usuário autenticado
 *   - req.params.pagamentoId - ID do pagamento a ser consultado
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função next do Express para tratamento de erros
 * 
 * @returns {Promise<void>} - Retorna void, mas envia resposta JSON com:
 *   - Em caso de sucesso: status 200 com detalhes do pagamento
 *   - Em caso de erro: status apropriado (400, 401, 403, 404, 500) com mensagem
 * 
 * @requires Autenticação - Usuário deve estar autenticado
 * @requires Autorização - Usuário deve ser o comprador, o prestador da contratação ou um administrador
 */
export const obterDetalhesPagamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }

  const userId = req.user.userId;
  const isAdmin = req.user.isAdmin;
  const { pagamentoId } = req.params;

  // Valida o ID do pagamento
  if (!pagamentoId || !mongoose.Types.ObjectId.isValid(pagamentoId)) {
    res.status(400).json({ message: 'ID do pagamento inválido ou ausente.' });
    return;
  }

  try {
    // Busca o pagamento com detalhes da contratação
    const pagamento = await Pagamento.findById(pagamentoId)
      .populate({
        path: 'contratacaoId',
        select: 'buyerId prestadorId valorTotal status dataInicioServico dataFimServico'
      });

    if (!pagamento) {
      res.status(404).json({ message: 'Pagamento não encontrado.' });
      return;
    }

    // Verifica permissões de acesso
    const contratacao = pagamento.contratacaoId as HydratedDocument<IContratacao>;
    const isBuyer = contratacao?.buyerId.toString() === userId;
    const isPrestador = contratacao?.prestadorId.toString() === userId;

    // Apenas o comprador, o prestador ou um administrador podem visualizar os detalhes
    if (!isBuyer && !isPrestador && !isAdmin) {
      res.status(403).json({ 
        message: 'Acesso proibido: Você não tem permissão para visualizar este pagamento.' 
      });
      return;
    }

    // Retorna os detalhes do pagamento
    res.status(200).json({ pagamento });

  } catch (error) {
    next(error);
  }
};

/**
 * Processa notificações (webhooks) recebidas do serviço de pagamento.
 * 
 * Este endpoint realiza as seguintes operações:
 * 1. Responde imediatamente com status 200 para evitar reenvios
 * 2. Valida a autenticidade da requisição (assinatura, origem)
 * 3. Analisa o tipo de evento recebido (aprovação, recusa, estorno, chargeback)
 * 4. Localiza o pagamento correspondente no banco de dados
 * 5. Atualiza o histórico de status do pagamento
 * 6. Atualiza o status da contratação quando necessário
 * 
 * @param {Request} req - Objeto de requisição Express contendo:
 *   - req.headers['x-webhook-signature'] - Assinatura para validação
 *   - req.body.event - Tipo de evento (payment.approved, payment.rejected, etc.)
 *   - req.body.data - Dados do evento (transacaoId, pagamentoIdInterno, etc.)
 * @param {Response} res - Objeto de resposta Express
 * @param {NextFunction} next - Função next do Express (não utilizada neste caso)
 * 
 * @returns {Promise<void>} - Retorna void e sempre responde com status 200
 * 
 * @security Este endpoint deve ser protegido por validação de assinatura e/ou IP
 * @note Erros são tratados internamente e não propagados, pois a resposta já foi enviada
 */
export const handleWebhookFintech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Importante responder rapidamente com status 200 para o serviço de pagamento
  // Isso evita que o serviço de pagamento tente reenviar a notificação
  res.status(200).send('Webhook recebido.');

  try {
    console.log("Webhook Recebido:", req.body);

    // 1. Validar a autenticidade da requisição
    // Em produção, verificar assinatura, IP de origem, etc.
    const webhookSecret = process.env.FINTECH_WEBHOOK_SECRET || 'webhook_secret_default';
    const receivedSignature = req.headers['x-webhook-signature'];

    // Simulação de verificação de assinatura
    // Em produção, implementar verificação real baseada na documentação do serviço de pagamento
    if (!receivedSignature) {
      console.error('Webhook rejeitado: Assinatura ausente');
      return; // Não processa o webhook, mas retorna 200 para evitar reenvios
    }

    // 2. Analisar o corpo da requisição para identificar o tipo de evento
    const { event, data } = req.body;

    if (!event || !data) {
      console.error('Webhook rejeitado: Formato inválido');
      return;
    }

    // 3. Extrair o identificador da transação ou do pagamento interno
    const { transacaoId, pagamentoIdInterno } = data;

    if (!transacaoId && !pagamentoIdInterno) {
      console.error('Webhook rejeitado: Identificadores ausentes');
      return;
    }

    // 4. Localizar o registro de pagamento correspondente no banco de dados
    let pagamento;

    if (transacaoId) {
      pagamento = await Pagamento.findOne({ transacaoId });
    } else if (pagamentoIdInterno && mongoose.Types.ObjectId.isValid(pagamentoIdInterno)) {
      pagamento = await Pagamento.findById(pagamentoIdInterno);
    }

    if (!pagamento) {
      console.error(`Webhook rejeitado: Pagamento não encontrado para transação ${transacaoId || pagamentoIdInterno}`);
      return;
    }

    // 5. Adicionar novo status ao histórico baseado no evento recebido
    let novoStatus: IHistoricoStatusPagamentoInput | null = null;

    switch (event) {
      case 'payment.approved':
        novoStatus = {
          status: PagamentoStatusEnum.APROVADO,
          timestamp: new Date(),
          motivo: data.message || 'Pagamento aprovado via webhook',
          metadata: { webhookData: data } as any
        };
        pagamento.transacaoId = transacaoId || pagamento.transacaoId;
        break;

      case 'payment.rejected':
        novoStatus = {
          status: PagamentoStatusEnum.RECUSADO,
          timestamp: new Date(),
          motivo: data.message || 'Pagamento recusado via webhook',
          metadata: { webhookData: data, errorCode: data.errorCode } as any
        };
        break;

      case 'payment.refunded':
        novoStatus = {
          status: PagamentoStatusEnum.REEMBOLSADO,
          timestamp: new Date(),
          motivo: data.message || 'Pagamento reembolsado via webhook',
          metadata: { webhookData: data } as any
        };
        break;

      case 'payment.chargeback':
        novoStatus = {
          status: PagamentoStatusEnum.CHARGEBACK,
          timestamp: new Date(),
          motivo: data.message || 'Chargeback recebido via webhook',
          metadata: { webhookData: data } as any
        };
        break;

      default:
        console.log(`Evento de webhook não processado: ${event}`);
        return;
    }

    if (novoStatus) {
      // 6. Salvar as atualizações no registro de pagamento
      pagamento.historicoStatus.push(novoStatus);
      await pagamento.save();
      console.log(`Pagamento ${pagamento._id} atualizado com status ${novoStatus.status} via webhook`);

      // 7. Executar ações adicionais quando necessário
      // Atualizar contratação se necessário
      if (novoStatus.status === PagamentoStatusEnum.APROVADO) {
        try {
          const contratacao = await Contratacao.findById(pagamento.contratacaoId);
          if (contratacao && contratacao.status !== ContratacaoStatusEnum.EM_ANDAMENTO) {
            contratacao.status = ContratacaoStatusEnum.EM_ANDAMENTO;
            if (!contratacao.dataInicioServico) {
              contratacao.dataInicioServico = new Date();
            }
            await contratacao.save();
            console.log(`Contratação ${contratacao._id} atualizada para EM_ANDAMENTO via webhook`);
          }
        } catch (error) {
          console.error('Erro ao atualizar contratação via webhook:', error);
        }
      } else if (novoStatus.status === PagamentoStatusEnum.REEMBOLSADO || novoStatus.status === PagamentoStatusEnum.CHARGEBACK) {
        try {
          const contratacao = await Contratacao.findById(pagamento.contratacaoId);
          if (contratacao && ![ContratacaoStatusEnum.CANCELADO_BUYER, ContratacaoStatusEnum.CANCELADO_PRESTADOR].includes(contratacao.status)) {
            // Por padrão, considera cancelamento pelo sistema
            contratacao.status = ContratacaoStatusEnum.CANCELADO_BUYER;
            await contratacao.save();
            console.log(`Contratação ${contratacao._id} cancelada via webhook`);
          }
        } catch (error) {
          console.error('Erro ao cancelar contratação via webhook:', error);
        }
      }

      // Enviar notificações sobre a atualização do pagamento
      try {
        // Aqui seria implementada a integração com um serviço de notificações
        console.log(`Notificação: Pagamento ${pagamento._id} atualizado para ${novoStatus.status} via webhook`);

        // Obtém os dados da contratação para a notificação
        const contratacao = await Contratacao.findById(pagamento.contratacaoId);

        if (contratacao) {
          // Determina o tipo de notificação com base no status
          let tipoNotificacao;
          switch (novoStatus.status) {
            case PagamentoStatusEnum.APROVADO:
              tipoNotificacao = 'pagamento_aprovado_webhook';
              break;
            case PagamentoStatusEnum.RECUSADO:
              tipoNotificacao = 'pagamento_recusado_webhook';
              break;
            case PagamentoStatusEnum.REEMBOLSADO:
              tipoNotificacao = 'pagamento_estornado_webhook';
              break;
            case PagamentoStatusEnum.CHARGEBACK:
              tipoNotificacao = 'pagamento_chargeback_webhook';
              break;
            default:
              tipoNotificacao = 'pagamento_atualizado_webhook';
          }

          // Exemplo de estrutura de dados para notificação
          const notificacaoData = {
            tipo: tipoNotificacao,
            pagamentoId: pagamento._id,
            contratacaoId: pagamento.contratacaoId,
            buyerId: contratacao.buyerId,
            prestadorId: contratacao.prestadorId,
            valor: pagamento.valor,
            dataAtualizacao: new Date(),
            status: novoStatus.status,
            motivo: novoStatus.motivo,
            evento: event,
            // Outros dados relevantes
          };

          // Em uma implementação real, chamaríamos um serviço de notificação
          // await notificacaoService.enviarNotificacao(notificacaoData);
        }
      } catch (notifError) {
        // Registra erro mas não interrompe o fluxo principal
        console.error('Erro ao enviar notificação de atualização via webhook:', notifError);
      }
    }

  } catch (error) {
    // Captura erros mas não os propaga, pois a resposta já foi enviada
    console.error('Erro ao processar webhook:', error);
  }
};

// Exporta todas as funções do controlador
// (Alternativa: export default { processarPagamento, ... })
