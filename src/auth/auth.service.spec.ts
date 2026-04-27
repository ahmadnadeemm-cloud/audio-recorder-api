import { UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { User } from "./user.entity";

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Pick<Repository<User>, "findOne" | "save">>;
  let jwtService: jest.Mocked<Pick<JwtService, "signAsync">>;

  beforeEach(async () => {
    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue("signed-token"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("logs in with normalized email and hashed password", async () => {
    const passwordHash = await bcrypt.hash("StrongPassword123", 10);
    usersRepo.findOne.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      passwordHash,
      createdAt: new Date(),
    } as User);

    const result = await service.login({
      email: "  TEST@example.com ",
      password: "StrongPassword123",
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(result).toEqual({ access_token: "signed-token" });
  });

  it("upgrades legacy plaintext passwords during login", async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 2,
      email: "legacy@example.com",
      passwordHash: "plaintext-pass",
      createdAt: new Date(),
    } as User);
    usersRepo.save.mockImplementation(async (user) => user as User);

    const result = await service.login({
      email: "legacy@example.com",
      password: "plaintext-pass",
    });

    expect(result).toEqual({ access_token: "signed-token" });
    expect(usersRepo.save).toHaveBeenCalledTimes(1);
    const savedUser = usersRepo.save.mock.calls[0][0] as User;
    expect(savedUser.passwordHash).not.toBe("plaintext-pass");
    await expect(bcrypt.compare("plaintext-pass", savedUser.passwordHash)).resolves.toBe(true);
  });

  it("throws unauthorized for invalid credentials", async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 3,
      email: "test@example.com",
      passwordHash: await bcrypt.hash("correct-password", 10),
      createdAt: new Date(),
    } as User);

    await expect(
      service.login({
        email: "test@example.com",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
