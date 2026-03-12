import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // 微信登录
  async wxLogin(code: string) {
    // TODO: 调用微信接口获取 openid
    // 暂时模拟
    const openid = `wx_${code}`;
    
    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { openId: openid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openId: openid,
          role: 'GUEST',
        },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      openid: user.openId,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar,
      },
    };
  }

  // 绑定手机号
  async bindPhone(userId: string, phone: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        phone,
        role: 'FIREFIGHTER', // 绑定后升级为消防用户
      },
    });

    // 创建消防用户档案
    await this.prisma.firefighterProfile.create({
      data: {
        userId: user.id,
      },
    });

    return user;
  }
}