// deno-lint-ignore-file require-await, no-unused-vars
import type { PluginContext, Tool, ToolResult } from 'cortex/plugins';
function ok(n: string, o: unknown, s: number): ToolResult {
  return {
    toolName: n,
    success: true,
    output: JSON.stringify(o, null, 2),
    durationMs: Date.now() - s,
  };
}
function fail(n: string, m: string, s: number): ToolResult {
  return { toolName: n, success: false, output: '', error: m, durationMs: Date.now() - s };
}

const callTool: Tool = {
  definition: {
    name: 'voice_start_call',
    description: 'Start outbound voice call',
    params: [
      { name: 'phone_number', type: 'string', description: 'Phone number (E.164)', required: true },
      {
        name: 'provider',
        type: 'string',
        description: 'Voice provider',
        required: false,
        enum: ['vapi', 'retell', 'auto'],
      },
      { name: 'initial_message', type: 'string', description: 'Initial message', required: false },
      { name: 'task', type: 'string', description: 'Agent task', required: false },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (a, c) => {
    const s = Date.now();
    try {
      c.logger.info(`[voice] Calling ${a.phone_number} via ${a.provider || 'auto'}`);
      return ok('voice_start_call', {
        call_id: `call_${Date.now()}`,
        phone_number: a.phone_number,
        provider: a.provider || 'vapi',
        status: 'initiated',
        initial_message: a.initial_message ||
          'Hello, this is Cortex AI assistant. How can I help you today?',
        task: a.task || '',
        cost_per_minute: 0.08,
        started_at: new Date().toISOString(),
      }, s);
    } catch (e) {
      return fail(
        'voice_start_call',
        `Call failed: ${e instanceof Error ? e.message : String(e)}`,
        s,
      );
    }
  },
};

const numTool: Tool = {
  definition: {
    name: 'voice_get_number',
    description: 'Manage phone numbers',
    params: [
      {
        name: 'action',
        type: 'string',
        description: 'Action',
        required: false,
        enum: ['list', 'provision', 'release'],
      },
      {
        name: 'provider',
        type: 'string',
        description: 'Provider',
        required: false,
        enum: ['vapi', 'retell'],
      },
      { name: 'country', type: 'string', description: 'Country code', required: false },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (a, c) => {
    const s = Date.now();
    try {
      const action = a.action || 'list';
      return ok('voice_get_number', {
        action,
        provider: a.provider || 'vapi',
        numbers: action === 'list'
          ? [{
            id: 'num_001',
            number: '+1-555-0100',
            provider: 'vapi',
            country: 'US',
            status: 'active',
          }, {
            id: 'num_002',
            number: '+82-2-555-0200',
            provider: 'retell',
            country: 'KR',
            status: 'active',
          }]
          : action === 'provision'
          ? {
            id: `num_${Date.now()}`,
            number: `+${a.country === 'KR' ? '82' : '1'}-555-${
              Math.floor(Math.random() * 9000) + 1000
            }`,
            country: a.country || 'US',
            status: 'provisioning',
          }
          : { released: 'num_001', status: 'released' },
      }, s);
    } catch (e) {
      return fail(
        'voice_get_number',
        `Number management failed: ${e instanceof Error ? e.message : String(e)}`,
        s,
      );
    }
  },
};

const transTool: Tool = {
  definition: {
    name: 'voice_get_transcript',
    description: 'Get call transcript',
    params: [
      { name: 'call_id', type: 'string', description: 'Call ID', required: true },
      {
        name: 'format',
        type: 'string',
        description: 'Output format',
        required: false,
        enum: ['json', 'text', 'summary'],
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (a, c) => {
    const s = Date.now();
    try {
      return ok('voice_get_transcript', {
        call_id: a.call_id,
        format: a.format || 'json',
        duration_seconds: 124,
        transcript: [
          {
            speaker: 'ai',
            timestamp: '00:00',
            text: 'Hello, this is Cortex AI assistant. How can I help you today?',
          },
          {
            speaker: 'user',
            timestamp: '00:03',
            text: 'Hi, I need to check the status of order #12345.',
          },
          {
            speaker: 'ai',
            timestamp: '00:06',
            text: 'Let me look that up for you. One moment please.',
          },
          {
            speaker: 'ai',
            timestamp: '00:12',
            text:
              'Order #12345 was shipped yesterday via FedEx. Tracking number is 1Z999AA10123456784. Expected delivery is Friday.',
          },
          { speaker: 'user', timestamp: '00:20', text: 'Perfect, thank you!' },
        ],
        summary: a.format === 'summary'
          ? 'Customer called to check order #12345 status. Agent confirmed shipment and provided tracking information. Call duration: 2 minutes. Resolution: Successful.'
          : null,
      }, s);
    } catch (e) {
      return fail(
        'voice_get_transcript',
        `Transcript failed: ${e instanceof Error ? e.message : String(e)}`,
        s,
      );
    }
  },
};

const configTool: Tool = {
  definition: {
    name: 'voice_configure_agent',
    description: 'Configure voice agent settings',
    params: [
      {
        name: 'provider',
        type: 'string',
        description: 'Provider',
        required: true,
        enum: ['vapi', 'retell'],
      },
      { name: 'voice_id', type: 'string', description: 'Voice ID', required: false },
      { name: 'language', type: 'string', description: 'Language code', required: false },
      {
        name: 'interruption_sensitivity',
        type: 'string',
        description: 'Interruption sensitivity',
        required: false,
        enum: ['low', 'medium', 'high'],
      },
      {
        name: 'enabled_tools',
        type: 'string',
        description: 'Comma-separated tool names',
        required: false,
      },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (a, c) => {
    const s = Date.now();
    try {
      return ok('voice_configure_agent', {
        provider: a.provider,
        config: {
          voice_id: a.voice_id || 'default',
          language: a.language || 'en-US',
          interruption_sensitivity: a.interruption_sensitivity || 'medium',
          enabled_tools: a.enabled_tools
            ? a.enabled_tools.split(',').map((t: string) => t.trim())
            : ['all'],
        },
        updated_at: new Date().toISOString(),
      }, s);
    } catch (e) {
      return fail(
        'voice_configure_agent',
        `Config failed: ${e instanceof Error ? e.message : String(e)}`,
        s,
      );
    }
  },
};

const statusTool: Tool = {
  definition: {
    name: 'voice_call_status',
    description: 'Get voice call statuses',
    params: [
      {
        name: 'status',
        type: 'string',
        description: 'Filter by status',
        required: false,
        enum: ['active', 'completed', 'failed', 'all'],
      },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
    ],
    capabilities: ['network:fetch'],
  },
  execute: async (a, c) => {
    const s = Date.now();
    try {
      return ok('voice_call_status', {
        calls: [
          {
            id: 'call_001',
            to: '+1-555-0100',
            provider: 'vapi',
            status: 'completed',
            duration_seconds: 124,
            cost: 0.17,
            created: '2026-06-19T10:00:00Z',
          },
          {
            id: 'call_002',
            to: '+1-555-0200',
            provider: 'retell',
            status: 'active',
            duration_seconds: 45,
            cost: 0.06,
            created: '2026-06-19T12:30:00Z',
          },
        ],
        total: 2,
      }, s);
    } catch (e) {
      return fail(
        'voice_call_status',
        `Status check failed: ${e instanceof Error ? e.message : String(e)}`,
        s,
      );
    }
  },
};

export async function onLoad(c: PluginContext): Promise<void> {
  c.logger.info('[cortex-plugin-voice-agent] Loaded — Vapi, Retell AI');
}
export async function onUnload(c: PluginContext): Promise<void> {
  c.logger.info('[cortex-plugin-voice-agent] Unloading...');
}
export const tools: Tool[] = [callTool, numTool, transTool, configTool, statusTool];
