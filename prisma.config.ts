import { defineConfig } from 'prisma/config'

const {
  DATABASE_URL,
  POSTGRES_USER = 'eq_user',
  POSTGRES_PASSWORD = '',
  POSTGRES_DB = 'eq_research',
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
} = process.env

export default defineConfig({
  datasource: {
    url: DATABASE_URL ?? `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  },
})
