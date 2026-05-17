// Scene metadata — single source of truth for all 12 scenes.
// Each scene has a kicker, a title, a teaching body, and a one-line concept.
// Prose is intentionally long-form — this is the place to learn Spark.

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
  kicker: string;
  body: string[]; // paragraphs
  concept: string; // one-line takeaway, used in italic pull-quote
}

export const SCENES: SceneMeta[] = [
  {
    id: "hero",
    index: 1,
    title: "A cluster, asleep.",
    kicker: "01 · The cluster",
    concept: "A Dataproc cluster is a small constellation of virtual machines.",
    body: [
      "It is two in the morning. Somewhere in a Google data center, a handful of virtual machines hum at idle. One of them is the master. The others are workers. Together they form what Google calls a Dataproc cluster — a temporary, managed Hadoop and Spark environment that exists only while you need it.",
      "If you've used Spark on your laptop, the cluster is the next thing to learn. Your laptop is one machine: it can read one file, sort one list, total one column at a time. A cluster is the same idea, multiplied — six, twelve, sometimes hundreds of machines, each doing the same kind of work in parallel. The trick is that Spark hides almost all of the wiring. You write code that looks like it runs on one computer, and Spark figures out how to spread it across six.",
      "Scroll on. We are going to take this cluster apart and show you what each piece does."
    ]
  },
  {
    id: "anatomy",
    index: 2,
    title: "Inside a worker.",
    kicker: "02 · Anatomy",
    concept: "A worker is a VM; an executor is a JVM living inside it.",
    body: [
      "Each worker is a virtual machine — usually something like an n1-standard-8 with 8 cores and 30 GB of RAM. But your Spark code does not run on the worker itself. The worker runs YARN, a resource manager that carves the VM's memory and CPU into smaller containers. Inside each container, YARN launches an executor — a Java Virtual Machine that holds your code, your data partitions, and your cached results.",
      "One worker can host several executors. One executor can run several tasks at once, one per core. So a cluster of 4 workers, with 2 executors each at 4 cores per executor, gives you 32 task slots running in parallel. This vocabulary trips a lot of people up: a worker is not an executor, and an executor is not a task. Worker is hardware, executor is process, task is unit of work.",
      "Fly the camera in by dragging the planet on the right. You'll see the worker's atmosphere peel back to reveal the executors inside."
    ]
  },
  {
    id: "driver",
    index: 3,
    title: "The driver wakes.",
    kicker: "03 · The driver",
    concept: "spark-submit ignites one JVM that conducts everything else.",
    body: [
      "When you type spark-submit and hit Enter, a single JVM blinks awake on the master node. This is the driver. It does not move data, it does not crunch numbers, it does not own any of the partitions. It only decides — and the executors obey.",
      "The driver does four things. It reads your code and builds a directed acyclic graph of operations. It asks YARN for executor containers. It schedules tasks onto those executors. And it collects results back, sometimes via small final aggregations and sometimes via writes to durable storage. If you ever do `.collect()` on a billion-row DataFrame, the driver is what crashes — because every row has to fit in its memory at once.",
      "There are two deploy modes worth knowing. Client mode runs the driver on the machine where you typed spark-submit (your laptop, often). Cluster mode runs the driver inside the cluster on the master node. Cluster mode is what you want for any long-running production job, because if your laptop sleeps, your driver does not die."
    ]
  },
  {
    id: "data-arrival",
    index: 4,
    title: "A terabyte arrives.",
    kicker: "04 · The data",
    concept: "Spark sees one logical dataset; physically it is many files.",
    body: [
      "Imagine a Parquet dataset on Cloud Storage that is, when measured, exactly one terabyte. To you it is one DataFrame — `spark.read.parquet(\"gs://bucket/orders/\")`. To Spark it is a directory listing of perhaps eight thousand smaller files, each one a chunk that was written by a previous job.",
      "Notice what does and does not happen at this moment. Spark does not download the terabyte. Spark does not even open the files. It builds a logical plan that says \"I will read all of these files and treat them as one DataFrame.\" This is called lazy evaluation, and it is the single most important idea in Spark.",
      "Lazy evaluation means Spark waits until you ask for a result — a `.show()`, a `.write()`, a `.count()` — before it does any real work. When you do, Spark looks at the entire chain of operations you stacked up, optimises them through the Catalyst engine (predicate pushdown, column pruning, join reordering), and only then sends actual tasks to actual executors. The terabyte you imagined is not even on the network yet."
    ]
  },
  {
    id: "partitions",
    index: 5,
    title: "Eight thousand pieces.",
    kicker: "05 · Partitions",
    concept: "Spark slices data into ~128 MB partitions — the unit of parallelism.",
    body: [
      "When Spark finally does read the terabyte, it splits the file list into partitions. Each partition is a chunk of rows roughly 128 megabytes in size. The number 128 is not magic — it matches the historical default block size of HDFS, the file system that came before Cloud Storage. A 128 MB partition reads in one disk seek, and the read amortises nicely against the cost of starting a task.",
      "A terabyte at 128 MB per partition gives you about 8,000 partitions. Spark's first big decision is how to distribute those 8,000 partitions across the executors you have. If you have 32 task slots and 8,000 partitions, every slot will eventually process about 250 partitions. The work-stealing scheduler ensures faster executors pick up more partitions while slower ones do fewer — no central dispatcher to bottleneck.",
      "You can change the partition count after the read with `.repartition(n)` or `.coalesce(n)`. Repartition reshuffles to give you exactly n partitions (expensive). Coalesce only merges, never splits (cheap, but only useful when reducing). The default of `spark.sql.shuffle.partitions = 200` is also the wrong default for almost every real workload — it should be tuned to your data size."
    ]
  },
  {
    id: "task-rain",
    index: 6,
    title: "Tasks, in parallel.",
    kicker: "06 · Parallelism",
    concept: "One task per partition. Executors drain the queue concurrently.",
    body: [
      "For each of your 8,000 partitions, Spark generates one task. The driver hands tasks to executors as soon as they are free. With four executors at four cores each — sixteen slots — sixteen tasks run concurrently at any given moment. The other 7,984 are queued in a priority list on the driver.",
      "Each task is a small bundle: a serialized copy of your transformation code, the location of the partition's input data, and the address of the executor that should pick it up. When the executor finishes, it reports success or failure back to the driver, and the driver hands it the next task. A task that fails is retried up to four times by default before the whole stage is marked failed.",
      "This is where the magic of Spark feels real. You wrote `.filter(col(\"country\") == \"US\")` once. Spark serialised that filter into bytes, sent it to every executor in the cluster, and now sixteen copies of your filter are running in parallel on different chunks of the dataset. You write code as if it's one machine; Spark fans it out."
    ]
  },
  {
    id: "narrow-vs-wide",
    index: 7,
    title: "Two kinds of work.",
    kicker: "07 · Transformations",
    concept: "Narrow stays local. Wide forces data to move between executors.",
    body: [
      "Not all transformations are equal. A filter is a quiet thing — each partition can decide on its own which rows to keep. A map is the same. A select that just trims columns is the same. We call these narrow transformations because each output partition depends on exactly one input partition. They cost nothing extra beyond the work itself.",
      "A `groupBy` is louder. To group all American sellers together, every row with `country = \"US\"` has to land on the same executor — but those rows could currently be sitting in any of the 8,000 partitions across all four executors. So Spark has to move them. We call these wide transformations because every output partition depends on every input partition. The same is true of `join`, `distinct`, `orderBy`, and the window functions.",
      "The cost of a wide transformation is enormous. Every row gets serialised, written to disk, sent over the network, deserialised, and re-inserted into a new partition. A terabyte that took twenty seconds to filter can take ten minutes to shuffle. This is the single biggest performance lesson in Spark: when you write a query, ask which operations are wide, and try to do them once — not three times in a row."
    ]
  },
  {
    id: "shuffle",
    index: 8,
    title: "The shuffle.",
    kicker: "08 · The shuffle",
    concept: "The shuffle is the most expensive thing Spark does. Understand it.",
    body: [
      "The shuffle is what makes wide transformations expensive. Watch the canvas: every row in flight is leaving one executor and arriving at another. The rule that decides where each row goes is simple — Spark computes `hash(key) % num_partitions` and that integer tells the row which destination executor it belongs to. Same key, same destination, every time. This is how `groupBy` puts all the Americans together and all the Mexicans together.",
      "Mechanically, here is what happens. Each executor scans its current partitions and writes out a shuffle file per destination — so if you have 200 target partitions and 16 source executors, that's 3,200 small files written to local disk in seconds. Then every destination executor reads back exactly the shuffle files meant for it, possibly from many other machines over the network. Then it merges them into the new partition. Then the next stage can begin.",
      "Skew is the failure mode to fear. If one key is 100 times more common than the others — `null`, often, or `\"unknown\"` — then one destination executor gets 100× the work of its peers. That executor becomes the long tail of the stage, and the entire job waits for it. Mitigations include salting (appending a random prefix to the key), broadcast joins (avoid shuffling the small side at all), and `spark.sql.adaptive.enabled` which can detect skew at runtime and split the heavy partition automatically."
    ]
  },
  {
    id: "stages",
    index: 9,
    title: "Stages, drawn on the air.",
    kicker: "09 · Stages",
    concept: "Spark cuts the DAG at every shuffle boundary. Tasks within a stage pipeline.",
    body: [
      "If you look at a Spark job from above, you do not see a single river of work. You see islands separated by shuffles. Each island is a stage, and tasks within a stage can run end-to-end without any cross-executor communication. The boundary between stages is always a shuffle.",
      "Why does this matter? Within a stage, Spark can pipeline operations. If you have `.filter().select().map()`, those three transformations happen in the same task, on the same row, without ever writing to disk. The intermediate values live in CPU registers for the lifetime of one row. This is the source of Spark's speed claim — it does many narrow operations on each row before checkpointing.",
      "Across stages, however, there has to be a write-and-read of every row. The DAG you see in the Spark UI is broken into stages exactly so you can spot the shuffles. A job with five stages did four shuffles. A job with one stage did none — and that is what you want."
    ]
  },
  {
    id: "airflow",
    index: 10,
    title: "A scheduler, above.",
    kicker: "10 · Orchestration",
    concept: "Spark runs one job. Airflow runs the same job every day, with retries.",
    body: [
      "Spark is brilliant at running one job. It is not very good at running the same job at two o'clock every morning, retrying it on failure, paging an engineer when it misses an SLA, and remembering every run that has ever happened. That's what Airflow is for.",
      "Airflow runs on a different machine — usually a small VM somewhere — and it does only three things. It reads Python files that define DAGs. It runs those DAGs on a schedule, or on demand, or in response to a sensor. And it records the state of every task that has ever run, so you can come back tomorrow and ask \"did Tuesday's job succeed?\".",
      "Airflow does not run Spark. It tells someone else to run Spark. The `DataprocSubmitJobOperator` shown above is a wrapper that calls Google's Dataproc Jobs API, which submits a spark-submit on your behalf, polls for status, and reports back. Airflow knows the job succeeded only because Dataproc told it so. This separation is what lets you swap Spark for a Beam job, or a dbt run, or anything else, without touching Airflow."
    ]
  },
  {
    id: "ephemeral",
    index: 11,
    title: "Born at 02:00, gone by 02:12.",
    kicker: "11 · Ephemeral clusters",
    concept: "Create cluster → submit job → delete cluster. Pay only for the minutes used.",
    body: [
      "The ephemeral pattern is the modern way to run Spark on the cloud. Your Airflow DAG has three tasks: `DataprocCreateClusterOperator` spins up a cluster from scratch, `DataprocSubmitJobOperator` runs your Spark job on it, and `DataprocDeleteClusterOperator` tears it back down. The first task takes about 90 seconds. The last takes about 15. The middle takes however long your job takes.",
      "Why bother? Because a Dataproc cluster with 4 n1-standard-8 workers costs roughly $1 per hour. If you only run it for the 12 minutes your job needs, you pay 20 cents. If you leave it on 24/7, you pay $24 every day — even on weekends, even on holidays. Multiply by the number of pipelines you have and the savings are real money.",
      "Set `trigger_rule='all_done'` on the delete step so that even a failed job still cleans up its cluster. Use preemptible workers (Google's spot instances) for an additional 60% discount, accepting that they may be reclaimed mid-job. And keep a small \"always-on\" cluster for ad-hoc queries from data scientists — the ephemeral pattern is for scheduled production jobs, not interactive notebooks."
    ]
  },
  {
    id: "fly",
    index: 12,
    title: "Your cluster, your camera.",
    kicker: "12 · Fly mode",
    concept: "Take the controls.",
    body: [
      "You have watched the cluster on rails for twelve scenes. Now take the camera. Drag to orbit, scroll to zoom, right-click to pan. The cluster you have been reading about is sitting there, breathing.",
      "There are eight planets in this final view instead of four — the same shape but a larger fleet, because in production you rarely stop at four workers. Around them, two hundred tiny motes drift gently. Those are partitions, the unit you now understand. Each one is a 128 MB chunk of someone's data, waiting to be picked up by an executor, processed, and sent to the next stage.",
      "There is nothing more to teach here. Move around. Notice the orbit. Find the master at the center. Click the explainer in the corner if you want any scene recapped. When you scroll past this section, the article ends — but everything you learned about Spark, you still know."
    ]
  }
];
