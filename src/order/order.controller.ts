import { Controller, Post, Body, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { OrderService } from './order.service';
import { AtGuard } from '../common/guards';
import { OrderDto } from './dto';
import { Request } from 'express';
import { Public, GetCurrentUserId } from '../common/decorators';
import { Order } from '@prisma/client';

@Controller('order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

  @UseGuards(AtGuard)
  @Post('createOrder')
  @HttpCode(HttpStatus.CREATED)
  createOrder(
      @GetCurrentUserId() userId: number,
      @Body() createOrderDto: OrderDto,
  ): Promise<Order> {
      return this.orderService.createOrder(createOrderDto, userId);
  }
}
