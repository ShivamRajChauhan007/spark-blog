// Scene metadata — single source of truth for all 12 scenes.
// The article body, the scroll mapper, and the camera rig all consume this.

export type SceneId =
  | "hero"
  | "anatomy"
  | "driver"
  | "data-arrival"
  | "partitions"
  | "task-rain"
  | "narrow-vs-wide"
  | "shuffle"
  | "stages"
  | "airflow"
  | "ephemeral"
  | "fly";

export interface SceneMeta {
  id: SceneId;
  index: number; // 1..12
  title: string;
  kicker: string; // small label
  body: string; // first paragraph — kept short here, full prose lives in MDX
  concept: string; // the one-line takeaway
}

export const SCENES: SceneMeta[] = [
  {
    id: "hero",
    index: 1,
    title: "A cluster, asleep.",
    kicker: "01 · The cluster",
    concept: "A Dataproc cluster is a small constellation of virtual machines.",
    body:
      "It is two in the morning. Somewhere in a Google data center, a handful of virtual machines hum at idle. One of them is the master. The others are workers. Together, they are about to do something quietly astonishing."
  },
  {
    id: "anatomy",
    index: 2,
    title: "Inside a worker.",
    kicker: "02 · Anatomy",
    concept: "A worker hosts executors — JVMs that actually run your code.",
    body:
      "Each worker node is a VM, but it is not where your code runs. Your code runs inside executors — JVM processes that the worker launches on demand. One worker can host several executors. One executor can run many tasks. The vocabulary matters."
  },
  {
    id: "driver",
    index: 3,
    title: "The driver wakes.",
    kicker: "03 · The driver",
    concept: "`spark-submit` ignites a single driver JVM that conducts everything else.",
    body:
      "When you type spark-submit and press Enter, a single JVM blinks awake on the master node. This is the driver. It will not move data. It will not crunch numbers. It will only decide — and the executors will obey."
  },
  {
    id: "data-arrival",
    index: 4,
    title: "A terabyte arrives.",
    kicker: "04 · The data",
    concept: "Spark sees one logical dataset; physically it is many files.",
    body:
      "Imagine a Parquet file on Cloud Storage — a long, cool prism that is, when measured, exactly one terabyte. From across the network, the cluster cannot see it as one thing. It must split it."
  },
  {
    id: "partitions",
    index: 5,
    title: "Eight thousand pieces.",
    kicker: "05 · Partitions",
    concept: "Spark slices data into ~128 MB partitions — the unit of parallelism.",
    body:
      "Spark divides the prism into chunks of about 128 megabytes each. Eight thousand of them, give or take. We call each chunk a partition. From here on, every plan Spark makes is at the granularity of a partition."
  },
  {
    id: "task-rain",
    index: 6,
    title: "Tasks, in parallel.",
    kicker: "06 · Parallelism",
    concept: "One task processes one partition. Executors drain the queue concurrently.",
    body:
      "The driver creates eight thousand tickets, one per partition, and the executors pull them down like rain. With six executors, six tickets are in flight at any moment. The queue drains; the cluster works."
  },
  {
    id: "narrow-vs-wide",
    index: 7,
    title: "Two kinds of work.",
    kicker: "07 · Transformations",
    concept: "Narrow transformations stay local. Wide ones force data to move.",
    body:
      "A filter is a quiet thing. Each partition can decide on its own which rows to keep. A groupBy is louder. To put all American sellers together, rows have to physically travel between executors. We call this a shuffle."
  },
  {
    id: "shuffle",
    index: 8,
    title: "The shuffle.",
    kicker: "08 · The shuffle",
    concept: "Wide transformations rearrange rows across executors. It is the most expensive thing Spark does.",
    body:
      "Every row gets a destination — usually the hash of a key, modulo the number of partitions. Rows arc across the cluster on invisible cables. When the dust settles, every executor holds exactly the rows it needs, and the next stage can begin."
  },
  {
    id: "stages",
    index: 9,
    title: "Stages, drawn on the air.",
    kicker: "09 · Stages",
    concept: "Spark cuts the DAG at every shuffle boundary into stages.",
    body:
      "If you look at a Spark job from above, you do not see a single river of work. You see islands separated by shuffles. Each island is a stage, and tasks within a stage can run end-to-end without ever talking to another executor."
  },
  {
    id: "airflow",
    index: 10,
    title: "A scheduler, above.",
    kicker: "10 · Orchestration",
    concept: "Airflow turns a one-shot Spark job into a recurring, monitored, retryable pipeline.",
    body:
      "Spark is brilliant at running one job. Airflow is brilliant at running the same job at two o'clock every morning, retrying it on failure, paging an engineer when it misses an SLA, and remembering everything it has ever done."
  },
  {
    id: "ephemeral",
    index: 11,
    title: "Born at 02:00, gone by 02:12.",
    kicker: "11 · Ephemeral clusters",
    concept: "Create cluster → submit job → delete cluster. Pay for twelve minutes, not twenty-four hours.",
    body:
      "The pattern is older than Dataproc but Dataproc makes it cheap: an Airflow DAG creates a cluster, submits the job, waits, then deletes the cluster. You pay for the minutes you used. Forget to delete it and you pay for a month of nothing."
  },
  {
    id: "fly",
    index: 12,
    title: "Your cluster, your camera.",
    kicker: "12 · Fly mode",
    concept: "Take the controls.",
    body:
      "You have watched it all happen on rails. Take the camera. Drag to orbit, scroll to zoom, right-click to pan. The cluster you've been reading about is sitting there, waiting."
  }
];
