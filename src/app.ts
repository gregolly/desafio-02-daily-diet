import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { mealsRoute } from './routes/meals-routes'
import { usersRoutes } from './routes/users-routes'

export const app = fastify()

app.register(cookie)

app.register(mealsRoute, {
  prefix: 'meals',
})

app.register(usersRoutes, {
  prefix: 'users',
})
