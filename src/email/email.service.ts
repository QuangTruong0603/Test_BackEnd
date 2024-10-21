import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.mailerService.sendMail({
     to:to,
     from: 'truongtran06032003@gmail.com',
     subject: subject,
     text: text,
     html: text,
    });
  }
}
