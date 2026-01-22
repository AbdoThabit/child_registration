import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SecUsers } from 'src/database/icare/entities/entities/SecUsers';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CenterUsers } from '../../database/isecure/entities/entities/CenterUsers';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';


jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;

  //  mock objects for dependencies
  const mockUsersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockSecUsersRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const mockCareCenterRepository = { findOne: jest.fn(), find: jest.fn() };
  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockUsersRepository)),
  };
  const mockJwtService = {
    signAsync: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(CenterUsers, 'isecure'),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(SecUsers, 'icare'),
          useValue: mockSecUsersRepository,
        },
        {
          provide: getRepositoryToken(CareCenter, 'icare'),
          useValue: mockCareCenterRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'isecureDataSource',
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create and return a new user successfully', async () => {
      const signUpDto = {
        username: 'newUser',
        password: 'password123',
        centerId: 1,
        userId: 1,
        centerType: 'type',
        isAdmin: true,
      };
      const mockUser = {
        id: 1,
        username: 'newUser',
        isAdmin: true,
        centerId: 1,
        userId: 1,
        centerType: 'type',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      mockSecUsersRepository.findOne.mockResolvedValue(null);
      mockCareCenterRepository.findOne.mockResolvedValue({ centerId: 1 });

      (argon2.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // secUsers repository will create and save a sec user
      const savedSecUser = { id: 3 };
      mockSecUsersRepository.create.mockReturnValue(savedSecUser);
      mockSecUsersRepository.save.mockResolvedValue(savedSecUser);

      // center users repo will then create and save the center user
      const savedCenterUser = { centerUserId: 1, username: 'newUser', isAdmin: true };
      mockUsersRepository.create.mockReturnValue(savedCenterUser);
      mockUsersRepository.save.mockResolvedValue(savedCenterUser);

      const result = await service.register(signUpDto as any);
      expect(result).toEqual({ id: 1, username: 'newUser', isAdmin: true });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(savedCenterUser);
    });

    it('should throw a ConflictException if the username already exists', async () => {
      const signUpDto = {
        username: 'existingUser',
        password: 'password123',
        centerId: 1,
        userId: 1,
        centerType: 'type',
      };

      mockUsersRepository.findOne.mockResolvedValue({ id: 1, username: 'existingUser' });

      await expect(service.register(signUpDto as any)).rejects.toThrow(ConflictException);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: [{ username: 'existingUser' }],
      });
    });
  });

  describe('validateUser', () => {
    it('should return the user if credentials are valid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        userPassword: 'hashedPassword',
        isActive: true,
        centerType2: {}, 
      };

      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true); 

      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        relations: ['centerType2'],
      });
    });

    it('should throw an UnauthorizedException for an invalid password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        userPassword: 'hashedPassword',
        isActive: true,
        centerType2: {},  
      };

      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false); 

      await expect(service.validateUser('testuser', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        relations: ['centerType2'],
      });
    });

    it('should throw an UnauthorizedException if user does not exist', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if user is inactive', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        userPassword: 'hashedPassword',
        isActive: false,
        centerType2: {},
      };

      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if user has no password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        userPassword: null,
        isActive: true,
        centerType2: {},
      };

      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.validateUser('testuser', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });
});