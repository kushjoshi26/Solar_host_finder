import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { UserService } from "modules/user/user.service";
import { RedisGeoHelper } from "modules/redis/redis-geo.helper";
import { IUser } from "modules/user/user.model";
import { UserThrottlerGuard } from "modules/user/user-throttler.guard";
import { Throttle } from "@nestjs/throttler";
import { sendNotificationPayload } from "./payload/sendNotfication-payload";
import { RedisSQSHelper } from "modules/redis/redis-sqs-helper";
import { INotification } from "modules/user/notification.model";

/**
 * App Controller
 */
@Controller()

export class AppController {
  /**
   * Constructor
   * @param appService
   * @param userService
   */
  constructor(
    private readonly userService: UserService,
    private readonly geoLocationHelper: RedisGeoHelper,
    private readonly sqsRedisHelper: RedisSQSHelper
  ) { }


  /**
   * Fetch hosts nearBy /api/nearby-hosts 
   * @returns { Promise<Partial<IUser[] | null>> } provide the list of users  
   */
  @Get("nearby-hosts")
  @UseGuards(AuthGuard("jwt"))
  @UseGuards(UserThrottlerGuard)
  @Throttle({
    default: { limit: 10, ttl: 60 },
  })
  async getNearByHost(@Req() req): Promise<Partial<IUser[] | null>> {
    // here we need to get the data from the redis if cache miss then find the data from the mongodb.
    const tenantData = await this.userService.get(req.user._id);
    if (!tenantData) {

      throw new UnauthorizedException(
        "Could not authenticate. Please try again.",
      );
    }
    const cityKey = `geo:${tenantData.city}`
    const tenantKey = `geo:${req.user._id.toString()}:${tenantData.city}`
    const findUserLocation = await this.geoLocationHelper.getTenantLocation(tenantKey)
    let latitude: string;
    let longitude: string;
    if (!findUserLocation) {
      // here cache miss
      const findDataFromDB = await this.userService.get(req.user._id)
      if (!findDataFromDB) {
        throw new BadRequestException(
          "Something went wrong.",
        );
      }
      latitude = findDataFromDB.location[1]
      longitude = findDataFromDB.location[0]
    } else {
      const locationObj = JSON.parse(findUserLocation);
      latitude = locationObj.latitude
      longitude = locationObj.longitude
    }
    let radius = 4;
    //  we need to get radius from env 
    const getDataFromTheCity: any = await this.geoLocationHelper.getNearby(cityKey, longitude, latitude, radius, 'km');
    if (!getDataFromTheCity) {
      // here cache miss 
      const findDataFromDB = await this.userService.getHosts(cityKey, longitude, latitude, radius * 1000);
      if (!findDataFromDB) {
        return null
      } else {
        return findDataFromDB
      }
    } else {
      return getDataFromTheCity
    }
  }



  /**
   * Send User Notification 
   * 
   */
  @Post("send-notification")
  @UseGuards(AuthGuard("jwt"))
  async sendNotification(@Req() req , @Body() body: sendNotificationPayload): Promise<Partial<INotification | null>> {
    const tenantId = req.user._id.toString()
    // here send data to SQS redis 
    const { hostId , mobileNumber ,customMessage} = body; 
    const key = `${hostId}-${req.user._id}`
    const data = {
      redisKey : key, 
      tenantId,
      hostId,
      notificationData: {
        customMessage, 
        date: Date.now(),
      }
    }
  
    const sendNotificationTOdb = await this.userService.createNotification(data);
    if (!sendNotificationTOdb) {
      throw new BadRequestException(
        "Something went wrong.",
      );
    } else {
      this.sqsRedisHelper.addNotificationToRedis(sendNotificationTOdb._id.toString(), tenantId, hostId, {
        mobileNumber: mobileNumber,
        customMessage,
        date: Date.now(),
      })

      return sendNotificationTOdb
    }
  }
}
