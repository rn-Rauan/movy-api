import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from 'src/shared/infrastructure/email/resend-email.service';

describe('ResendEmailService', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should call Resend API with the expected payload', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-api-key';
        if (key === 'RESEND_FROM_EMAIL') return 'noreply@movy.app';
        if (key === 'RESEND_FROM_NAME') return 'Movy';
        return undefined;
      }),
    } as unknown as ConfigService;

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    });

    global.fetch = fetchMock as typeof fetch;

    const sut = new ResendEmailService(configService);

    await sut.send(
      'tester@example.com',
      'Recuperação de senha',
      'Token: ABC123',
      { kind: 'password_reset', userId: 'user-1', token: 'ABC123' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('"to":["tester@example.com"]'),
      }),
    );
  });
});
