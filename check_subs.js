import { sequelize } from './microservice backend/coding-service/src/config/pgDb.js';

async function check() {
  const [rows] = await sequelize.query('SELECT DISTINCT "user" FROM coding_submissions LIMIT 20;');
  console.log('Distinct submission users:', rows);
  const [userSubs] = await sequelize.query('SELECT * FROM coding_submissions WHERE "user" = \'df220922-daec-4c75-8240-755ef37d6c5f\';');
  console.log('Submissions for df220922:', userSubs.length, userSubs);
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });

