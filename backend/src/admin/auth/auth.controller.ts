import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginBody {
  email: string;
  password: string;
}

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginBody) {
    if (!body.email || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    return this.authService.login(body.email, body.password);
  }
}
