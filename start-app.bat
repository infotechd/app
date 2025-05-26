@echo off
echo ===================================================
echo Iniciando o App - Backend MongoDB e Frontend Mobile
echo ===================================================
echo.

echo Verificando se o MongoDB está em execução...
sc query MongoDB > nul
if %ERRORLEVEL% NEQ 0 (
    echo MongoDB não está instalado como serviço ou não está em execução.
    echo Tentando iniciar o MongoDB...
    net start MongoDB
    if %ERRORLEVEL% NEQ 0 (
        echo AVISO: Não foi possível iniciar o MongoDB como serviço.
        echo Por favor, inicie o MongoDB manualmente e tente novamente.
        echo Consulte INSTRUCTIONS.md para mais detalhes.
        pause
        exit /b 1
    )
)
echo MongoDB está em execução.
echo.

echo Iniciando o Backend...
start cmd /k "cd backend && pnpm run dev"
echo.

echo Aguardando o backend iniciar (10 segundos)...
timeout /t 10 /nobreak > nul
echo.

echo Iniciando o Frontend Mobile...
start cmd /k "cd frontend\mobile && pnpm run start"
echo.

echo ===================================================
echo Aplicação iniciada!
echo.
echo O backend está rodando na porta 3000
echo O frontend mobile está rodando via Expo
echo.
echo Para parar a aplicação, feche as janelas de terminal abertas.
echo Para mais informações, consulte o arquivo INSTRUCTIONS.md
echo ===================================================
echo.
pause