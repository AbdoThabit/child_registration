import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ParentRegistrationLink } from './ParentRegistrationLinks';

@Entity('child_registrations')
export class ChildRegistration {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', name: 'registration_link_id' })
  registrationLinkId: number;

  @Column({ type: 'nvarchar', length: 255, name: 'child_name' })
  childName: string;

  @Column({ type: 'int', name: 'class_id' })
  classId: number;
  @Column({ type: 'nvarchar', length: 255, name: 'class_name', nullable: true })
  className: string;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: string;

  @CreateDateColumn({
    type: 'datetime2',
    precision: 7,
    name: 'created_at',
    default: () => 'SYSDATETIME()',
  })
  createdAt: Date;

  @Column({ type: 'int', name: 'approved_by_admin_id', nullable: true })
  approvedByAdminId: number | null;
  @Column({ type: 'nvarchar',   length: 250, name: 'parent_id' })
  parentId: string;
  @Column({ type: 'datetime', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'date', name: 'child_dob', nullable: true })
  childDob: Date | null;

  @Column({ type: 'int', nullable: true })
  gender: number  | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'child_photo', nullable: true })
  childPhoto: string | null;

  @Column({ type: 'nvarchar', length: 250, name: 'place_of_birth', nullable: true })
  placeOfBirth: string | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'special_needs', nullable: true })
  specialNeeds: string  | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'child_notes', nullable: true })
  childNotes: string  | null;

  @Column({ type: 'datetime2', precision: 7, name: 'submitted_at', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'admin_notes', nullable: true })
  adminNotes: string  | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'rejection_reason', nullable: true })
  rejectionReason: string   | null;

  @Column({ type: 'bit', name: 'can_takephoto', nullable: true })
  canTakePhoto: boolean | null;

  @Column({ type: 'date', name: 'registration_date', nullable: true })
  registrationDate: Date | null;

  @Column({ type: 'nvarchar', length: 'max', name: 'child_pin', nullable: true })
  childPin: string | null;

  @Column({ type: 'nvarchar', length: 250, nullable: true })
  nationality: string | null;

  @Column({ type: 'nvarchar', length: 250, name: 'nationality_id', nullable: true })
  nationalityId: string  | null;

  @Column({ type: 'nvarchar', length: 250, name: 'registration_id', nullable: true })
  registrationId: string | null;

  @Column({ type: 'bit', name: 'is_complete', default: false })
  isComplete: boolean;

  // --- Relationships ---

  @ManyToOne(() => ParentRegistrationLink, (link) => link.id)
  @JoinColumn({ name: 'registration_link_id' })
  registrationLink: ParentRegistrationLink;
}