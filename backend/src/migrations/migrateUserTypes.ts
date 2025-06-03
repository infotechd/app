// src/migrations/migrateUserTypes.ts
// Este arquivo contém um script de migração para atualizar os tipos de usuários no banco de dados

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Conecta ao MongoDB
const MONGO_URI = process.env.MONGO_URI as string;
if (!MONGO_URI) {
  console.error("ERRO FATAL: MONGO_URI não definida no .env");
  process.exit(1);
}

// Define os valores do enum antigo de tipo de usuário
enum OldTipoUsuarioEnum {
  COMPRADOR = 'comprador',
  PRESTADOR = 'prestador',
  ANUNCIANTE = 'anunciante',
  ADMIN = 'admin'
}

/**
 * Script de migração para atualizar usuários existentes para usar os novos campos booleanos
 * baseados no valor atual de tipoUsuario.
 */
async function migrateUserTypes() {
  try {
    // Conecta ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Conectado ao MongoDB com sucesso.');

    // Obtém a coleção de Usuários
    const userCollection = mongoose.connection.collection('users');

    // Obtém todos os usuários
    const users = await userCollection.find({}).toArray();
    console.log(`Encontrados ${users.length} usuários para migrar.`);

    // Inicializa contadores para relatório
    let migratedCount = 0;
    let errorCount = 0;

    // Processa cada usuário
    for (const user of users) {
      try {
        // Obtém o valor atual de tipoUsuario
        const tipoUsuario = user.tipoUsuario;

        // Define os novos campos booleanos baseados no valor atual de tipoUsuario
        const updates: any = {
          isComprador: false,
          isPrestador: false,
          isAnunciante: false,
          isAdmin: false
        };

        // Define o campo booleano apropriado baseado no valor de tipoUsuario
        switch (tipoUsuario) {
          case OldTipoUsuarioEnum.COMPRADOR:
            updates.isComprador = true;
            break;
          case OldTipoUsuarioEnum.PRESTADOR:
            updates.isPrestador = true;
            break;
          case OldTipoUsuarioEnum.ANUNCIANTE:
            updates.isAnunciante = true;
            break;
          case OldTipoUsuarioEnum.ADMIN:
            updates.isAdmin = true;
            break;
          default:
            console.warn(`Usuário ${user._id} possui tipoUsuario desconhecido: ${tipoUsuario}`);
        }

        // Atualiza o usuário com os novos campos booleanos
        await userCollection.updateOne(
          { _id: user._id },
          { $set: updates }
        );

        migratedCount++;
        console.log(`Usuário ${user._id} migrado de tipoUsuario=${tipoUsuario} para flags booleanas.`);
      } catch (error) {
        errorCount++;
        console.error(`Erro ao migrar usuário ${user._id}:`, error);
      }
    }

    console.log(`Migração concluída. ${migratedCount} usuários migrados com sucesso, ${errorCount} erros.`);
  } catch (error) {
    console.error('Falha na migração:', error);
  } finally {
    // Fecha a conexão com o MongoDB
    await mongoose.connection.close();
    console.log('Conexão com MongoDB fechada.');
  }
}

// Executa a migração
migrateUserTypes()
  .then(() => {
    console.log('Script de migração concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha no script de migração:', error);
    process.exit(1);
  });
