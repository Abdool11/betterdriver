# TAG Ecosystem — Automated Test Runner
# Usage: .\run-tests.ps1 [api|ui|e2e|all]

param(
    [string]$Suite = "all"
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TAG Ecosystem Automated Test Runner" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

switch ($Suite.ToLower()) {
    "api" {
        Write-Host "Running API tests only..." -ForegroundColor Yellow
        npx playwright test api/
    }
    "ui" {
        Write-Host "Running UI smoke tests only..." -ForegroundColor Yellow
        npx playwright test ui/
    }
    "e2e" {
        Write-Host "Running E2E flow tests only..." -ForegroundColor Yellow
        npx playwright test e2e/
    }
    default {
        Write-Host "Running full test suite (API + UI + E2E)..." -ForegroundColor Yellow
        npx playwright test
    }
}

$exitCode = $LASTEXITCODE

Write-Host "`n========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "  SOME TESTS FAILED (exit $exitCode)" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nHTML report: tests\playwright-report\index.html" -ForegroundColor Gray
Write-Host "To view:     npx playwright show-report`n" -ForegroundColor Gray

exit $exitCode
