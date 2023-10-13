import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

import { knexDB } from '../database'
import { checkSessionIdSession } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const createUserBodySchema = z.object({
      firstName: z.string().nonempty('First name cannobt be empty'),
      lastName: z.string().nonempty('Last name cannot be empty'),
      photoUrl: z.string().url().nonempty('Photo URL cannot be empty'),
    })

    const validationResult = createUserBodySchema.safeParse(request.body)

    if (!validationResult.success) {
      return reply.status(400).send({
        message: validationResult.error.errors.map((error) => error.message),
      })
    }

    const { firstName, lastName, photoUrl } = validationResult.data

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const user = await knexDB('users').insert(
      {
        id: randomUUID(),
        first_name: firstName,
        last_name: lastName,
        photo_url: photoUrl,
        session_id: sessionId,
      },
      '*',
    )

    reply.send({ user })
  })

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdSession] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sessionId } = request.cookies

      const { id } = await knexDB('users')
        .select('id')
        .where({ session_id: sessionId })
        .first()

      const meals = await knexDB('meals')
        .select('on_diet')
        .where({ user_id: id })
        .orderBy('upadted_at')

      let bestStreak = 0
      let currentSequence = 0

      for (const meal of meals) {
        if (meal.on_diet === 1) {
          currentSequence++
          bestStreak = Math.max(bestStreak, currentSequence)
        } else {
          currentSequence = 0
        }
      }

      const onDiet = meals.filter((meal) => meal.on_diet).length

      reply.send({
        total: meals.length,
        onDiet,
        offDiet: meals.length - onDiet,
        bestStreak,
      })
    },
  )
}
