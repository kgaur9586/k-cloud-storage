import { Axiom } from '@axiomhq/js';
import dotenv from 'dotenv';

dotenv.config();

export const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN || '',
  orgId: process.env.AXIOM_ORG_ID || '',
});

export const DATASET = process.env.AXIOM_DATASET || 'cloud-storage-logs';
