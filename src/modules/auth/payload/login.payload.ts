import { IsAlphanumeric, IsNotEmpty, MinLength, IsEmail } from "class-validator";

/**
 * Login Paylaod Class
 */
export class LoginPayload {
  /**
   * email field
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Password field
   */
  @IsNotEmpty()
  @MinLength(8)
  password: string;

}
