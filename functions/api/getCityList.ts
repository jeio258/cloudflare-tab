import { ok } from '../lib/http';
import { cityOptions } from '../lib/cities';

export async function onRequestGet() {
  return ok(cityOptions);
}
