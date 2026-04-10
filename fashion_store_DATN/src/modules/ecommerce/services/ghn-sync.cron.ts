// shipping/cron/ghn-sync.cron.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ShipmentOrder } from '@modules/ecommerce/entities/shipmentOrder.entity';

import { ShipmentSyncService } from '@modules/ecommerce/services/shipment-sync.service';
import { ShipmentStatus } from '@modules/ecommerce/enums/shipmentStatus.enum';
import { ExchangeStatus } from '@modules/ecommerce/enums/exchangeStatus.enum';
import { ExchangeRequest } from '@modules/ecommerce/entities/exchangeRequest.entity';

@Injectable()
export class GhnSyncCron {
  constructor(
    @InjectRepository(ShipmentOrder)
    private shipmentRepo: Repository<ShipmentOrder>,
    private syncService: ShipmentSyncService,
    @InjectRepository(ExchangeRequest)
    private exchangeRepo: Repository<ExchangeRequest>,
  ) {}

  @Cron('*/10 * * * * *')
  async handle() {
    console.log('ok');
    const shipments = await this.shipmentRepo.find({
      where: {
        shipmentStatus: Not(
          In([
            ShipmentStatus.DELIVERED,
            ShipmentStatus.RETURNED,
            ShipmentStatus.CANCEL,
          ]),
        ),
      },
    });
    console.log(shipments);
    for (const shipment of shipments) {
      await this.syncService.syncShipment(shipment);
    }
  }

  @Cron('*/10 * * * * *')
  async handleExchange() {
    console.log('okssssss');
    const shipments = await this.shipmentRepo.find({
      where: {
        shipmentStatus: ShipmentStatus.DELIVERED,
        type: 'exchange_delivery',
      },
    });

    for (const shipment of shipments) {
      try {
        const exchange = await this.exchangeRepo.findOneBy({
          id: shipment.exchangeRequestId,
        });

        if (!exchange) {
          console.error(
            `[GHN EXCHANGE CRON] ExchangeRequest not found`,
            shipment.exchangeRequestId,
          );
          continue;
        }

        if (exchange.status !== ExchangeStatus.COMPLETED) {
          exchange.status = ExchangeStatus.COMPLETED;
          await this.exchangeRepo.save(exchange);
        }
      } catch (err) {
        console.error(`[GHN EXCHANGE CRON] Error shipment ${shipment.id}`, err);
      }
    }
  }
}
