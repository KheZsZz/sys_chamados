import { z } from "zod"

export const loginBodySchema = z.object({
  email: z.string().email("E-mail invalid"),
  password: z.string().min(1, "Password is required.")
})
