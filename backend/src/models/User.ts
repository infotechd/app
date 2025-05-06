// models/User.ts (Backend - Convertido para TypeScript)

import mongoose, {
  CallbackError,
  Document,
  HydratedDocument,
  Model,
  Schema,
} from "mongoose";
import bcrypt from "bcryptjs"; // Usar import em vez de require
import logger from "../config/logger";

// --- Tipos e Interfaces ---

// Enum para os tipos de usuário (melhor usar um Enum TypeScript)
export enum TipoUsuarioEnum {
  COMPRADOR = 'comprador',
  PRESTADOR = 'prestador',
  ANUNCIANTE = 'anunciante',
  ADMIN = 'admin'
}

// Interface que define a estrutura de um documento User (propriedades)
// Estende Document do Mongoose para incluir _id, __v, etc.
export interface IUser extends Document {
  nome: string;
  email: string;
  senha?: string; // Senha é opcional aqui porque usamos select: false
  telefone?: string;
  cpfCnpj: string;
  tipoUsuario: TipoUsuarioEnum;
  endereco?: string;
  foto?: string;
  // Timestamps (adicionados pelo Mongoose)
  createdAt: Date;
  updatedAt: Date;

  // Declaração do método de instância para o TypeScript reconhecer
  comparePassword(candidatePassword: string): Promise<boolean>; // Tornar async é melhor prática com bcrypt.compare
}

// Interface para definir métodos estáticos no Modelo (se houver) - Opcional aqui
interface IUserModel extends Model<IUser> {
  // Exemplo: findByEmail(email: string): Promise<HydratedDocument<IUser> | null>;
}

// --- Schema Mongoose ---

// Regex básica para validação de formato de email
let emailRegex: RegExp;
emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// Regex para validação de formato de telefone brasileiro
// Aceita formato: (XX) XXXXX-XXXX ou XXXXXXXXXXX (apenas números)
// DDD (2 dígitos) + número (9 dígitos) = 11 dígitos no total
let telefoneRegex: RegExp;
telefoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;

// Define o Schema do Mongoose, usando a interface IUser para tipagem
const UserSchema: Schema<IUser, IUserModel> = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O campo nome é obrigatório.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'O campo email é obrigatório.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Por favor, insira um endereço de email válido.'],
      index: true,
    },
    senha: {
      type: String,
      required: [true, 'O campo senha é obrigatório.'],
      select: false, // Mantém o hash da senha oculto por padrão
    },
    telefone: {
      type: String,
      trim: true,
      // Validação do formato do telefone usando a regex definida
      match: [telefoneRegex, 'Por favor, insira um número de telefone válido com DDD (11 dígitos).'],
      // Validação customizada para garantir que o telefone tenha exatamente 11 dígitos numéricos
      validate: {
        validator: function(value: string) {
          // Se o valor não for fornecido, é considerado válido (campo opcional)
          if (!value) return true;

          // Remove todos os caracteres não numéricos para contar apenas os dígitos
          const numeroLimpo = value.replace(/\D/g, '');

          // Verifica se tem exatamente 11 dígitos (DDD + número)
          return numeroLimpo.length === 11;
        },
        message: 'O telefone deve conter 11 dígitos numéricos (DDD + número).'
      }
    },
    cpfCnpj: {
      type: String,
      required: [true, 'O campo CPF/CNPJ é obrigatório.'],
      unique: true,
      trim: true,
      index: true,
      // Validação de formato/validade deve ocorrer na camada de serviço/controller
    },
    tipoUsuario: {
      type: String,
      enum: {
        values: Object.values(TipoUsuarioEnum), // Usa os valores do Enum TypeScript
        message: 'O tipo de usuário fornecido ({VALUE}) não é válido.'
      },
      required: [true, 'O tipo de usuário é obrigatório.'],
      index: true,
    },
    endereco: {
      type: String,
      trim: true,
    },
    foto: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- Middleware (Hook) pré-save ---
UserSchema.pre<HydratedDocument<IUser>>('save', async function(next: (err?: CallbackError) => void) {
  // Usa async function para poder usar await dentro, se necessário (embora bcrypt.hashSync seja síncrono)
  // Tipagem 'this' como HydratedDocument<IUser>
  // Tipagem 'next' callback

  // Normaliza o formato do telefone se foi modificado
  if (this.isModified('telefone') && this.telefone) {
    try {
      // Remove todos os caracteres não numéricos
      const numeroLimpo = this.telefone.replace(/\D/g, '');

      // Formata o número como (XX) XXXXX-XXXX se tiver 11 dígitos
      if (numeroLimpo.length === 11) {
        this.telefone = `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 7)}-${numeroLimpo.substring(7)}`;
      }
    } catch (error: any) {
      logger.error("Erro ao normalizar telefone:", { error: error.message, stack: error.stack });
      // Não interrompe o fluxo por erro de formatação
    }
  }

  // Só faz o hash se a senha foi modificada
  if (!this.isModified('senha') || !this.senha) {
    return next(); // Chama next() e retorna se não precisar fazer hash da senha
  }

  try {
    // Usar bcrypt.genSalt e bcrypt.hash (assíncronos) é geralmente preferido em Node.js
    // sobre as versões Sync para não bloquear a thread.
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error: any) { // Captura o erro
    logger.error("Erro ao gerar hash da senha:", { error: error.message, stack: error.stack });
    next(error); // Passa o erro para o Mongoose
  }
});

// --- Método de Instância comparePassword ---
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // 'this' aqui se refere à instância do documento User
  // Adicionado async/await para usar bcrypt.compare (assíncrono)

  if (!this.senha) {
    // Lança um erro se a senha não foi carregada (select: false)
    logger.error("Erro em comparePassword: Campo 'senha' não foi selecionado na query para este usuário.");
    // Lançar um erro é mais apropriado para sinalizar um problema de programação
    throw new Error("Campo 'senha' não carregado para comparação. Use .select('+senha') na query.");
  }

  try {
    // Usa a versão assíncrona bcrypt.compare
    return await bcrypt.compare(candidatePassword, this.senha);
  } catch (error: any) {
    logger.error("Erro ao comparar senhas:", { error: error.message, stack: error.stack });
    return false; // Retorna falso em caso de erro
  }
};

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'User' tipado com IUser (documento) e IUserModel (modelo)
const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
