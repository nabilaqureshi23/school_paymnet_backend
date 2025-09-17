import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

async register(dto: RegisterDto) {
  const { name, email, password } = dto;
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ name, email, password: hashed });
    return { success: true, userId: user._id };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return { success: true, access_token: token };
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId).lean();
  }
}
