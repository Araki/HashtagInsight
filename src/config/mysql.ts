import { createPool, Pool, PoolConfig } from 'mysql';

import dotenv from 'dotenv';

export interface IDbConfig {
    host: string;
    user: string;
    password: string;
    database: string;
}

class MySql {
    // tslint:disable-next-line: variable-name
    private _pool: Pool;
    private _poolCommon: Pool;

    constructor() {
        dotenv.config();

        const defaultConfig: PoolConfig = {
            connectionLimit: 10,
            typeCast: this.tinyintToBoolean,
            charset: 'utf8mb4',
        };

        const dbConfig: IDbConfig = {
            host: process.env.DB_HOST === undefined ? 'localhost' : process.env.DB_HOST,
            user: process.env.DB_USER === undefined ? 'donatello' : process.env.DB_USER,
            password: process.env.DB_PASSWORD === undefined ? 'root' : process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE === undefined ? 'root' : process.env.DB_DATABASE,
            ...defaultConfig,
        };
        const dbConfigCommon: IDbConfig = {
            host: process.env.DB_COMMON_HOST === undefined ? 'localhost' : process.env.DB_COMMON_HOST,
            user: process.env.DB_COMMON_USER === undefined ? 'donatello' : process.env.DB_COMMON_USER,
            password: process.env.DB_COMMON_PASSWORD === undefined ? 'root' : process.env.DB_COMMON_PASSWORD,
            database: process.env.DB_COMMON_DATABASE === undefined ? 'root' : process.env.DB_COMMON_DATABASE,
            ...defaultConfig,
        };
        this._pool = createPool(dbConfig);
        this._poolCommon = createPool(dbConfigCommon);
    }

    public pool(db: 'db1' | 'common' = 'db1'): Pool {
        if (db === 'db1') {
            return this._pool;
        } else {
            return this._poolCommon;
        }
    }

    private tinyintToBoolean(field: any, next: () => void): boolean | void {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1'; // 1 = true, 0 = false
        }
        return next();
    }
}

export default new MySql();
