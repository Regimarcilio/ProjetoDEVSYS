import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    if (company.status !== 'ACTIVE') {
      throw new BadRequestException('A empresa está inativa.');
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        companyId: dto.companyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado para esta empresa.',
      );
    }

    if (client.status !== 'ACTIVE') {
      throw new BadRequestException('O cliente está inativo.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        companyId: dto.companyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Usuário não encontrado para esta empresa.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('O usuário está inativo.');
    }

    const productIds = dto.items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      throw new ConflictException(
        'O mesmo produto não pode ser adicionado mais de uma vez ao pedido.',
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        companyId: dto.companyId,
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Um ou mais produtos não foram encontrados para esta empresa.',
      );
    }

    const inactiveProduct = products.find(
      (product) => product.status !== 'ACTIVE',
    );

    if (inactiveProduct) {
      throw new BadRequestException(
        `O produto "${inactiveProduct.name}" está inativo.`,
      );
    }

    const productsMap = new Map(
      products.map((product) => [product.id, product]),
    );

    let subtotal = new Prisma.Decimal(0);

    const itemsData = dto.items.map((item) => {
      const product = productsMap.get(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Produto ${item.productId} não encontrado.`,
        );
      }

      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(product.price);
      const itemSubtotal = quantity.mul(unitPrice);

      subtotal = subtotal.add(itemSubtotal);

      return {
        productId: product.id,
        quantity,
        unitPrice,
        discount: new Prisma.Decimal(0),
        subtotal: itemSubtotal,
      };
    });

    const discount = new Prisma.Decimal(dto.discount ?? 0);

    if (discount.greaterThan(subtotal)) {
      throw new BadRequestException(
        'O desconto não pode ser maior que o subtotal.',
      );
    }

    const total = subtotal.sub(discount);

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        companyId: dto.companyId,
      },
      orderBy: {
        number: 'desc',
      },
      select: {
        number: true,
      },
    });

    const number = (lastOrder?.number ?? 0) + 1;

    try {
      return await this.prisma.order.create({
        data: {
          companyId: dto.companyId,
          clientId: dto.clientId,
          userId: dto.userId,
          number,
          status: OrderStatus.DRAFT,
          subtotal,
          discount,
          total,
          items: {
            create: itemsData,
          },
        },
        include: this.getOrderInclude(),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Não foi possível gerar o número do pedido. Tente novamente.',
        );
      }

      throw error;
    }
  }

  async findAll(companyId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        companyId,
      },
      orderBy: {
        number: 'desc',
      },
      include: this.getOrderInclude(),
    });

    return orders;
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.getOrderInclude(),
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        subtotal: true,
        discount: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException(
        'Somente pedidos em rascunho podem ser alterados.',
      );
    }

    const discount = new Prisma.Decimal(dto.discount ?? order.discount ?? 0);

    if (discount.greaterThan(order.subtotal)) {
      throw new BadRequestException(
        'O desconto não pode ser maior que o subtotal.',
      );
    }

    const total = new Prisma.Decimal(order.subtotal).sub(discount);

    return this.prisma.order.update({
      where: { id },
      data: {
        discount,
        total,
      },
      include: this.getOrderInclude(),
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    this.validateStatusTransition(order.status, status);

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
      },
      include: this.getOrderInclude(),
    });
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    if (currentStatus === newStatus) {
      throw new BadRequestException(
        'O pedido já está neste status.',
      );
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.DRAFT]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.COMPLETED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Não é possível alterar o pedido de ${currentStatus} para ${newStatus}.`,
      );
    }
  }

  private getOrderInclude() {
    return {
      client: true,
      user: {
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    } satisfies Prisma.OrderInclude;
  }
}
