import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';

@Entity('ai_recommendation_vectors')
@Index(['productId'], { unique: true })
export class AiRecommendationVector extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json' })
  vector: number[];
}
