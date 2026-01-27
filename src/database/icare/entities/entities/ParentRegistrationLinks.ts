
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ChildRegistration } from './ChildRegistration';

@Entity('parent_registration_links')
export class ParentRegistrationLink {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 128 })
  token: string;

  @Column({ type: 'int', name: 'center_id' })
  centerId: number;

  @Column({ type: 'int', name: 'parent_id' })
  parentId: number;

  @Column({ type: 'nvarchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'datetime', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', name: 'max_children', nullable: true })
  maxChildren: number;

  @Column({ type: 'int', name: 'used_children_count', default: 0 })
  usedChildrenCount: number;

  @Column({ type: 'int', name: 'created_by_admin_id' })
  createdByAdminId: number;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
    default: () => 'SYSDATETIME()',
  })
  createdAt: Date;



  @OneToMany(() => ChildRegistration, registration => registration.registrationLink)
  childRegistrations: ChildRegistration[];

  // Computed property for remaining slots
  get remainingSlots(): number | null {
    if (this.maxChildren === null) return null;
    return this.maxChildren - this.usedChildrenCount;
  }

  // Helper method to check if link can accept more children
  canAcceptMoreChildren(): boolean {
    if (this.status !== 'active') return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    if (this.maxChildren === null) return true;
    return this.usedChildrenCount < this.maxChildren;
  }
}