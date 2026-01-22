export class UserResponseDto {
  id: number;
  username: string | null;
  isAdmin: boolean | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}