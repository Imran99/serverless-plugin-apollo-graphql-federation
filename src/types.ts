export interface IService {
  name: string;
  schema: string;
  url: string;
}

export interface IGraph {
  name: string;
  key: string;
  variant?: string;
  services: IService[];
}
