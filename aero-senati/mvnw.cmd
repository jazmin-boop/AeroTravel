@echo off
setlocal
set PROJECT_DIR=%~dp0
set LOCAL_MVN=%PROJECT_DIR%.tools\apache-maven-3.9.9\bin\mvn.cmd

if exist "%LOCAL_MVN%" (
    call "%LOCAL_MVN%" %*
) else (
    where mvn >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call mvn %*
    ) else (
        echo [ERROR] No se detecto Apache Maven en el PATH ni en .tools.
        echo Por favor abra la carpeta del proyecto en NetBeans IDE o IntelliJ IDEA.
        exit /b 1
    )
)
