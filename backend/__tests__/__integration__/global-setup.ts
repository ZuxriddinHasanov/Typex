import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

let startedPostgresContainer: StartedTestContainer | undefined;
let startedRedisContainer: StartedTestContainer | undefined;

export async function setup(): Promise<void> {
  process.env.TZ = "UTC";

  //use testcontainer to start postgres
  console.log("\x1b[36mPostgreSQL starting...\x1b[0m");
  const pgContainer = new GenericContainer("postgres:16-alpine")
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "test",
    })
    .withWaitStrategy(Wait.forListeningPorts());

  startedPostgresContainer = await pgContainer.start();

  const pgUrl = `postgresql://test:test@${startedPostgresContainer.getHost()}:${startedPostgresContainer.getMappedPort(5432)}/test`;
  process.env["TEST_DATABASE_URL"] = pgUrl;
  console.log(`\x1b[32mPostgreSQL is running on ${pgUrl}\x1b[0m`);

  //use testcontainer to start redis
  console.log("\x1b[36mRedis starting...\x1b[0m");
  const redisContainer = new GenericContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"));

  startedRedisContainer = await redisContainer.start();

  const redisUrl = `redis://${startedRedisContainer.getHost()}:${startedRedisContainer.getMappedPort(6379)}`;
  process.env["REDIS_URI"] = redisUrl;
  console.log(`\x1b[32mRedis is running on ${redisUrl}\x1b[0m`);
}

async function stopContainers(): Promise<void> {
  console.log("\x1b[36mPostgreSQL stopping...\x1b[0m");
  await startedPostgresContainer?.stop();
  console.log("\x1b[36mRedis stopping...\x1b[0m");
  await startedRedisContainer?.stop();
  console.log(`\x1b[32mContainers stopped.\x1b[0m`);
}

export async function teardown(): Promise<void> {
  await stopContainers();
}

process.on("SIGTERM", stopContainers);
process.on("SIGINT", stopContainers);
