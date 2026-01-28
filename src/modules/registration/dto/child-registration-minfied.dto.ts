import { Expose } from "class-transformer";
export class ChildRegistrationMinifiedDto {
  @Expose({ name: 'id' })
  registrationId: number;
  @Expose()
  childName: string;
  @Expose()
  classId: number;
  @Expose()
  className?: string;
  @Expose()
  status: string;
  @Expose({name:'isComplete'})
  isCompleted: boolean;
  @Expose()
  isApproved: boolean;
}