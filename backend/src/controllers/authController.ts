// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser, TipoUsuarioEnum } from '../models/User'; // Importa modelo e interface/enum
// import { validate as isValidEmail } from 'email-validator'; // Exemplo: usar lib de validação
// import { validate as isValidCpfCnpj } from 'cpf-cnpj-validator'; // Exemplo: usar lib de validação

// --- Funções do Controller ---

/**
 * Registra um novo usuário (CU1)
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Desestrutura o corpo da requisição (idealmente validado por middleware antes)
  const { nome, email, senha, telefone, cpfCnpj, tipoUsuario, endereco, foto } = req.body;

  try {
    // Validação básica (melhor usar middleware de validação como express-validator ou Joi)
    if (!nome || !email || !senha || !cpfCnpj || !tipoUsuario) {
      res.status(400).json({ message: 'Campos obrigatórios ausentes: nome, email, senha, cpfCnpj, tipoUsuario.' });
      return;
    }
    // TODO: Implementar validação mais robusta de formato/regras (email, cpf/cnpj, força da senha)
    // Exemplo: if (!isValidEmail(email)) { ... }

    // Verifica existência (o índice unique no Mongoose já ajuda, mas verificar antes dá msg melhor)
    const existingUser = await User.findOne({ $or: [{ email }, { cpfCnpj }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'CPF/CNPJ';
      res.status(409).json({ message: `${field} já cadastrado.` }); // 409 Conflict
      return;
    }

    // Valida tipoUsuario (Enum já valida no save, mas podemos checar antes)
    if (!Object.values(TipoUsuarioEnum).includes(tipoUsuario)) {
      res.status(400).json({ message: `Tipo de usuário inválido: ${tipoUsuario}` });
      return;
    }
    // Não é necessário fazer hash aqui, o hook pre('save') no modelo User.ts fará isso.

    // Cria nova instância do usuário
    const newUser = new User({
      nome,
      email,
      senha, // Passa a senha em texto plano, o hook pre-save fará o hash
      telefone,
      cpfCnpj,
      tipoUsuario,
      endereco,
      foto
    });

    // Salva no banco (o hook pre-save será executado)
    await newUser.save();

    // Resposta de sucesso (não retorna o usuário criado para não expor dados como _id imediatamente)
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });

  } catch (error) {
    next(error); // Passa o erro para o middleware de erro centralizado
  }
};

/**
 * Realiza o login do usuário
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, senha } = req.body;

  try {
    if (!email || !senha) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }

    // Busca o usuário E seleciona explicitamente a senha (devido ao select: false no modelo)
    const user = await User.findOne({ email }).select('+senha');
    if (!user) {
      // Usar 401 (Unauthorized) em vez de 404 para não revelar se o email existe
      res.status(401).json({ message: 'Credenciais inválidas.' });
      return;
    }

    // Compara a senha fornecida com o hash armazenado (usando o método do modelo)
    const isMatch = await user.comparePassword(senha); // Usa o método assíncrono que criamos
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciais inválidas.' }); // Mensagem genérica
      return;
    }

    // Gera o token JWT
    // Usando tipagem inline em vez de uma interface nomeada
    const payload = {
      userId: String(user._id),
      tipoUsuario: user.tipoUsuario
    } as { userId: string; tipoUsuario: TipoUsuarioEnum };

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Ajuste a expiração conforme necessário

    // Define o cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Ou 'lax' dependendo da necessidade
      maxAge: 60 * 60 * 1000 // 1 hora em milissegundos
      // path: '/' // Opcional: define o path do cookie
    });

    // Retorna sucesso e dados do usuário (sem a senha)
    res.status(200).json({
      message: 'Login realizado com sucesso.',
      token: token, // Pode retornar o token também no corpo se o cliente precisar (ex: mobile)
      user: { // Retorna um objeto seguro sem a senha
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
 * Edita o perfil do usuário logado (CU17)
 */
export const editProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // req.user é populado pelo authMiddleware
  if (!req.user) {
    // Segurança extra, embora authMiddleware já deva garantir
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;
  const allowedUpdates: Partial<Pick<IUser, 'nome' | 'telefone' | 'endereco' | 'foto' | 'senha'>> = {}; // Campos permitidos
  const receivedUpdates = req.body;

  // Filtra apenas os campos permitidos do req.body
  const updatableFields: (keyof typeof allowedUpdates)[] = ['nome', 'telefone', 'endereco', 'foto', 'senha'];
  updatableFields.forEach(field => {
    if (receivedUpdates[field] !== undefined) {
      (allowedUpdates as any)[field] = receivedUpdates[field];
    }
  });

  // Não permite atualizar campos sensíveis como email, cpfCnpj, tipoUsuario por aqui
  if (Object.keys(allowedUpdates).length === 0) {
    res.status(400).json({ message: 'Nenhum campo válido para atualização fornecido.' });
    return;
  }

  try {
    // Se a senha está sendo atualizada, faz o hash ANTES de salvar
    // NOTA: O hook pre('save') SÓ roda em user.save(), NÃO em findByIdAndUpdate.
    // Precisamos fazer o hash aqui ou buscar o documento e usar save().
    if (allowedUpdates.senha) {
      const salt = await bcrypt.genSalt(10);
      allowedUpdates.senha = await bcrypt.hash(allowedUpdates.senha, salt);
    }

    // Atualiza usando findByIdAndUpdate (não dispara o hook pre-save)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates }, // Usa $set para garantir que só os campos permitidos sejam atualizados
      { new: true, runValidators: true, context: 'query' } // new: true retorna o doc atualizado, runValidators roda validações do schema
    ).select('-senha'); // Garante que a senha não retorne

    if (!updatedUser) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    res.status(200).json({ message: 'Perfil atualizado com sucesso.', user: updatedUser });

  } catch (error) {
    // Tratar erros de validação do Mongoose separadamente se desejar (ex: email/cpfCnpj únicos se tentar atualizar)
    if ((error as any).code === 11000) { // Código de erro do Mongo para chave duplicada
      res.status(409).json({ message: 'Erro de duplicação de campo único (email ou CPF/CNPJ).'});
      return;
    }
    next(error);
  }
};

/**
 * Exclui a conta do usuário logado (CU12)
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;

  try {
    // TODO: Implementar verificação de pendências (contratações ativas, etc.) ANTES de deletar

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      // Embora improvável se o token for válido, é bom verificar
      res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
      return;
    }

    // TODO: Implementar lógica de logout / invalidação de cookie/token se necessário
    res.clearCookie('token'); // Exemplo: Limpa o cookie de autenticação

    res.status(200).json({ message: 'Conta excluída com sucesso.' });

  } catch (error) {
    next(error);
  }
};


/**
 * Lista todos os usuários (Apenas Admin)
 */
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // --- VERIFICAÇÃO DE AUTORIZAÇÃO ---
    if (!req.user || req.user.tipoUsuario !== TipoUsuarioEnum.ADMIN) {
      res.status(403).json({ message: 'Acesso proibido: Requer privilégios de administrador.' });
      return;
    }
    // ---------------------------------

    // Busca usuários selecionando campos específicos
    // TODO: Adicionar paginação para muitos usuários
    const users = await User.find({})
      .select('nome email tipoUsuario createdAt'); // Nunca retornar senha

    res.status(200).json(users);

  } catch (error) {
    next(error);
  }
};

// (Opcional) Função para obter perfil do usuário logado
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Não autorizado.' });
    return;
  }
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId).select('-senha'); // Exclui a senha
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};