import { User as PrismaUser} from "generated/prisma/client";
import { User } from "src/modules/user/domain/entities";

export class UserMapper {

    static toDomain(raw: PrismaUser): User{
        return User.restore({
            id: raw.id,
            name: raw.name,
            email: raw.email,
            passwordHash: raw.passwordHash,
            telephone: raw.telephone,
            status: raw.status,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        })
    }

    static toPersistence(user: User): PrismaUser{
        return{
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            telephone: user.telephone,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }
}