import { test, expect } from '@playwright/test';

test.describe('AppController (API)', () => {
  test('GET / should return 200 and hello message', async ({ request }) => {
    // Assuming the docker container is running and mapping to localhost:3000
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
    
    const text = await response.text();
    // Assuming app controller returns some text containing "running" or "inkstream"
    // Adjust this assertion if your API returns something else at root
    expect(text.toLowerCase()).toContain('inkstream');
  });

  test('POST /graphql should be reachable', async ({ request }) => {
    // A simple GraphQL introspection or basic query to verify it's up
    const response = await request.post('/graphql', {
      data: {
        query: `
          query {
            __schema {
              queryType {
                name
              }
            }
          }
        `
      }
    });
    
    // As long as we get a 200 OK, GraphQL is reachable
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.data).toBeDefined();
  });
});
