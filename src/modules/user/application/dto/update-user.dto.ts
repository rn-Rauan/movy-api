import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;
    
    @IsOptional()
    @IsString()
    email?: string
    
    @IsOptional()
    @IsString()
    telephone?: string;
    
    @IsOptional()
    @IsString()
    @MinLength(8, {message: "Password must be at least 8 characters"})
    password?: string;
    
}