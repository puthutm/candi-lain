import { db } from './db';
import { users } from './db/schema/users';

async function main() {
  const u = await db.select().from(users);
  console.log("Users in DB:", u);
}

main().catch(console.error);
