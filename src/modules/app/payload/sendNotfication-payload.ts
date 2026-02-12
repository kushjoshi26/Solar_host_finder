
import {
  
  IsNotEmpty,
  
  IsAlphanumeric,
  IsMongoId,
  MaxLength,
  IsMobilePhone,
  isNotEmpty,
} from "class-validator";

/**
 * Send Notification payload
 */
export class sendNotificationPayload {
  /**
   * Email field
   */

  @IsMongoId()
  @IsNotEmpty()
  hostId: string;

  /**
   * Username field
   */

  @IsAlphanumeric()
  @IsNotEmpty()
  @MaxLength(300)
  customMessage: string;

  @IsMobilePhone()
  @IsNotEmpty()
  mobileNumber: string;

}
