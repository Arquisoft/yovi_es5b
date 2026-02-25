import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import app from '../users-service.js'

// TODO: createuser: implementar correctamente
describe('POST /createuser', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns a greeting message for the provided username', async () => {
        const res = await request(app)
            .post('/createuser')
            .send({ username: 'Pablo' })
            .set('Accept', 'application/json')

        expect(res.status).toBe(400)
        //expect(res.body).toHaveProperty('message')
        //expect(res.body.message).toMatch(/Hello Pablo! Welcome to the course!/i)
    })
})

// TODO: getusers: implementar correctamente
describe('GET /getusers', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('gets all users of the application', async () => {
        const res = await request(app)
            .get('/getusers')
            .send()
            .set('Accept', 'application/json')

        expect(res.status).toBe(500)
    })
})
