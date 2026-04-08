import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Recording } from "./recording.entity";
import { CreateRecordingDto } from "./dto/create-recording.dto";
import { UpdateRecordingDto } from "./dto/update-recording.dto";

@Injectable()
export class RecordingsService {
  constructor(
    @InjectRepository(Recording) private recRepo: Repository<Recording>,
  ) {}

  async create(userId: number, dto: CreateRecordingDto, file: Express.Multer.File) {
    const rec = this.recRepo.create({
      title: dto.title ?? "",
      mimeType: file.mimetype,
      audioData: file.buffer,
      user: { id: userId } as any,
    });

    const saved = await this.recRepo.save(rec);
    return { id: saved.id, title: saved.title, createdAt: saved.createdAt };
  }

  async findAllForUser(userId: number) {
    return this.recRepo.find({
      where: { user: { id: userId } as any },
      order: { createdAt: "DESC" },
      select: ["id", "title", "mimeType", "createdAt"],
    });
  }

  async findOne(userId: number, id: number) {
    const rec = await this.recRepo.findOne({
      where: { id, user: { id: userId } as any },
    });
    if (!rec) throw new NotFoundException("Recording not found");
    return rec;
  }

  async update(userId: number, id: number, dto: UpdateRecordingDto, file?: Express.Multer.File) {
    const rec = await this.findOne(userId, id);

    if (dto.title !== undefined) rec.title = dto.title;
    if (file) {
      rec.audioData = file.buffer;
      rec.mimeType = file.mimetype;
    }

    const saved = await this.recRepo.save(rec);
    return { id: saved.id, title: saved.title, updated: true };
  }

  async remove(userId: number, id: number) {
    // Delete only if the recording belongs to THIS user
    const result = await this.recRepo.delete({
      id,
      user: { id: userId } as any,
    });

    if (result.affected === 0) {
      // either it doesn't exist OR it belongs to someone else
      throw new NotFoundException("Recording not found");
    }

    return { deleted: true };
  }
}