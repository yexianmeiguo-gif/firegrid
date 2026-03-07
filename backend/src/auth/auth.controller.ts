import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

class WxLoginDto {
  code: string;
}

class BindPhoneDto {
  phone: string;
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('wx-login')
  @ApiOperation({ summary: '微信登录' })
  async wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.wxLogin(dto.code);
  }

  @Post('bind-phone')
  @ApiOperation({ summary: '绑定手机号' })
  async bindPhone(@Request() req, @Body() dto: BindPhoneDto) {
    return this.authService.bindPhone(req.user.sub, dto.phone);
  }
}