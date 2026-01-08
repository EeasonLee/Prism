@echo off
REM Windows 版本的 commit-msg hook
REM 如果项目在 WSL 中，使用 wsl 命令执行

REM 获取当前目录
set "CURRENT_DIR=%~dp0"
echo %CURRENT_DIR% | findstr /i "\\wsl" >nul
if %errorlevel% equ 0 (
  REM 检测到 WSL 路径，使用 wsl 执行
  REM 将 Windows 路径转换为 WSL 路径
  for /f "delims=" %%i in ('wsl wslpath -a "%CURRENT_DIR%..\.."') do set "WSL_PROJECT_ROOT=%%i"
  wsl bash -c "cd '%WSL_PROJECT_ROOT%' && pnpm exec commitlint --edit '%1'"
  exit /b %errorlevel%
)

REM 正常 Windows 路径
cd /d "%CURRENT_DIR%..\.." || exit /b 1
call pnpm exec commitlint --edit %1
exit /b %errorlevel%

