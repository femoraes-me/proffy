import express from 'express';
import db from './database/connection';
import convertHourToMinutes from './utils/converHoursToMinutes';

const routes = express.Router();

//criação da interface do Schedule Item
interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

routes.post('/classes', async (request, response) => {
    const {
        name,
        avatar,
        whatsapp,
        bio,
        subject,
        cost,
        schedule
    } = request.body;

    //criação da transaction para sincronização das inserções
    const trx = await db.transaction();

    try {
        //inserção de usuários
        const insertedUsersIds =
        await trx('users').insert({
            name,
            avatar,
            whatsapp,
            bio,    
        });
        
        //armazenando id do primeiro usuario
        const user_id = insertedUsersIds[0];


        //inserção de aulas
        const insertedClassesIds = await trx('classes').insert({
            subject,
            cost,
            user_id,
        });

        //pegando id da aula
        const class_id = insertedClassesIds[0];

        //inserção de horario
        const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
            return {
                class_id,
                week_day: scheduleItem.week_day,
                from: convertHourToMinutes(scheduleItem.from),
                to: convertHourToMinutes(scheduleItem.to),
            };
        });

        await trx('class_schedule').insert(classSchedule);

        await trx.commit();

        return response.status(201).send();

    } catch (err) {

        await trx.rollback();
        
        return response.status(400).json({
            error: 'Unexpected error while creating new class'
        })
    }
});

export default routes;