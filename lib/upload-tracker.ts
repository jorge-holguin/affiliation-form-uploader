// Simple in-memory upload tracker
// In a production environment, this should be replaced with a database or Redis

interface UploadRecord {
  ip: string;
  timestamp: number;
  fileId: string;
  fileName: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

class UploadTracker {
  private uploads: Map<string, UploadRecord[]> = new Map();
  private readonly MAX_UPLOADS_PER_HOUR = 3;
  private readonly ONE_HOUR_MS = 60 * 60 * 1000;

  // Add a new upload record
  addUpload(ip: string, fileId: string, fileName: string, status: 'success' | 'failed', errorMessage?: string): void {
    const record: UploadRecord = {
      ip,
      timestamp: Date.now(),
      fileId,
      fileName,
      status,
      errorMessage
    };

    if (!this.uploads.has(ip)) {
      this.uploads.set(ip, []);
    }

    const userUploads = this.uploads.get(ip)!;
    userUploads.push(record);
    
    // Clean up old records (older than 24 hours)
    this.cleanupOldRecords();
  }

  // Check if user has exceeded upload limit
  hasExceededLimit(ip: string): boolean {
    // If in development mode or bypass is enabled, don't enforce limits
    if (process.env.NODE_ENV === 'development' || 
        process.env.UPLOAD_LIMIT_BYPASS === 'true' || 
        process.env.UPLOAD_LIMIT_BYPASS === '1') {
      console.log('Upload limit check bypassed due to environment settings');
      return false;
    }

    const userUploads = this.uploads.get(ip) || [];
    const now = Date.now();
    const recentUploads = userUploads.filter(
      upload => upload.status === 'success' && now - upload.timestamp < this.ONE_HOUR_MS
    );
    
    const hasExceeded = recentUploads.length >= this.MAX_UPLOADS_PER_HOUR;
    if (hasExceeded) {
      console.log(`User ${ip} has exceeded upload limit: ${recentUploads.length}/${this.MAX_UPLOADS_PER_HOUR} in the last hour`);
    }

    return hasExceeded;
  }

  // Get recent uploads for a user
  getRecentUploads(ip: string, limit: number = 10): UploadRecord[] {
    const userUploads = this.uploads.get(ip) || [];
    return [...userUploads]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Clean up old records
  private cleanupOldRecords(): void {
    const now = Date.now();
    const oneDayAgo = now - (24 * this.ONE_HOUR_MS);

    for (const [ip, records] of this.uploads.entries()) {
      const recentRecords = records.filter(record => record.timestamp >= oneDayAgo);
      if (recentRecords.length === 0) {
        this.uploads.delete(ip);
      } else if (recentRecords.length !== records.length) {
        this.uploads.set(ip, recentRecords);
      }
    }
  }
}

// Export singleton instance
export const uploadTracker = new UploadTracker();
