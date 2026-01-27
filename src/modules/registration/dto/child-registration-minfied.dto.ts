import { Expose } from "class-transformer";
export class ChildRegistrationMinifiedDto {
  @Expose()
  id: number;
  @Expose()
  childName: string;
  @Expose()
  classId: number;
  @Expose()
  className?: string;
}