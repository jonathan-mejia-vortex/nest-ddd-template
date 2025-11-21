import { UUIDV4 } from 'sequelize';
import { Column, DataType, HasOne, Model, Table } from 'sequelize-typescript';
import { UserSequelizeEntity } from '../../../../users/infrastructure/persistence/sequelize/user.sequelize.entity';

@Table({ tableName: 'auths', timestamps: true })
export class AuthSequelizeEntity extends Model<AuthSequelizeEntity> {
  @Column({
    type: DataType.UUID,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @HasOne(() => UserSequelizeEntity, { foreignKey: 'authId' })
  user: UserSequelizeEntity;
}

