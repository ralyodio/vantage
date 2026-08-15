import axios from 'axios';
import { FastifyInstance } from 'fastify';

export interface SpamDetectionResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
  requiresCaptcha: boolean;
}

export class AntiSpamService {
  private recaptchaSecretKey: string;
  private recaptchaEnabled: boolean;
  private suspiciousPatterns = new RegExp(
    /(bot|crawler|spider|scraper|automation|script)/i
  );

  constructor() {
    this.recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY || '';
    this.recaptchaEnabled = process.env.NODE_ENV === 'production' && !!this.recaptchaSecretKey;
    
    if (process.env.NODE_ENV === 'production' && !this.recaptchaSecretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not set - reCAPTCHA will be disabled');
    } else if (!this.recaptchaEnabled) {
      console.log('reCAPTCHA disabled in development mode');
    }
  }

  /**
   * Verify reCAPTCHA token
   */
  async verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
    // In development, bypass reCAPTCHA verification
    if (!this.recaptchaEnabled) {
      console.log('reCAPTCHA bypassed in development mode');
      return true;
    }

    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: this.recaptchaSecretKey,
            response: token,
            remoteip: remoteIp,
          },
        }
      );

      const { success, score, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.warn('reCAPTCHA verification failed:', errorCodes);
        return false;
      }

      // For reCAPTCHA v3, check the score (0.0-1.0)
      // Score > 0.5 is typically considered human
      if (score !== undefined && score < 0.5) {
        console.warn(`reCAPTCHA score too low: ${score}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      // Fail open in case of reCAPTCHA API errors to avoid blocking legitimate users
      return true;
    }
  }

  /**
   * Check if reCAPTCHA is enabled
   */
  isRecaptchaEnabled(): boolean {
    return this.recaptchaEnabled;
  }

  /**
   * Detect potential spam/abuse patterns
   */
  detectSpam(request: any, userAgent?: string): SpamDetectionResult {
    const reasons: string[] = [];
    let score = 0;

    // Check user agent for suspicious patterns
    if (userAgent && this.suspiciousPatterns.test(userAgent)) {
      reasons.push('Suspicious user agent');
      score += 30;
    }

    // Check for rapid successive requests (handled by rate limiting)
    // Check for unusual request patterns
    if (request.headers['accept'] === '*/*') {
      reasons.push('Generic accept header');
      score += 10;
    }

    // Note: referer is deliberately NOT scored. Browsers always send it,
    // but legitimate API clients (curl, SDKs) never do — gating on it
    // captcha-locks every programmatic consumer in production. Suspicious
    // user agents alone (+30) still trip the threshold, and the Redis
    // rate limiter remains the primary protection for everything else.

    // Check request frequency patterns (would need historical data)
    // For now, we'll use a simple scoring system

    const requiresCaptcha = score >= 25;
    const isSpam = score >= 50;

    return {
      isSpam,
      score,
      reasons,
      requiresCaptcha,
    };
  }

  /**
   * Check if an IP has been flagged for abuse
   */
  async isAbusiveIP(_ip: string): Promise<boolean> {
    // In a real implementation, this would check a database
    // of known abusive IPs or use a service like AbuseIPDB
    // For now, we'll implement a simple in-memory check
    return false;
  }

  /**
   * Flag an IP for abusive behavior
   */
  async flagAbusiveIP(ip: string, reason: string): Promise<void> {
    // In a real implementation, this would store the IP
    // in a database with a timestamp and reason
    console.warn(`Flagged IP ${ip} for abuse: ${reason}`);
  }

  /**
   * Register anti-spam middleware with Fastify
   */
  registerMiddleware(fastify: FastifyInstance): void {
    // Middleware to check for spam
    fastify.addHook('preHandler', async (request, reply) => {
      const clientIP = request.ip;
      const userAgent = request.headers['user-agent'];

      // Check if IP is flagged as abusive
      if (await this.isAbusiveIP(clientIP)) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied due to suspicious activity',
          requiresCaptcha: true,
        });
      }

      // Run spam detection
      const spamResult = this.detectSpam(request, userAgent);

      if (spamResult.isSpam) {
        // Flag the IP for future reference
        await this.flagAbusiveIP(clientIP, spamResult.reasons.join(', '));

        return reply.status(429).send({
          success: false,
          error: 'Request blocked due to spam detection',
          reasons: spamResult.reasons,
          requiresCaptcha: true,
        });
      }

      // Add spam detection result to request for later use
      (request as any).spamDetection = spamResult;
    });
  }
}

// Export singleton instance
export const antiSpamService = new AntiSpamService();