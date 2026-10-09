// drizzle-kit reads this: where the schema is, and where migrations go.
export default {
  dialect: 'sqlite',
  schema: './src/schema.js',
  out: './drizzle',
  dbCredentials: { url: 'local.db' },
};
