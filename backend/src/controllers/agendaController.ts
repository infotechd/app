// src/controllers/agendaController.ts

import { Request, Response } from 'express';

// Interface que define a estrutura de um compromisso na agenda
interface Compromisso {
  _id: string;                // Identificador único do compromisso
  contratacaoId: string;      // Referência à contratação relacionada
  compradorId: string;        // Identificador do comprador/cliente
  data: string;               // Data e hora do compromisso
  status: string;             // Status atual do compromisso (pendente, confirmado, etc.)
  observacoes?: string;       // Campo opcional para observações adicionais
}

// Interface que define a estrutura completa da agenda de um prestador
interface Agenda {
  _id: string;                // Identificador único da agenda
  prestadorId: string;        // Identificador do prestador de serviço
  compromissos: Compromisso[]; // Lista de compromissos agendados
}

/**
 * Busca e retorna a agenda do prestador autenticado
 * @param req - Objeto de requisição Express
 * @param res - Objeto de resposta Express
 */
export const getAgenda = async (req: Request, res: Response): Promise<void> => {
  try {
    // Função que busca a agenda do prestador no banco de dados
    // Atualmente implementada com dados simulados para demonstração

    // Extrai o ID do prestador a partir do token de autenticação
    const prestadorId = (req as any).user?.userId;

    // Verifica se o ID do prestador está presente
    if (!prestadorId) {
      res.status(401).json({ message: 'Usuário não autenticado ou ID não encontrado' });
      return;
    }

    // Cria um objeto de agenda com dados simulados para demonstração
    const agenda: Agenda = {
      _id: 'agenda-' + prestadorId,
      prestadorId,
      compromissos: [
        {
          _id: 'compromisso-1',
          contratacaoId: 'contratacao-1',
          compradorId: 'comprador-1',
          data: new Date().toISOString(),
          status: 'pendente',
          observacoes: 'Primeiro compromisso simulado'
        },
        {
          _id: 'compromisso-2',
          contratacaoId: 'contratacao-2',
          compradorId: 'comprador-2',
          data: new Date(Date.now() + 86400000).toISOString(), // Data do dia seguinte
          status: 'confirmado',
          observacoes: 'Segundo compromisso simulado'
        }
      ]
    };

    // Retorna a agenda encontrada com status 200 (sucesso)
    res.status(200).json({ agenda });
  } catch (error) {
    // Registra e trata erros que possam ocorrer durante o processamento
    console.error('Erro ao buscar agenda:', error);
    res.status(500).json({ message: 'Erro ao buscar agenda' });
  }
};

/**
 * Atualiza o status de um compromisso específico na agenda do prestador
 * @param req - Objeto de requisição Express
 * @param res - Objeto de resposta Express
 */
export const updateCompromissoStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extrai os parâmetros da requisição
    const { agendaId, compromissoId } = req.params;
    const { status } = req.body;

    // Realiza validação do campo status
    if (!status) {
      res.status(400).json({ message: 'Status é obrigatório' });
      return;
    }

    // Função que atualiza o status do compromisso no banco de dados
    // Atualmente implementada com dados simulados para demonstração

    // Extrai o ID do prestador a partir do token de autenticação
    const prestadorId = (req as any).user?.userId;

    // Verifica se o ID do prestador está presente
    if (!prestadorId) {
      res.status(401).json({ message: 'Usuário não autenticado ou ID não encontrado' });
      return;
    }

    // Verifica se o prestador tem permissão para acessar esta agenda
    if (agendaId !== 'agenda-' + prestadorId) {
      res.status(403).json({ message: 'Acesso negado: esta agenda não pertence ao usuário' });
      return;
    }

    // Cria um objeto de agenda com o status do compromisso atualizado
    const agenda: Agenda = {
      _id: agendaId,
      prestadorId,
      compromissos: [
        {
          _id: 'compromisso-1',
          contratacaoId: 'contratacao-1',
          compradorId: 'comprador-1',
          data: new Date().toISOString(),
          status: compromissoId === 'compromisso-1' ? status : 'pendente',
          observacoes: 'Primeiro compromisso simulado'
        },
        {
          _id: 'compromisso-2',
          contratacaoId: 'contratacao-2',
          compradorId: 'comprador-2',
          data: new Date(Date.now() + 86400000).toISOString(), // Data do dia seguinte
          status: compromissoId === 'compromisso-2' ? status : 'confirmado',
          observacoes: 'Segundo compromisso simulado'
        }
      ]
    };

    // Retorna a agenda atualizada e uma mensagem de sucesso
    res.status(200).json({ 
      agenda,
      message: `Status do compromisso atualizado com sucesso para ${status}`
    });
  } catch (error) {
    // Registra e trata erros que possam ocorrer durante o processamento
    console.error('Erro ao atualizar status do compromisso:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do compromisso' });
  }
};
