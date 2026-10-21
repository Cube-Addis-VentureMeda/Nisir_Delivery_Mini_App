// src/config/database.ts
import { Sequelize } from 'sequelize';
import { env } from './env';


export const sequelize = new Sequelize({
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  dialect: 'mysql',          

  
  define: {
    underscored: true,
    timestamps: true,        
  },

  logging: env.NODE_ENV === 'development'
    ? (sql) => console.log(`[SQL] ${sql}`)   
    : false,                                  
});