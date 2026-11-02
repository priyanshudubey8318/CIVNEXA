@echo off
cd /d "C:\Users\priyanshu dubey\OneDrive\Desktop\PROJECTS\CIVNEXA"
title CIVNEXA - Frontend Dev Server (Port 5174)
powershell.exe -ExecutionPolicy Bypass -NoExit -Command "$host.UI.RawUI.WindowTitle = 'CIVNEXA - Frontend Dev Server (Port 5174)'; Set-Location 'C:\Users\priyanshu dubey\OneDrive\Desktop\PROJECTS\CIVNEXA'; cmd.exe /c 'npm run dev -- --port 5174'"
