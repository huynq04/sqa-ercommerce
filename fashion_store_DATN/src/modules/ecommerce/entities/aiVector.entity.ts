// src/modules/ai/aiVector.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';

export enum VectorType {
  PRODUCT = 'product',
  POLICY = 'policy',
}

@Entity('ai_vectors')
@Index(['type', 'entityId'], { unique: true })
export class AiVector extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: VectorType })
  type: VectorType;

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ type: 'text' })
  content: string; // Text content để embed (name + description, title + content)

  @Column({ type: 'json' })
  vector: number[]; // Embedding vector (array of numbers)
}
