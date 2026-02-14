import bcrypt from "bcrypt";
import * as crypto from "crypto";
import * as gravatar from "gravatar";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from "@nestjs/common";
import { IUser, UserTypes } from "./user.model";
import { RegisterPayload } from "modules/auth/payload/register.payload";
import { UserRoles } from "nest-access-control";
import { sendNotificationPayload } from "modules/app/payload/sendNotfication-payload";
import { INotification } from "./notification.model";
// import { AppRoles } from "../app/app.roles";

/**
 * Models a typical response for a crud operation
 */
export interface IGenericMessageBody {
  /**
   * Status message to return
   */
  message: string;
}

/**
 * user Service
 */
@Injectable()
export class UserService {
  /**
   * Constructor
   * @param {Model<IUser>} userModel
   */
  private saltRound: number
  constructor(
    @InjectModel("User") private readonly userModel: Model<IUser>,
    @InjectModel("Notification") private readonly notificationModel: Model<INotification>,
  
  ) {
    this.saltRound = 10
   }

  /**
   * Fetches a user from database by UUID
   * @param {string} id
   * @returns {Promise<IUser>} queried user data
   */
  get(id: string): Promise<IUser> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Fetches a user from database by email
   * @param {string} email
   * @returns {Promise<IUser>} queried user data
   */
  getByEmail(email: string): Promise<IUser> {
    return this.userModel.findOne({ email }).exec();
  }

  /* * Fetches a hosts list using radius
   * @param {string} city
   @param {string} longitude
   @param {string} latitude
   @param {number} maxDistance
   @returns {Promise<Partial<IUser[]>>} queried user data

  */
  getHostsByRadius(city: string,  longitude: string, latitude: string, maxDistance: number): Promise<Partial<IUser[]>> {
    return this.userModel.find({
      city: city, 
      userType : UserTypes.HOST,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance, 
        },
      },

    }).select({password: -1}).exec();;
  }

  /**
   * 
   */
  
  async createNotification(payload): Promise<INotification> {
    const notification = new this.notificationModel({
      ...payload,
      // password: crypto.createHmac("sha256", payload.password).digest("hex"),
      // type: user.userType
    });

    return notification.save();
  }
  /**
   * Fetches a user by their email and hashed password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<IUser>} queried user data
   */
  async getByEmailAndPass(email: string, password: string): Promise<IUser> {
    const userData =  await this.userModel
      .findOne({
        email,
      })
      .exec();
    if (userData) {
    const isPasswordValid =  await bcrypt.compare(password, userData.password);
      if(isPasswordValid) {
        delete userData.password 
        return userData
      }
    }
  }

  /**
   * Create a user with RegisterPayload fields
   * @param {RegisterPayload} payload user payload
   * @returns {Promise<IUser>} created user data
   */
  async create(payload: RegisterPayload): Promise<IUser> {
    const user = await this.getByEmail(payload.email);
    if (user) {
      throw new NotAcceptableException(
        "The account with the provided email currently exists. Please choose another one.",
      );
    }
    // this will auto assign the admin role to each created user
    const createduser = new this.userModel({
      ...payload,
      location: [payload.longitude, payload.latitude],
      password: bcrypt.hash(payload.password, this.saltRound),
      type: user.userType
    });

    return createduser.save();
  }

  /**
   * send User hosts in given radius
   */
  async getHosts(city: string, longitude: string, latitude: string, maxDistance: number): Promise<IUser[]> {
    const user = await this.getHostsByRadius(city, longitude, latitude, maxDistance);
    return user
  }
}
