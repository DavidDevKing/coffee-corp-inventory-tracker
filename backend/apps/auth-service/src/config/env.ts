import dotenv from 'dotenv';
import path from 'path';


dotenv.config({path: path.resolve(import.meta.dirname, '../../.env')});


const getEnvVariable = (key: string, defaultvalue?: string) => {
    const value = process.env[key] || defaultvalue;

    if (!value) {
        throw new Error(`Environment variable ${key} not found.`);
    }
    return value;
}


export const env = {
    PORT : parseInt(getEnvVariable('PORT', '4000'), 10),
    NODE_ENV : getEnvVariable('NODE_ENV', 'development'),
    DATABASE_URL : getEnvVariable('DATABASE_URL'),
    ACCESS_SECRET : getEnvVariable('ACCESS_SECRET'),
    REFRESH_SECRET : getEnvVariable('REFRESH_SECRET'),
    INVITATION_SECRET : getEnvVariable('INVITATION_SECRET'),
    EMAIL_USER : getEnvVariable('EMAIL_USER'),
    EMAIL_PASSOWRD : getEnvVariable('EMAIL_PASSWORD'),
    BASE_URL : getEnvVariable('BASE_URL'),
} as const