// compliment.constants.ts
export const COMPLIMENT_CONSTANTS = {
  
  // Rate limiting
  MAX_COMPLIMENTS_PER_DAY: 50,
  MAX_COMPLIMENTS_TO_SAME_USER_PER_DAY: 3,
  COMPLIMENT_COOLDOWN_PERIOD: 60 * 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  DAILY_RESET_HOUR: 0, 
  MIN_MATCH_SCORE_FOR_COMPLIMENT: 0,
  
  // Error messages
  ERRORS: {
    NO_COMPLIMENTS_AVAILABLE: 'You don\'t have any compliments available',
    SELF_SEND: 'You cannot send a compliment to yourself',
    USER_NOT_FOUND: 'Receiver not found',
    BLOCKED_USER: 'You cannot send a compliment to this user',
    ALREADY_MATCHED: 'You are already matched with this user',
    RATE_LIMIT_EXCEEDED: 'You have exceeded the daily compliment limit',
    COOLDOWN_ACTIVE: 'Please wait before sending another compliment to this user',
    SAME_USER_LIMIT: 'You can only send 3 compliments per day to the same user',
    INVALID_COMPLIMENT_TYPE: 'Invalid compliment type',
    PURCHASED_COMPLIMENTS_UNAVAILABLE: 'You don\'t have purchased compliments available',
  },
  
  // Success messages
  SUCCESS: {
    COMPLIMENT_SENT: 'Compliment sent successfully',
    PURCHASED_COMPLIMENT_USED: 'Compliment used successfully',
  },
} as const;

export const COMPLIMENT_TYPE_PRIORITY = {
  PURCHASED: 1,
} as const;