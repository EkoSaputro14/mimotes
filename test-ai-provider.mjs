// test-ai-provider.mjs — Test script for workspace-aware AI provider config
import { prisma, setWorkspaceContext, getWorkspaceContext } from './lib/prisma.js';
import { getProviderConfig, getProviderType } from './lib/ai-provider.js';

async function test() {
  try {
    const workspaceId = process.argv[2];
    console.log('Testing workspace-aware AI provider config...\n');
    
    if (workspaceId) {
      await setWorkspaceContext(workspaceId);
      console.log(`Set workspace context: ${workspaceId}`);
    } else {
      console.log('No workspace context (fallback to global)');
    }
    
    const ctx = await getWorkspaceContext();
    console.log(`Workspace context detected: ${ctx || 'null (using global)'}`);
    
    const config = await getProviderConfig();
    console.log('\nProvider config:', JSON.stringify(config, null, 2));
    
    const type = await getProviderType();
    console.log('\nProvider type:', type);
    
    console.log('\n✅ Test passed!');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
