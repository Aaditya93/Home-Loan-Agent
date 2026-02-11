import { readFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

import { scrapeAndSave } from './scrape.js';
import { processAndSave } from './ai-pipeline.js';
import { generateAllEmbeddings } from './embeddings.js';
import { ingestToDatabase } from './ingest.js';

dotenv.config();

interface BankConfig {
    key: string;
    name: string;
    url: string;
}

async function main() {
    console.log('🚀 Bank Data Scraping & AI Pipeline');
    console.log('====================================\n');

    // Check MongoDB connectivity
    const mongoUri = process.env.MONGODB_URI;
    const skipDb = !mongoUri || mongoUri.trim() === '';
    if (skipDb) {
        console.warn('⚠️  MONGODB_URI is not set in .env — DB ingestion will be SKIPPED.');
        console.warn('   Scraping, AI processing, and embedding generation will still run.\n');
    }

    // 1. Read banks config
    const configPath = path.resolve(import.meta.dirname, 'data', 'banks.json');
    const configRaw = await readFile(configPath, 'utf-8');
    const banks: BankConfig[] = JSON.parse(configRaw);

    console.log(`📋 Found ${banks.length} banks to process\n`);

    const results: { bank: string; status: string; error?: string }[] = [];

    for (const bank of banks) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🏦 Processing: ${bank.name} (${bank.key})`);
        console.log(`${'='.repeat(50)}`);

        try {
            // Step 1: Scrape the bank's webpage
            console.log('\n📌 Step 1: Scraping webpage...');
            const rawText = await scrapeAndSave(bank.key, bank.url);

            if (rawText.length < 100) {
                console.warn(`  ⚠️ Very little text scraped (${rawText.length} chars). The page may be JS-rendered.`);
            }

            // Step 2: Process with Gemini AI
            console.log('\n📌 Step 2: AI processing...');
            const sections = await processAndSave(bank.key, bank.name, rawText);

            // Step 3: Generate embeddings
            console.log('\n📌 Step 3: Generating embeddings...');
            const embeddingResults = await generateAllEmbeddings(bank.name, sections);

            // Step 4: Ingest into MongoDB (skip if no URI)
            if (!skipDb) {
                console.log('\n📌 Step 4: Ingesting into MongoDB...');
                const scrapedAt = new Date();
                await ingestToDatabase(bank.key, bank.name, bank.url, scrapedAt, embeddingResults);
            } else {
                console.log('\n📌 Step 4: Skipped (MONGODB_URI not set)');
            }

            console.log(`\n✅ ${bank.name} processed successfully!`);
            results.push({ bank: bank.name, status: '✅ Success' });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error(`\n❌ Failed to process ${bank.name}: ${errMsg}`);
            results.push({ bank: bank.name, status: '❌ Failed', error: errMsg });
        }

        // Rate limit delay between banks (avoid API throttling)
        console.log('\n  ⏳ Waiting 2s before next bank...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Summary
    console.log('\n\n' + '='.repeat(50));
    console.log('📊 PIPELINE SUMMARY');
    console.log('='.repeat(50));
    for (const r of results) {
        console.log(`  ${r.status} ${r.bank}${r.error ? ` — ${r.error}` : ''}`);
    }
    console.log(`\nTotal: ${results.filter((r) => r.status.includes('Success')).length}/${results.length} succeeded`);
    if (skipDb) {
        console.log('⚠️  DB ingestion was skipped. Set MONGODB_URI in .env and re-run to ingest.');
    }
    console.log('\n🏁 Pipeline complete!\n');

    // Exit after all work is done
    process.exit(0);
}

main().catch((error) => {
    console.error('💥 Fatal pipeline error:', error);
    process.exit(1);
});
