export interface ICommunity {
  name: string;
  priority: number;
  active: boolean;
}

export interface IReligion {
  name: string;
  priority: number;
  active: boolean;
  communities: ICommunity[];
}

export interface IReligionPayload {
  religions: IReligion[];
}

export interface IUpdateReligionPayload {
  id: string;
  name?: string;
  priority?: number;
  active?: boolean;
  communities?: ICommunity[];
}

export interface IRemoveReligionPayload {
  ids: string[];
}