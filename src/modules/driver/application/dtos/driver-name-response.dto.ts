import { ApiProperty } from '@nestjs/swagger';

export class DriverNameResponseDto {
  @ApiProperty({ example: 'João Silva' })
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
