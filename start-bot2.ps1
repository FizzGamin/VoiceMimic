# Start Bot 2 (uses .env.bot2 file with @ prefix)
Write-Host "Starting VoiceMimic Bot 2 (prefix: @)" -ForegroundColor Cyan

# Copy .env.bot2 to .env temporarily for this instance
Copy-Item .env.bot2 .env.bot2.backup -Force
$env:NODE_ENV = "bot2"

# Load environment from .env.bot2
Get-Content .env.bot2 | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

node src/index.js
