import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 启用CORS - 允许微信小程序访问
  app.enableCors({
    origin: [
      'http://localhost:8080', 
      'http://localhost:3000',
      'https://servicewechat.com',  // 微信小程序
      /\.tcloudbase\.com$/,  // 腾讯云域名
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger文档
  const config = new DocumentBuilder()
    .setTitle('FireGrid API')
    .setDescription('消防车辆装备信息化服务平台 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 监听端口 - CloudBase 云托管默认使用 10000
  const port = process.env.PORT || 10000;
  await app.listen(port, '0.0.0.0');  // 必须绑定 0.0.0.0
  console.log(`🚀 FireGrid Backend running on port ${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}
bootstrap();