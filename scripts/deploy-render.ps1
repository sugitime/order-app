# Deploy order-app to Render via API.
# Prerequisites:
#   1. Push this repo to GitHub (e.g. https://github.com/sugitime/order-app)
#   2. Set RENDER_API_KEY in your environment
#   3. Run: .\scripts\deploy-render.ps1 -RepoUrl "https://github.com/sugitime/order-app"

param(
    [string]$RepoUrl = "https://github.com/sugitime/order-app",
    [string]$OwnerId = "tea-d8m251i8qa3s73b06upg",
    [string]$Branch = "main",
    [string]$Region = "oregon",
    [string]$AdminEmail = "kevin@sugiti.me",
    [string]$AdminPassword = ""
)

if (-not $env:RENDER_API_KEY) {
    Write-Error "Set RENDER_API_KEY before running this script."
    exit 1
}

if (-not $AdminPassword) {
    $AdminPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Write-Host "Generated SEED_ADMIN_PASSWORD: $AdminPassword"
}

$headers = @{
    Authorization = "Bearer $($env:RENDER_API_KEY)"
    "Content-Type" = "application/json"
}

function Invoke-RenderApi {
    param([string]$Method, [string]$Uri, $Body = $null)
    if ($Body) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10)
    }
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
}

Write-Host "Creating PostgreSQL database..."
$authSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

$db = Invoke-RenderApi -Method POST -Uri "https://api.render.com/v1/postgres" -Body @{
    name = "order-app-db"
    ownerId = $OwnerId
    plan = "free"
    region = $Region
    version = "16"
    databaseName = "order_app"
    databaseUser = "order_app"
}

$dbId = $db.id
Write-Host "Database ID: $dbId"

Write-Host "Waiting for database connection info..."
Start-Sleep -Seconds 15
$dbInfo = Invoke-RenderApi -Method GET -Uri "https://api.render.com/v1/postgres/$dbId/connection-info"
$databaseUrl = $dbInfo.connectionString

Write-Host "Creating Docker web service..."
$service = Invoke-RenderApi -Method POST -Uri "https://api.render.com/v1/services" -Body @{
    type = "web_service"
    name = "order-app"
    ownerId = $OwnerId
    repo = $RepoUrl
    branch = $Branch
    autoDeploy = "yes"
    serviceDetails = @{
        env = "docker"
        plan = "free"
        region = $Region
        healthCheckPath = "/order"
        envSpecificDetails = @{
            dockerContext = "."
            dockerfilePath = "./Dockerfile"
        }
    }
    envVars = @(
        @{ key = "DATABASE_URL"; value = $databaseUrl },
        @{ key = "AUTH_SECRET"; value = $authSecret },
        @{ key = "NODE_ENV"; value = "production" },
        @{ key = "RUN_SEED"; value = "true" },
        @{ key = "SEED_ADMIN_EMAIL"; value = $AdminEmail },
        @{ key = "SEED_ADMIN_PASSWORD"; value = $AdminPassword },
        @{ key = "APP_URL"; value = "https://order-app.onrender.com" }
    )
}

$serviceId = $service.service.id
$dashboard = $service.service.dashboardUrl
Write-Host "Service created: $dashboard"
Write-Host "Deploy ID: $($service.deployId)"
Write-Host ""
Write-Host "After deploy completes, sign in at /admin/login with:"
Write-Host "  Email: $AdminEmail"
Write-Host "  Password: $AdminPassword"
Write-Host ""
Write-Host "Update APP_URL in Render to the actual service URL once assigned."