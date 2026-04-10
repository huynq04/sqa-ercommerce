import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app.module';
import { VectorSearchService } from '@providers/chatbot/vector-search.service';
import { UserProductService } from '@modules/ecommerce/services/user-product.service';
import { UserPolicyService } from '@modules/ecommerce/services/user-policy.service';
import { Logger } from '@nestjs/common';

/**
 * Script to generate embeddings for all existing products and policies
 *
 * Usage:
 * 1. Make sure API_KEY (Gemini API key) is set in .env
 * 2. Run: npm run build
 * 3. Run: node dist/src/providers/chatbot/scripts/generate-embeddings.js
 *
 * Or use ts-node:
 * npx ts-node src/providers/chatbot/scripts/generate-embeddings.ts
 *
 * Note: Uses Gemini Embedding API (gemini-embedding-001) - same API key as chatbot
 */
async function generateEmbeddings() {
  const logger = new Logger('GenerateEmbeddings');

  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule);

    const vectorSearchService = app.get(VectorSearchService);
    const productService = app.get(UserProductService);
    const policyService = app.get(UserPolicyService);

    logger.log('🚀 Starting embedding generation...');

    // Generate embeddings for all products
    logger.log('📦 Fetching all products...');
    let productCount = 0;
    let productErrors = 0;
    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const products = await productService.findAll({ page, limit });
        const productList = products.data || [];

        if (productList.length === 0) {
          hasMore = false;
          break;
        }

        logger.log(
          `📄 Processing page ${page} (${productList.length} products)...`,
        );

        for (const product of productList) {
          try {
            await vectorSearchService.upsertProductVector(product);
            productCount++;
            if (productCount % 10 === 0) {
              logger.log(`✅ Processed ${productCount} products...`);
            }
            // Add small delay to avoid rate limiting (OpenAI has rate limits)
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error: any) {
            productErrors++;
            logger.error(
              `❌ Error generating embedding for product ${product.id}: ${error.message}`,
            );
            // Continue with next product even if one fails
          }
        }

        // Check if there are more products
        if (productList.length < limit || productCount >= products.total) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error: any) {
        logger.error(
          `❌ Error fetching products page ${page}: ${error.message}`,
        );
        hasMore = false;
      }
    }
    logger.log(
      `✅ Generated embeddings for ${productCount} products (${productErrors} errors)`,
    );

    // Generate embeddings for all policies
    logger.log('📄 Fetching all policies...');
    const policies = await policyService.findAll();

    logger.log(`Found ${policies.length} policies. Generating embeddings...`);
    let policyCount = 0;
    let policyErrors = 0;

    for (const policy of policies) {
      try {
        await vectorSearchService.upsertPolicyVector(policy);
        policyCount++;
        logger.log(
          `✅ Processed ${policyCount}/${policies.length} policies...`,
        );
        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error: any) {
        policyErrors++;
        logger.error(
          `❌ Error generating embedding for policy ${policy.id}: ${error.message}`,
        );
        // Continue with next policy even if one fails
      }
    }
    logger.log(
      `✅ Generated embeddings for ${policyCount} policies (${policyErrors} errors)`,
    );

    logger.log('🎉 Embedding generation completed!');
    logger.log(`📊 Summary: ${productCount} products, ${policyCount} policies`);
  } catch (error: any) {
    logger.error(`💥 Fatal error: ${error.message}`, error.stack);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

generateEmbeddings();
