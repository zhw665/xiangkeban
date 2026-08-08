declare module "ali-oss" {
  type ClientOptions = {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
  };

  type GetResult = { content: Buffer | Uint8Array };

  export default class OSS {
    constructor(options: ClientOptions);
    put(name: string, data: Buffer, options?: { headers?: Record<string, string> }): Promise<unknown>;
    get(name: string): Promise<GetResult>;
  }
}
