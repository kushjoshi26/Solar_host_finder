import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User } from "./user.model";
import { Notification } from './notification.model';
import { UserController } from "./user.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: "User", schema: User }]), 
    MongooseModule.forFeature([{ name: "Notification", schema: Notification }])],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule { }
