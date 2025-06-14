// models/User.ts (Modelo de usuário do sistema)

import mongoose, {
  CallbackError,
  Document,
  HydratedDocument,
  Model,
  Schema,
} from "mongoose";
import bcrypt from "bcryptjs"; // Biblioteca para criptografia de senhas
import logger from "../config/logger";

// --- Tipos e Interfaces ---

// Enumeração para definir o tipo de usuário administrador
export enum TipoUsuarioEnum {
  ADMIN = 'admin'
}

// Interface para definir as capacidades do usuário
export interface IUserCapabilities {
  isComprador: boolean;
  isPrestador: boolean;
  isAnunciante: boolean;
}

// Interface que define a estrutura de um documento de usuário no banco de dados
// Estende a classe Document do Mongoose para herdar propriedades como _id e __v
export interface IUser extends Document, IUserCapabilities {
  nome: string;
  email: string;
  senha?: string; // Campo opcional na interface porque é excluído das consultas por padrão
  telefone?: string;
  cpfCnpj: string;
  isAdmin: boolean; // Indica se o usuário é administrador
  endereco?: string;
  foto?: string;
  dataNascimento?: Date; // Armazena a data de nascimento do usuário
  genero?: string; // Armazena o gênero do usuário
  // Campos de data criados automaticamente pelo Mongoose
  createdAt: Date;
  updatedAt: Date;

  // Método para comparar a senha fornecida com a senha armazenada
  comparePassword(candidatePassword: string): Promise<boolean>; // Método assíncrono para comparação segura de senhas
}

// Interface para definir métodos estáticos adicionais no modelo User
interface IUserModel extends Model<IUser> {
  // Aqui podem ser adicionados métodos estáticos personalizados
}

// --- Definição do Schema no Mongoose ---

// Expressão regular para validar o formato de email
let emailRegex: RegExp;
emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// Expressão regular para validar o formato de telefone brasileiro
// Aceita os formatos: (XX) XXXXX-XXXX ou XXXXXXXXXXX (apenas números)
// Composto por DDD (2 dígitos) + número (9 dígitos) = 11 dígitos no total
let telefoneRegex: RegExp;
telefoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;

// Criação do Schema do Mongoose com base na interface IUser
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
      select: false, // Impede que a senha seja retornada em consultas por padrão
    },
    telefone: {
      type: String,
      trim: true,
      // Validação do formato do telefone usando a expressão regular definida anteriormente
      match: [telefoneRegex, 'Por favor, insira um número de telefone válido com DDD (11 dígitos).'],
      // Validação personalizada para garantir que o telefone tenha exatamente 11 dígitos numéricos
      validate: {
        validator: function(value: string) {
          // Se o campo estiver vazio, é considerado válido (campo opcional)
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
      validate: {
        validator: function(value: string) {
          // Remove caracteres não numéricos como pontos e traços
          const numeroLimpo = value.replace(/\D/g, '');

          // Verifica se o número tem a quantidade correta de dígitos para CPF ou CNPJ
          if (numeroLimpo.length !== 11 && numeroLimpo.length !== 14) {
            return false;
          }

          // Validação básica: verifica se não são todos dígitos iguais (caso inválido)
          if (/^(\d)\1+$/.test(numeroLimpo)) {
            return false;
          }

          // Validação específica para CPF
          if (numeroLimpo.length === 11) {
            // Algoritmo de validação de CPF
            let soma = 0;
            let resto;

            // Primeiro dígito verificador
            for (let i = 1; i <= 9; i++) {
              soma = soma + parseInt(numeroLimpo.substring(i-1, i)) * (11 - i);
            }
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(numeroLimpo.substring(9, 10))) return false;

            // Segundo dígito verificador
            soma = 0;
            for (let i = 1; i <= 10; i++) {
              soma = soma + parseInt(numeroLimpo.substring(i-1, i)) * (12 - i);
            }
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(numeroLimpo.substring(10, 11))) return false;

            return true;
          }

          // Validação específica para CNPJ
          if (numeroLimpo.length === 14) {
            // Algoritmo de validação de CNPJ
            let tamanho = numeroLimpo.length - 2;
            let numeros = numeroLimpo.substring(0, tamanho);
            const digitos = numeroLimpo.substring(tamanho);
            let soma = 0;
            let pos = tamanho - 7;

            // Primeiro dígito verificador
            for (let i = tamanho; i >= 1; i--) {
              soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
              if (pos < 2) pos = 9;
            }
            let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado !== parseInt(digitos.charAt(0))) return false;

            // Segundo dígito verificador
            tamanho = tamanho + 1;
            numeros = numeroLimpo.substring(0, tamanho);
            soma = 0;
            pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
              soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
              if (pos < 2) pos = 9;
            }
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado !== parseInt(digitos.charAt(1))) return false;

            return true;
          }

          return false; // Não deveria chegar aqui, mas por segurança retorna falso
        },
        message: 'CPF/CNPJ inválido. Verifique se o número está correto.'
      }
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isComprador: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrestador: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAnunciante: {
      type: Boolean,
      default: false,
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
    dataNascimento: {
      type: Date,
      validate: {
        validator: function(value: Date) {
          // Verifica se a data é válida e não está no futuro
          return !value || value <= new Date();
        },
        message: 'A data de nascimento não pode estar no futuro.'
      }
    },
    genero: {
      type: String,
      enum: {
        values: ['Feminino', 'Masculino', 'Prefiro não dizer'],
        message: 'O gênero fornecido ({VALUE}) não é válido.'
      },
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- Middleware executado antes de salvar um usuário ---
UserSchema.pre<HydratedDocument<IUser>>('save', async function(next: (err?: CallbackError) => void) {
  // Função assíncrona para permitir o uso de await nas operações de criptografia
  // O parâmetro 'this' é tipado como HydratedDocument<IUser> para acesso aos métodos do documento
  // O callback 'next' é tipado para permitir passar erros para o Mongoose

  // Formata o telefone para o padrão brasileiro se o campo foi modificado
  if (this.isModified('telefone') && this.telefone) {
    try {
      // Remove todos os caracteres não numéricos do telefone
      const numeroLimpo = this.telefone.replace(/\D/g, '');

      // Formata o número no padrão (XX) XXXXX-XXXX se tiver a quantidade correta de dígitos
      if (numeroLimpo.length === 11) {
        this.telefone = `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 7)}-${numeroLimpo.substring(7)}`;
      } else if (numeroLimpo.length > 0) {
        // Se o número não tem 11 dígitos mas não está vazio, registra um aviso
        logger.warn("Telefone com formato inesperado:", { 
          telefone: this.telefone, 
          numeroLimpo, 
          userId: this._id 
        });
      }
    } catch (error: any) {
      logger.error("Erro ao normalizar telefone:", { 
        error: error.message, 
        stack: error.stack,
        telefone: this.telefone,
        userId: this._id
      });

      // Não permite continuar com um telefone mal formatado
      return next(new Error(`Erro ao formatar telefone: ${error.message}`));
    }
  }

  // Só criptografa a senha se ela foi modificada
  if (!this.isModified('senha') || !this.senha) {
    return next(); // Prossegue para o próximo middleware se não precisar criptografar
  }

  try {
    // Utiliza funções assíncronas do bcrypt para não bloquear a thread principal
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error: any) { // Captura qualquer erro durante a criptografia
    logger.error("Erro ao gerar hash da senha:", { error: error.message, stack: error.stack });
    next(error); // Passa o erro para o Mongoose tratar
  }
});

// --- Método para comparação de senhas ---
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // O 'this' refere-se à instância atual do documento de usuário
  // Método implementado como assíncrono para usar bcrypt.compare de forma não-bloqueante

  if (!this.senha) {
    // Registra erro se o campo senha não estiver disponível (devido ao select: false)
    logger.error("Erro em comparePassword: Campo 'senha' não foi selecionado na query para este usuário.");
    // Lança um erro para indicar um problema na implementação da consulta
    throw new Error("Campo 'senha' não carregado para comparação. Use .select('+senha') na query.");
  }

  try {
    // Compara a senha fornecida com o hash armazenado usando bcrypt
    return await bcrypt.compare(candidatePassword, this.senha);
  } catch (error: any) {
    // Registra o erro detalhado no log
    logger.error("Erro ao comparar senhas:", { 
      error: error.message, 
      stack: error.stack,
      userId: this._id
    });

    // Lança o erro para que seja tratado adequadamente nas camadas superiores
    // Isso permite que o sistema identifique e resolva problemas reais em vez de silenciá-los
    throw new Error(`Erro ao verificar senha: ${error.message}`);
  }
};

// --- Criação e exportação do modelo ---
// Cria o modelo 'User' com as tipagens definidas e o schema configurado
const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
