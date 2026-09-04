const http = require('http');

const API_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Automated E2E Verification ---');
  let token = null;

  // Test 1: Admin Login
  try {
    const loginRes = await makeRequest('POST', '/auth/login', {
      identifier: 'MAT-001',
      mot_de_passe: 'password123',
    });

    if (loginRes.status === 200 && loginRes.body.token) {
      console.log('✔ Test 1: Admin Login succeeded. Token received.');
      token = loginRes.body.token;
    } else {
      console.error('❌ Test 1: Admin Login failed.', loginRes);
      process.exit(1);
    }
  } catch (e) {
    console.error('Test 1 error:', e);
    process.exit(1);
  }

  // Test 2: Auth Profile Fetch
  try {
    const meRes = await makeRequest('GET', '/auth/me', null, token);
    if (meRes.status === 200 && meRes.body.user?.nom === 'Ahmed Kacem') {
      console.log('✔ Test 2: /auth/me profile details validated.');
    } else {
      console.error('❌ Test 2: Profile fetch failed.', meRes);
    }
  } catch (e) {
    console.error('Test 2 error:', e);
  }

  // Test 3: Stock exit with quantity exceeding stock (Insufficient stock)
  // Fil AWG 18 rouge (A002) has 45 units in stock. Let's request 100 units.
  try {
    const exitRes = await makeRequest('POST', '/stock/sorties', {
      article_id: 'A002',
      quantite: 100,
      emplacement: 'B-04',
      matricule: 'MAT-045',
    }, token);

    if (exitRes.status === 400 && exitRes.body.error?.includes('insuffisante')) {
      console.log('✔ Test 3: Stock withdrawal boundary checked. Blocked exceeding exit successfully (400 Bad Request).');
    } else {
      console.error('❌ Test 3: Stock withdrawal boundary failed. Expected 400 error but got:', exitRes);
    }
  } catch (e) {
    console.error('Test 3 error:', e);
  }

  // Test 4: Valid stock exit
  // Request 5 units (45 -> 40 remaining)
  try {
    const exitRes = await makeRequest('POST', '/stock/sorties', {
      article_id: 'A002',
      quantite: 5,
      emplacement: 'B-04',
      matricule: 'MAT-045',
    }, token);

    if (exitRes.status === 201 && exitRes.body.reste === 40) {
      console.log('✔ Test 4: Stock withdrawal succeeded. Remaining stock matches (40 units).');
    } else {
      console.error('❌ Test 4: Valid stock exit failed.', exitRes);
    }
  } catch (e) {
    console.error('Test 4 error:', e);
  }

  // Test 5: Panel validation constraint (etat_khm = CONFORME requires etat_validation = VALIDE)
  try {
    const patchRes = await makeRequest('PATCH', '/panneaux/PNL-104/etat', {
      etat_khm: 'CONFORME',
    }, token);

    if (patchRes.status === 400 && patchRes.body.error?.includes('validé')) {
      console.log('✔ Test 5: Panel KHM constraint check validated. Prevented marking unvalidated panel conform.');
    } else {
      console.error('❌ Test 5: Panel KHM constraint check failed.', patchRes);
    }
  } catch (e) {
    console.error('Test 5 error:', e);
  }

  // Test 6: SUPERVISEUR Role validation (Non-sequential move)
  try {
    // We login as SUPERVISEUR to get a different token
    const supLoginRes = await makeRequest('POST', '/auth/login', {
      identifier: 'MAT-002', // Assuming MAT-002 is supervisor
      mot_de_passe: 'password123',
    });
    
    let supToken = null;
    if (supLoginRes.status === 200) supToken = supLoginRes.body.token;
    
    if (supToken) {
      // PNL-091 is KHM. Try to move backwards to EN_CONSTRUCTION
      const invalidMove = await makeRequest('PATCH', '/panneaux/PNL-091/etat', {
        etat_construction: 'EN_CONSTRUCTION',
      }, supToken);

      if (invalidMove.status === 403 && invalidMove.body.error?.includes('administrateur')) {
        console.log('✔ Test 6: SUPERVISEUR backward movement blocked correctly.');
      } else {
        console.error('❌ Test 6: SUPERVISEUR backward movement failed check. Expected 403 but got:', invalidMove);
      }
    }
  } catch (e) {
    console.error('Test 6 error:', e);
  }

  // Test 7: ADMIN Role override movement with reason
  try {
    // We already have ADMIN token
    // Move PNL-091 backwards to EN_VALIDATION with a reason
    const overrideMove = await makeRequest('PATCH', '/panneaux/PNL-091/etat', {
      etat_construction: 'EN_VALIDATION',
      reason: 'Redémarre pour contrôle qualité.'
    }, token);

    if (overrideMove.status === 200 && overrideMove.body.history) {
      console.log('✔ Test 7: ADMIN backward movement with reason succeeded. History logged.');
    } else {
      console.error('❌ Test 7: ADMIN backward movement failed check. Expected 200 but got:', overrideMove);
    }

    // Try ADMIN without reason
    const noReasonMove = await makeRequest('PATCH', '/panneaux/PNL-091/etat', {
      etat_construction: 'EN_CONSTRUCTION'
    }, token);

    if (noReasonMove.status === 400 && noReasonMove.body.error?.includes('motif')) {
      console.log('✔ Test 8: ADMIN override without reason blocked correctly.');
    } else {
      console.error('❌ Test 8: ADMIN override without reason failed check. Expected 400 but got:', noReasonMove);
    }

  } catch (e) {
    console.error('Test 7/8 error:', e);
  }

  console.log('--- E2E Verification Complete ---');
}

// Give server 1 second to bind before running test
setTimeout(runTests, 1000);
