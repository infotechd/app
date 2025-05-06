// src/controllers/agendaController.ts

import { Request, Response } from 'express';

// Tipos para tipagem do TypeScript
interface Compromisso {
  _id: string;
  contratacaoId: string;
  compradorId: string;
  data: string;
  status: string;
  observacoes?: string;
}

interface Agenda {
  _id: string;
  prestadorId: string;
  compromissos: Compromisso[];
}

/**
 * Busca a agenda do prestador autenticado
 * @param req - Objeto de requisição Express
 * @param res - Objeto de resposta Express
 */
export const getAgenda = async (req: Request, res: Response): Promise<void> => {
  try {
    // Aqui você implementaria a lógica para buscar a agenda do banco de dados
    // Por enquanto, retornamos dados simulados
    
    // Obtém o ID do usuário do token (assumindo que req.user.userId existe)
    const prestadorId = (req as any).user?.userId;
    
    if (!prestadorId) {
      res.status(401).json({ message: 'Usuário não autenticado ou ID não encontrado' });
      return;
    }
    
    // Cria uma agenda simulada
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
          data: new Date(Date.now() + 86400000).toISOString(), // Amanhã
          status: 'confirmado',
          observacoes: 'Segundo compromisso simulado'
        }
      ]
    };
    
    res.status(200).json({ agenda });
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    res.status(500).json({ message: 'Erro ao buscar agenda' });
  }
};

/**
 * Atualiza o status de um compromisso específico
 * @param req - Objeto de requisição Express
 * @param res - Objeto de resposta Express
 */
export const updateCompromissoStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agendaId, compromissoId } = req.params;
    const { status } = req.body;
    
    // Validação básica
    if (!status) {
      res.status(400).json({ message: 'Status é obrigatório' });
      return;
    }
    
    // Aqui você implementaria a lógica para atualizar o status no banco de dados
    // Por enquanto, retornamos dados simulados
    
    // Obtém o ID do usuário do token (assumindo que req.user.userId existe)
    const prestadorId = (req as any).user?.userId;
    
    if (!prestadorId) {
      res.status(401).json({ message: 'Usuário não autenticado ou ID não encontrado' });
      return;
    }
    
    // Verifica se a agenda pertence ao prestador (simulado)
    if (agendaId !== 'agenda-' + prestadorId) {
      res.status(403).json({ message: 'Acesso negado: esta agenda não pertence ao usuário' });
      return;
    }
    
    // Cria uma agenda simulada com o status atualizado
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
          data: new Date(Date.now() + 86400000).toISOString(), // Amanhã
          status: compromissoId === 'compromisso-2' ? status : 'confirmado',
          observacoes: 'Segundo compromisso simulado'
        }
      ]
    };
    
    res.status(200).json({ 
      agenda,
      message: `Status do compromisso atualizado com sucesso para ${status}`
    });
  } catch (error) {
    console.error('Erro ao atualizar status do compromisso:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do compromisso' });
  }
};