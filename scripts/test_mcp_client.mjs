import { spawn } from 'child_process';

const child = spawn('node', ['scripts/simulaja-mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] });

let output = '';
child.stdout.on('data', (d) => {
  output += d.toString();
});

const reqs = [
  JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
  JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'simular_consorcio', arguments: { categoria: 'imovel', credito: 350000 } } }),
  JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'consultar_grupo', arguments: { grupo: '6042' } } })
].join('\n') + '\n';

child.stdin.write(reqs);
child.stdin.end();

child.on('close', () => {
  console.log('--- OUTPUT RECEBIDO DO MCP SERVER: ---');
  const lines = output.trim().split('\n');
  lines.forEach((l) => {
    try {
      const obj = JSON.parse(l);
      console.log(`\n=== RESPOSTA ID ${obj.id} ===`);
      if (obj.result?.content) {
        console.log(obj.result.content[0].text);
      } else if (obj.result?.tools) {
        console.log('Ferramentas Registradas:', obj.result.tools.map(t => t.name));
      } else {
        console.log(JSON.stringify(obj.result, null, 2));
      }
    } catch (e) {
      console.log('Linha não-json:', l);
    }
  });
});
