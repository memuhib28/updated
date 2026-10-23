$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..
node node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& '.\node_modules\@esbuild\win32-x64\esbuild.exe' src/main.tsx --bundle --minify --sourcemap --format=esm --target=es2022 --outfile=dist/assets/app.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if (Test-Path public) { Copy-Item public/* dist/ -Recurse -Force }
$html = [IO.File]::ReadAllText((Join-Path (Get-Location) 'index.html')).Replace('/src/main.tsx','./assets/app.js').Replace('</head>','<link rel="stylesheet" href="./assets/app.css"/></head>')
[IO.File]::WriteAllText((Join-Path (Get-Location) 'dist/index.html'),$html)
& '.\node_modules\@esbuild\win32-x64\esbuild.exe' scripts/all-tests.ts --bundle --platform=node --format=esm --target=node18 --outfile=test-results/unit-tests.mjs --alias:vitest=./scripts/test-adapter.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node test-results/unit-tests.mjs
exit $LASTEXITCODE
