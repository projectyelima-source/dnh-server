import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generateFilter } from '@/common/factory';
import { CreateSeededMedDto, UpdateSeededMedDto } from './dto';
import { SeededMed } from './entities/seeded-med.entity';

@Injectable()
export class SeededMedsService {
	private logger = new Logger(SeededMedsService.name);

	constructor(
		@InjectModel(SeededMed.name)
		private readonly seededMedModel: Model<SeededMed>,
	) {}

	async create(dto: CreateSeededMedDto) {
		const seededMed = await this.seededMedModel.create(dto);
		return seededMed._id.toString();
	}

	async findAll(query: any) {
		const { pageFilter, searchFilter } = generateFilter(query);
		const [rows, count] = await Promise.all([
			this.seededMedModel
				.find(searchFilter)
				.skip(pageFilter.offset)
				.limit(pageFilter.limit)
				.sort(pageFilter.orderBy),
			this.seededMedModel.countDocuments(searchFilter),
		]);
		return { rows, count };
	}

	async findOne(id: string) {
		const seededMed = await this.seededMedModel.findById(id);
		if (!seededMed) {
			throw new NotFoundException('Seeded medication not found');
		}
		return seededMed;
	}

	async update(id: string, dto: UpdateSeededMedDto) {
		const seededMed = await this.seededMedModel.findByIdAndUpdate(
			id,
			{ $set: dto },
			{ returnDocument: 'after' },
		);
		if (!seededMed) {
			throw new NotFoundException('Seeded medication not found');
		}
		return seededMed._id.toString();
	}

	async findAllPaginated(
		filter: Record<string, any>,
		page: number,
		pageSize: number,
	) {
		const offset = (page - 1) * pageSize;
		const [rows, count] = await Promise.all([
			this.seededMedModel
				.find(filter)
				.skip(offset)
				.limit(pageSize)
				.sort({ name: 1 }),
			this.seededMedModel.countDocuments(filter),
		]);
		return { rows, count };
	}

	async remove(id: string) {
		const seededMed = await this.seededMedModel.findByIdAndDelete(id);
		if (!seededMed) {
			throw new NotFoundException('Seeded medication not found');
		}
	}
}
