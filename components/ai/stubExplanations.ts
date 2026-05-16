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
  partitions:
    "Spark turns the file list into partitions: chunks of roughly 128 MB. The default exists because HDFS blocks are 128 MB and a partition that fits in one block reads with one disk seek. With 1 TB of data you get about 8,000 partitions.",
  "task-rain":
    "For each partition, Spark generates one task. The driver hands tasks to executors as soon as they're free. With four executors at four cores each, sixteen tasks run concurrently. The other 7,984 are queued.",
  "narrow-vs-wide":
    "A narrow transformation — map, filter, select — operates on one partition at a time. A wide transformation — groupBy, join, distinct — requires rows with the same key to live in the same partition. The latter forces movement.",
  shuffle:
    "The shuffle is the single most expensive thing Spark does. Each row is hashed by its key, modulo the target partition count. Then every executor sends each row to the executor responsible for that target. Disk, network, serialization — all of it lights up at once.",
  stages:
    "Spark cuts the execution plan at every shuffle boundary. The pieces between shuffles are called stages. Tasks within a stage can pipeline freely; tasks across stages cannot — the next stage can't start until all of its inputs have been shuffled into place.",
  airflow:
    "Airflow is a directed-acyclic-graph scheduler. You write Python that builds a graph of tasks; Airflow runs the graph on a schedule, retries failures, and remembers everything. It does not run Spark. It tells someone else to run Spark.",
  ephemeral:
    "The ephemeral pattern: DataprocCreateClusterOperator → DataprocSubmitJobOperator → DataprocDeleteClusterOperator. trigger_rule='all_done' on the delete step so a failed job still cleans up. Twelve minutes of compute instead of twenty-four hours of idle.",
  fly:
    "There is nothing more to teach. Move with WASD; look with the mouse. Each tiny cube you see is a real concept — find the partitions, count the executors, watch the cluster from above. The scene is the same; what you choose to look at is up to you."
};
