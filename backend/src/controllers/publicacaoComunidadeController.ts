// src/controllers/publicacaoComunidadeController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum, PublicacaoTipoEnum } from '../models/PublicacaoComunidade';
import Comentario from '../models/Comentario'; // Importação para deletar comentários associados
import Curtida from '../models/Curtida'; // Importação para deletar curtidas associadas
import { TipoUsuarioEnum } from '../models/User';

// Interface que define a estrutura de dados para criação e atualização de publicações
interface PublicacaoPayload {
  conteudo: string;
  tipo?: PublicacaoTipoEnum;
  imagens?: string[];
  dataEvento?: string | Date;
  localEvento?: string;
}

// --- Funções do Controlador de Publicações da Comunidade ---

/**
 * Cria uma nova publicação na comunidade (post ou evento).
 * Define o status inicial conforme a política de moderação (PENDENTE_APROVACAO ou APROVADO).
 * Valida os dados recebidos e retorna erro caso estejam incompletos.
 */
export const createPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.' }); return; }

  // TODO: Implementar validação completa do req.body usando bibliotecas como Joi ou express-validator
  const {
    conteudo,
    tipo = PublicacaoTipoEnum.POST, // Define POST como valor padrão se não for especificado
    imagens,
    dataEvento,
    localEvento
  } = req.body as PublicacaoPayload;

  try {
    // Realiza validação básica dos dados recebidos
    if (!conteudo) {
      res.status(400).json({ message: 'Conteúdo é obrigatório.' }); return;
    }
    if (tipo === PublicacaoTipoEnum.EVENTO && (!dataEvento || !localEvento)) {
      res.status(400).json({ message: 'Data e local são obrigatórios para eventos.' }); return;
    }
    // TODO: Implementar validação do formato da data do evento

    // Cria o objeto de nova publicação com os dados recebidos
    const novaPublicacao = new PublicacaoComunidade({
      autorId: req.user.userId,
      conteudo,
      tipo,
      imagens: imagens || [],
      dataEvento: dataEvento ? new Date(dataEvento) : undefined,
      localEvento,
      status: PublicacaoStatusEnum.PENDENTE_APROVACAO, // Define status inicial como pendente de aprovação
      contagemLikes: 0, // Inicializa contador de curtidas
      contagemComentarios: 0 // Inicializa contador de comentários
    });

    // Salva a publicação no banco de dados
    const publicacaoSalva = await novaPublicacao.save();

    // TODO: Implementar sistema de notificação para administradores quando uma publicação estiver pendente de aprovação

    // Retorna resposta de sucesso com a publicação criada
    res.status(201).json({ message: 'Publicação criada com sucesso.', publicacao: publicacaoSalva });

  } catch (error) {
    next(error);
  }
};

/**
 * Lista todas as publicações aprovadas para exibição no feed principal da comunidade.
 * Implementa sistema de paginação para controlar a quantidade de itens retornados.
 * Retorna dados das publicações junto com informações básicas dos autores.
 */
export const getPublicacoesAprovadas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extrai e processa parâmetros de paginação da requisição
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Define filtro para buscar apenas publicações aprovadas
    const query: mongoose.FilterQuery<IPublicacaoComunidade> = { status: PublicacaoStatusEnum.APROVADO };
    // TODO: Implementar filtros adicionais por tipo de publicação (post/evento), data de criação, etc.

    // Executa consultas em paralelo para obter publicações e contagem total
    const [publicacoes, total] = await Promise.all([
      PublicacaoComunidade.find(query)
        .populate('autorId', 'nome foto') // Inclui dados básicos do autor (nome e foto)
        .sort({ createdAt: -1 }) // Ordena pelas publicações mais recentes primeiro
        .skip(skip) // Aplica deslocamento para paginação
        .limit(limit), // Limita quantidade de resultados
      PublicacaoComunidade.countDocuments(query) // Conta total de publicações que atendem ao filtro
    ]);

    // Retorna dados paginados com metadados de paginação
    res.status(200).json({
      publicacoes, // Lista de publicações da página atual
      totalPages: Math.ceil(total / limit), // Calcula número total de páginas
      currentPage: page, // Página atual
      totalPublicacoes: total // Total de publicações encontradas
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtém os detalhes completos de uma publicação específica que esteja aprovada.
 * Verifica se o ID é válido e se a publicação existe e está aprovada.
 * Retorna os dados da publicação incluindo informações básicas do autor.
 */
export const getPublicacaoAprovadaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extrai o ID da publicação dos parâmetros da requisição
  const { publicacaoId } = req.params;

  // Valida se o ID fornecido é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  try {
    // Busca a publicação pelo ID e verifica se está aprovada
    const publicacao = await PublicacaoComunidade.findOne({
      _id: publicacaoId,
      status: PublicacaoStatusEnum.APROVADO
    }).populate('autorId', 'nome foto'); // Inclui dados básicos do autor (nome e foto)

    // Verifica se a publicação foi encontrada
    if (!publicacao) {
      res.status(404).json({ message: 'Publicação não encontrada ou não está aprovada.' }); return;
    }

    // TODO: Implementar sistema para registrar visualizações da publicação

    // Retorna os dados da publicação
    res.status(200).json(publicacao);
  } catch (error) {
    next(error);
  }
};


/**
 * Permite que o autor edite sua própria publicação.
 * Só permite edição se a publicação estiver com status RASCUNHO ou REJEITADO.
 * Valida os campos que podem ser atualizados e rejeita atualizações de campos não permitidos.
 */
export const updateMinhaPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }

  // Extrai parâmetros e dados da requisição
  const { publicacaoId } = req.params;
  const autorId = req.user.userId;
  // TODO: Implementar validação completa dos dados recebidos no corpo da requisição
  const updates = req.body as Partial<PublicacaoPayload>;

  // Filtra apenas os campos que o autor tem permissão para editar
  const allowedUpdates: Partial<IPublicacaoComunidade> = {};
  const editableFields: (keyof PublicacaoPayload)[] = ['conteudo', 'imagens', 'tipo', 'dataEvento', 'localEvento'];
  editableFields.forEach(field => {
    if (updates[field] !== undefined) {
      // Aqui podem ser adicionadas validações específicas para cada campo
      (allowedUpdates as any)[field] = updates[field];
    }
  });

  // Verifica se há campos válidos para atualização
  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' }); return;
  }

  // Valida se o ID da publicação é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  try {
    // Busca e atualiza a publicação, verificando se o usuário é o autor e se o status permite edição
    const publicacaoAtualizada = await PublicacaoComunidade.findOneAndUpdate(
      { 
        _id: publicacaoId, 
        autorId: autorId, 
        status: { $in: [PublicacaoStatusEnum.RASCUNHO, PublicacaoStatusEnum.REJEITADO] } // Só permite editar publicações em rascunho ou rejeitadas
      },
      { $set: allowedUpdates },
      { new: true, runValidators: true, context: 'query' } // Retorna o documento atualizado e executa validadores
    );

    // Verifica se a publicação foi encontrada e atualizada
    if (!publicacaoAtualizada) {
      res.status(404).json({ message: 'Publicação não encontrada, não pertence a você ou não pode ser editada no status atual.' }); return;
    }

    // Retorna resposta de sucesso com a publicação atualizada
    res.status(200).json({ message: 'Publicação atualizada com sucesso.', publicacao: publicacaoAtualizada });
  } catch (error) {
    next(error);
  }
};

/**
 * Permite que o autor da publicação ou um administrador exclua uma publicação.
 * Utiliza transação para garantir que todos os dados relacionados (comentários e curtidas) sejam excluídos.
 * Verifica permissões: apenas o autor ou administradores podem excluir.
 */
export const deletePublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) { res.status(401).json({ message: 'Não autorizado.'}); return; }

  // Extrai parâmetros e dados do usuário da requisição
  const { publicacaoId } = req.params;
  const userId = req.user.userId;
  const userType = req.user.tipoUsuario;

  // Valida se o ID da publicação é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  // Inicia uma sessão de transação para garantir integridade dos dados
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Prepara a consulta para encontrar a publicação
    const query: mongoose.FilterQuery<IPublicacaoComunidade> = { _id: publicacaoId };
    // Se o usuário não for administrador, adiciona restrição para que só possa excluir suas próprias publicações
    if (userType !== TipoUsuarioEnum.ADMIN) {
      query.autorId = userId;
    }

    // Tenta excluir a publicação
    const publicacaoDeletada = await PublicacaoComunidade.findOneAndDelete(query).session(session);

    // Verifica se a publicação foi encontrada e excluída
    if (!publicacaoDeletada) {
      await session.abortTransaction(); session.endSession();
      res.status(404).json({ message: 'Publicação não encontrada ou você não tem permissão para excluí-la.' }); return;
    }

    // --- Exclusão de dados relacionados ---
    // Exclui todos os comentários associados à publicação
    await Comentario.deleteMany({ publicacaoId: publicacaoId }).session(session);
    // Exclui todas as curtidas associadas à publicação
    await Curtida.deleteMany({ itemCurtidoId: publicacaoId, tipoItemCurtido: 'PublicacaoComunidade' }).session(session);
    // ------------------------------------

    // Confirma a transação após todas as operações terem sido bem-sucedidas
    await session.commitTransaction();
    session.endSession();

    // Retorna resposta de sucesso
    res.status(200).json({ message: 'Publicação e seus comentários/curtidas associados foram excluídos com sucesso.' });

  } catch (error) {
    // Em caso de erro, cancela a transação para evitar dados inconsistentes
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Permite que administradores moderem publicações da comunidade.
 * Possibilita aprovar, rejeitar ou ocultar publicações.
 * Exige motivo ao rejeitar uma publicação para informar ao autor.
 */
export const moderarPublicacao = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário é administrador
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido: Apenas administradores podem moderar.' }); return;
  }

  // Extrai parâmetros e dados da requisição
  const { publicacaoId } = req.params;
  const { status: novoStatus, motivo } = req.body as { status: PublicacaoStatusEnum, motivo?: string };

  // Valida se o ID da publicação é um ObjectId válido do MongoDB
  if (!mongoose.Types.ObjectId.isValid(publicacaoId)) {
    res.status(400).json({ message: 'ID da publicação inválido.' }); return;
  }

  // Define e valida os status que um administrador pode atribuir
  const statusValidosParaAdmin: PublicacaoStatusEnum[] = [
    PublicacaoStatusEnum.APROVADO, 
    PublicacaoStatusEnum.REJEITADO, 
    PublicacaoStatusEnum.OCULTO_PELO_ADMIN
  ];

  // Verifica se o status fornecido é válido
  if (!novoStatus || !statusValidosParaAdmin.includes(novoStatus)) {
    res.status(400).json({ 
      message: `Status inválido fornecido para moderação: ${novoStatus}. Válidos: ${statusValidosParaAdmin.join(', ')}` 
    }); 
    return;
  }

  // Exige motivo quando uma publicação é rejeitada
  if (novoStatus === PublicacaoStatusEnum.REJEITADO && !motivo) {
    res.status(400).json({ message: 'Motivo é obrigatório ao rejeitar.' }); return;
  }

  try {
    // Busca e atualiza a publicação com o novo status
    const publicacao = await PublicacaoComunidade.findByIdAndUpdate(
      publicacaoId,
      {
        status: novoStatus,
        // Salva o motivo apenas quando a publicação é rejeitada
        motivoReprovacaoOuOcultacao: novoStatus === PublicacaoStatusEnum.REJEITADO ? motivo : undefined
      },
      { new: true, runValidators: true } // Retorna o documento atualizado e executa validadores
    );

    // Verifica se a publicação foi encontrada
    if (!publicacao) {
      res.status(404).json({ message: 'Publicação não encontrada.' }); return;
    }

    // TODO: Implementar sistema para notificar o autor sobre o resultado da moderação

    // Retorna resposta de sucesso com a publicação atualizada
    res.status(200).json({ 
      message: `Publicação atualizada para status '${novoStatus}'.`, 
      publicacao 
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Lista todas as publicações pendentes de aprovação para revisão dos administradores.
 * Acesso restrito apenas para usuários com perfil de administrador.
 * Função preparada para futura implementação completa com paginação.
 */
export const listarPublicacoesPendentes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário é administrador
  if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
    res.status(403).json({ message: 'Acesso proibido.'}); return;
  }

  // TODO: Implementar consulta de publicações com status PENDENTE_APROVACAO incluindo sistema de paginação

  // Retorna mensagem informando que o endpoint ainda não foi implementado
  res.status(501).json({ message: 'Endpoint listarPublicacoesPendentes não implementado.'});
};
