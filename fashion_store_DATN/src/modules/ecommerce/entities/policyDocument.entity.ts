import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@base/model/base.entity';

export enum PolicyType {
  RETURN = 'return_policy',
  WARRANTY = 'warranty_policy',
  PRIVACY = 'privacy_policy',
  TERMS = 'terms',
}

@Entity('policy_documents')
export class PolicyDocument extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: PolicyType })
  type: PolicyType;

  @Column({ type: 'text' })
  content: string;
}
