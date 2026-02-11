import {
  BadRequestException,
  Controller,

  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { UserService } from "./user.service";
import { IUser } from "./user.model";

/**
 * User Controller
 */
@Controller("api/user")
export class UserController {
  /**
   * Constructor
   * @param userService
   */
  constructor(private readonly userService: UserService) { }

  /**
   * Retrieves a particular profile
   * @param username the profile given username to fetch
   * @returns {Promise<IProfile>} queried profile data
   */
  @Get(":email")
  @UseGuards(AuthGuard("jwt"))
  async getProfile(@Param("email") username: string): Promise<IUser> {
    const profile = await this.userService.getByEmail(username);
    if (!profile) {
      throw new BadRequestException(
        "The User with that email could not be found.",
      );
    }
    return profile;
  }
}
