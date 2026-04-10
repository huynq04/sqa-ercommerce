// src/modules/logs/activityLog.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { BaseEntity } from '@base/model/base.entity';

@Entity('activity_logs')
@Index('uq_activity_log_unique', ['user', 'action', 'entityType', 'entityId'], {
  unique: true,
})
export class ActivityLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.activityLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;
}
