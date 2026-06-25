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

export interface LegendItem {
  /** Optional CSS color for the swatch dot. Falls back to the panel accent when omitted. */
  swatch?: string;
  /** The legend row text. */
  label: string;
}

export interface SceneMeta {
  id: SceneId;
  index: number;
  title: string;
  kicker: string;
  body: string[];
  concept: string;
  sources?: Array<{ label: string; href: string }>;
  /** "What the dots/colors mean" markers for the DOM legend overlay. */
  legend?: LegendItem[];
  /**
   * One-line "what am I looking at" helper, rendered as crisp DOM text at the
   * top-left of the 3D panel (so it never clips like floating 3D text, and it
   * shows on the mobile static poster too).
   */
  caption?: string;
}

export const SCENES: SceneMeta[] = [
  {
    id: "hero",
    index: 1,
    title: "A cluster, asleep.",
    kicker: "01 · The cluster",
    concept: "A Dataproc cluster is a small constellation of virtual machines.",
    body: [
      "It's two in the morning in a Google data center, and a handful of virtual machines hum at idle. One is the master — an `n2-standard-4`, 4 vCPUs and 16 GB of RAM. Four are workers — each an `n2-highmem-8`, 8 vCPUs and 64 GB. Together they're a Managed Service for Apache Spark cluster: the product you knew as Dataproc, rebranded in 2025. The shape is unchanged — a temporary, managed Spark environment that exists only while you need it. List price: about **$2.65/hr**, including the $0.01/vCPU Dataproc surcharge.",
      "A cluster is just your laptop, multiplied. Your laptop reads one file, sorts one list, totals one column at a time; a cluster does the same work across five machines — sometimes hundreds in production — all at once. The trick is that Spark hides almost all the wiring: you write code that looks like it runs on one computer, and Spark spreads it across the cluster for you.",
      "We're going to take this cluster apart and show what each piece does. Every number in the canvas is the real, current list price or default for **Apache Spark 3.5 on Dataproc 2.2** — pin that frame in your head before we start."
    ],
    legend: [
      { label: "the whole assembly = one Dataproc cluster (1 master + 4 workers)" },
      { swatch: "#e89856", label: "central glowing sun = master node (n2-standard-4)" },
      { swatch: "#e89856", label: "amber dust ring around the master = its halo (it's alive, listening)" },
      { swatch: "#79b9d4", label: "four orbiting planets = worker VMs (n2-highmem-8)" },
      { swatch: "#c8dfff", label: "small dots ringing each worker = its core threads" },
      { label: "faint outer ring = the workers' shared orbit (purely cosmetic)" }
    ]
  },
  {
    id: "anatomy",
    index: 2,
    title: "Inside a worker.",
    kicker: "02 · Anatomy",
    concept: "A worker is a VM. YARN slices it into containers. Each container hosts an executor.",
    body: [
      "Each worker is a virtual machine — an `n2-highmem-8` here: 8 vCPUs, 64 GB of memory, 8 GB per core, because Spark loves memory more than CPU. Cheaper options exist — `e2-standard-4` for dev at $0.13/hr, AMD `n2d-standard-8` (10–20% cheaper than N2 for similar performance), and the newer C3 / N4 / N4D families on Google's Titanium platform. But your Spark code doesn't run on the worker itself.",
      "The worker runs YARN, which carves its memory and CPU into containers. Inside each, YARN launches an executor — a JVM holding your code, data partitions, and cached results. Each worker here hosts **2 executors of 4 cores each**, ~**11 GB heap + 1.1 GB overhead** apiece. An executor runs one task per core, several at once — so 4 workers × 2 executors × 4 cores = **32 task slots** in parallel.",
      "The vocabulary trips people up. Worker is hardware (the VM); executor is a process (the JVM YARN launched in a container); task is a unit of work (one per partition, per core). Drag the planet — its atmosphere is translucent, so you can see the YARN container ring and the executors orbiting inside, each spinning its own core-threads."
    ],
    sources: [
      { label: "Dataproc supported machine types", href: "https://cloud.google.com/dataproc/docs/concepts/compute/supported-machine-types" },
      { label: "Cloudera executor sizing guide", href: "https://docs-archive.cloudera.com/documentation/enterprise/5-10-x/topics/admin_spark_tuning1.html" }
    ],
    legend: [
      { swatch: "#c8dfff", label: "blue sphere = the worker VM (n2-highmem-8)" },
      { swatch: "#9be8b3", label: "green ring = YARN, carving the VM into containers" },
      { swatch: "#f4cf9c", label: "two orange spheres = executor JVMs (one per container)" },
      { swatch: "#ffffff", label: "small white dots around each executor = its 4 core threads" },
      { swatch: "#e89856", label: "bright orange flash + drifting mote = a task just finished" }
    ]
  },
  {
    id: "driver",
    index: 3,
    title: "The driver wakes.",
    kicker: "03 · The driver",
    concept: "spark-submit ignites one JVM that conducts everything else.",
    body: [
      "Type `spark-submit` and hit Enter, and a single JVM blinks awake on the master: the driver — about **4 GB of heap** here. It doesn't move data, crunch numbers, or own any partitions. It only decides — and the executors obey.",
      "The driver does four things: reads your code into a directed acyclic graph of operations; asks YARN (or Kubernetes, on Dataproc on GKE) for executor containers; schedules tasks onto them; and collects results back, via small final aggregations or writes to durable storage. Do `.collect()` on a billion-row DataFrame and the driver is what crashes — every row has to fit in its memory at once.",
      "Two deploy modes matter. Client mode runs the driver on the machine where you typed spark-submit; cluster mode runs it inside the cluster on the master — what you want for any long-running production job. The canonical submit here: `spark-submit --deploy-mode cluster --executor-cores 4 --executor-memory 11g --num-executors 8 my-job.jar`."
    ],
    legend: [
      { swatch: "#e89856", label: "central amber sphere = the driver JVM (~4 GB heap)" },
      { swatch: "#e89856", label: "halo + flare ring = the driver is ignited and ready to dispatch" },
      { swatch: "#e89856", label: "dust ring around it = the surrounding cluster, listening" },
      { label: "panel below = the spark-submit command that launched everything" }
    ]
  },
  {
    id: "data-arrival",
    index: 4,
    title: "A terabyte arrives.",
    kicker: "04 · The data",
    concept: "Spark sees one logical dataset; physically it is many files. Nothing is read yet.",
    caption: "A 1 TB Parquet dataset (~800 files) drifts toward the master — registered, not yet read.",
    body: [
      "Picture a Parquet dataset on Cloud Storage — exactly one terabyte across about **800 files**. To you it's one DataFrame: `df = spark.read.parquet(\"gs://orders/2026/*.parquet\")`. To Spark it's a directory listing of those files and their schemas.",
      "Notice what doesn't happen: Spark doesn't download the terabyte, or even open the files. It builds a logical plan — \"read all of these and treat them as one DataFrame.\" This is lazy evaluation, the single most important idea in Spark.",
      "Nothing runs until you call an *action*. A transformation like `.filter()` or `.select()` only extends the plan; an action — `.count()`, `.show()`, `.collect()`, `.write()` — wakes Spark up. The next scene shows exactly what that wake-up looks like."
    ],
    legend: [
      { swatch: "#e89856", label: "central amber sphere = master node (idle, just waiting)" },
      { swatch: "#5fa8e5", label: "blue comet with tail = a 1 TB Parquet dataset arriving" },
      { label: "nothing is read yet — only the file listing has been registered" }
    ]
  },
  {
    id: "action-trigger",
    index: 5,
    title: "The Spark wakes.",
    kicker: "05 · The action",
    concept: "An action turns the lazy plan into 8,000 real tasks.",
    body: [
      "Type `df.count()` and press Enter — the moment of transition from lazy to eager. Watch the canvas.",
      "First the call lands on the driver. Catalyst, Spark's query optimizer, rewrites your whole chain of operations through the rules it knows — predicate pushdown, column pruning, join reordering. The Adaptive Query Execution layer (on by default since Spark 3.2) marks shuffle boundaries where it'll re-plan with live statistics. The output is a *physical plan*: a tree of operators the driver can ship to executors.",
      "Then the driver breaks the plan into stages, each a set of tasks — one per partition. For our 1 TB input split into ~8,000 partitions of 128 MB, that's 8,000 tasks queued in the driver's scheduling pool, handed out as executor slots free up. The pulse you see is the lazy plan turning into work. From now on, the cluster is hot."
    ],
    sources: [
      { label: "Databricks AQE deep-dive", href: "https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html" }
    ],
    legend: [
      { swatch: "#e89856", label: "center = the driver (waking up when the action fires)" },
      { swatch: "#79b9d4", label: "eight outer planets = worker executors" },
      { swatch: "#e89856", label: "amber pulse code-panel → driver = .count() being received" },
      { swatch: "#e89856", label: "amber rays driver → workers = stage-0 tasks being dispatched" },
      { label: "the top card ticks 0 → 8,000 — the task count for our 1 TB read" }
    ]
  },
  {
    id: "partitions",
    index: 6,
    title: "Eight thousand pieces.",
    kicker: "06 · Partitions",
    concept: "Spark slices data into ~128 MB partitions — the unit of parallelism.",
    caption: "Each dot = one ~128 MB partition. A 1 TB job has roughly 8,000 of them.",
    body: [
      "When Spark actually reads the terabyte, it splits the file list into partitions — chunks of rows roughly 128 MB each. 128 isn't magic: it matches the historical default block size of HDFS, the file system before Cloud Storage. A 128 MB partition reads in one disk seek, amortising nicely against the cost of starting a task.",
      "A terabyte at 128 MB per partition is about **8,000 partitions**. At a typical Parquet compression ratio of 5–10×, each decompresses to roughly **6–12 million rows** in memory (at ~100 bytes/row). The work-stealing scheduler lets faster executors grab more partitions and slower ones fewer — no central dispatcher to bottleneck.",
      "Change the count after the read with `.repartition(n)` (reshuffles to exactly n — expensive) or `.coalesce(n)` (only merges, never splits — cheap, but only for reducing). The default `spark.sql.shuffle.partitions = 200` has been wrong for almost every real workload since Spark 1.1 — for a 1 TB job you want closer to **5,000–8,000** (shuffle size ÷ 128 MB target). With AQE on, set a *large* initial number and let coalesce drive it down at runtime."
    ],
    sources: [
      { label: "Sahaj on shuffle partition tuning", href: "https://sahaj.ai/fine-tuning-shuffle-partitions-in-apache-spark-for-maximum-efficiency/" }
    ],
    legend: [
      { swatch: "#e89856", label: "center = the master node, orchestrating the read" },
      { swatch: "#5fa8e5", label: "each blue dot = one 128 MB partition (~6–12 M rows)" },
      { label: "we draw 96 dots, but in reality this is ~8,000 partitions for 1 TB" }
    ]
  },
  {
    id: "task-rain",
    index: 7,
    title: "Tasks, in parallel.",
    kicker: "07 · Parallelism",
    concept: "One task per partition. Executors drain the queue concurrently.",
    caption: "Each mote in flight = one task. 32 run at once; the other ~8,000 wait in the queue.",
    body: [
      "Spark generates one task per partition — 8,000 of them — and the driver hands them to executors as they free up. With our four `n2-highmem-8` workers running 8 executor cores each (**32 slots total**), 32 tasks run at any moment; the other 7,968 wait in the driver's priority queue.",
      "Each task is a small bundle: a serialized closure of your code, the location of its partition's input, and the address of the executor to pick it up. On finishing, the executor reports success or failure and gets the next task. A failed task is retried up to four times by default before the whole stage is marked failed.",
      "The `spark.speculation` flag (off by default) is the safety net for slow tasks: if one runs past 1.5× the median at the 75th percentile, Spark launches a duplicate on another executor — first to finish wins, the other is killed. Reports cite **13–24% faster jobs** when paired with dynamic allocation, but only on heterogeneous clusters with flaky disks; on uniform CPU-bound jobs it just wastes cores."
    ],
    legend: [
      { swatch: "#e89856", label: "center = the driver (handing out tasks)" },
      { swatch: "#79b9d4", label: "four outer planets W1–W4 = worker executors" },
      { swatch: "#f4f4f5", label: "white dot in flight = one task (closure + partition address)" },
      { label: "worker flashes bright the moment a task lands on it" }
    ]
  },
  {
    id: "narrow-vs-wide",
    index: 8,
    title: "Two kinds of work.",
    kicker: "08 · Transformations",
    concept: "Narrow stays local. Wide forces data to move between executors.",
    caption: "Left = narrow (rows stay put). Right = wide (rows shuffle across executors).",
    body: [
      "Not all transformations are equal. A `filter`, a `map`, a `select` that trims columns — each partition decides on its own which rows to keep. These are narrow: each output partition depends on exactly one input partition. On our 32-slot cluster a narrow scan of 1 TB takes roughly **3–5 minutes** (1024 GB / (32 cores × ~100 MB/s) ≈ 5 min).",
      "A `groupBy` is louder. To group all American sellers, every row with `country = \"US\"` must land on the same executor — but those rows could be in any of the 8,000 partitions across all four executors, so Spark has to move them. These are wide transformations: every output partition depends on every input partition. So are `join`, `distinct`, `orderBy`, and window functions.",
      "The cost is enormous. Every row is serialised, written to disk, sent over the network, deserialised, and re-inserted into a new partition. Shuffle write for 1 TB of Parquet is roughly **2 TB** (rows are uncompressed during shuffle, while Parquet on disk is column-compressed). A terabyte that filtered in five minutes can take **30–40 minutes** to shuffle. The biggest performance lesson in Spark: ask which operations are wide, and do them once — not three times in a row."
    ],
    legend: [
      { swatch: "#62cf83", label: "left green planet = a narrow transformation (filter / select)" },
      { swatch: "#5fa8e5", label: "right blue planet = a wide transformation (groupBy / join)" },
      { swatch: "#62cf83", label: "green dots = rows that stay on the same executor (cheap)" },
      { swatch: "#5fa8e5", label: "blue dots = rows hopping between executors (expensive)" }
    ]
  },
  {
    id: "joins",
    index: 9,
    title: "How joins really work.",
    kicker: "09 · Joins",
    concept: "Broadcast a small table, sort-merge two big ones, shuffle-hash in between, never nested-loop.",
    caption: "Small table broadcast to every worker; big tables shuffled and sort-merged.",
    body: [
      "Joining two DataFrames is the most common wide transformation in production Spark, and the strategy Spark picks decides whether the query takes ten seconds or ten minutes. There are four: **Broadcast Hash Join** (BHJ), **Sort-Merge Join** (SMJ), **Shuffle Hash Join** (SHJ), and the catastrophic-when-misused **Broadcast Nested Loop Join** (BNLJ). The first three are equi-joins (`a.key = b.key`); BNLJ is the fallback when there's no equality in the join condition.",
      "Broadcast Hash Join is the one to root for. When one side is below `spark.sql.autoBroadcastJoinThreshold` (default 10 MB at planning, 30 MB at runtime under AQE since Spark 3.2), Spark collects that small table to the driver, broadcasts it to every executor, and each builds a hash map and streams the big side through locally — no shuffle on the big side. For a 1 TB orders × 100 MB countries lookup with the threshold bumped to 200 MB, that's ~8,000 tasks of pure local work — about **2 to 5 minutes** end-to-end versus 20 to 40 for Sort-Merge. Force it with `df_big.join(broadcast(df_small), \"key\")` or `/*+ BROADCAST(countries) */`, but watch for driver OOM during collect.",
      "Sort-Merge Join is the default when both sides are big: Spark hashes both on the key, shuffles each into the same partitions, sorts locally, and walks the two sorted streams in lockstep — correct, but pays the full shuffle cost on both inputs. Shuffle Hash Join is the rare middle ground AQE picks when post-shuffle partitions fit a per-task hash build. BNLJ — the one to avoid — fires for non-equi joins (`>`, `BETWEEN`, complex predicates) and is O(N×M); when a big-data join \"hangs forever,\" check the physical plan, chances are BNLJ snuck in. Hint priority Spark respects: `BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL`."
    ],
    sources: [
      { label: "Spark SQL Performance Tuning", href: "https://spark.apache.org/docs/latest/sql-performance-tuning.html" },
      { label: "Spark Join Hints syntax", href: "https://spark.apache.org/docs/latest/sql-ref-syntax-qry-select-hints.html" },
      { label: "Databricks AQE", href: "https://docs.databricks.com/aws/en/optimizations/aqe" }
    ],
    legend: [
      { swatch: "#79b9d4", label: "four outer planets = worker executors (W1–W4)" },
      { swatch: "#62cf83", label: "small green planet (left) = the small table being broadcast" },
      { swatch: "#62cf83", label: "green dots flying out = broadcast copies landing on every worker" },
      { swatch: "#5fa8e5", label: "blue arcs between workers = rows shuffled (sort-merge / shuffle-hash)" },
      { swatch: "#e89856", label: "amber ring overhead = the hash table built on one side" },
      { label: "top label changes per strategy — watch the cycle: BHJ → SMJ → SHJ" }
    ]
  },
  {
    id: "shuffle",
    index: 10,
    title: "The shuffle.",
    kicker: "10 · The shuffle",
    concept: "The shuffle is the most expensive thing Spark does. Understand it.",
    caption: "Each arc = one row flying to a new executor, chosen by hash(key) % N.",
    body: [
      "The shuffle is what makes wide transformations expensive. Every row in flight is leaving one executor for another, and the rule is simple: Spark computes `hash(key) % num_partitions`, and that integer is the row's destination executor. Same key, same destination, every time — that's how `groupBy` puts all the Americans together and all the Mexicans together.",
      "Mechanically, each executor scans its partitions and writes one shuffle file per destination. With **8 source executors and 5,000 destination partitions**, that's 40,000 small files on local disk in seconds. (The 200 default is too small for 1 TB — see Scene 6.) Each destination executor then reads back exactly the files meant for it, often from many machines over the network, and merges them into its new partition. Then the next stage begins.",
      "Skew is the failure mode to fear. If one key is 100× more common than the rest — `null`, often, or `\"unknown\"` — one destination executor gets 100× the work, becomes the long tail of the stage, and the whole job waits for it. The next scene shows what AQE does about it automatically — and when you still have to salt the key yourself."
    ],
    legend: [
      { swatch: "#79b9d4", label: "four planets A B C D = the worker executors" },
      { swatch: "#6cabe0", label: "each arcing dot = one row (~256 B) in flight" },
      { label: "dot's color blends from source executor → destination executor" },
      { label: "the rule: hash(key) % N decides the destination" }
    ]
  },
  {
    id: "aqe",
    index: 11,
    title: "The optimizer wakes up mid-flight.",
    kicker: "11 · Adaptive Query Execution",
    concept: "AQE re-plans the query at runtime using actual statistics, not estimates.",
    caption: "AQE spots a skewed partition (> 5× median & > 256 MB) mid-run and splits it across free executors.",
    body: [
      "Catalyst, Spark's query optimizer, used to plan the whole job ahead of time from whatever statistics it had on disk. AQE — on by default since Spark 3.2 — lets it pause at every shuffle boundary, look at the actual sizes of the partitions it just wrote, and re-plan downstream. Three things change in flight.",
      "First, Adaptive Coalesce: the default `spark.sql.shuffle.partitions = 200` was almost always wrong, so you set it intentionally too high and AQE merges adjacent small partitions toward `advisoryPartitionSizeInBytes` (default **64 MB**) at runtime — the right count without guessing. Second, Dynamic Join Switch: a planned `SortMergeJoin` becomes a `BroadcastHashJoin` mid-query if the build side turns out smaller than expected after a filter, and the shuffle simply doesn't happen.",
      "Third, and most important — Skew Split. A partition is flagged skewed when its size is both **> 5× the median** AND **> 256 MB**. AQE splits it into ~64 MB pieces, replicates the matching rows from the other side, and spreads the work; a skewed Sort-Merge Join that ran for an hour can finish in five minutes. The canvas shows it: a giant 1.4 GB partition arrives, AQE detects it (the red ring fires), and it cleaves into 6 sub-partitions of ~240 MB that flow to free executors. When AQE misses skew — mild skew under thresholds, group-by aggregations, non-equi joins — you still salt the key by hand."
    ],
    sources: [
      { label: "Databricks AQE deep-dive", href: "https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html" },
      { label: "Canadian Data Guy on skewed joins", href: "https://www.canadiandataguy.com/p/a-deep-dive-into-skewed-joins-groupby" }
    ],
    legend: [
      { swatch: "#e89856", label: "center = master node" },
      { swatch: "#79b9d4", label: "four outer planets = worker executors (W1 is the unlucky one)" },
      { swatch: "#e89856", label: "large amber sphere = a skewed partition (>5× the median size)" },
      { swatch: "#e96440", label: "red ring pulse on W1 = AQE detecting the skew at runtime" },
      { swatch: "#5fa8e5", label: "blue spheres splitting away = sub-partitions sent to free executors" }
    ]
  },
  {
    id: "stages",
    index: 12,
    title: "Stages, drawn on the air.",
    kicker: "12 · Stages",
    concept: "Spark cuts the DAG at every shuffle boundary. Tasks within a stage pipeline.",
    caption: "Spark cuts the job into stages at each shuffle boundary; tasks pipeline within one.",
    body: [
      "Look at a Spark job from above and you don't see a single river of work — you see islands separated by shuffles. Each island is a stage, and tasks within it run end-to-end with no cross-executor communication. The boundary between stages is always a shuffle.",
      "Why does this matter? Within a stage, Spark pipelines operations: `.filter().select().map()` all happen in the same task, on the same row, never writing to disk — the intermediate values live in CPU registers for the lifetime of one row. That's the source of Spark's speed claim: many narrow operations per row before checkpointing.",
      "Across stages, though, every row is written and read back. The DAG in the Spark UI is broken into stages precisely so you can spot the shuffles: a job with five stages did four shuffles; a job with one stage did none — and that's what you want."
    ],
    legend: [
      { swatch: "#e89856", label: "center = master node coordinating the run" },
      { swatch: "#5fa8e5", label: "blue concentric orbits = stages 1 and 3" },
      { swatch: "#e89856", label: "amber orbit = stage 2 (the one running right now)" },
      { swatch: "#e89856", label: "spheres on each orbit = the parallel tasks in that stage" },
      { label: "the gap between any two orbits = a shuffle boundary" }
    ]
  },
  {
    id: "machine-types",
    index: 13,
    title: "Picking the planets.",
    kicker: "13 · Machine types",
    concept: "Spark on Dataproc is mostly N2-highmem. The other families exist for a reason.",
    body: [
      "Dataproc supports a wide menu — E2, N1, N2, N2D, C2, C2D, C3, N4, N4D, M1, M2, plus the Arm-based C4A — but the right answer for most Spark jobs is the same: `n2-highmem-8` at about **$0.52/hr**. Eight vCPUs, 64 GB — 8 GB per core — and per-second billing. Highmem matters because Spark caches partitions in RAM and OOMs rarely come from CPU starvation. The cheaper `n2-standard-8` ($0.39/hr) runs, but spills to disk on big shuffles.",
      "When does that change? E2 (`e2-standard-4`, ~$0.13/hr) is for dev and CI where speed doesn't matter. N2D is AMD, 10–20% cheaper than N2 for similar work. C3 (`c3-standard-8`, $0.40/hr, Sapphire Rapids) is the fastest single-core and shines on shuffle-heavy SQL. The memory beasts — M1 (`m1-ultramem-40`, $6.29/hr) and M2 — reach ~28 GB per vCPU, for jobs that broadcast huge tables or cache massive state. Sizing rule of thumb: pick 10–20 `n2-highmem-8` workers for a 1 TB batch ETL, scale horizontally first, vertically only when broadcast joins or large UDFs dominate.",
      "Secondary (spot) workers are 60–91% cheaper but can be reclaimed mid-job — cap them at ~50% of your primary count for jobs over an hour, since Spark recovery is cheap but recomputing lost shuffle data isn't. The master? An `n2-standard-4` is fine until ~100 workers, then go HA with three. On Serverless for Apache Spark you don't pick a machine type at all — you pick a DCU count and Google scales it, with cold start in 30–60 seconds."
    ],
    sources: [
      { label: "Dataproc machine type support matrix", href: "https://cloud.google.com/dataproc/docs/concepts/compute/supported-machine-types" },
      { label: "mkuthan Dataproc tuning blog", href: "https://mkuthan.github.io/blog/2022/03/24/gcp-dataproc-spark-tuning/" }
    ],
    legend: [
      { label: "each planet = one Dataproc machine family — size ∝ its RAM" },
      { swatch: "#9be8b3", label: "small green = e2-standard-4, the cheap dev box" },
      { swatch: "#9fcef7", label: "medium blue = n2-standard-8, the default" },
      { swatch: "#f4cf9c", label: "★ amber (with pulsing ring) = n2-highmem-8, the Spark workhorse" },
      { swatch: "#c8dfff", label: "pale blue = c3-standard-8, the compute speed king" },
      { swatch: "#dca0e6", label: "purple giant = m1-ultramem-40, for huge cached state" }
    ]
  },
  {
    id: "airflow",
    index: 14,
    title: "A scheduler, above.",
    kicker: "14 · Orchestration",
    concept: "Spark runs one job. Airflow runs the same job every day, with retries.",
    body: [
      "Spark is brilliant at running one job. It's not good at running that job at two every morning, retrying on failure, paging an engineer on a missed SLA, and remembering every run. That's what Airflow is for.",
      "Airflow runs on a different machine — usually a small VM — and does only three things: it reads Python files that define DAGs; runs them on a schedule (cron-like `0 2 * * *` for daily at 02:00), on demand, or via a sensor; and records the state of every task ever run, so tomorrow you can ask \"did Tuesday's job succeed?\".",
      "Airflow doesn't run Spark — it tells someone else to. The `DataprocSubmitJobOperator` above wraps Google's Dataproc Jobs API, which submits a spark-submit on your behalf, polls for status, and reports back; Airflow knows the job succeeded only because Dataproc said so. That separation lets you swap Spark for a Beam job, a dbt run, or anything else without touching Airflow."
    ],
    legend: [
      { swatch: "#b0b0b8", label: "gray clock dial overhead = Airflow's schedule" },
      { swatch: "#e89856", label: "amber clock hand sweeping the dial = ticking toward 02:00" },
      { swatch: "#5fa8e5", label: "left blue planet = task 1: DataprocCreateClusterOperator" },
      { swatch: "#e89856", label: "middle amber planet = task 2: DataprocSubmitJobOperator" },
      { swatch: "#5fa8e5", label: "right blue planet = task 3: DataprocDeleteClusterOperator" },
      { label: "tasks light up in sequence — that's the DAG running each morning" }
    ]
  },
  {
    id: "ephemeral",
    index: 15,
    title: "Born at 02:00, gone by 02:12.",
    kicker: "15 · Ephemeral clusters",
    concept: "Create cluster → submit job → delete cluster. Pay only for the minutes used.",
    body: [
      "The ephemeral pattern is the modern way to run Spark in the cloud. Your Airflow DAG has three tasks: `DataprocCreateClusterOperator` spins up a cluster, `DataprocSubmitJobOperator` runs your job on it, and `DataprocDeleteClusterOperator` tears it down. The first takes ~90 seconds, the last ~15, the middle however long your job runs.",
      "Why bother? Our canonical cluster — 4 × `n2-highmem-8` + 1 master with the surcharge — costs about **$2.65/hr**. Run it only the 12 minutes your job needs (create 90s + run 11min + delete 15s) and you pay about **$0.53**; leave it on 24/7 and it's $64 every day, weekends and holidays included. Multiply by your pipeline count and the savings are real money.",
      "Set `trigger_rule='all_done'` on the delete step so even a failed job cleans up its cluster. Use Spot secondary workers (Google's preemptible successor) for another 60–91% off, accepting mid-job reclaim — Spark retries on remaining workers, though shuffle data on the lost node must be recomputed. Keep a small \"always-on\" cluster for data scientists' ad-hoc queries — the ephemeral pattern is for scheduled production jobs, not interactive notebooks. The newest tier, Lightning Engine on Serverless for Apache Spark, claims up to 4.3× speedups on TPC-DS, at the price of the premium SKU."
    ],
    sources: [
      { label: "Dataproc pricing", href: "https://cloud.google.com/dataproc/pricing" },
      { label: "Lightning Engine for Serverless", href: "https://cloud.google.com/blog/products/data-analytics/dataproc-serverless-performance-and-usability-updates/" }
    ],
    legend: [
      { swatch: "#e89856", label: "center = master node" },
      { swatch: "#79b9d4", label: "four outer planets = worker VMs" },
      { swatch: "#62cf83", label: "green card = ephemeral cost: $0.53 for ~12 minutes/day" },
      { swatch: "#e96440", label: "red card = always-on cost: $64/day even on weekends" },
      { label: "the whole cluster pulses up and dissolves on a loop — that's one daily cycle" }
    ]
  },
  {
    id: "fly",
    index: 16,
    title: "Your cluster, your camera.",
    kicker: "16 · Fly mode",
    concept: "Take the controls.",
    body: [
      "You've watched the cluster on rails for fifteen scenes. Now take the camera — drag to orbit, scroll to zoom, right-click to pan. The cluster you've been reading about is sitting there, breathing.",
      "Eight planets here instead of four — the same shape, a larger fleet, because in production you rarely stop at four workers. Around them, two hundred tiny motes drift: partitions, the unit you now understand, each a 128 MB chunk of someone's data waiting to be picked up by an executor, processed, and sent to the next stage.",
      "There's nothing more to teach. Move around, notice the orbit, find the master at the center. When you scroll past this section the article ends — but everything you learned about Spark, you still know."
    ],
    legend: [
      { swatch: "#e89856", label: "center = master node" },
      { swatch: "#79b9d4", label: "eight outer planets = workers (production fleet, not just 4)" },
      { swatch: "#b0b0b8", label: "small drifting motes = ~180 partitions waiting to be processed" },
      { label: "your camera now — drag to orbit, scroll to zoom, right-click to pan" }
    ]
  }
];
