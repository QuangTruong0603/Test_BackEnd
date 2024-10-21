import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRootAsync({
        useFactory: () => ({
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, 
            auth: {
              user: 'truongtran06032003@gmail.com',
              pass: 'pzgq ekyv vket cnnl', 
            },
          },
          defaults: {
            from: '"No Reply" <truongtran06032003@gmail.com>', 
          },
        }),
      }),
  ],
  providers: [EmailService],
  exports: [EmailService], 
})
export class EmailModule {}

