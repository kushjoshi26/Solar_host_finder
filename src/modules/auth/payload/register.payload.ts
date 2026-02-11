
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEnum,
  IsLatitude,
  IsLongitude,
} from "class-validator";
import { UserTypes } from "modules/user/user.model";

/**
 * Register Payload Class
 */
export class RegisterPayload {
  /**
   * Email field
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

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

  /*
  City field
  */

  @IsNotEmpty()
  city: string

  /**
   * User type field
   */
  @IsEnum(UserTypes)
  userType: string;
  /**
   * lat and long 
   */

  @IsLatitude()
  latitude: number; // or string if using @IsNumberString()

  @IsLongitude()
  longitude: number;


}
