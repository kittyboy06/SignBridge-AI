@echo off
echo ==============================================
echo SignBridge AI - Reusable GitHub Pages Deployer
echo ==============================================

:: 1. Build the production assets
echo Building production assets...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed! Aborting deployment.
    exit /b %ERRORLEVEL%
)

:: 2. Get the current git remote URL dynamically
echo Retrieving remote repository URL...
for /f "tokens=*" %%i in ('git config --get remote.origin.url') do set REMOTE_URL=%%i

if "%REMOTE_URL%"=="" (
    echo [ERROR] No git remote origin URL found! Ensure you are inside a git repository with an origin remote.
    exit /b 1
)
echo Found remote: %REMOTE_URL%

:: 3. Prepare target folder
cd dist
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not navigate to dist/ directory. Ensure the build succeeded.
    exit /b 1
)

:: 4. Initialize temporary repo in dist and push
echo Initializing temporary git repository in dist...
git init
git add -A
git commit -m "Deploy to gh-pages [auto-generated]"
echo Pushing to gh-pages branch...
git push -f "%REMOTE_URL%" master:gh-pages

:: 5. Clean up and return
echo Cleaning up temporary git files...
rd /s /q .git
cd ..

echo ==============================================
echo Deployment completed successfully!
echo ==============================================
