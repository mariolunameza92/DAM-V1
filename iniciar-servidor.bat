@echo off
REM ============================================================
REM  DAM V1 - Servidor local
REM  Doble clic para levantar http://localhost:3000
REM  Deja ESTA ventana abierta mientras trabajas.
REM  Para apagar el servidor: cierra la ventana o pulsa Ctrl+C.
REM ============================================================
cd /d "%~dp0"
echo.
echo  Iniciando servidor DAM V1 en http://localhost:3000 ...
echo  (No cierres esta ventana mientras uses el proyecto)
echo.
npx serve -l 3000 .
echo.
echo  El servidor se detuvo. Pulsa una tecla para cerrar.
pause >nul
