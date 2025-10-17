#!/usr/bin/env node

/**
 * =====================================================
 * Node.js Script: Replace Production Products with Dev Products
 * =====================================================
 * This script provides a Node.js interface for replacing
 * production products with dev products
 * =====================================================
 */

const { Client } = require('pg');
const readline = require('readline');

// Configuration
const CONFIG = {
    // Update these with your database credentials
    connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name',
    sourceTable: 'products_bv_test', // or 'products_bvTest'
    createBackup: true,
    force: false
};

// Command line argument parsing
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--source-table':
            CONFIG.sourceTable = args[++i];
            break;
        case '--no-backup':
            CONFIG.createBackup = false;
            break;
        case '--force':
            CONFIG.force = true;
            break;
        case '--help':
            showHelp();
            process.exit(0);
            break;
    }
}

function showHelp() {
    console.log(`
Usage: node replace_prod_products.js [options]

Options:
  --source-table <name>  Source table name (default: products_bv_test)
  --no-backup           Skip creating backup
  --force               Skip confirmation prompt
  --help                Show this help message

Environment Variables:
  DATABASE_URL          PostgreSQL connection string

Examples:
  node replace_prod_products.js
  node replace_prod_products.js --source-table products_bvTest --force
  DATABASE_URL="postgresql://user:pass@localhost/db" node replace_prod_products.js
    `);
}

async function confirmAction() {
    if (CONFIG.force) return true;
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('Are you sure you want to replace production products with dev data? (yes/no): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}

async function executeQuery(client, query, params = []) {
    try {
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error(`Query failed: ${error.message}`);
        throw error;
    }
}

async function main() {
    const client = new Client({
        connectionString: CONFIG.connectionString
    });

    try {
        console.log('=====================================================');
        console.log('Product Data Replacement Script');
        console.log('=====================================================');
        
        await client.connect();
        console.log('✅ Connected to database successfully');

        // Step 1: Check if source table exists and has data
        console.log(`\n🔍 Checking source table: ${CONFIG.sourceTable}`);
        
        const sourceCheckQuery = `
            SELECT COUNT(*) as record_count 
            FROM information_schema.tables 
            WHERE table_name = $1
        `;
        
        const sourceResult = await executeQuery(client, sourceCheckQuery, [CONFIG.sourceTable]);
        
        if (sourceResult.rows[0].record_count === '0') {
            throw new Error(`Source table '${CONFIG.sourceTable}' does not exist!`);
        }

        // Check record count
        const countQuery = `SELECT COUNT(*) FROM ${CONFIG.sourceTable}`;
        const countResult = await executeQuery(client, countQuery);
        const recordCount = parseInt(countResult.rows[0].count);
        
        console.log(`📊 Source table has ${recordCount} records`);
        
        if (recordCount === 0) {
            throw new Error('Source table is empty!');
        }

        // Step 2: Create backup if requested
        if (CONFIG.createBackup) {
            console.log('\n💾 Creating backup of current products...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const backupTableName = `products_backup_${timestamp}`;
            
            const backupQuery = `
                DROP TABLE IF EXISTS ${backupTableName};
                CREATE TABLE ${backupTableName} AS 
                SELECT * FROM products;
            `;
            
            await executeQuery(client, backupQuery);
            console.log(`✅ Backup created: ${backupTableName}`);
        }

        // Step 3: Confirm action
        const confirmed = await confirmAction();
        if (!confirmed) {
            console.log('❌ Operation cancelled by user');
            return;
        }

        // Step 4: Clear and replace products
        console.log('\n🗑️  Clearing current products table...');
        
        const truncateQuery = 'TRUNCATE TABLE products RESTART IDENTITY CASCADE';
        await executeQuery(client, truncateQuery);

        console.log('📥 Inserting dev data into production table...');
        
        const insertQuery = `
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
            FROM ${CONFIG.sourceTable}
        `;
        
        const insertResult = await executeQuery(client, insertQuery);
        console.log(`✅ Successfully inserted ${insertResult.rowCount} records`);

        // Step 5: Verify
        const verifyQuery = 'SELECT COUNT(*) FROM products';
        const verifyResult = await executeQuery(client, verifyQuery);
        const finalCount = verifyResult.rows[0].count;
        
        console.log(`📊 Final product count: ${finalCount}`);

        // Step 6: Show sample data
        console.log('\n📋 Sample of new products:');
        const sampleQuery = `
            SELECT name, price, bv, category, is_active 
            FROM products 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        
        const sampleResult = await executeQuery(client, sampleQuery);
        
        sampleResult.rows.forEach(row => {
            console.log(`  - ${row.name} | ₹${row.price} | ${row.bv} BV | ${row.category} | Active: ${row.is_active}`);
        });

        console.log('\n=====================================================');
        console.log('✅ Product replacement completed successfully!');
        console.log('=====================================================');

    } catch (error) {
        console.error(`❌ Error occurred: ${error.message}`);
        console.error('Operation failed!');
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled promise rejection:', err);
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, CONFIG };
