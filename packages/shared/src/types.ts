export type RoomType = 'audio' | 'video';

export type CallStatus = 'ringing' | 'connected' | 'rejected' | 'ended' | 'busy';

export interface CreatorSocials {
  instagram?: string;
  x?: string;
  youtube?: string;
  website?: string;
  twitter?: string;
}

export interface CreatorProfile {
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  videoRate: number;
  audioRate: number;
  isAcceptingCalls: boolean;
  upiId?: string;
  socials?: CreatorSocials;
  isLive?: boolean;
}

export interface CallSignalPayload {
  type: 'incoming_call' | 'call_accepted' | 'call_rejected' | 'call_ended' | 'ping';
  roomId: string;
  channelName: string;
  callerUsername: string;
  callerDisplayName?: string;
  callerProfileImage?: string;
  targetUsername: string;
  mode: RoomType;
  ratePerMinute: number;
  timestamp: number;
}

export interface WalletSummary {
  balance: number;
  withdrawable: number;
  currency: string;
}
