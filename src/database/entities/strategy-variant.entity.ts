import { StrategyId } from 'src/commons/constants';
import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('strategy-vanriant')
@Unique(['strategyId', 'variantId'])
export class StrategyVariantEntity<ParamsType> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: StrategyId,
  })
  strategyId!: StrategyId;

  @Index()
  @Column()
  variantId!: string;

  @Column()
  crewvityStrategyId!: string;

  @Column({
    type: 'json',
    default: {},
    transformer: {
      from: (value: any) => value as ParamsType,
      to: (value: ParamsType) => value,
    },
  })
  params!: ParamsType;
}
