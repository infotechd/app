# Instruções para Executar o Backend MongoDB e o Frontend Mobile App

Este documento fornece instruções passo a passo para executar o backend com MongoDB e o frontend mobile do aplicativo.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [MongoDB](https://www.mongodb.com/try/download/community) instalado e configurado
- [pnpm](https://pnpm.io/installation) instalado globalmente
- [Expo CLI](https://docs.expo.dev/get-started/installation/) instalado globalmente
- Um dispositivo móvel com o aplicativo Expo Go ou um emulador Android/iOS

## Parte 1: Iniciar o MongoDB

1. Certifique-se de que o MongoDB está instalado no seu sistema.
2. Inicie o serviço MongoDB:

   ```bash
   # No Windows (via PowerShell como administrador)
   Start-Service MongoDB

   # No macOS (se instalado via Homebrew)
   brew services start mongodb-community

   # No Linux
   sudo systemctl start mongod
   ```

3. Verifique se o MongoDB está rodando na porta padrão 27017.

## Parte 2: Iniciar o Backend

1. Navegue até a pasta raiz do projeto:

   ```bash
   cd C:\Users\maidn\WebstormProjects\app
   ```

2. Instale as dependências (se ainda não tiver feito):

   ```bash
   pnpm install
   ```

3. Navegue até a pasta do backend:

   ```bash
   cd backend
   ```

4. Inicie o servidor backend em modo de desenvolvimento:

   ```bash
   pnpm run dev
   ```

   Isso iniciará o servidor na porta 3000 conforme configurado no arquivo .env.

## Parte 3: Iniciar o Frontend Mobile

1. Abra um novo terminal e navegue até a pasta raiz do projeto:

   ```bash
   cd C:\Users\maidn\WebstormProjects\app
   ```

2. Navegue até a pasta do frontend mobile:

   ```bash
   cd frontend\mobile
   ```

3. Inicie o aplicativo Expo:

   ```bash
   pnpm run start
   ```

4. Após iniciar o Expo, você terá algumas opções:
   - Escanear o QR code com o aplicativo Expo Go no seu dispositivo móvel
   - Pressionar 'a' para abrir no emulador Android
   - Pressionar 'i' para abrir no emulador iOS

## Notas Importantes

### Configuração de IP

- O backend está configurado para rodar em `http://192.168.15.12:3000`
- O frontend mobile está configurado para se conectar ao backend em `http://192.168.15.12:3000/api`

Se você estiver usando um IP diferente na sua rede local, precisará atualizar os seguintes arquivos:

1. `backend/.env`: Atualize o valor de `CLIENT_URL`
2. `frontend/mobile/.env`: Atualize os valores de `API_URL` e `EXPO_PUBLIC_API_URL`

### Usando com Emulador Android

Se estiver usando um emulador Android, descomente as linhas no arquivo `frontend/mobile/.env`:

```
API_URL=http://10.0.2.2:3000/api
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

## Solução de Problemas

### Problemas de Conexão com o MongoDB

Se o backend não conseguir se conectar ao MongoDB, verifique:
- Se o MongoDB está rodando na porta 27017
- Se o banco de dados "app" existe (será criado automaticamente na primeira execução)

### Problemas de Conexão com o Backend

Se o aplicativo mobile não conseguir se conectar ao backend, verifique:
- Se o backend está rodando corretamente na porta 3000
- Se o IP configurado no arquivo .env do frontend mobile corresponde ao IP da sua máquina na rede