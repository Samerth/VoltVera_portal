# =====================================================
# PowerShell Script: Replace Production Products with Dev Products
# =====================================================
# This script provides a Windows PowerShell interface
# for replacing production products with dev products
# =====================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "your_connection_string_here",
    
    [Parameter(Mandatory=$false)]
    [string]$SourceTable = "products_bv_test", # or "products_bvTest"
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateBackup = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Product Data Replacement Script" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Check if connection string is provided
if ($ConnectionString -eq "your_connection_string_here") {
    Write-Host "Please provide a valid connection string:" -ForegroundColor Yellow
    Write-Host ".\replace_prod_products.ps1 -ConnectionString 'Host=localhost;Database=your_db;Username=user;Password=pass'" -ForegroundColor Yellow
    exit 1
}

try {
    # Load PostgreSQL module if available
    if (Get-Module -ListAvailable -Name "Npgsql") {
        Import-Module Npgsql
    } else {
        Write-Host "Npgsql module not found. Please install it or use psql command line." -ForegroundColor Yellow
        Write-Host "Install: Install-Module -Name Npgsql" -ForegroundColor Yellow
        exit 1
    }
    
    # Create connection
    $connection = New-Object Npgsql.NpgsqlConnection($ConnectionString)
    $connection.Open()
    
    Write-Host "Connected to database successfully" -ForegroundColor Green
    
    # Step 1: Check if source table exists and has data
    $checkSourceQuery = @"
        SELECT COUNT(*) as record_count 
        FROM information_schema.tables 
        WHERE table_name = '$SourceTable'
    "@
    
    $command = New-Object Npgsql.NpgsqlCommand($checkSourceQuery, $connection)
    $sourceExists = $command.ExecuteScalar()
    
    if ($sourceExists -eq 0) {
        Write-Host "Source table '$SourceTable' does not exist!" -ForegroundColor Red
        exit 1
    }
    
    # Check record count
    $countQuery = "SELECT COUNT(*) FROM $SourceTable"
    $command = New-Object Npgsql.NpgsqlCommand($countQuery, $connection)
    $recordCount = $command.ExecuteScalar()
    
    Write-Host "Source table '$SourceTable' has $recordCount records" -ForegroundColor Green
    
    if ($recordCount -eq 0) {
        Write-Host "Source table is empty! Aborting..." -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Create backup if requested
    if ($CreateBackup) {
        Write-Host "Creating backup of current products..." -ForegroundColor Yellow
        
        $backupQuery = @"
            DROP TABLE IF EXISTS products_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss');
            CREATE TABLE products_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss') AS 
            SELECT * FROM products;
        "@
        
        $command = New-Object Npgsql.NpgsqlCommand($backupQuery, $connection)
        $command.ExecuteNonQuery()
        
        Write-Host "Backup created successfully" -ForegroundColor Green
    }
    
    # Step 3: Confirm action
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to replace production products with dev data? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "Operation cancelled by user" -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Step 4: Clear and replace products
    Write-Host "Clearing current products table..." -ForegroundColor Yellow
    
    $truncateQuery = "TRUNCATE TABLE products RESTART IDENTITY CASCADE;"
    $command = New-Object Npgsql.NpgsqlCommand($truncateQuery, $connection)
    $command.ExecuteNonQuery()
    
    Write-Host "Inserting dev data into production table..." -ForegroundColor Yellow
    
    $insertQuery = @"
        INSERT INTO products (
            id, name, description, price, bv, gst, 
            sponsor_income_percentage, category, purchase_type, 
            image_url, is_active, created_at, updated_at
        )
        SELECT 
            id, name, description, price, bv, gst,
            COALESCE(sponsor_income_percentage, '10.00'),
            category, purchase_type, image_url, is_active, 
            created_at, updated_at
        FROM $SourceTable;
    "@
    
    $command = New-Object Npgsql.NpgsqlCommand($insertQuery, $connection)
    $insertedRows = $command.ExecuteNonQuery()
    
    Write-Host "Successfully inserted $insertedRows records" -ForegroundColor Green
    
    # Step 5: Verify
    $verifyQuery = "SELECT COUNT(*) FROM products"
    $command = New-Object Npgsql.NpgsqlCommand($verifyQuery, $connection)
    $finalCount = $command.ExecuteScalar()
    
    Write-Host "Final product count: $finalCount" -ForegroundColor Green
    
    # Step 6: Show sample data
    Write-Host "`nSample of new products:" -ForegroundColor Cyan
    $sampleQuery = @"
        SELECT name, price, bv, category, is_active 
        FROM products 
        ORDER BY created_at DESC 
        LIMIT 5
    "@
    
    $command = New-Object Npgsql.NpgsqlCommand($sampleQuery, $connection)
    $reader = $command.ExecuteReader()
    
    while ($reader.Read()) {
        Write-Host "- $($reader['name']) | ₹$($reader['price']) | $($reader['bv']) BV | $($reader['category']) | Active: $($reader['is_active'])" -ForegroundColor White
    }
    $reader.Close()
    
    Write-Host "`n=====================================================" -ForegroundColor Green
    Write-Host "Product replacement completed successfully!" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Operation failed!" -ForegroundColor Red
} finally {
    if ($connection -and $connection.State -eq 'Open') {
        $connection.Close()
        Write-Host "Database connection closed" -ForegroundColor Yellow
    }
}

# Usage examples:
# .\replace_prod_products.ps1 -ConnectionString "Host=localhost;Database=mlm_db;Username=postgres;Password=password"
# .\replace_prod_products.ps1 -ConnectionString "Host=localhost;Database=mlm_db;Username=postgres;Password=password" -SourceTable "products_bvTest" -Force
