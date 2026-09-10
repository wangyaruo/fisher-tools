import { buildApp } from './app.js'
import { config } from './config.js'

async function main(): Promise<void> {
  const app = await buildApp()

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      app.log.info(`收到 ${signal}，正在关闭服务`)
      void app.close().then(() => process.exit(0))
    })
  }

  try {
    await app.listen({ port: config.port, host: config.host })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void main()
