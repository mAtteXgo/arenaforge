@echo off
setlocal
cd /d "%~dp0"

git status
git add -A
git commit -m "fix: separate collision groups so fighters collide"
git push

pause