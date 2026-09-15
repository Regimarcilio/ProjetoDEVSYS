import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoryModule } from './category/category.module.js';
import { ClientModule } from './client/client.module.js';
import { CompanyModule } from './company/company.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductModule } from './product/product.module.js';
import { OrderModule } from './order/order.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    PrismaModule,
    CompanyModule,
    ClientModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    UserModule,
    AuthModule,	    	
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
