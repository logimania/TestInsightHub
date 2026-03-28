import { describe, it, expect } from "vitest";
import { analyzeFileQuality } from "../../../src/main/services/test-quality-analyzer";

describe("test-quality-analyzer", () => {
  it("scores a weak test (status only) as LOW", () => {
    const content = `
      test('GET /users returns 200', async () => {
        const res = await request(app).get('/users');
        expect(res.status).toBe(200);
      });
    `;

    const result = analyzeFileQuality("handler.test.ts", content, "typescript");
    expect(result.testCases.length).toBe(1);
    expect(result.testCases[0].level).toBe("low");
    expect(result.testCases[0].foundCategories).toContain("status");
    expect(result.testCases[0].missingCategories.length).toBeGreaterThan(3);
  });

  it("scores a strong test (multiple assertions) as MEDIUM or HIGH", () => {
    const content = `
      test('GET /users returns user list', async () => {
        const res = await request(app).get('/users');
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
      });
    `;

    const result = analyzeFileQuality("handler.test.ts", content, "typescript");
    expect(result.testCases.length).toBe(1);
    const tc = result.testCases[0];
    expect(tc.foundCategories).toContain("status");
    expect(tc.foundCategories).toContain("body");
    expect(tc.foundCategories).toContain("property");
    expect(tc.foundCategories).toContain("type_format");
    expect(["medium", "high"]).toContain(tc.level);
  });

  it("detects error case testing", () => {
    const content = `
      test('GET /users/999 returns 404', async () => {
        const res = await request(app).get('/users/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBeDefined();
      });
    `;

    const result = analyzeFileQuality("handler.test.ts", content, "typescript");
    expect(result.testCases[0].foundCategories).toContain("error_case");
  });

  it("detects boundary/parametrize testing", () => {
    const content = `
      test('handles multiple inputs', () => {
        test.each([
          [0, 'zero'],
          [1, 'one'],
          [-1, 'negative'],
        ])('handles input %i as %s', (input, expected) => {
          expect(format(input)).toBe(expected);
        });
      });
    `;

    const result = analyzeFileQuality("utils.test.ts", content, "typescript");
    expect(result.testCases.length).toBe(1);
    expect(result.testCases[0].foundCategories).toContain("boundary");
  });

  it("handles Python test files", () => {
    const content = `
def test_get_users(client):
    response = client.get('/users')
    assert response.status_code == 200
    assert len(response.json()) > 0
    assert 'id' in response.json()[0]

def test_get_users_not_found(client):
    response = client.get('/users/999')
    assert response.status_code == 404
    `;

    const result = analyzeFileQuality("test_handler.py", content, "python");
    expect(result.testCases.length).toBe(2);
    expect(result.testCases[0].foundCategories).toContain("status");
    expect(result.testCases[0].foundCategories).toContain("property");
    expect(result.testCases[1].foundCategories).toContain("error_case");
  });

  it("handles Go test files", () => {
    const content = `
func TestGetUsers(t *testing.T) {
    resp := httptest.NewRecorder()
    req := httptest.NewRequest("GET", "/users", nil)
    handler.ServeHTTP(resp, req)
    assert.Equal(t, http.StatusOK, resp.Code)
    assert.NotEmpty(t, resp.Body)
}
    `;

    const result = analyzeFileQuality("handler_test.go", content, "go");
    expect(result.testCases.length).toBe(1);
    expect(result.testCases[0].foundCategories).toContain("status");
    expect(result.testCases[0].foundCategories).toContain("property");
  });

  it("calculates file-level averages", () => {
    const content = `
      test('weak test', () => {
        expect(true).toBe(true);
      });

      test('strong test', async () => {
        const res = await fetch('/api');
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
      });
    `;

    const result = analyzeFileQuality("mixed.test.ts", content, "typescript");
    expect(result.testCases.length).toBe(2);
    expect(result.averagePercentage).toBeGreaterThan(0);
    expect(result.level).toBeDefined();
  });

  it("generates suggestions for missing categories", () => {
    const content = `
      test('minimal test', () => {
        expect(1 + 1).toBe(2);
      });
    `;

    const result = analyzeFileQuality("minimal.test.ts", content, "typescript");
    expect(result.testCases[0].suggestions.length).toBeGreaterThan(0);
    expect(
      result.testCases[0].suggestions.some((s) => s.includes("エラーケース")),
    ).toBe(true);
  });

  it("returns empty for non-test file", () => {
    const content = `
      export function add(a: number, b: number) {
        return a + b;
      }
    `;

    const result = analyzeFileQuality("utils.ts", content, "typescript");
    expect(result.testCases.length).toBe(0);
  });
});
