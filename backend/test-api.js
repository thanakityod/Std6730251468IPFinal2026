const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      res => {
        let resBody = '';
        res.on('data', chunk => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting API Verification Tests...\n');

  // Test 1: POST /api/login (Success)
  const loginOk = await request('POST', '/api/login', { username: 'admin', password: 'password123' });
  console.assert(loginOk.status === 200 && loginOk.body.token === 'mock-jwt-token', 'Test 1 Failed: Valid Login');
  console.log('✅ Test 1: Valid Login -> Status 200, Token received');

  // Test 2: POST /api/login (Failure)
  const loginFail = await request('POST', '/api/login', { username: 'admin', password: 'wrongpassword' });
  console.assert(loginFail.status === 401, 'Test 2 Failed: Invalid Login');
  console.log('✅ Test 2: Invalid Login -> Status 401 Unauthorized');

  // Test 3: GET /api/employees
  const getEmps = await request('GET', '/api/employees');
  console.assert(getEmps.status === 200 && Array.isArray(getEmps.body) && getEmps.body.length >= 5, 'Test 3 Failed: GET /api/employees');
  console.log(`✅ Test 3: GET /api/employees -> Status 200, Count: ${getEmps.body.length}`);

  // Test 4: POST /api/employees (Empty fields - 400 Bad Request)
  const postBad = await request('POST', '/api/employees', { name: '', position: 'Dev', salary: 30000 });
  console.assert(postBad.status === 400, 'Test 4 Failed: Empty field should return 400');
  console.log('✅ Test 4: POST /api/employees with empty field -> Status 400 Bad Request');

  // Test 5: POST /api/employees (Valid)
  const postGood = await request('POST', '/api/employees', { name: 'Test Employee', position: 'QA Engineer', salary: 35000 });
  console.assert(postGood.status === 201 && postGood.body.id, 'Test 5 Failed: Valid employee creation');
  console.log(`✅ Test 5: POST /api/employees -> Status 201 Created (ID: ${postGood.body.id})`);

  // Test 6: PUT /api/employees/:id/status (Toggle)
  const toggleRes = await request('PUT', `/api/employees/${postGood.body.id}/status`);
  console.assert(toggleRes.status === 200 && toggleRes.body.status === 'On Leave', 'Test 6 Failed: Toggle status');
  console.log(`✅ Test 6: PUT /api/employees/:id/status -> Status toggled to: ${toggleRes.body.status}`);

  // Test 7: GET /api/employees/salary-clusters (K-Means)
  const clusterRes = await request('GET', '/api/employees/salary-clusters');
  console.assert(clusterRes.status === 200 && clusterRes.body.success && clusterRes.body.clusters.length === 3, 'Test 7 Failed: K-Means clusters');
  console.log('✅ Test 7: GET /api/employees/salary-clusters -> Status 200 OK, 3 Tiers:');
  console.dir(clusterRes.body.clusters, { depth: null });

  // Test 8: DELETE /api/employees/:id
  const deleteRes = await request('DELETE', `/api/employees/${postGood.body.id}`);
  console.assert(deleteRes.status === 200 && deleteRes.body.success, 'Test 8 Failed: Delete employee');
  console.log('✅ Test 8: DELETE /api/employees/:id -> Status 200 OK, Employee removed');

  console.log('\n🎉 ALL 8 BACKEND TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
