
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsAlphanumeric,
  Matches,
} from "class-validator";

/**
 * Patch Profile Payload Class
 */
export class PatchProfilePayload {
  /**
   * Email field
   */

  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Username field
   */

  @IsAlphanumeric()
  @IsNotEmpty()
  username: string;

  /**
   * Name field
   */

  @Matches(/^[a-zA-Z ]+$/)
  @IsNotEmpty()
  name: string;

  /**
   * Password field
   */

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
