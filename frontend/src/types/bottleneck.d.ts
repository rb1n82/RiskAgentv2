declare module 'bottleneck' {
  export default class Bottleneck {
    constructor(options?: {
      maxConcurrent?: number;
      minTime?: number;
    });
    schedule<T>(fn: () => Promise<T>): Promise<T>;
  }
} 