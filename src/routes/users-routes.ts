import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

import { knexDB } from '../database'


export async function usersRoutes(app: FastifyInstance) {
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const createUserBodySchema = z.object({
            firstName: z.string().nonempty('First name cannobt be empty'),
            lastName: z.string().nonempty('Last name cannot be empty'),
            photoUrl: z.string().url().nonempty('Photo URL cannot be empty')
        })

        const validationResult = createUserBodySchema.safeParse(request.body)

        if (!validationResult.success) {
            return reply.status(400).send({
                message: validationResult.error.errors
            })
        }

        const { firstName, lastName, photoUrl } = validationResult.data

        let sessionId = request.cookies.sessionId

        if(!sessionId) {
            sessionId = randomUUID()
            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            })
        }

        const user = await knexDB('users').insert({
            id: randomUUID(),
            first_name: firstName,
            last_name: lastName,
            photo_url: photoUrl,
            session_id: sessionId,
        }, '*')

        reply.send({ user })
    })
}
