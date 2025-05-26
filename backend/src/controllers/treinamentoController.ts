// src/controllers/treinamentoController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Treinamento, { ITreinamento, TreinamentoStatusEnum, TreinamentoFormatoEnum } from '../models/Treinamento'; // Importa o modelo e as interfaces/enums de Treinamento
import { TipoUsuarioEnum } from '../models/User'; // Importa o enum de tipos de usuário

// Interface que define a estrutura de dados para criação ou atualização de treinamentos
interface TreinamentoPayload {
  titulo: string;
  descricao: string;
  formato: TreinamentoFormatoEnum;
  conteudoUrl: string;
  dataHora?: string | Date;
  preco?: number;
  // Status não deve vir do cliente na criação/update geral
  // Campos adicionais podem ser incluídos aqui
}


// --- Funções do Controller para Anunciantes ---

/**
 * Cria um novo treinamento com status 'rascunho'.
 * Requer que o usuário seja um Anunciante.
 */
export const createTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado e é um anunciante
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido: Apenas anunciantes podem criar treinamentos.' });
    return;
  }

  // Extrai os dados do corpo da requisição
  const {
    titulo,
    descricao,
    formato,
    conteudoUrl,
    dataHora,
    preco
  } = req.body as TreinamentoPayload;

  try {
    // Realiza validações básicas dos campos obrigatórios
    if (!titulo || !descricao || !formato || !conteudoUrl) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes: titulo, descricao, formato, conteudoUrl.' });
      return;
    }

    // Verifica se o formato é válido
    if (!Object.values(TreinamentoFormatoEnum).includes(formato)) {
      res.status(400).json({ message: `Formato inválido: ${formato}`});
      return;
    }

    // Valida o preço, se fornecido
    if (preco !== undefined && (typeof preco !== 'number' || preco < 0)) {
      res.status(400).json({ message: 'Preço inválido.' });
      return;
    }
    // TODO: Validar URL, dataHora (se formato for webinar)

    // Cria um novo objeto de treinamento
    const novoTreinamento = new Treinamento({
      anuncianteId: req.user.userId,
      titulo,
      descricao,
      formato,
      conteudoUrl,
      dataHora: dataHora ? new Date(dataHora) : undefined,
      preco: preco ?? 0, // Usa operador de coalescência nula para permitir valor 0 explícito
      status: TreinamentoStatusEnum.RASCUNHO // Inicia sempre como rascunho
    });

    // Salva o treinamento no banco de dados
    const treinamentoSalvo = await novoTreinamento.save();
    res.status(201).json({ message: 'Treinamento criado como rascunho.', treinamento: treinamentoSalvo });

  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Atualiza um treinamento existente (enquanto em 'rascunho' ou 'rejeitado').
 * Requer que o usuário seja o anunciante proprietário do treinamento.
 */
export const updateTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado e é um anunciante
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.' });
    return;
  }

  // Extrai o ID do treinamento dos parâmetros da requisição
  const { treinamentoId } = req.params;
  const anuncianteId = req.user.userId;
  const receivedUpdates = req.body as Partial<TreinamentoPayload>;

  // Valida se o ID do treinamento é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(treinamentoId)) {
    res.status(400).json({ message: 'ID do treinamento inválido.' });
    return;
  }

  // Prepara objeto com campos permitidos para atualização
  const allowedUpdates: Partial<ITreinamento> = {};
  const updatableFields: (keyof TreinamentoPayload)[] = [
    'titulo', 'descricao', 'formato', 'conteudoUrl', 'dataHora', 'preco'
    // Não permite mudar status diretamente aqui
  ];

  // Filtra e processa apenas os campos permitidos que foram enviados na requisição
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      // Tratamento especial para o campo dataHora, convertendo para objeto Date
      if (field === 'dataHora' && receivedUpdates[field]) {
        (allowedUpdates as any)[field] = new Date(receivedUpdates[field] as string);
      } 
      // Tratamento especial para o campo preço, validando se é um número positivo
      else if (field === 'preco') {
        if (typeof receivedUpdates[field] === 'number' && (receivedUpdates[field] as number) >= 0) {
          (allowedUpdates as any)[field] = receivedUpdates[field];
        } // Ignora preço inválido
      } 
      // Para os demais campos, aceita o valor como está
      else {
        (allowedUpdates as any)[field] = receivedUpdates[field];
      }
    }
  });

  // Verifica se há campos válidos para atualização
  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }
  // TODO: Validar os dados em allowedUpdates (formato, enum, etc.)

  try {
    // Busca e atualiza o treinamento, verificando se o usuário é o proprietário e se o status permite edição
    const treinamentoAtualizado = await Treinamento.findOneAndUpdate(
      {
        _id: treinamentoId,
        anuncianteId: anuncianteId,
        status: { $in: [TreinamentoStatusEnum.RASCUNHO, TreinamentoStatusEnum.REJEITADO] } // Permite editar apenas se estiver em rascunho ou rejeitado
      },
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' }
    );

    // Verifica se o treinamento foi encontrado e atualizado
    if (!treinamentoAtualizado) {
      res.status(404).json({ message: 'Treinamento não encontrado, não pertence a você, ou não pode ser editado no status atual.' });
      return;
    }

    // Retorna o treinamento atualizado
    res.status(200).json({ message: 'Treinamento atualizado com sucesso.', treinamento: treinamentoAtualizado });

  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};

// --- Funções ainda não implementadas completamente ---

/**
 * Permite ao anunciante listar todos os seus treinamentos, independente do status.
 */
export const listarMeusTreinamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado e é um anunciante
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }
  // TODO: Implementar busca por treinamentos com anuncianteId = req.user.userId
  // Adicionar filtros (req.query), paginação, ordenação.
  res.status(501).json({ message: 'Endpoint listarMeusTreinamentos não implementado.'});
};

/**
 * Permite ao anunciante ou administrador excluir um treinamento.
 */
export const deleteTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }

  // Extrai o ID do treinamento dos parâmetros da requisição
  const { treinamentoId } = req.params;

  // TODO: Implementar lógica de deleção, verificando se req.user é dono ou Admin.
  // Considerar o que fazer com InscricoesTreinamento existentes (soft delete?).
  res.status(501).json({ message: 'Endpoint deleteTreinamento não implementado.'});
};

/**
 * Permite ao anunciante submeter um treinamento para revisão ou publicá-lo diretamente.
 */
export const submeterOuPublicarTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado e é um anunciante
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ANUNCIANTE) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }

  // Extrai o ID do treinamento dos parâmetros da requisição
  const { treinamentoId } = req.params;

  // TODO: Implementar lógica:
  // 1. Buscar treinamento pelo ID e verificar se pertence ao usuário e se está em RASCUNHO ou REJEITADO.
  // 2. Se houver fluxo de revisão: Mudar status para PENDENTE_REVISAO.
  // 3. Se NÃO houver fluxo de revisão: Mudar status para PUBLICADO.
  // 4. Salvar e retornar.
  res.status(501).json({ message: 'Endpoint submeterOuPublicarTreinamento não implementado.'});
};


// --- Funções do Controller para Público ---

/**
 * Lista todos os treinamentos com status 'publicado' que estão disponíveis para o público.
 * Aceita filtros, paginação e ordenação através dos parâmetros da requisição.
 */
export const getPublicTreinamentos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Busca treinamentos com status PUBLICADO
    // TODO: Implementar filtros adicionais (categoria, formato), paginação e ordenação customizada
    // TODO: Selecionar apenas campos públicos e popular dados do anunciante (nome/foto)
    const treinamentos = await Treinamento.find({ status: TreinamentoStatusEnum.PUBLICADO })
      .sort({ createdAt: -1 }) // Ordena do mais recente para o mais antigo
      .limit(20); // Limita a 20 resultados por página

    // Retorna a lista de treinamentos encontrados
    res.status(200).json({ treinamentos });
  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};

/**
 * Obtém os detalhes completos de um treinamento específico que esteja publicado.
 * Acessível para qualquer usuário, mesmo sem autenticação.
 */
export const getPublicTreinamentoById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrai o ID do treinamento dos parâmetros da requisição
  const { treinamentoId } = req.params;

  // Valida se o ID do treinamento é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(treinamentoId)) {
    res.status(400).json({ message: 'ID do treinamento inválido.' });
    return;
  }

  try {
    // Busca o treinamento pelo ID, garantindo que esteja publicado
    const treinamento = await Treinamento.findOne({
      _id: treinamentoId,
      status: TreinamentoStatusEnum.PUBLICADO // Garante que só retorne treinamentos publicados
    }).populate('anuncianteId', 'nome foto'); // Inclui dados básicos do anunciante (nome e foto)

    // Verifica se o treinamento foi encontrado
    if (!treinamento) {
      res.status(404).json({ message: 'Treinamento não encontrado ou não está publicado.' });
      return;
    }

    // Retorna os detalhes do treinamento
    res.status(200).json(treinamento);
  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};


// --- Funções do Controller para Administradores (Para moderação de conteúdo) ---

/**
 * Lista todos os treinamentos que estão aguardando revisão por um administrador.
 * Acesso restrito apenas para usuários com perfil de administrador.
 */
export const listarTreinamentosPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar verificação de permissão de administrador
  // TODO: Implementar busca por treinamentos com status PENDENTE_REVISAO
  // TODO: Adicionar paginação e ordenação
  res.status(501).json({ message: 'Endpoint listarTreinamentosPendentes não implementado.' });
};

/**
 * Permite que um administrador revise um treinamento pendente, aprovando-o ou rejeitando-o.
 * Em caso de rejeição, deve incluir o motivo para orientar o anunciante.
 */
export const revisarTreinamento = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // TODO: Implementar verificação de permissão de administrador
  // TODO: Implementar lógica para aprovar (mudar status para PUBLICADO) ou rejeitar (mudar status para REJEITADO)
  // TODO: Em caso de rejeição, registrar o motivo da rejeição para feedback ao anunciante
  res.status(501).json({ message: 'Endpoint revisarTreinamento não implementado.' });
};

// Exporta todas as funções do controlador
