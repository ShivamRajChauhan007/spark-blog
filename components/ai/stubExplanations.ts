// Per-scene canned explainer used while the AI sidebar is not wired to a live model.
// Phase 7 will allow a one-line swap to a streaming Claude/OpenAI call.

import { SceneId } from "@/lib/scenes";

export const EXPLAINERS: Record<SceneId, string> = {
  hero:
    "A Dataproc cluster is a small constellation of virtual machines that Google's managed Hadoop service spins up in seconds. It is not a database, not a queue — it is a temporary compute swarm waiting for work.",
  anatomy:
    "Each worker VM runs YARN — Hadoop's resource manager. YARN slices the VM's CPU and memory into containers, and each container hosts a Spark executor JVM. Your code lives inside the executor; the worker is just its landlord.",
  driver:
    "spark-submit packages your code, picks a cluster master, and asks YARN for one container for the driver. Once that container boots, the driver reads your DAG, asks YARN for executor containers, and the show begins.",
  "data-arrival":
    "On disk, your dataset is many files — Parquet, JSON, CSV. Spark builds a logical plan that says 'I will read all of these and treat them as one DataFrame.' Nothing has moved yet. This is laziness, on purpose.",
  "action-trigger":
    "An action wakes Spark up. The user calls df.count(), the driver runs Catalyst to optimize the plan, marks shuffle boundaries for AQE, then breaks the plan into stages and tasks. For 1 TB across 8,000 partitions that's 8,000 tasks queued on the driver's scheduler. The pulse from the code panel to the driver is the lazy→eager moment.",
  partitions:
    "Spark turns the file list into partitions: chunks of roughly 128 MB. The default exists because HDFS blocks are 128 MB and a partition that fits in one block reads with one disk seek. With 1 TB of data you get about 8,000 partitions.",
  "task-rain":
    "For each partition, Spark generates one task. The driver hands tasks to executors as soon as they're free. With four executors at four cores each, sixteen tasks run concurrently. The other 7,984 are queued.",
  "narrow-vs-wide":
    "A narrow transformation — map, filter, select — operates on one partition at a time. A wide transformation — groupBy, join, distinct — requires rows with the same key to live in the same partition. The latter forces movement.",
  joins:
    "Four join strategies. Broadcast Hash (small × big, no shuffle on big side, the cheapest), Sort-Merge (big × big, full shuffle on both, default), Shuffle Hash (rare middle ground, AQE-picked), Broadcast Nested Loop (non-equi joins, O(N×M), the one to avoid). The hint priority Spark respects is BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL.",
  shuffle:
    "The shuffle is the single most expensive thing Spark does. Each row is hashed by its key, modulo the target partition count. Then every executor sends each row to the executor responsible for that target. Disk, network, serialization — all of it lights up at once.",
  aqe:
    "Adaptive Query Execution re-plans the query at runtime using actual statistics from completed shuffles. Three things happen: post-shuffle partitions get coalesced toward an advisory size of 64 MB; planned Sort-Merge Joins get switched to Broadcast Hash Joins if the build side turns out smaller than expected; and partitions that are both >5× the median and >256 MB get split into smaller pieces. On by default since Spark 3.2.",
  stages:
    "Spark cuts the execution plan at every shuffle boundary. The pieces between shuffles are called stages. Tasks within a stage can pipeline freely; tasks across stages cannot — the next stage can't start until all of its inputs have been shuffled into place.",
  "machine-types":
    "Dataproc supports E2 (cheap, dev), N2 (default), N2D (AMD, ~15% cheaper), C3 (Sapphire Rapids, fastest single-core), N4/N4D (newer Titanium platform), M1/M2 (memory beasts). The Spark workhorse is n2-highmem-8 — 8 vCPUs, 64 GB. Highmem matters because Spark caches partitions in RAM and OOMs come from memory pressure, not CPU starvation.",
  airflow:
    "Airflow is a directed-acyclic-graph scheduler. You write Python that builds a graph of tasks; Airflow runs the graph on a schedule, retries failures, and remembers everything. It does not run Spark. It tells someone else to run Spark.",
  ephemeral:
    "The ephemeral pattern: DataprocCreateClusterOperator → DataprocSubmitJobOperator → DataprocDeleteClusterOperator. trigger_rule='all_done' on the delete step so a failed job still cleans up. Twelve minutes of compute instead of twenty-four hours of idle.",
  fly:
    "There is nothing more to teach. Move with WASD; look with the mouse. Each tiny cube you see is a real concept — find the partitions, count the executors, watch the cluster from above. The scene is the same; what you choose to look at is up to you."
};
