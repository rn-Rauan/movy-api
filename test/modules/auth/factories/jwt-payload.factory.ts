import type { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

interface JwtPayloadOverrides {
    sub?: string;
    id?: string;
    email?: string;
    organizationId?: string;
    role?: 'ADMIN' | 'DRIVER' | null;
    isDev?: boolean;
    userStatus?: string;
}

export function makeJwtPayload(overrides: JwtPayloadOverrides = {}): JwtPayload {
    const sub = overrides.sub ?? 'user-id-stub';
    return {
        sub,
        id: overrides.id ?? sub,
        email: overrides.email ?? 'stub@email.com',
        organizationId: overrides.organizationId,
        role: overrides.role ?? null,
        isDev: overrides.isDev ?? false,
        userStatus: overrides.userStatus ?? 'ACTIVE',
    };
}
