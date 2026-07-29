import { NextResponse } from "next/server";

export async function GET() {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  const prometheusText = `
# HELP process_uptime_seconds Process uptime in seconds.
# TYPE process_uptime_seconds counter
process_uptime_seconds ${uptime.toFixed(2)}

# HELP node_memory_rss_bytes Resident Set Size memory in bytes.
# TYPE node_memory_rss_bytes gauge
node_memory_rss_bytes ${memory.rss}

# HELP node_memory_heap_total_bytes Heap total memory in bytes.
# TYPE node_memory_heap_total_bytes gauge
node_memory_heap_total_bytes ${memory.heapTotal}

# HELP node_memory_heap_used_bytes Heap used memory in bytes.
# TYPE node_memory_heap_used_bytes gauge
node_memory_heap_used_bytes ${memory.heapUsed}

# HELP app_status Service health status (1 = healthy).
# TYPE app_status gauge
app_status 1
  `.trim();

  return new NextResponse(prometheusText, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}

export const dynamic = "force-dynamic";
