// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser, TipoUsuarioEnum } from '../models/User'; // Importa modelo e interface/enum
import Contratacao, { ContratacaoStatusEnum } from '../models/Contratacao';
import { DecodedUserToken } from '../server'; // Importa a interface do payload JWT
// import { validate as isValidEmail } from 'email-validator';
// import { validate as isValidCpfCnpj } from 'cpf-cnpj-validator';

// --- Funções do Controller ---

/**
 * Registra um novo usuário (CU1)
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Desestrutura o corpo da requisição validado pelo middleware de validação
  const { nome, email, senha, telefone, cpfCnpj, tipoUsuario, endereco, foto } = req.body;

  try {
    // Verifica se o usuário já existe no banco de dados
    // O índice unique no Mongoose já ajuda, mas verificar antes fornece uma mensagem melhor
    const existingUser = await User.findOne({ $or: [{ email }, { cpfCnpj }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'CPF/CNPJ';
      res.status(409).json({ message: `${field} já cadastrado.` }); // 409 Conflict
      return;
    }
    // Não é necessário fazer hash aqui, o hook pre('save') no modelo User.ts fará isso

    // Cria nova instância do usuário com os dados fornecidos
    const newUser = new User({
      nome,
      email,
      senha, // A senha é passada em texto plano, o hook pre-save fará o hash
      telefone,
      cpfCnpj,
      tipoUsuario,
      endereco,
      foto
    });

    // Salva o novo usuário no banco de dados
    await newUser.save();

    // Retorna resposta de sucesso sem expor dados sensíveis do usuário
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });

  } catch (error) {
    // Passa o erro para o middleware de erro centralizado
    next(error);
  }
};

/**
 * Realiza o login do usuário
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, senha } = req.body;

  try {
    // Busca o usuário no banco e seleciona explicitamente a senha (que está com select: false no modelo)
    const user = await User.findOne({ email }).select('+senha');
    if (!user) {
      // Usa código 401 (Unauthorized) em vez de 404 para não revelar se o email existe no sistema
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // Verifica se a senha fornecida corresponde ao hash armazenado no banco
    const isMatch = await user.comparePassword(senha); // Utiliza o método assíncrono definido no modelo
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
      return;
    }

    // Gera o token JWT para autenticação
    // Utiliza a interface DecodedUserToken para definir o tipo do payload
    const payload: DecodedUserToken = {
      userId: String(user._id),
      tipoUsuario: user.tipoUsuario
    };

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Define o tempo de expiração do token

    // Configura o cookie com o token JWT e opções de segurança
    res.cookie('token', token, {
      httpOnly: true, // Impede acesso via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
      sameSite: 'strict', // Proteção contra CSRF
      maxAge: 60 * 60 * 1000 // Tempo de vida do cookie: 1 hora em milissegundos
      // path: '/' // Caminho do cookie (opcional)
    });

    // Retorna resposta de sucesso com dados do usuário (excluindo a senha)
    res.status(200).json({
      message: 'Login realizado com sucesso.',
      token: token, // Inclui o token no corpo da resposta para clientes como aplicativos móveis
      user: { // Objeto com dados seguros do usuário
        id: user._id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        cpfCnpj: user.cpfCnpj,
        tipoUsuario: user.tipoUsuario,
        endereco: user.endereco,
        foto: user.foto
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Realiza o logout do usuário limpando o cookie de autenticação
 */
export const logout = (req: Request, res: Response, next: NextFunction): void => {
  // As opções de configuração do cookie devem ser as mesmas usadas ao definir o cookie no login
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // path: '/' // Adicione se você definiu um path específico no login
  });

  // Retorna mensagem de sucesso
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
};







/**
 * Edita o perfil do usuário logado (CU17)
 */
export const editProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado (req.user é populado pelo authMiddleware)
  if (!req.user) {
    // Verificação de segurança adicional, embora o authMiddleware já deva garantir isso
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  // Define os tipos para os campos que podem ser atualizados
  type UpdatableUserFields = Pick<IUser, 'nome' | 'telefone' | 'endereco' | 'foto' | 'senha'>;
  type UpdatableFieldKey = keyof UpdatableUserFields;

  const allowedUpdates: Partial<UpdatableUserFields> = {}; // Objeto para armazenar campos permitidos
  const receivedUpdates = req.body;

  // Filtra apenas os campos permitidos do corpo da requisição
  const updatableFields: UpdatableFieldKey[] = ['nome', 'telefone', 'endereco', 'foto', 'senha'];
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      // Usa type assertion para garantir tipagem correta
      allowedUpdates[field] = receivedUpdates[field] as UpdatableUserFields[typeof field];
    }
  });

  // Verifica se há campos válidos para atualização
  // Campos sensíveis como email, cpfCnpj e tipoUsuario não podem ser atualizados por esta rota
  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }

  try {
    // Tratamento especial para atualização de senha
    // O hook pre('save') só é executado com o método save(), não com findByIdAndUpdate
    // Por isso, precisamos fazer o hash da senha manualmente aqui
    if (allowedUpdates.senha) {
      const salt = await bcrypt.genSalt(10);
      allowedUpdates.senha = await bcrypt.hash(allowedUpdates.senha, salt);
    }

    // Atualiza o usuário no banco de dados
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates }, // Usa $set para garantir que apenas os campos permitidos sejam atualizados
      { 
        new: true, // Retorna o documento atualizado
        runValidators: true, // Executa as validações do schema
        context: 'query' 
      }
    ).select('-senha'); // Remove a senha do resultado

    if (!updatedUser) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // Retorna sucesso com os dados atualizados do usuário
    res.status(200).json({ message: 'Perfil atualizado com sucesso.', user: updatedUser });

  } catch (error) {
    next(error);
  }
};

/**
 * Exclui a conta do usuário logado (CU12)
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  try {
    // Verifica pendências (contratações ativas) antes de permitir a exclusão da conta
    const statusAtivos = [
      ContratacaoStatusEnum.PENDENTE,
      ContratacaoStatusEnum.ACEITA,
      ContratacaoStatusEnum.EM_ANDAMENTO,
      ContratacaoStatusEnum.DISPUTA
    ];

    // Conta quantas contratações ativas o usuário possui, seja como comprador ou prestador
    const contratacoesPendentes = await Contratacao.countDocuments({
      $or: [
        { buyerId: userId, status: { $in: statusAtivos } },
        { prestadorId: userId, status: { $in: statusAtivos } }
      ]
    });

    // Se existirem contratações pendentes, impede a exclusão da conta
    if (contratacoesPendentes > 0) {
      res.status(400).json({ 
        message: 'Não é possível excluir sua conta enquanto você possui contratações ativas. Finalize ou cancele todas as contratações pendentes antes de excluir sua conta.' 
      });
      return;
    }

    // Exclui o usuário do banco de dados
    const deletedUser = await User.findByIdAndDelete(userId);

    // Verifica se o usuário foi encontrado e excluído
    if (!deletedUser) {
      // Esta verificação é improvável de falhar se o token for válido, mas é uma boa prática
      res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
      return;
    }

    // Realiza o logout do usuário removendo o cookie de autenticação
    res.clearCookie('token');

    // Retorna mensagem de sucesso
    res.status(200).json({ message: 'Conta excluída com sucesso.' });

  } catch (error) {
    next(error);
  }
};


/**
 * Lista todos os usuários (Apenas Admin) com paginação
 */
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // --- VERIFICAÇÃO DE AUTORIZAÇÃO ---
    // Verifica se o usuário é administrador
    if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
      res.status(403).json({ message: 'Acesso proibido: Requer privilégios de administrador.' });
      return;
    }
    // ---------------------------------

    // --- IMPLEMENTAÇÃO DE PAGINAÇÃO ---
    // Define valores padrão para os parâmetros de paginação
    let page = 1; // Página inicial
    let limit = 10; // Quantidade de itens por página

    // Processa e valida o parâmetro 'page' da query string
    if (req.query.page) {
      const pageParam = parseInt(req.query.page as string);
      if (isNaN(pageParam) || pageParam < 1) {
        res.status(400).json({ message: 'O parâmetro page deve ser um número positivo.' });
        return;
      }
      page = pageParam;
    }

    // Processa e valida o parâmetro 'limit' da query string
    if (req.query.limit) {
      const limitParam = parseInt(req.query.limit as string);
      if (isNaN(limitParam) || limitParam < 1 || limitParam > 100) {
        res.status(400).json({ message: 'O parâmetro limit deve ser um número entre 1 e 100.' });
        return;
      }
      limit = limitParam;
    }

    // Calcula quantos documentos devem ser pulados para a página atual
    const skip = (page - 1) * limit;

    // Obtém o total de usuários no sistema para calcular a paginação
    const totalUsers = await User.countDocuments({});
    const totalPages = Math.ceil(totalUsers / limit);

    // Busca os usuários com paginação aplicada
    const users = await User.find({})
      .select('nome email tipoUsuario createdAt') // Seleciona apenas os campos necessários, excluindo a senha
      .skip(skip) // Aplica o deslocamento para a página atual
      .limit(limit) // Limita a quantidade de resultados
      .sort({ createdAt: -1 }); // Ordena por data de criação decrescente (mais recentes primeiro)

    // Retorna os usuários encontrados junto com informações de paginação
    res.status(200).json({
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtém os dados do perfil do usuário logado
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  try {
    // Busca os dados do usuário no banco, excluindo a senha do resultado
    const user = await User.findById(userId).select('-senha');

    // Verifica se o usuário foi encontrado
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // Retorna os dados do usuário
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Altera o email do usuário com verificação de segurança
 * Requer a senha atual do usuário para confirmar a identidade
 */
export const changeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Verifica se o usuário está autenticado
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  // Extrai os dados da requisição
  const { currentPassword, newEmail } = req.body;

  // Valida os dados recebidos
  if (!currentPassword || !newEmail) {
    res.status(400).json({ 
      message: 'Senha atual e novo email são obrigatórios.',
      errorCode: 'EMAIL_CHANGE_MISSING_FIELDS'
    });
    return;
  }

  // Valida o formato do email
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(newEmail)) {
    res.status(400).json({ 
      message: 'Formato de email inválido.',
      errorCode: 'EMAIL_CHANGE_INVALID_EMAIL_FORMAT'
    });
    return;
  }

  try {
    // Busca o usuário com a senha (que normalmente é excluída das consultas)
    const user = await User.findById(userId).select('+senha');

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    // Verifica se a senha atual está correta
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      res.status(401).json({ 
        message: 'Senha incorreta. Por favor, verifique e tente novamente.',
        errorCode: 'EMAIL_CHANGE_INCORRECT_PASSWORD'
      });
      return;
    }

    // Verifica se o novo email já está em uso
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      res.status(400).json({ 
        message: 'Este email já está em uso por outra conta.',
        errorCode: 'EMAIL_CHANGE_EMAIL_IN_USE'
      });
      return;
    }

    // Atualiza o email do usuário
    user.email = newEmail;
    await user.save();

    // Retorna sucesso
    res.status(200).json({ 
      message: 'Email alterado com sucesso.',
      success: true
    });

  } catch (error) {
    next(error);
  }
};
