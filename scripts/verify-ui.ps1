$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..
& '.\node_modules\@esbuild\win32-x64\esbuild.exe' tests/ui.test.ts --bundle --platform=node --format=cjs --target=node18 --outfile=test-results/ui-tests.cjs --loader:.css=empty --external:jsdom --external:react --external:react-dom/* --external:@testing-library/dom --external:fake-indexeddb
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node test-results/ui-tests.cjs
exit $LASTEXITCODE
