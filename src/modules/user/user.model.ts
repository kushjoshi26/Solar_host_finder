import { Schema, Document, Types } from "mongoose";
// import { AppRoles } from "modules/app/app.roles";
export enum UserTypes {
  TENANT = 'tenant',
  HOST = 'host',
}

/**
 * Mongoose User Schema
 */
export const User = new Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  city: { type: String, require: true },
  mobileNumber: { type: String, require: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  userType: { type: String, required: true, enum: UserTypes },
  date: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Mongoose Profile Document
 */
export interface IUser extends Document {
  /**
   * UUID
   */
  readonly _id: Types.ObjectId;

  /**
   * Email
   */
  readonly email: string;
  /**
   * userType 
   */
  readonly userType: string;
  /**
   * Name
   */
  readonly name: string;

  /**
   * City
   */
  readonly city: string;
  /**
   * Password
   */
  password: string;
  /**
   * Date
   */
  readonly date: Date;
  /**
   * Location
   */
  readonly location: [string, string];

  /**
  * mobileNumber
  */
  readonly mobileNumber: string;

}
