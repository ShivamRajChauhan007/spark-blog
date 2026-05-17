// Scene metadata — single source of truth for all 16 scenes.
// CANONICAL EXAMPLE (locked across the article):
//   Cluster: 4 × n2-highmem-8 workers + 1 × n2-standard-4 master
//           = 32 vCPU · 256 GB RAM · ~$2.65/hr including Dataproc surcharge
//   Input:  1 TB Parquet on Cloud Storage, ~800 files, ~8,000 partitions
//   Spark:  Apache Spark 3.5 on Dataproc 2.2

export type SceneId =
  | "hero"
  | "anatomy"
  | "driver"
  | "data-arrival"
  | "action-trigger"
  | "partitions"
  | "task-rain"
  | "narrow-vs-wide"
  | "joins"
  | "shuffle"
  | "aqe"
  | "stages"
  | "machine-types"
  | "airflow"
  | "ephemeral"
  | "fly";

export interface SceneMeta {
  id: SceneId;
  index: number;
  title: string;
  kicker: string;
  body: string[];
  concept: string;
  sources?: Array<{ label: string; href: string }>;
}

export const SCENES: SceneMeta[] = [
  {
    id: "hero",
    index: 1,
    title: "A cluster, asleep.",
    kicker: "01 · The cluster",
    concept: "A Dataproc cluster is a small constellation of virtual machines.",
    body: [
      "It is two in the morning. Somewhere in a Google data center, a handful of virtual machines hum at idle. One of them is the master (an `n2-standard-4` with 4 vCPUs and 16 GB of RAM). The other four are workers (each an `n2-highmem-8` with 8 vCPUs and 64 GB of RAM). Together they form what Google now calls a Managed Service for Apache Spark cluster — the same product you remember as Dataproc, with a 2025 rebrand. The shape is unchanged: a temporary, managed Spark environment that exists only while you need it. List price: about **$2.65/hr** including the $0.01/vCPU Dataproc surcharge.",
      "If you've used Spark on your laptop, the cluster is the next thing to learn. Your laptop is one machine: it can read one file, sort one list, total one column at a time. A cluster is the same idea, multiplied — five machines here, sometimes hundreds in production, each doing the same kind of work in parallel. The trick is that Spark hides almost all of the wiring. You write code that looks like it runs on one computer, and Spark figures out how to spread it across five.",
      "Scroll on. We are going to take this cluster apart and show you what each piece does. Every number you see in the canvas is the real, current list price or default for **Apache Spark 3.5 on Dataproc 2.2** — pin that frame in your head before we start."
    ]
  },
  {
    id: "anatomy",
    index: 2,
    title: "Inside a worker.",
    kicker: "02 · Anatomy",
    concept: "A worker is a VM. YARN slices it into containers. Each container hosts an executor.",
    body: [
      "Each worker is a virtual machine — an `n2-highmem-8` in our canonical setup. Eight vCPUs and 64 GB of memory, eight gigabytes per core, because Spark loves memory more than it loves CPU. There are cheaper options like `e2-standard-4` for development at $0.13/hr, AMD-based `n2d-standard-8` that's 10–20% cheaper than N2 for similar performance, and newer C3 / N4 / N4D families on Google's Titanium platform. But your Spark code does not run on the worker itself.",
      "The worker runs YARN, a resource manager that carves the VM's memory and CPU into containers. Inside each container, YARN launches an executor — a Java Virtual Machine that holds your code, your data partitions, and your cached results. In our setup each worker hosts **2 executors of 4 cores each**, with about **11 GB of heap + 1.1 GB of overhead** per executor. One executor runs several tasks at once, one per core. So 4 workers × 2 executors × 4 cores = **32 task slots** running in parallel.",
      "The vocabulary trips a lot of people up. A worker is not an executor, and an executor is not a task. Worker is hardware (the VM). Executor is process (the JVM YARN launched inside the container). Task is unit of work (one task per partition, per core). Drag the planet on the right — the worker's atmosphere is translucent so you can see the YARN container ring around it and the executors orbiting inside, each spinning its own core-threads."
    ],
    sources: [
      { label: "Dataproc supported machine types", href: "https://cloud.google.com/dataproc/docs/concepts/compute/supported-machine-types" },
      { label: "Cloudera executor sizing guide", href: "https://docs-archive.cloudera.com/documentation/enterprise/5-10-x/topics/admin_spark_tuning1.html" }
    ]
  },
  {
    id: "driver",
    index: 3,
    title: "The driver wakes.",
    kicker: "03 · The driver",
    concept: "spark-submit ignites one JVM that conducts everything else.",
    body: [
      "When you type `spark-submit` and hit Enter, a single JVM blinks awake on the master. This is the driver — about **4 GB of heap** for our setup. It does not move data, it does not crunch numbers, it does not own any of the partitions. It only decides — and the executors obey.",
      "The driver does four things. It reads your code and builds a directed acyclic graph of operations. It asks YARN (or Kubernetes, on Dataproc on GKE) for executor containers. It schedules tasks onto those executors. And it collects results back, sometimes via small final aggregations and sometimes via writes to durable storage. If you ever do `.collect()` on a billion-row DataFrame, the driver is what crashes — because every row has to fit in its memory at once.",
      "There are two deploy modes worth knowing. Client mode runs the driver on the machine where you typed spark-submit. Cluster mode runs the driver inside the cluster on the master. Cluster mode is what you want for any long-running production job. The canonical submit for this article: `spark-submit --deploy-mode cluster --executor-cores 4 --executor-memory 11g --num-executors 8 my-job.jar`."
    ]
  },
  {
    id: "data-arrival",
    index: 4,
    title: "A terabyte arrives.",
    kicker: "04 · The data",
    concept: "Spark sees one logical dataset; physically it is many files. Nothing is read yet.",
    body: [
      "Imagine a Parquet dataset on Cloud Storage that is, when measured, exactly one terabyte spread across about **800 files**. To you it is one DataFrame — `df = spark.read.parquet(\"gs://orders/2026/*.parquet\")`. To Spark it is a directory listing of those files and their schemas.",
      "Notice what does and does not happen at this moment. Spark does not download the terabyte. Spark does not even open the files. It builds a logical plan that says \"I will read all of these files and treat them as one DataFrame.\" This is called lazy evaluation, and it is the single most important idea in Spark.",
      "Nothing happens until you call an *action*. A transformation like `.filter()` or `.select()` only extends the plan. An action — `.count()`, `.show()`, `.collect()`, `.write()` — is what wakes Spark up. The next scene shows you exactly what that wake-up looks like."
    ]
  },
  {
    id: "action-trigger",
    index: 5,
    title: "The Spark wakes.",
    kicker: "05 · The action",
    concept: "An action turns the lazy plan into 8,000 real tasks.",
    body: [
      "Type `df.count()` and press Enter. This is the moment of transition — lazy to eager — that nothing in the previous scene has yet shown. Watch the canvas.",
      "First, the call lands on the driver. Catalyst — Spark's query optimizer — looks at the entire chain of operations you stacked up and rewrites it through the rules it knows: predicate pushdown, column pruning, join reordering. The Adaptive Query Execution layer (on by default since Spark 3.2) marks shuffle boundaries where it intends to re-plan with live statistics. The output is a *physical plan* — a tree of operators that the driver can ship to executors.",
      "Then the driver breaks the plan into stages. Each stage becomes a set of tasks — one task per partition. For our 1 TB input split into ~8,000 partitions of 128 MB, that's 8,000 tasks queued in the driver's scheduling pool. The driver hands them out to executors as slots free up. The pulse you see in the visualization is the moment the lazy plan turns into work. From now on the cluster is hot."
    ],
    sources: [
      { label: "Databricks AQE deep-dive", href: "https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html" }
    ]
  },
  {
    id: "partitions",
    index: 6,
    title: "Eight thousand pieces.",
    kicker: "06 · Partitions",
    concept: "Spark slices data into ~128 MB partitions — the unit of parallelism.",
    body: [
      "When Spark actually reads the terabyte, it splits the file list into partitions. Each partition is a chunk of rows roughly 128 megabytes in size. The number 128 is not magic — it matches the historical default block size of HDFS, the file system that came before Cloud Storage. A 128 MB partition reads in one disk seek, and the read amortises nicely against the cost of starting a task.",
      "A terabyte at 128 MB per partition gives you about **8,000 partitions**. At a typical Parquet compression ratio of 5–10×, each 128 MB on-disk partition decompresses to roughly **6–12 million rows** in memory if rows are ~100 bytes. The work-stealing scheduler ensures faster executors pick up more partitions while slower ones do fewer — no central dispatcher to bottleneck.",
      "You can change the partition count after the read with `.repartition(n)` or `.coalesce(n)`. Repartition reshuffles to give you exactly n partitions (expensive). Coalesce only merges, never splits (cheap, but only useful when reducing). The default of `spark.sql.shuffle.partitions = 200` has been wrong for almost every real workload since Spark 1.1 — for a 1 TB job you want closer to **5,000–8,000** (shuffle size ÷ 128 MB target). With Adaptive Query Execution on, set a *large* initial number and let coalesce drive it down at runtime."
    ],
    sources: [
      { label: "Sahaj on shuffle partition tuning", href: "https://sahaj.ai/fine-tuning-shuffle-partitions-in-apache-spark-for-maximum-efficiency/" }
    ]
  },
  {
    id: "task-rain",
    index: 7,
    title: "Tasks, in parallel.",
    kicker: "07 · Parallelism",
    concept: "One task per partition. Executors drain the queue concurrently.",
    body: [
      "For each of your 8,000 partitions, Spark generates one task. The driver hands tasks to executors as soon as they are free. With our four `n2-highmem-8` workers running 8 executor cores each — **32 slots total** — 32 tasks run concurrently at any given moment. The other 7,968 sit in the driver's priority queue.",
      "Each task is a small bundle: a serialized closure of your transformation code, the location of the partition's input data, and the address of the executor that should pick it up. When the executor finishes, it reports success or failure back to the driver, and the driver hands it the next task. A task that fails is retried up to four times by default before the whole stage is marked failed.",
      "Spark's `spark.speculation` flag (off by default) is the safety net for slow tasks. If a task runs more than 1.5× the median time at the 75th percentile, Spark launches a duplicate on another executor. First to finish wins; the other is killed. Reports cite **13–24% faster jobs** when speculation is paired with dynamic allocation, but only on heterogeneous clusters with flaky disks — on uniform CPU-bound jobs it wastes cores."
    ]
  },
  {
    id: "narrow-vs-wide",
    index: 8,
    title: "Two kinds of work.",
    kicker: "08 · Transformations",
    concept: "Narrow stays local. Wide forces data to move between executors.",
    body: [
      "Not all transformations are equal. A filter is a quiet thing — each partition can decide on its own which rows to keep. A map is the same. A select that just trims columns is the same. We call these narrow transformations because each output partition depends on exactly one input partition. On our 32-slot cluster a narrow scan of 1 TB takes roughly **3–5 minutes**: 1024 GB / (32 cores × ~100 MB/s) ≈ 5 min.",
      "A `groupBy` is louder. To group all American sellers together, every row with `country = \"US\"` has to land on the same executor — but those rows could currently be sitting in any of the 8,000 partitions across all four executors. So Spark has to move them. We call these wide transformations because every output partition depends on every input partition. The same is true of `join`, `distinct`, `orderBy`, and the window functions.",
      "The cost of a wide transformation is enormous. Every row gets serialised, written to disk, sent over the network, deserialised, and re-inserted into a new partition. Shuffle write for 1 TB of Parquet input is roughly **2 TB** (rows are stored uncompressed during shuffle, while Parquet on disk is column-compressed). A terabyte that took five minutes to filter can take **30–40 minutes** to shuffle. This is the single biggest performance lesson in Spark: when you write a query, ask which operations are wide, and try to do them once — not three times in a row."
    ]
  },
  {
    id: "joins",
    index: 9,
    title: "How joins really work.",
    kicker: "09 · Joins",
    concept: "Broadcast a small table, sort-merge two big ones, shuffle-hash in between, never nested-loop.",
    body: [
      "Joining two DataFrames is the most common wide transformation in production Spark. The strategy Spark picks decides whether the query takes ten seconds or ten minutes. There are four: **Broadcast Hash Join** (BHJ), **Sort-Merge Join** (SMJ), **Shuffle Hash Join** (SHJ), and the catastrophic-when-misused **Broadcast Nested Loop Join** (BNLJ). The first three are equi-joins (`a.key = b.key`); the fourth is what Spark falls back to when there is no equality on the join condition.",
      "Broadcast Hash Join is the one to root for. When one side is below `spark.sql.autoBroadcastJoinThreshold` (default 10 MB at planning, 30 MB at runtime under AQE since Spark 3.2), Spark collects that small table to the driver, wraps it in a torrent-style broadcast, and ships it to every executor. Each executor builds a hash map from the small side and streams the big side through it locally. No shuffle on the big side. For a 1 TB orders × 100 MB countries lookup with the threshold bumped to 200 MB, this is ~8,000 tasks of pure local work — about **2 to 5 minutes** end-to-end on our cluster, versus 20 to 40 minutes for Sort-Merge. Force it manually with `df_big.join(broadcast(df_small), \"key\")` or `/*+ BROADCAST(countries) */`. Watch out for driver OOM during collect.",
      "Sort-Merge Join is the default when both sides are big. Spark hashes both DataFrames on the join key, shuffles each into the same set of partitions, sorts each partition locally, and then walks the two sorted streams in lockstep. Correct but pays the full shuffle cost on both inputs. Shuffle Hash Join is the rare middle ground that AQE picks when post-shuffle partitions all fit a per-task hash build. And BNLJ — the one to avoid — fires for non-equi joins (`>`, `BETWEEN`, complex predicates) and is O(N×M). When your big-data join \"hangs forever,\" check the physical plan first; chances are BNLJ snuck in. The hint priority Spark respects: `BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL`."
    ],
    sources: [
      { label: "Spark SQL Performance Tuning", href: "https://spark.apache.org/docs/latest/sql-performance-tuning.html" },
      { label: "Spark Join Hints syntax", href: "https://spark.apache.org/docs/latest/sql-ref-syntax-qry-select-hints.html" },
      { label: "Databricks AQE", href: "https://docs.databricks.com/aws/en/optimizations/aqe" }
    ]
  },
  {
    id: "shuffle",
    index: 10,
    title: "The shuffle.",
    kicker: "10 · The shuffle",
    concept: "The shuffle is the most expensive thing Spark does. Understand it.",
    body: [
      "The shuffle is what makes wide transformations expensive. Watch the canvas: every row in flight is leaving one executor and arriving at another. The rule that decides where each row goes is simple — Spark computes `hash(key) % num_partitions` and that integer tells the row which destination executor it belongs to. Same key, same destination, every time. This is how `groupBy` puts all the Americans together and all the Mexicans together.",
      "Mechanically: each executor scans its current partitions and writes out one shuffle file per destination. With **8 source executors and 5,000 destination partitions** that's 40,000 small files written to local disk in seconds. (The 200 default is too small for 1 TB; the prose in Scene 6 explains why.) Each destination executor then reads back exactly the shuffle files meant for it, possibly from many other machines over the network, and merges them into the new partition. Then the next stage can begin.",
      "Skew is the failure mode to fear. If one key is 100× more common than the others — `null`, often, or `\"unknown\"` — then one destination executor gets 100× the work of its peers. That executor becomes the long tail of the stage, and the entire job waits for it. The next scene shows what Spark's Adaptive Query Execution does about it automatically — and when you still have to salt the key yourself."
    ]
  },
  {
    id: "aqe",
    index: 11,
    title: "The optimizer wakes up mid-flight.",
    kicker: "11 · Adaptive Query Execution",
    concept: "AQE re-plans the query at runtime using actual statistics, not estimates.",
    body: [
      "Catalyst, Spark's query optimizer, used to plan the whole job ahead of time using whatever statistics it had on disk. AQE — on by default since Spark 3.2 — lets Catalyst pause at every shuffle boundary, look at the actual sizes of the partitions it just wrote, and re-plan everything downstream. Three things change in flight.",
      "First, Adaptive Coalesce. The default `spark.sql.shuffle.partitions = 200` was almost always wrong for a specific workload. With AQE, you set it intentionally too high and AQE merges adjacent small partitions toward `advisoryPartitionSizeInBytes` (default **64 MB**) at runtime. Suddenly you have the right number of partitions without ever guessing. Second, Dynamic Join Switch. A planned `SortMergeJoin` can become a `BroadcastHashJoin` mid-query if the build side turns out to be smaller than expected after a filter. The shuffle that would have happened simply doesn't.",
      "Third — and most important — Skew Split. A partition is flagged skewed when its size is both **> 5× the median** AND **> 256 MB**. AQE splits it into smaller pieces of about 64 MB each, replicates the matching rows from the other side, and distributes the work. A skewed Sort-Merge Join that used to run for an hour can finish in five minutes. The visualization on the right shows it: one giant 1.4 GB partition arrives at an executor, AQE detects it (the red ring fires), and it cleaves into 6 sub-partitions of ~240 MB that flow to free executors. When AQE misses skew (mild skew under thresholds, group-by aggregations, or non-equi joins) you still have to salt the key by hand."
    ],
    sources: [
      { label: "Databricks AQE deep-dive", href: "https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html" },
      { label: "Canadian Data Guy on skewed joins", href: "https://www.canadiandataguy.com/p/a-deep-dive-into-skewed-joins-groupby" }
    ]
  },
  {
    id: "stages",
    index: 12,
    title: "Stages, drawn on the air.",
    kicker: "12 · Stages",
    concept: "Spark cuts the DAG at every shuffle boundary. Tasks within a stage pipeline.",
    body: [
      "If you look at a Spark job from above, you do not see a single river of work. You see islands separated by shuffles. Each island is a stage, and tasks within a stage can run end-to-end without any cross-executor communication. The boundary between stages is always a shuffle.",
      "Why does this matter? Within a stage, Spark can pipeline operations. If you have `.filter().select().map()`, those three transformations happen in the same task, on the same row, without ever writing to disk. The intermediate values live in CPU registers for the lifetime of one row. This is the source of Spark's speed claim — it does many narrow operations on each row before checkpointing.",
      "Across stages, however, there has to be a write-and-read of every row. The DAG you see in the Spark UI is broken into stages exactly so you can spot the shuffles. A job with five stages did four shuffles. A job with one stage did none — and that is what you want."
    ]
  },
  {
    id: "machine-types",
    index: 13,
    title: "Picking the planets.",
    kicker: "13 · Machine types",
    concept: "Spark on Dataproc is mostly N2-highmem. The other families exist for a reason.",
    body: [
      "Dataproc supports a wide menu — E2, N1, N2, N2D, C2, C2D, C3, N4, N4D, M1, M2, plus the Arm-based C4A. The right answer for most Spark jobs is the same: `n2-highmem-8` at about **$0.52/hr**. Eight vCPUs, 64 GB of memory — eight gigabytes per core — and per-second billing. Highmem matters because Spark caches partitions in RAM and your OOMs almost never come from CPU starvation. The cheaper `n2-standard-8` at $0.39/hr will run, but it'll spill to disk on big shuffles.",
      "When does the answer change? E2 (`e2-standard-4` at ~$0.13/hr) is for dev and CI clusters where speed doesn't matter. N2D is AMD and runs 10–20% cheaper than N2 for similar workloads. C3 (`c3-standard-8` at $0.40/hr, Sapphire Rapids) is the fastest single-core and shines on shuffle-heavy SQL. The memory beasts — M1 (`m1-ultramem-40` at $6.29/hr) and M2 — go up to ~28 GB per vCPU and are reserved for jobs that broadcast huge tables or cache massive state. Workers cost real money, so the cluster-sizing rule of thumb is: pick 10–20 `n2-highmem-8` workers for a 1 TB batch ETL, scale horizontally first, scale vertically only when broadcast joins or large UDFs dominate.",
      "Secondary (spot) workers are 60–91% cheaper than on-demand but can be reclaimed mid-job. Cap them at ~50% of your primary worker count for jobs longer than an hour — Spark recovery is cheap, but recomputing lost shuffle data isn't. Master node? An `n2-standard-4` is fine until you cross 100 workers, then go HA with three. On Serverless for Apache Spark, you don't pick a machine type at all — you pick a DCU count and Google scales it for you, with cold start in 30–60 seconds."
    ],
    sources: [
      { label: "Dataproc machine type support matrix", href: "https://cloud.google.com/dataproc/docs/concepts/compute/supported-machine-types" },
      { label: "mkuthan Dataproc tuning blog", href: "https://mkuthan.github.io/blog/2022/03/24/gcp-dataproc-spark-tuning/" }
    ]
  },
  {
    id: "airflow",
    index: 14,
    title: "A scheduler, above.",
    kicker: "14 · Orchestration",
    concept: "Spark runs one job. Airflow runs the same job every day, with retries.",
    body: [
      "Spark is brilliant at running one job. It is not very good at running the same job at two o'clock every morning, retrying it on failure, paging an engineer when it misses an SLA, and remembering every run that has ever happened. That's what Airflow is for.",
      "Airflow runs on a different machine — usually a small VM somewhere — and it does only three things. It reads Python files that define DAGs. It runs those DAGs on a schedule (cron-like: `0 2 * * *` for daily at 02:00), or on demand, or in response to a sensor. And it records the state of every task that has ever run, so you can come back tomorrow and ask \"did Tuesday's job succeed?\".",
      "Airflow does not run Spark. It tells someone else to run Spark. The `DataprocSubmitJobOperator` shown above is a wrapper that calls Google's Dataproc Jobs API, which submits a spark-submit on your behalf, polls for status, and reports back. Airflow knows the job succeeded only because Dataproc told it so. This separation is what lets you swap Spark for a Beam job, or a dbt run, or anything else, without touching Airflow."
    ]
  },
  {
    id: "ephemeral",
    index: 15,
    title: "Born at 02:00, gone by 02:12.",
    kicker: "15 · Ephemeral clusters",
    concept: "Create cluster → submit job → delete cluster. Pay only for the minutes used.",
    body: [
      "The ephemeral pattern is the modern way to run Spark on the cloud. Your Airflow DAG has three tasks: `DataprocCreateClusterOperator` spins up a cluster from scratch, `DataprocSubmitJobOperator` runs your Spark job on it, and `DataprocDeleteClusterOperator` tears it back down. The first task takes about 90 seconds. The last takes about 15. The middle takes however long your job takes.",
      "Why bother? Our canonical cluster — 4 × `n2-highmem-8` workers + 1 master with the Dataproc surcharge — costs about **$2.65/hr**. If you only run it for the 12 minutes your job needs (create 90s + run 11min + delete 15s), you pay about **$0.53**. If you leave it on 24/7, you pay $64 every day — even on weekends, even on holidays. Multiply by the number of pipelines you have and the savings are real money.",
      "Set `trigger_rule='all_done'` on the delete step so that even a failed job still cleans up its cluster. Use Spot secondary workers (Google's preemptible-successor) for an additional 60–91% discount, accepting that they may be reclaimed mid-job — Spark will retry on remaining workers, though shuffle data on the lost node has to be recomputed. And keep a small \"always-on\" cluster for ad-hoc queries from data scientists — the ephemeral pattern is for scheduled production jobs, not interactive notebooks. The newest tier, Lightning Engine on Serverless for Apache Spark, claims up to 4.3× speedups on TPC-DS at the price of needing the premium SKU."
    ],
    sources: [
      { label: "Dataproc pricing", href: "https://cloud.google.com/dataproc/pricing" },
      { label: "Lightning Engine for Serverless", href: "https://cloud.google.com/blog/products/data-analytics/dataproc-serverless-performance-and-usability-updates/" }
    ]
  },
  {
    id: "fly",
    index: 16,
    title: "Your cluster, your camera.",
    kicker: "16 · Fly mode",
    concept: "Take the controls.",
    body: [
      "You have watched the cluster on rails for fifteen scenes. Now take the camera. Drag to orbit, scroll to zoom, right-click to pan. The cluster you have been reading about is sitting there, breathing.",
      "There are eight planets in this final view instead of four — the same shape but a larger fleet, because in production you rarely stop at four workers. Around them, two hundred tiny motes drift gently. Those are partitions, the unit you now understand. Each one is a 128 MB chunk of someone's data, waiting to be picked up by an executor, processed, and sent to the next stage.",
      "There is nothing more to teach here. Move around. Notice the orbit. Find the master at the center. Click the explainer in the corner if you want any scene recapped. When you scroll past this section, the article ends — but everything you learned about Spark, you still know."
    ]
  }
];
