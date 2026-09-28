import { Context } from 'cordis';
import {
  TriDatabaseManager,
  MCardFileSystem,
  MCardCollection,
  registerFileSystemService,
  registerCollectionService,
  AgentDid,
} from 'clm-kernel';

declare module 'cordis' {
  interface Context {
    'mcard.fs': MCardFileSystem;
    'mcard.collection': MCardCollection;
  }
}

export interface ClmContextBridge {
  triDb: TriDatabaseManager;
  mcardFs: MCardFileSystem;
  mcardCollection: MCardCollection;
  authorDid: AgentDid;
}

export const DEFAULT_AUTHOR_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiz48Z8x288nn64PeE2KYm9976';

/**
 * Initializes an in-memory TriDatabase and registers Layer 2 MCardFileSystem
 * and Layer 0 MCardCollection into the Cordis Service Mesh.
 */
export function initTriDatabase(
  ctx: Context,
  authorDidStr: string = DEFAULT_AUTHOR_DID,
  triDb: TriDatabaseManager = TriDatabaseManager.newInMemory()
): ClmContextBridge {
  const authorDid = AgentDid.create(authorDidStr);

  // Register 'mcard.fs' service in Cordis
  registerFileSystemService(ctx, triDb.mcard);

  // Construct G-Set collection over mcard filesystem and register in Cordis
  const mcardCollection = MCardCollection.fromFileSystem(triDb.mcard);
  registerCollectionService(ctx, mcardCollection);

  return {
    triDb,
    mcardFs: triDb.mcard,
    mcardCollection,
    authorDid,
  };
}
