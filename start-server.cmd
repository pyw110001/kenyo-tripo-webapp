@echo off
cd /d "%~dp0"
"C:\Program Files\Blender Foundation\Blender 4.2\4.2\python\bin\python.exe" -c "import sys; sys.path.insert(0, r'D:\01_AIGC\CODEX\kenyo-tripo-webapp\.pydeps'); import uvicorn; uvicorn.run('backend.main:app', host='127.0.0.1', port=8000)" 1>uvicorn.stdout.log 2>uvicorn.stderr.log
