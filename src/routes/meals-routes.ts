import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { checkSessionIdSession } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { knexDB } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoute(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdSession] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        time: z.string(),
        onDiet: z.boolean(),
      })

      const validationResult = createMealBodySchema.safeParse(request.body)

      if (!validationResult.success) {
        return reply.status(400).send({
          message: validationResult.error.errors,
        })
      }

      const { name, description, date, time, onDiet } = validationResult.data

      const { sessionId } = request.cookies

      const { id } = await knexDB('users')
        .select('id')
        .where({ session_id: sessionId })
        .first()

      const meal = await knexDB('meals')
        .insert({
          id: randomUUID(),
          name,
          description,
          date: date.toISOString(),
          time,
          on_diet: onDiet,
          user_id: id,
        })
        .returning('*')

        console.log(meal)

      reply.status(201).send({ meal })
    },
  )
}
