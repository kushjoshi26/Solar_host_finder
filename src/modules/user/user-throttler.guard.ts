import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {

    protected getTracker(req: Record<string, any>): Promise<string> {
        // If user exists, use user id
        if (req.user?._id) {
            return req.user._id.toString();
        }

        // fallback to IP
        return req.ip;
    }
}