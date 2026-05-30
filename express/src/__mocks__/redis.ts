export class Redis {
  constructor(_opts?: any) {}

  static fromEnv() {
    return new Redis();
  }

  get = async () => null;
  set = async () => 'OK';
  incr = async () => 1;
  expire = async () => 1;
  sadd = async () => 1;
  srem = async () => 1;
  smembers = async () => [];
  pipeline = () => ({ exec: async () => [] });
}
