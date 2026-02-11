import { Controller, Body, Post } from "@nestjs/common";
import { AuthService, ITokenReturnBody } from "./auth.service";
import { LoginPayload } from "./payload/login.payload";
import { RegisterPayload } from "./payload/register.payload";
import { UserService } from "../user/user.service";
import { UserTypes } from "modules/user/user.model";
import { RedisGeoHelper } from 'modules/redis/redis-geo.helper';

/**
 * Authentication Controller
 */
@Controller("api/auth")
export class AuthController {
  /**
   * Constructor
   * @param {AuthService} authService authentication service
   * @param {UserService} UserService user service
   */
  constructor(
    private readonly authService: AuthService,
    private readonly UserService: UserService,
    private readonly geoHelper: RedisGeoHelper
  ) { }

  /**
   * Login route to validate and create tokens for users
   * @param {LoginPayload} payload the login dto
   */
  @Post("login")
  async login(@Body() payload: LoginPayload): Promise<ITokenReturnBody> {
    const user = await this.authService.validateUser(payload);
    return await this.authService.createToken(user);
  }

  /**
   * Registration route to create and generate tokens for users
   * @param {RegisterPayload} payload the registration dto
   */
  @Post("register")
  async register(@Body() payload: RegisterPayload): Promise<ITokenReturnBody> {
    const user = await this.UserService.create(payload);
    //  store current user location in redis 
    if(user.userType === UserTypes.TENANT) {
  
      const tenantId = user._id;
      const key = `geo:${tenantId}:${user.city}`;


      await this.geoHelper.addOrUpdateTenantLocation(
        key,
        user.location[0],
        user.location[1],
      );
    }else {
      const userId = user._id;
      const key = `geo:${user.city}`;

      await this.geoHelper.addOrUpdateUserLocation(
        key,
        user.location[0],
        user.location[1],
        userId.toString()
      );
    }

    return await this.authService.createToken(user);
  }
}
