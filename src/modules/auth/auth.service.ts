

import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CenterUsers } from '../../database/isecure/entities/entities/CenterUsers';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { TokenResponse } from './dto/token-reponse';
import { JwtPayload } from './dto/jwt-payload';
import { UserResponseDto } from './dto/user-response.dto';
import { SecUsers } from 'src/database/icare/entities/entities/SecUsers';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';


/**
 * Handles all user authentication logic, including registration, login,
 * and token management using TypeORM and argon2.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(CenterUsers, 'isecure')
    private centerUsersRepository: Repository<CenterUsers>,
    @InjectRepository(SecUsers, 'icare')
    private secUsersRepository: Repository<SecUsers>,
    @InjectRepository(CareCenter, 'icare')
    private centerRepository: Repository<CareCenter>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectDataSource('isecure') private dataSource: DataSource,) { }



  /**
     * Registers a new user with a securely hashed password.
     * @param createUserDto The user data for registration.
     * @returns The newly created user's public information.
     * @throws {ConflictException} If the username or other unique constraints are violated.
     * @throws {InternalServerErrorException} If a database error occurs.
  */

  async register(createUserDto: SignUpDto): Promise<UserResponseDto> {
    const existingUser = await this.centerUsersRepository.findOne({
      where: [{ username: createUserDto.username }],
    });
    const existingSecUser = await this.secUsersRepository.findOne({
      where: { username: createUserDto.username }
    })
    const center = await this.centerRepository.findOne({
      where: { centerId: createUserDto.centerId }
    })


    if (existingUser || existingSecUser || !center) {
      throw new ConflictException('User with that username already exists');
    }

    const hashedPassword = await argon2.hash(createUserDto.password);


    const newSecUser = await this.secUsersRepository.create({
      username: createUserDto.username,
      password: createUserDto.password,
      email: createUserDto.email,
      firstname: createUserDto.firstName,
      lastname: createUserDto.lastName,
      classesFullAccess: createUserDto.hasAllClassesAccess,
      center: center
    })

    try {
      const savedSecUser = await this.secUsersRepository.save(newSecUser);

      if (!savedSecUser) {
        throw new InternalServerErrorException('Failed to create user. Please try again.');
      }
      const newUser = this.centerUsersRepository.create({
        username: createUserDto.username,
        formattedUserName: createUserDto.username.toLowerCase(),
        userPassword: hashedPassword,
        centerId: createUserDto.centerId,
        centerUserId: savedSecUser.id,
        centerType: createUserDto.centerType,
        isAdmin: createUserDto.isAdmin || false,
        isActive: true,
        creationDate: new Date(),
      });
      const savedUser = await this.centerUsersRepository.save(newUser);

      if (!savedUser) {
        this.secUsersRepository.remove(savedSecUser);
        throw new InternalServerErrorException('Failed to create user. Please try again.');
      }
      return new UserResponseDto({
        id: savedUser.centerUserId!!,
        username: savedUser.username!,
        isAdmin: savedUser.isAdmin!,
      })
    } catch (error) {
      console.error('DATABASE ERROR in register:', error);

      if (error.number === 2601) {
        throw new ConflictException('A user with this Center ID, Type, and User ID combination already exists.');
      }
      throw new InternalServerErrorException('An error occurred during registration.');
    }

  }

  /**
   * Authenticates a user and provides them with JWTs.
   * @param loginDto The user's login credentials.
   * @returns A response containing access and refresh tokens.
   * @throws {UnauthorizedException} If credentials are invalid.
   */

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await this.validateUser(loginDto.username, loginDto.password);
      const tokens = await this.generateTokens(user);
      const hashedRefreshToken = await argon2.hash(tokens.refreshToken);

      await transactionalEntityManager.update(CenterUsers, user.id, {
        refreshToken: hashedRefreshToken,
        lastSession: new Date(),
      });

      return tokens;
    });
  }

  /**
   * Validates a user's credentials against the database. For internal use by the login process.
   * @param username The user's username.
   * @param password The user's plain-text password.
   * @returns The full user entity if validation is successful.
   * @throws {UnauthorizedException} If credentials are invalid or user is inactive.
   */

  async validateUser(username: string, password: string): Promise<CenterUsers> {
    const user = await this.centerUsersRepository.findOne({
      where: { username },
      relations: ['centerType2'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.userPassword) {
      throw new UnauthorizedException('Password not set for this user');
    }

    const isPasswordValid = await argon2.verify(user.userPassword, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }


  /**
   * Generates new access and refresh JWTs for a given user.
   * @param user The user entity object.
   * @returns An object containing the new tokens and user payload.
   */

  async generateTokens(user: CenterUsers): Promise<TokenResponse> {

    const accessTokenExpirationStr = this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '900'
    const refreshTokenExpirationStr = this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '604800'

    const accessTokenExpiresIn = parseInt(accessTokenExpirationStr, 10);
    const refreshTokenExpiresIn = parseInt(refreshTokenExpirationStr, 10);

    const payload: JwtPayload = {
      sub: user.centerUserId!,
      username: user.username,
      centerId: user.centerId!,
      centerType: user.centerType,
      isAdmin: user.isAdmin,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTokenExpiresIn
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      token_type: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
      expiresAt: new Date(Date.now() + accessTokenExpiresIn * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1000),
      user: {
        id: user.id,
        username: user.username!,
        isAdmin: user.isAdmin!,
      }
    };
  }


  /**
   * Generates a new set of tokens from a valid refresh token.
   * @param userId The ID of the user requesting the refresh.
   * @param refreshToken The refresh token provided by the client.
   * @returns A new set of access and refresh tokens.
   * @throws {UnauthorizedException} If the refresh token is invalid or revoked.
   */

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        }
      );
      // const user = await this.centerUsersRepository.findOne({ where: { id: payload.sub } });
      const user = await this.centerUsersRepository.findOne({
        where:{
          centerUserId:payload.sub,
          centerId:payload.centerId ??IsNull(),
          centerType:payload.centerType ??IsNull()
        }
      })
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }
      const isRefreshTokenMatching = await argon2.verify(user.refreshToken, refreshToken);
      if (!isRefreshTokenMatching) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }
      const newTokens = await this.generateTokens(user);
      const newHashedRefreshToken = await argon2.hash(newTokens.refreshToken);
      await this.updateRefreshToken(user.id, newHashedRefreshToken);
      return newTokens;

    }catch(error) {
    console.error('Refresh Token Error Details:', error.message);

    // Re-throw appropriate exception
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('Invalid refresh token'); 
  }
}

  /**
   * Updates the stored hashed refresh token for a user.
   * @param userId The ID of the user to update.
   * @param refreshToken The new hashed refresh token.
   */

  async updateRefreshToken(userId: number, refreshToken: string): Promise < void> {
  await this.centerUsersRepository.update(userId, {
    refreshToken: refreshToken,
  });
}


  /**
   * Logs a user out by clearing their stored refresh token.
   * @param userId The ID of the user to log out.
   */

  async logout(userId: number): Promise < void> {
  await this.centerUsersRepository.update(userId, {
    refreshToken: null,
  });
}


  /**
 * A more forceful logout that also updates the last session time.
 * @param userId The ID of the user to revoke tokens for.
 */

  async revokeAllUserTokens(userId: number): Promise < void> {
  await this.centerUsersRepository.update(userId, {
    refreshToken: null,
    lastSession: new Date(),
  });
}
}
//#endregion

