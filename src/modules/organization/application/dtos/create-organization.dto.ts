import { IsString, IsNotEmpty } from "class-validator";

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'CNPJ is required' })
    cnpj: string;

    @IsString()
    @IsNotEmpty({ message: 'Telephone is required' })
    telephone: string;

    @IsString()
    @IsNotEmpty({ message: 'Slug is required' })
    slug: string;

    @IsString()
    @IsNotEmpty({ message: 'Address is required' })
    address: string;
}