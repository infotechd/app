# App

Este repositório contém o projeto completo do App, com backend, app mobile (React Native/Expo) e app web (React).  
Cada subprojeto está organizado como um workspace para facilitar o desenvolvimento e a escalabilidade.

## Estrutura

- **backend/**: API e lógica de negócio.
- **frontend/mobile/**: Aplicativo mobile (Android/iOS) com Expo.
- **frontend/web/**: Aplicativo web (React).

## Executando a Aplicação

### Método Rápido (Windows)

Execute o script `start-app.bat` para iniciar automaticamente o MongoDB, o backend e o frontend mobile:

```
start-app.bat
```

### Método Manual

Consulte o arquivo [INSTRUCTIONS.md](INSTRUCTIONS.md) para instruções detalhadas sobre como:
1. Iniciar o MongoDB
2. Iniciar o servidor backend
3. Iniciar o aplicativo mobile

## Requisitos

- Node.js 18+
- MongoDB
- pnpm
- Expo CLI (para o app mobile)

Consulte a documentação interna de cada subprojeto para mais detalhes.
