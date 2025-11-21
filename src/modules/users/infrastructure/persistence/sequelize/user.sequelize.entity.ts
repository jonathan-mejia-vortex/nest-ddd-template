import { UUIDV4 } from 'sequelize';
import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { AuthSequelizeEntity } from '../../../../auth/infrastructure/persistence/sequelize/auth.sequelize.entity';

@Table({ tableName: 'users', timestamps: true })
export class UserSequelizeEntity extends Model<UserSequelizeEntity> {
  @Column({
    type: DataType.UUID,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'USER' })
  role: string;

  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  authId: string;

  @BelongsTo(() => AuthSequelizeEntity, { foreignKey: 'authId', as: 'auth' })
  auth: AuthSequelizeEntity;
}

