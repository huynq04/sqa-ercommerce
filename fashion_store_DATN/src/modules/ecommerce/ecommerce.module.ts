import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@modules/ecommerce/entities/product.entity';
import { ActivityLog } from '@modules/ecommerce/entities/activityLog.entity';
import { AiVector } from '@modules/ecommerce/entities/aiVector.entity';
import { AiRecommendationVector } from '@modules/ecommerce/entities/aiRecommendationVector.entity';
import { Cart } from '@modules/ecommerce/entities/cart.entity';
import { CartItem } from '@modules/ecommerce/entities/cartItem.entity';
import { Category } from '@modules/ecommerce/entities/category.entity';
import { DiscountCode } from '@modules/ecommerce/entities/discountCode.entity';
import { Notification } from '@modules/ecommerce/entities/notification.entity';
import { Order } from '@modules/ecommerce/entities/order.entity';
import { OrderItem } from '@modules/ecommerce/entities/orderItem.entity';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';
import { ProductColor } from '@modules/ecommerce/entities/productColor.entity';
import { ProductImage } from '@modules/ecommerce/entities/productImage.entity';
import { ProductSize } from '@modules/ecommerce/entities/productSize.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
// import { ReturnRequest } from '@modules/ecommerce/entities/returnRequest.entity';
// import { WarrantyRequest } from '@modules/ecommerce/entities/warrantyRequest.entity';
import { ProductReview } from '@modules/ecommerce/entities/productReview.entity';
import { UsersModule } from '@modules/user/user.module';
import { User } from '@modules/user/entities/user.entity';
import { AdminCategoryController } from '@modules/ecommerce/controllers/admin-category.controller';
import { AdminCategoryService } from '@modules/ecommerce/services/admin-category.service';
import { AdminProductService } from '@modules/ecommerce/services/admin-product.service';
import {
  AdminProductColorController,
  AdminProductController,
  AdminProductImageController,
  AdminProductSizeController,
  AdminProductVariantController,
} from '@modules/ecommerce/controllers/admin-product.controller';
import { UserProductService } from '@modules/ecommerce/services/user-product.service';
import { UserCategoryService } from '@modules/ecommerce/services/user-category.service';
import { UserCategoryController } from '@modules/ecommerce/controllers/user-category.controller';
import { UserProductController } from '@modules/ecommerce/controllers/user-product.controller';
import { AdminProductVariantService } from '@modules/ecommerce/services/admin-product-variant.service';
import { AdminProductColorService } from '@modules/ecommerce/services/admin-product-color.service';
import { AdminProductSizeService } from '@modules/ecommerce/services/admin-product-size.service';
import { AdminProductImageService } from '@modules/ecommerce/services/admin-product-image.service';
import { AdminOrderController } from '@modules/ecommerce/controllers/admin-order.controller';
import { AdminReportController } from '@modules/ecommerce/controllers/admin-report.controller';
import { UserCartController } from '@modules/ecommerce/controllers/user-cart.controller';
import { UserOrderController } from '@modules/ecommerce/controllers/user-order.controller';
import { AdminOrderService } from '@modules/ecommerce/services/admin-order.service';
import { AdminReportService } from '@modules/ecommerce/services/admin-report.service';
import { UserCartService } from '@modules/ecommerce/services/user-cart.service';
import { UserOrderService } from '@modules/ecommerce/services/user-order.service';
import { UserPolicyService } from '@modules/ecommerce/services/user-policy.service';
import { AdminPolicyService } from '@modules/ecommerce/services/admin-policy.service';
import { UserPolicyController } from '@modules/ecommerce/controllers/user-policy.controller';
import { AdminPolicyController } from '@modules/ecommerce/controllers/admin-policy.controller';
import { AdminDiscountController } from '@modules/ecommerce/controllers/admin-discount.controller';
import { UserDiscountController } from '@modules/ecommerce/controllers/user-discount.controller';
import { AdminDiscountService } from '@modules/ecommerce/services/admin-discount.service';
import { UserDiscountService } from '@modules/ecommerce/services/user-discount.service';
import { VnpayModule } from '@providers/vnpay/vnpay.module';
import { VnpayService } from '@providers/vnpay/vnpay.service';
import { GhnModule } from '@providers/ghn/ghn.module';
import { OrderScheduler } from '@modules/ecommerce/services/order.scheduler.service';
import { ChatbotModule } from '@providers/chatbot/chatbot.module';
import { RecommendationService } from '@modules/ecommerce/services/recommendation.service';
import { UserRecommendationController } from '@modules/ecommerce/controllers/user-recommendation.controller';
import { UserReviewController } from '@modules/ecommerce/controllers/user-review.controller';
import { AdminReviewController } from '@modules/ecommerce/controllers/admin-review.controller';
import { UserReviewService } from '@modules/ecommerce/services/user-review.service';
import { AdminReviewService } from '@modules/ecommerce/services/admin-review.service';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';
import { ShipmentSyncService } from '@modules/ecommerce/services/shipment-sync.service';
import { GhnSyncCron } from '@modules/ecommerce/services/ghn-sync.cron';
import { ShipmentHistory } from '@modules/ecommerce/entities/shipmentHistory.entity';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';
import { UserExchangeRequestService } from '@modules/ecommerce/services/user-exchange-request.service';
import { UserExchangeRequestController } from '@modules/ecommerce/controllers/user-exchange-request.controller';
import { AdminExchangeRequestController } from '@modules/ecommerce/controllers/admin-exchange-request.controller';
import { AdminExchangeRequestService } from '@modules/ecommerce/services/admin-exchange-request.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductColor,
      ProductImage,
      ProductSize,
      ProductVariant,
      ActivityLog,
      AiVector,
      AiRecommendationVector,
      Cart,
      CartItem,
      Category,
      DiscountCode,
      Notification,
      Order,
      OrderItem,
      PolicyDocument,
      // ReturnRequest,
      // WarrantyRequest,
      ProductReview,
      User,
      ShipmentOrder,
      ShipmentHistory,
      ExchangeRequest,
    ]),
    UsersModule,
    VnpayModule,
    GhnModule,
    ChatbotModule,
  ],
  providers: [
    AdminCategoryService,
    AdminProductService,
    AdminProductVariantService,
    AdminProductColorService,
    AdminProductSizeService,
    AdminProductImageService,
    AdminOrderService,
    AdminReportService,
    AdminDiscountService,
    AdminPolicyService,
    UserCategoryService,
    UserProductService,
    UserCartService,
    UserOrderService,
    UserDiscountService,
    UserPolicyService,
    RecommendationService,
    UserReviewService,
    AdminReviewService,
    AdminExchangeRequestService,
    VnpayService,
    OrderScheduler,
    ShipmentSyncService,
    GhnSyncCron,
    UserExchangeRequestService,
  ],
  controllers: [
    AdminCategoryController,
    AdminProductController,
    AdminProductVariantController,
    AdminProductColorController,
    AdminProductSizeController,
    AdminProductImageController,
    AdminOrderController,
    AdminReportController,
    AdminDiscountController,
    AdminPolicyController,
    UserCategoryController,
    UserProductController,
    UserCartController,
    UserOrderController,
    UserDiscountController,
    UserPolicyController,
    UserRecommendationController,
    UserReviewController,
    AdminReviewController,
    UserExchangeRequestController,
    AdminExchangeRequestController,
  ],
  exports: [UserOrderService, UserProductService, UserPolicyService],
})
export class EcommerceModule {}
