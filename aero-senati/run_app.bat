@echo off
title AERO-SENATI - Servidor Spring Boot
color 0b
echo ============================================================
echo   AERO-SENATI: SISTEMA DE VENTA DE PASAJES AEREOS (PDSD643)
echo   Evaluacion Final Integral - Jazmin Chamorro Arone
echo ============================================================
echo.

set PROJECT_DIR=%~dp0
set MAVEN_BIN=%PROJECT_DIR%.tools\apache-maven-3.9.9\bin\mvn.cmd

if exist "%MAVEN_BIN%" (
    echo [OK] Utilizando Apache Maven embebido...
    call "%MAVEN_BIN%" spring-boot:run
) else (
    echo [INFO] Buscando mvn en el sistema...
    where mvn >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call mvn spring-boot:run
    ) else (
        echo [ERROR] No se encontro Maven en el PATH ni en .tools.
        echo Abra el proyecto en Apache NetBeans IDE o IntelliJ IDEA.
        pause
    )
)
pause

