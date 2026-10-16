@echo off
chcp 65001 >nul
set "PATH=%PATH%;C:\Program Files\nodejs"
echo.
echo ╔══════════════════════════════════════╗
echo ║       🎭 MAFIA UZ BOT LAUNCHER       ║
echo ╚══════════════════════════════════════╝
echo.

:: Node.js borligini tekshirish
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js topilmadi!
    echo.
    echo 📥 Node.js yuklab olish: https://nodejs.org
    echo    LTS versiyasini yuklab, o'rnating.
    echo.
    pause
    exit /b 1
)

:: .env faylini tekshirish
if not exist ".env" (
    echo ⚠️  .env fayli topilmadi!
    echo.
    echo 📝 .env.example faylini .env ga nusxalang:
    echo    copy .env.example .env
    echo.
    echo Keyin .env faylini Notepad bilan oching va
    echo BOT_TOKEN va ADMIN_IDS ni to'ldiring.
    echo.
    pause
    exit /b 1
)

:: node_modules borligini tekshirish
if not exist "node_modules" (
    echo 📦 Kutubxonalar o'rnatilmoqda...
    echo.
    npm install
    if errorlevel 1 (
        echo ❌ Kutubxonalar o'rnatilmadi!
        pause
        exit /b 1
    )
    echo.
)

echo ✅ Hammasi tayyor!
echo.
echo 🚀 MAFIA UZ bot ishga tushmoqda...
echo ⏹️  To'xtatish uchun Ctrl+C bosing
echo.
node src/bot.js
pause
