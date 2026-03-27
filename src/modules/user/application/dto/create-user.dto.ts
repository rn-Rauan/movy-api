import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto{
    @IsString()
    @IsNotEmpty({message: "Name is required"})
    name: string;

    @IsString()
    @IsNotEmpty({message: "Email is required"})
    email: string;

    @IsString()
    @IsNotEmpty({message: "Password is required"})
    @MinLength(8, {message: "Password must be at least 8 characters"})
    password: string;

    @IsString()
    @IsNotEmpty({message: "Telephone is required"})
    telephone: string
}