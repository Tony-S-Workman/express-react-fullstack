import { connectDB } from './connect-db'

export async function assembleUserState(user){
    if (!user || !user.id) {
        throw new Error('User and user.id are required');
    }
    
    let db = await connectDB();

    let tasks = await db.collection(`tasks`).find({owner:user.id}).toArray();
    let comments = await db.collection(`comments`).find({task:{$in:tasks.map(task=>task.id)}}).toArray();
    let userOwners = [...tasks,comments].map(x=>x.owner).filter(Boolean);
    let additionalUsers = await db.collection(`users`).find({id:{$in:userOwners}}).toArray();
    let users = [
        await db.collection(`users`).findOne({id:user.id}),
        ...additionalUsers
    ].filter(Boolean);

    return {
        session:{authenticated:`AUTHENTICATED`,id:user.id},
        groups:await db.collection(`groups`).find({owner:user.id}).toArray(),
        tasks,
        users,
        comments
    };
}