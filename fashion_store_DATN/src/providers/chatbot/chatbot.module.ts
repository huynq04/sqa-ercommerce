import { Module } from '@nestjs/common';
import { ChatbotController } from '@providers/chatbot/chatbot.controller';
import { ChatbotService } from '@providers/chatbot/chatbot.service';
import { UserProductService } from '@modules/ecommerce/services/user-product.service';
import { UserPolicyService } from '@modules/ecommerce/services/user-policy.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';
import { AiVector } from '@modules/ecommerce/entities/aiVector.entity';
import { ChatbotRagService } from '@providers/chatbot/chatbot.rag.service';
import { EmbeddingService } from '@providers/chatbot/embedding.service';
import { VectorSearchService } from '@providers/chatbot/vector-search.service';
import { RedisCacheModule } from '@base/db/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, PolicyDocument, AiVector, ActivityLog]),
    RedisCacheModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotRagService,
    EmbeddingService,
    VectorSearchService,
    UserProductService,
    UserPolicyService,
  ],
  exports: [EmbeddingService, VectorSearchService],
})
export class ChatbotModule {}
