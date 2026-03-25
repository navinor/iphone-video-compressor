import { useState, useCallback, useRef } from 'react';
import type { CompressionJob, CompressionSettings, VideoAsset, BatchJob, JobStatus } from '../types';
import { compressVideo, cancelActiveSession, generateOutputPath } from '../lib/ffmpeg';
import { getJSON, setJSON, StorageKeys } from '../lib/storage';
import type { HistoryEntry } from '../types';

/**
 * Hook to manage compression jobs (single and batch).
 * Jobs run sequentially to avoid thermal throttling.
 */
export function useCompressionJob() {
  const [batchJob, setBatchJob] = useState<BatchJob | null>(null);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const cancelledRef = useRef(false);

  const startBatch = useCallback(
    async (assets: VideoAsset[], settings: CompressionSettings, presetName?: string) => {
      cancelledRef.current = false;

      const jobs: CompressionJob[] = assets.map((asset) => ({
        id: `job-${asset.id}-${Date.now()}`,
        videoAsset: asset,
        settings,
        status: 'pending' as JobStatus,
        progress: 0,
      }));

      const batch: BatchJob = {
        id: `batch-${Date.now()}`,
        jobs,
        presetName,
        startedAt: Date.now(),
      };

      setBatchJob(batch);
      setCurrentJobIndex(0);

      // Run sequentially
      for (let i = 0; i < jobs.length; i++) {
        if (cancelledRef.current) break;

        setCurrentJobIndex(i);

        const job = jobs[i]!;
        const outputPath = generateOutputPath(job.videoAsset.filename);

        // Mark active
        updateJobStatus(batch, i, 'active');


        await new Promise<void>((resolve) => {
          compressVideo(job.videoAsset, outputPath, settings, {
            onProgress: (percent, frame, speed) => {
              updateJobProgress(batch, i, percent, frame);
            },
            onComplete: (outputUri, outputSize) => {
              updateJobComplete(batch, i, outputUri, outputSize);
              addHistoryEntry(job, outputUri, outputSize, presetName);
              resolve();
            },
            onError: (message, logs) => {
              updateJobError(batch, i, message, logs);
              resolve();
            },
            onCancel: () => {
              updateJobStatus(batch, i, 'cancelled');
              resolve();
            },
          });
        });
      }

      // Mark batch complete
      setBatchJob((prev) => {
        if (!prev) return null;
        return { ...prev, completedAt: Date.now() };
      });
    },
    [],
  );

  const cancelBatch = useCallback(() => {
    cancelledRef.current = true;
    cancelActiveSession();

    setBatchJob((prev) => {
      if (!prev) return null;
      const jobs = prev.jobs.map((j) =>
        j.status === 'pending' ? { ...j, status: 'cancelled' as JobStatus } : j,
      );
      return { ...prev, jobs, completedAt: Date.now() };
    });
  }, []);

  // ── Internal helpers ──

  function updateJobStatus(batch: BatchJob, index: number, status: JobStatus) {
    setBatchJob((prev) => {
      if (!prev) return null;
      const jobs = [...prev.jobs];
      jobs[index] = { ...jobs[index]!, status };
      return { ...prev, jobs };
    });
  }

  function updateJobProgress(batch: BatchJob, index: number, progress: number, frame: number) {
    setBatchJob((prev) => {
      if (!prev) return null;
      const jobs = [...prev.jobs];
      jobs[index] = { ...jobs[index]!, progress, currentFrame: frame };
      return { ...prev, jobs };
    });
  }

  function updateJobComplete(
    batch: BatchJob,
    index: number,
    outputUri: string,
    outputSize: number,
  ) {
    setBatchJob((prev) => {
      if (!prev) return null;
      const jobs = [...prev.jobs];
      jobs[index] = {
        ...jobs[index]!,
        status: 'done',
        progress: 100,
        outputUri,
        outputSize,
        completedAt: Date.now(),
      };
      return { ...prev, jobs };
    });
  }

  function updateJobError(batch: BatchJob, index: number, error: string, logs: string) {
    setBatchJob((prev) => {
      if (!prev) return null;
      const jobs = [...prev.jobs];
      jobs[index] = {
        ...jobs[index]!,
        status: 'failed',
        error,
        ffmpegLogs: logs,
      };
      return { ...prev, jobs };
    });
  }

  return {
    batchJob,
    currentJobIndex,
    startBatch,
    cancelBatch,
  };
}

// ── History ──

function addHistoryEntry(
  job: CompressionJob,
  outputUri: string,
  outputSize: number,
  presetName?: string,
): void {
  const history = getJSON<HistoryEntry[]>(StorageKeys.history) ?? [];
  const entry: HistoryEntry = {
    id: `history-${Date.now()}`,
    originalFilename: job.videoAsset.filename,
    originalSize: job.videoAsset.fileSize,
    outputFilename: outputUri.split('/').pop() ?? 'output.mp4',
    outputSize,
    outputUri,
    presetName: presetName ?? 'Custom',
    reductionPercent: Math.round(
      ((job.videoAsset.fileSize - outputSize) / job.videoAsset.fileSize) * 100,
    ),
    completedAt: Date.now(),
    fileExists: true,
  };
  history.unshift(entry);
  setJSON(StorageKeys.history, history);
}
