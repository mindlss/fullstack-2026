import type { Job, JobName } from './types';
import { quotaResetJob } from './jobs/quota_reset.job';

export const jobs: Job[] = [
    quotaResetJob,
];

export const jobsByName: Record<JobName, Job> = jobs.reduce((acc, j) => {
    acc[j.name] = j;
    return acc;
}, {} as Record<JobName, Job>);
