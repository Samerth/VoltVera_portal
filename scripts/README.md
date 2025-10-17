# Product Data Replacement Scripts

This directory contains scripts to replace production product table data with development/test product table data.

## 📁 Available Scripts

### 1. `replace_prod_products_with_dev.sql` (Comprehensive)
- **Best for**: Production environments, full safety
- **Features**: 
  - Automatic backup creation
  - Data validation
  - Error handling
  - Verification steps
  - Detailed logging
- **Usage**: Run directly in PostgreSQL client

### 2. `quick_replace_prod_products.sql` (Simple)
- **Best for**: Development/testing environments
- **Features**: 
  - Minimal safety checks
  - Quick execution
  - Basic verification
- **Usage**: Run directly in PostgreSQL client

### 3. `replace_prod_products.ps1` (PowerShell)
- **Best for**: Windows environments
- **Features**: 
  - Interactive prompts
  - Parameter support
  - Error handling
  - Progress reporting
- **Usage**: PowerShell script

### 4. `replace_prod_products.js` (Node.js)
- **Best for**: Cross-platform automation
- **Features**: 
  - Command-line arguments
  - Environment variable support
  - Async/await handling
  - JSON output support
- **Usage**: Node.js script

## 🚀 Quick Start

### Option 1: SQL Script (Recommended for Production)

```bash
# 1. Connect to your database
psql -h localhost -U username -d database_name

# 2. Run the comprehensive script
\i scripts/replace_prod_products_with_dev.sql

# 3. Or run the quick script
\i scripts/quick_replace_prod_products.sql
```

### Option 2: PowerShell (Windows)

```powershell
# Basic usage
.\scripts\replace_prod_products.ps1 -ConnectionString "Host=localhost;Database=mlm_db;Username=postgres;Password=password"

# With custom source table
.\scripts\replace_prod_products.ps1 -ConnectionString "Host=localhost;Database=mlm_db;Username=postgres;Password=password" -SourceTable "products_bvTest" -Force
```

### Option 3: Node.js (Cross-platform)

```bash
# Install dependencies
npm install pg

# Basic usage
node scripts/replace_prod_products.js

# With environment variable
DATABASE_URL="postgresql://user:pass@localhost/db" node scripts/replace_prod_products.js

# With command line arguments
node scripts/replace_prod_products.js --source-table products_bvTest --force
```

## 📋 Prerequisites

### Database Requirements
- PostgreSQL database
- Access to both production and development product tables
- Appropriate permissions to TRUNCATE and INSERT

### Source Tables
The scripts automatically detect and use one of these tables:
- `products_bv_test` (preferred)
- `products_bvTest` (alternative)

### Required Dependencies

#### PowerShell Script
```powershell
Install-Module -Name Npgsql
```

#### Node.js Script
```bash
npm install pg
```

## ⚙️ Configuration

### Environment Variables
```bash
# Node.js script
export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### Connection Strings
```
Host=localhost;Database=mlm_db;Username=postgres;Password=password
```

## 🔧 Customization

### Modify Source Table
If your dev products are in a different table, update the `SourceTable` parameter:

**SQL Scripts**: Edit the table name in the INSERT statement
**PowerShell**: Use `-SourceTable "your_table_name"`
**Node.js**: Use `--source-table your_table_name`

### Add Custom Fields
If your dev table has additional fields, modify the INSERT statements:

```sql
INSERT INTO products (
    id, name, description, price, bv, gst, 
    sponsor_income_percentage, category, purchase_type, 
    image_url, is_active, created_at, updated_at,
    custom_field_1, custom_field_2  -- Add your custom fields
)
SELECT 
    id, name, description, price, bv, gst,
    COALESCE(sponsor_income_percentage, '10.00'),
    category, purchase_type, image_url, is_active, 
    created_at, updated_at,
    custom_field_1, custom_field_2  -- Add your custom fields
FROM your_dev_table;
```

## 🛡️ Safety Features

### Automatic Backups
- All scripts create timestamped backups
- Backup tables: `products_backup_YYYYMMDD_HHMMSS`
- Easy restoration if needed

### Data Validation
- Source table existence check
- Record count verification
- Post-operation verification

### Confirmation Prompts
- Interactive confirmation (except with `--force`)
- Clear warnings about data replacement
- Cancellation support

## 🔄 Restoration

If you need to restore the original data:

```sql
-- 1. Clear current products
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- 2. Restore from backup
INSERT INTO products SELECT * FROM products_backup_before_dev_replace;

-- 3. Verify restoration
SELECT COUNT(*) FROM products;
```

## 📊 Verification Steps

After running any script, verify:

1. **Record Count**: Check if expected number of products exist
2. **Sample Data**: Review a few products to ensure data integrity
3. **Application Testing**: Test product catalog and purchase flows
4. **Related Tables**: Ensure no foreign key issues

## 🚨 Troubleshooting

### Common Issues

#### "Source table does not exist"
- Verify table name: `products_bv_test` or `products_bvTest`
- Check database connection
- Ensure proper permissions

#### "Source table is empty"
- Populate your dev table first
- Check if you're looking at the right database
- Verify table name

#### "Permission denied"
- Ensure user has TRUNCATE permissions
- Check INSERT permissions
- Verify table ownership

#### "Foreign key constraint violation"
- Check if other tables reference products
- Temporarily disable constraints if needed
- Consider using CASCADE options

### Debug Mode

#### PowerShell
```powershell
# Enable verbose output
$VerbosePreference = "Continue"
.\scripts\replace_prod_products.ps1 -ConnectionString "..." -Verbose
```

#### Node.js
```bash
# Enable debug logging
DEBUG=* node scripts/replace_prod_products.js
```

## 📝 Logging

### SQL Scripts
- Use `RAISE NOTICE` for progress updates
- Check PostgreSQL logs for detailed information
- Review backup table creation messages

### PowerShell/Node.js
- Console output with color coding
- Progress indicators
- Error details with stack traces

## 🔐 Security Considerations

1. **Connection Strings**: Never commit credentials to version control
2. **Permissions**: Use least-privilege database accounts
3. **Backups**: Store backups securely
4. **Testing**: Always test in non-production first

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Verify your database setup
3. Test with the quick script first
4. Review PostgreSQL logs for detailed errors

## 📄 License

These scripts are provided as-is for internal use. Modify as needed for your specific requirements.
