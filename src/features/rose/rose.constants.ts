// rose.constants.ts
export const ROSE_CONSTANTS = {
  
  // Rate limiting
  MAX_ROSES_PER_DAY: 50,
  MAX_ROSES_TO_SAME_USER_PER_DAY: 3,
  
  // Cooldown periods (in milliseconds)
  ROSE_COOLDOWN_PERIOD: 60 * 1000, // 1 minute between roses to same user
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  
  // Reset time (UTC hour)
  DAILY_RESET_HOUR: 0, // Midnight UTC
  
  // Business logic
  MIN_MATCH_SCORE_FOR_ROSE: 0,
  
  // Error messages
  ERRORS: {
    INSUFFICIENT_ROSES: 'You don\'t have any roses available',
    SELF_SEND: 'You cannot send a rose to yourself',
    USER_NOT_FOUND: 'Receiver not found',
    BLOCKED_USER: 'You cannot send a rose to this user',
    ALREADY_MATCHED: 'You are already matched with this user',
    RATE_LIMIT_EXCEEDED: 'You have exceeded the daily rose limit',
    COOLDOWN_ACTIVE: 'Please wait before sending another rose to this user',
    SAME_USER_LIMIT: 'You can only send 3 roses per day to the same user',
    INVALID_ROSE_TYPE: 'Invalid rose type',
    PURCHASED_ROSES_UNAVAILABLE: 'You don\'t have purchased roses available',
  },
  
  // Success messages
  SUCCESS: {
    ROSE_SENT: 'Rose sent successfully',
    PURCHASED_ROSE_USED: 'Rose used successfully',
  },
} as const;

export const ROSE_TYPE_PRIORITY = {
  PURCHASED: 1,
} as const;