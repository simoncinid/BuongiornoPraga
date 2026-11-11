const base = process.env.PLATFORM_URL || process.env.NEXT_PUBLIC_SITE_URL;
if (!base || !process.env.CRON_SECRET)
  throw Error("PLATFORM_URL e CRON_SECRET richiesti");
let inFlight = false,
  iteration = 0;
async function call(task) {
  try {
    const r = await fetch(`${base}/api/platform/cron?task=${task}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(55000),
    });
    console.log(
      JSON.stringify({ at: new Date().toISOString(), task, status: r.status }),
    );
  } catch {
    console.error(`Worker ${task}: richiesta non riuscita`);
  }
}
async function tick() {
  if (inFlight) return;
  inFlight = true;
  try {
    await Promise.allSettled([
      call("jobs"),
      ...(iteration % 5 === 0 ? [call("mailbox")] : []),
      ...(iteration % 1440 === 0 ? [call("maintenance")] : []),
    ]);
    iteration++;
  } finally {
    inFlight = false;
  }
}
await tick();
setInterval(tick, 60000);
