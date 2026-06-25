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
      "It's two in the morning in a Google data center, and a handful of virtual machines hum at idle. One is the master — an `n2-standard-4`, 4 vCPUs and 16 GB of RAM. Four are workers, each an `n2-highmem-8` with 8 vCPUs and 64 GB. Together they're a Managed Service for Apache Spark cluster: the product you knew as Dataproc, rebranded in 2025. Nothing about it changed except the name — it still spins up only while you need it, then goes away. List price runs about **$2.65/hr**, including the $0.01/vCPU Dataproc surcharge.",
      "A cluster is just your laptop, multiplied. Where your laptop crunches through a file one chunk at a time, the cluster splits that same job across five machines — hundreds, in production — and runs the pieces side by side. The clever part is what you don't see: you write code as if it runs on one computer, and Spark quietly fans it out across every worker.",
      "We're going to take the thing apart, piece by piece. Every number you see in the canvas is a real list price or default for **Apache Spark 3.5 on Dataproc 2.2** — pin that frame in your head before we start."
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
      "Worker, executor, task get used interchangeably all the time, and then nothing lines up. The worker is just hardware, the VM. The executor lives inside it, a JVM process YARN launched in a container. A task is the actual work: one per partition, pinned to a single core for its whole short life. Three different things at three different scales. Drag the planet. Its atmosphere is translucent, so you can watch the YARN container ring and the executors orbiting inside, each spinning its own core-threads."
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
      "Type `spark-submit` and hit Enter, and a single JVM blinks awake on the master: the driver, about **4 GB of heap** here. It owns no partitions and moves none of the data. The math happens somewhere else entirely — the driver just decides what runs where, and the executors do as they're told.",
      "What it decides is the whole job. It reads your code into a directed acyclic graph of operations, then goes shopping: it asks YARN (or Kubernetes, on Dataproc on GKE) for executor containers and schedules tasks onto them. When results come back, the driver is where they land — small final aggregations, or a write out to durable storage. That last part is the trap. Call `.collect()` on a billion-row DataFrame and every row has to fit in those 4 GB at once; the driver is what crashes.",
      "Where the driver actually lives depends on deploy mode. Client mode keeps it on the machine where you typed spark-submit, which is fine for a notebook but fragile the moment your laptop goes to sleep. For anything long-running in production you want cluster mode, which puts the driver inside the cluster on the master. The canonical submit here: `spark-submit --deploy-mode cluster --executor-cores 4 --executor-memory 11g --num-executors 8 my-job.jar`."
    ],
    legend: [
      { swatch: "#e89856", label: "central amber sphere = the driver JVM (~4 GB heap)" },
      { swatch: "#e89856", label: "halo + flare ring = the driver is ignited and ready to dispatch" },
      { swatch: "#6f86c9", label: "enveloping field of dim dots = the surrounding cluster (hundreds of cores), listening" },
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
      "That's the whole of it for now. Spark hasn't downloaded the terabyte. It hasn't opened a single file. All it built was a logical plan: read all of these, treat them as one DataFrame. This is lazy evaluation — Spark writes down what you want and waits.",
      "It keeps waiting through every `.filter()` and `.select()` you stack on top, because those just bolt more steps onto the plan. Then you call `.count()`, or `.show()`, `.collect()`, `.write()` — an *action* — and Spark finally has a reason to do the work."
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
    caption: "df.count() fires: the lazy plan goes eager — the driver wakes and dispatches tasks out to the workers.",
    body: [
      "Type `df.count()` and press Enter. That one call flips Spark from lazy to eager, and everything that was sitting around as a plan suddenly has to run.",
      "The call lands on the driver. Catalyst, Spark's query optimizer, rewrites your whole chain of operations: it shoves filters down to the scan so less data ever loads, drops columns nobody reads, and reorders joins to cut what moves between them. The Adaptive Query Execution layer (on by default since Spark 3.2) marks the shuffle boundaries where it'll re-plan later using live statistics. What comes out is a *physical plan* — a tree of operators the driver can ship to executors.",
      "Now the driver carves that plan into stages, and each stage into tasks, one per partition. Our 1 TB read is split into ~8,000 partitions of 128 MB, so 8,000 tasks pile into the driver's scheduling pool and get handed out as executor slots free up. The pulse you're watching is a lazy plan finally turning into work, and every core in the cluster stays pinned to it until `.count()` comes back with a number."
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
      "To read the terabyte, Spark chops the file list into partitions: chunks of rows around 128 MB apiece. That number traces straight back to HDFS, the file system everyone used before Cloud Storage, whose default block size was 128 MB. A partition that size reads in roughly one disk seek, so the read cost stays comfortably ahead of the cost of starting a task.",
      "A terabyte chopped that way lands at about **8,000 partitions**. Parquet compresses 5–10×, so each one decompresses to somewhere between **6 and 12 million rows** in memory at ~100 bytes a row. There's no central desk handing them out. A work-stealing scheduler lets a fast executor grab more partitions while a slow one grabs fewer, so a single straggler never throttles the rest.",
      "You can change the count after the read, and the two ways of doing it are not interchangeable. `.repartition(n)` reshuffles to exactly n and pays the full shuffle cost for the privilege. `.coalesce(n)` is cheap — it just glues existing partitions together — which is also why it can only shrink the count, never grow it. The default, `spark.sql.shuffle.partitions = 200`, has been wrong for almost every real workload since Spark 1.1. A 1 TB job wants closer to **5,000–8,000**; divide your shuffle size by the 128 MB target and that's roughly where you land. With AQE on, set a deliberately *large* initial number and let coalesce walk it back down at runtime."
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
      "A task is a tiny bundle — a serialized closure of your code plus the location of its partition's input — addressed to whichever executor is meant to pick it up. The executor runs it, reports back success or failure, and grabs the next one off the queue. Fail, and Spark retries the task up to four times by default. Fail all four, and the whole stage goes down with it.",
      "And the one task that's dragging the whole stage out? `spark.speculation` is built for it, though Spark ships with it off. Switch it on, and once a task runs past 1.5× the median at the 75th percentile, Spark fires a duplicate at another executor. Whichever copy finishes first wins, and Spark kills the other one mid-flight. Reports cite **13–24% faster jobs** when you pair it with dynamic allocation — but that number comes from heterogeneous clusters with flaky disks. On a uniform CPU-bound job it just burns cores running the same work twice."
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
      "Some transformations keep to themselves. Run a `filter`, a `map`, or a `select` that trims columns and each partition just looks at its own rows and decides what to keep — no coordination with anyone. Spark calls these narrow: each output partition depends on exactly one input partition. On our 32-slot cluster a narrow scan of 1 TB runs in roughly **3–5 minutes**. The math is unglamorous: 1024 GB over 32 cores reading at ~100 MB/s lands you just under five.",
      "A `groupBy` needs cooperation. Say you want every American seller in one place. Each row with `country = \"US\"` has to land on the same executor, but those rows are scattered across 8,000 partitions on all four executors, so Spark physically moves them. That's a wide transformation. `join`, `distinct`, `orderBy`, the window functions — same story. None of them can answer a single piece of the result from one partition alone.",
      "Moving data isn't cheap. Every row has to be serialised, dumped to disk, pushed across the network, then read back and slotted into a fresh partition on the far side. Shuffle write for 1 TB of Parquet runs around **2 TB**, because rows go uncompressed during the shuffle while Parquet on disk is column-compressed. So a terabyte that filtered in five minutes can take **30–40 minutes** to shuffle. Know which of your operations are wide, and shape the query so you pay for each one once instead of shuffling the same data three times over."
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
    concept: "Broadcast the small table. Sort-merge two big ones, shuffle-hash for the in-between case, and never let it nested-loop.",
    caption: "Small table broadcast to every worker; big tables shuffled and sort-merged.",
    body: [
      "Joining two DataFrames is the most common wide transformation in production Spark, and the strategy Spark picks is often the difference between a query that finishes and one you kill. Give it an equi-join (`a.key = b.key`) and it has three plans to choose from: **Broadcast Hash Join**, **Sort-Merge Join**, and **Shuffle Hash Join**. Take the equality away and it has only one — **Broadcast Nested Loop Join**, the fallback for any condition without an `=`. That's the one that wrecks jobs.",
      "The broadcast is the one you want. When one side sits below `spark.sql.autoBroadcastJoinThreshold` (default 10 MB at planning, 30 MB at runtime under AQE since Spark 3.2), Spark pulls that small table back to the driver, ships a copy to every executor, and each one builds a hash map and streams the big side through locally. The big side never moves. Take a 1 TB orders × 100 MB countries lookup with the threshold bumped to 200 MB: ~8,000 tasks of pure local work, **2 to 5 minutes** end-to-end against 20 to 40 for Sort-Merge. Force it with `df_big.join(broadcast(df_small), \"key\")` or `/*+ BROADCAST(countries) */`. Just watch the driver doesn't OOM during the collect.",
      "When both sides are big, you get Sort-Merge. Spark hashes both on the key, shuffles each into matching partitions, sorts locally, then walks the two sorted streams in lockstep. Correct, dependable, the workhorse — but you pay the full shuffle on both inputs. Shuffle Hash Join is the rarer middle ground AQE reaches for when the post-shuffle partitions are small enough to hash-build per task. Then there's BNLJ, the one waiting for any non-equi join — `>`, `BETWEEN`, anything without an `=`. It's O(N×M). It scales like a brick. So when a big-data join \"hangs forever,\" check the physical plan; chances are BNLJ snuck in. If you're handing Spark hints, it honors them in this order: `BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL`."
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
      "The shuffle is what makes wide transformations expensive. Every row in flight is leaving one executor for another. The rule that decides where it lands: Spark computes `hash(key) % num_partitions`, and that integer is the row's destination executor. Same key, same destination, every time. That's how `groupBy` collects every American into one partition and every Mexican into another.",
      "Each executor scans its partitions and writes one shuffle file per destination. Run that with **8 source executors and 5,000 destination partitions** and you've got 40,000 small files on local disk within seconds. (The 200 default is too small for 1 TB — see Scene 6.) Each destination executor then reads back exactly the files meant for it, usually pulling from a dozen machines over the network, and merges them into its new partition. Only then does the next stage begin.",
      "Skew is what breaks this. One key shows up 100× more often than the rest — `null`, usually, or `\"unknown\"` — and the executor it hashes to inherits 100× the rows. It turns into the long tail of the stage while every other executor sits idle, done with its work, waiting. AQE handles some of this for you; the rest you salt by hand. Next scene."
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
      "Catalyst, Spark's query optimizer, used to plan the whole job ahead of time from whatever statistics it had on disk. AQE — on by default since Spark 3.2 — lets it pause at every shuffle boundary, measure the partitions it just wrote, and re-plan everything downstream from those real sizes.",
      "The cheapest win is coalescing. The default `spark.sql.shuffle.partitions = 200` is almost always wrong, so you set it deliberately too high and let AQE merge adjacent small partitions toward `advisoryPartitionSizeInBytes` (default **64 MB**) at runtime — the right count, arrived at from real sizes instead of a guess. Joins get re-decided too: a planned `SortMergeJoin` flips to a `BroadcastHashJoin` mid-query when the build side turns out smaller than expected after a filter, and the shuffle just doesn't happen.",
      "Skew splitting is the feature people actually turn AQE on for. A partition gets flagged skewed only when it clears both bars — **> 5× the median** AND **> 256 MB**, so a partition that's relatively huge but still small in absolute terms doesn't trigger the machinery. AQE chops the offender into ~64 MB pieces, replicates the matching rows from the other side, and spreads the work. A skewed Sort-Merge Join that ran for an hour finishes in five. On the canvas, a 1.4 GB partition arrives, the red ring fires, and it cleaves into 6 sub-partitions of ~240 MB that flow off to free executors.",
      "It won't catch everything. Mild skew under the thresholds slips through, and so do group-by aggregations and non-equi joins — those you still salt by hand."
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
      "Look at a Spark job from above and you don't see one river of work. You see islands, separated by shuffles. Each island is a stage, and the tasks inside it run end-to-end with no cross-executor chatter. The thing that divides one stage from the next is always a shuffle.",
      "Inside a stage, Spark pipelines. `.filter().select().map()` all land in the same task, on the same row, with nothing touching disk. The intermediate values live in CPU registers for the lifetime of one row, and dozens of narrow operations can hit that row before anything gets checkpointed.",
      "Cross a boundary and the bookkeeping flips. Now every row gets written out and read back. The Spark UI splits the DAG into stages for exactly this reason: count the boxes and you've counted the shuffles. Five stages, four shuffles. One stage, none at all."
    ],
    legend: [
      { swatch: "#9fcef7", label: "left & right columns = stages 1 and 3" },
      { swatch: "#f4cf9c", label: "amber column = stage 2 (running right now)" },
      { label: "dots flowing down a column = tasks pipelining within a stage (no data moves)" },
      { swatch: "#e96440", label: "red plane between columns = a shuffle boundary" },
      { label: "white dots crossing a boundary = the shuffle redistributing rows" }
    ]
  },
  {
    id: "machine-types",
    index: 13,
    title: "Picking the planets.",
    kicker: "13 · Machine types",
    concept: "Spark on Dataproc is mostly N2-highmem. The other families exist for a reason.",
    body: [
      "For most Spark jobs the pick never changes. It's `n2-highmem-8` at about **$0.52/hr** — eight vCPUs, 64 GB, so 8 GB per core, billed per second. Why highmem? Spark caches partitions in RAM, and the OOMs that kill you almost never trace back to starved CPUs. The cheaper `n2-standard-8` at $0.39/hr will run your job too, then spill to disk the moment a big shuffle shows up. Dataproc lists a dozen more families — E2, N1, N2, N2D, C2, C2D, C3, N4, N4D, M1, M2, the Arm-based C4A — and most of that menu is there for jobs that aren't yours.",
      "A few of them do earn a second look. E2 (`e2-standard-4`, ~$0.13/hr) is the dev-and-CI box, where nobody's watching the clock. N2D is just N2 on AMD silicon, 10–20% cheaper for the same work. When shuffle-heavy SQL bottlenecks on raw per-core speed, C3 (`c3-standard-8`, $0.40/hr, Sapphire Rapids) is the fastest single core money buys. And when a job broadcasts a giant table or parks massive state in cache, you call in the memory monsters: M1 (`m1-ultramem-40`, $6.29/hr) and M2, both around 28 GB per vCPU. For a 1 TB batch ETL, start with 10–20 `n2-highmem-8` workers and grow from there. Reach for more boxes before bigger ones. The bigger box only earns its keep once broadcast joins or fat UDFs are what's actually slowing you down.",
      "Secondary (spot) workers cost 60–91% less, with the catch that Google can yank them mid-job. On anything over an hour, cap them at ~50% of your primary count — Spark shrugs off a lost executor, but recomputing the shuffle data that went with it isn't free. The master? An `n2-standard-4` carries you to ~100 workers; past that, go HA with three. On Serverless for Apache Spark you skip machine types entirely. You hand Google a DCU count, it scales the thing, and cold start lands in 30–60 seconds."
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
      "Spark is brilliant at running one job. Running that same job at two every morning is a different problem. Now something has to retry it when it fails. When an SLA slips, something has to page the engineer who'll fix it, and keep a record of what happened so anyone can reconstruct the morning afterward. Airflow does that part.",
      "It runs on its own machine, usually a small VM. You hand it Python files that define DAGs, and it fires them off on a schedule (cron-like `0 2 * * *` for daily at 02:00), on demand, or when a sensor trips. It also keeps the books — the state of every task it's ever run — so tomorrow morning you can ask \"did Tuesday's job succeed?\" and get a straight answer.",
      "What Airflow doesn't do is run Spark itself; it tells something else to. The `DataprocSubmitJobOperator` above wraps Google's Dataproc Jobs API, which submits a spark-submit on your behalf, polls for status, and reports back. Airflow only knows the job succeeded because Dataproc said so. Swap Spark for a Beam job or a dbt run and Airflow doesn't notice the difference."
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
      "Spin the cluster up, run the job, tear it down — that's the ephemeral pattern, and the Airflow DAG is three tasks. `DataprocCreateClusterOperator` builds the cluster, `DataprocSubmitJobOperator` runs your job on it, `DataprocDeleteClusterOperator` deletes it. The first takes ~90 seconds, the last ~15, the middle however long your job runs.",
      "Our canonical cluster — 4 × `n2-highmem-8` + 1 master with the surcharge — runs about **$2.65/hr**. The job needs the cluster for roughly 12 minutes: a minute and a half to build it, eleven to run, fifteen seconds to tear down. That's about **$0.53**. Leave the same cluster on 24/7 and it's $64 a day whether anything runs or not. One pipeline. You probably have forty.",
      "Wire one thing into the delete step: `trigger_rule='all_done'`. Skip it and a failed job leaves its cluster running. Spot secondary workers (Google's preemptible successor) cut another 60–91% off, and you pay for it mid-job — when one gets reclaimed, Spark retries on the workers that survive, but any shuffle data that lived on the lost node gets recomputed from scratch.",
      "The pattern is for scheduled production jobs, not notebooks. A data scientist poking at ad-hoc queries wants a small always-on cluster, not a fresh build on every run. And if you'd rather pay than wait, the newest tier — Lightning Engine on Serverless for Apache Spark — claims up to 4.3× speedups on TPC-DS, at the premium SKU price."
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
      "You've watched fifteen scenes run on rails. This one's yours to fly: drag to orbit, scroll to zoom, right-click to pan.",
      "Eight planets this time instead of four, because production clusters rarely stop at four workers. Roughly 180 tiny motes drift among them, and each one is a partition — a 128 MB chunk of someone's data, waiting for an executor to grab it, chew through it, and hand it to the next stage.",
      "That's the whole machine: the master at the center, the fleet orbiting it. Have a look around for as long as you like. When you scroll past this section, the article ends."
    ],
    legend: [
      { swatch: "#e89856", label: "center = master node" },
      { swatch: "#79b9d4", label: "eight outer planets = workers (production fleet, not just 4)" },
      { swatch: "#b0b0b8", label: "small drifting motes = ~180 partitions waiting to be processed" },
      { label: "your camera now — drag to orbit, scroll to zoom, right-click to pan" }
    ]
  }
];
