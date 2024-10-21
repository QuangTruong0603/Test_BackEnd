import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderDto } from './dto';
@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) {}

  async createOrder(dto: OrderDto, userId: number) {
    return this.prisma.order.create({
      data: {
        totalPrice: dto.totalPrice,
        userId: userId,
      },
    });
  }
}
