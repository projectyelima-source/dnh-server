import { Global, Module } from '@nestjs/common';
import { OtpModule } from './otp/otp.module';

@Global()
@Module({
	imports: [OtpModule],
	exports: [OtpModule],
})
export class SecurityModule {}
