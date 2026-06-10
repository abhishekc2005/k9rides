import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const replacePattern = /(eqosy|appzeto|rideon)/gi;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  // Collections that are safe to update without breaking user emails/credentials
  const safeCollections = [
    'foodbusinesssettings',
    'taxiadminappsettings',
    'taxiadminbusinesssettings',
    'food_settings',
    'taxibanners',
    'food_hero_banners',
    'food_page_contents',
    'food_landing_settings'
  ];

  let totalUpdated = 0;

  for (let c of collections) {
    if (!safeCollections.includes(c.name)) continue;

    const col = db.collection(c.name);
    const cursor = col.find({});
    const docs = await cursor.toArray();

    for (let doc of docs) {
      let modified = false;

      function traverse(obj) {
        for (let key in obj) {
          if (typeof obj[key] === 'string') {
            if (obj[key].match(replacePattern)) {
              obj[key] = obj[key].replace(replacePattern, 'K9 Rides');
              modified = true;
            }
          } else if (obj[key] && typeof obj[key] === 'object' && !(obj[key] instanceof Date) && !(obj[key] instanceof mongoose.Types.ObjectId)) {
            traverse(obj[key]);
          }
        }
      }

      traverse(doc);

      if (modified) {
        await col.updateOne({ _id: doc._id }, { $set: doc });
        totalUpdated++;
      }
    }
  }

  console.log(`Updated ${totalUpdated} documents across settings collections.`);
  process.exit(0);
}

run().catch(console.error);
