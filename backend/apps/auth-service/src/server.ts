import app from "./app.js";
import { env } from "./config/env.ts"

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Authentication service is up. Listening on http://localhost:${PORT}`)
})