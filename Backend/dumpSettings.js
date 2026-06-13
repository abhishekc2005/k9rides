import mongoose from 'mongoose';
import { FoodRestaurant } from './src/modules/food/restaurant/models/restaurant.model.js';

async function checkDB() {
    await mongoose.connect('mongodb+srv://k9bharatrides_db_user:GbrJeMWDJqoFnuWI@k9.spowyus.mongodb.net/?appName=k9', {
    }).catch(err => {
        console.log("Error connecting to DB", err);
    });

    const rests = await FoodRestaurant.find({}).limit(2).lean();
    console.log("Restaurants:");
    console.log(JSON.stringify(rests, null, 2));

    process.exit(0);
}

checkDB();
