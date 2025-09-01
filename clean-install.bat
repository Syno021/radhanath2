@echo off
echo ======================================
echo 🔥 Cleaning node_modules and cache...
echo ======================================

:: Remove node_modules folder
rmdir /s /q node_modules

:: Remove package-lock.json if it exists
if exist package-lock.json del /f /q package-lock.json

:: Clear npm cache (optional but recommended)
npm cache clean --force

echo ======================================
echo 📦 Reinstalling dependencies...
echo ======================================

npm install

echo ======================================
echo ✅ Done! You can now run:
echo eas build -p android --profile preview
echo ======================================
pause
