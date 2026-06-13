// Types derived from the real Repliz OpenAPI spec (https://api.repliz.com/public-json).

export type ReplizCreds = { username: string; password: string };

export type ReplizAccount = {
  _id: string;
  generatedId?: string;
  name?: string;
  username?: string;
  picture?: string;
  isConnected?: boolean;
  type: "threads" | "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin" | string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReplizMediaType = "text" | "image" | "video" | "reel" | "album" | "link" | "story";

export type ReplizScheduleMedia = {
  type: 0 | 1; // 0 = image, 1 = video (per spec)
  url: string;
  alt?: string;
  thumbnail?: string;
  customThumbnail?: boolean;
};

export type ReplizScheduleReply = {
  title?: string;
  description: string;
  topic?: string;
  type: ReplizMediaType;
  medias: ReplizScheduleMedia[];
};

export type ReplizScheduleInput = {
  title?: string;
  description: string;
  topic: string;
  type: ReplizMediaType;
  medias: ReplizScheduleMedia[];
  accountId: string;
  scheduleAt: string; // ISO 8601 UTC
  replies?: ReplizScheduleReply[]; // thread (Nested) posts
  templateId?: string;
};

/** Inbound webhook payload. `data.id` is the reply target (comment record id). */
export type ReplizWebhook = {
  platform: string;
  type: "comment" | "schedule" | "chat";
  accountId: string;
  data: {
    id: string;
    userId?: string;
    content?: {
      id: string;
      title?: string;
      description?: string;
      topic?: string;
      type?: string;
      url?: string;
      createdAt?: string;
      owner?: { id: string; name: string; picture?: string };
      medias?: unknown[];
    };
    comment?: {
      id: string;
      type: "text" | "image";
      text?: string;
      owner?: { id: string; name: string; picture?: string };
      medias?: { url: string }[];
      createdAt?: string;
    };
  };
};
