import type { Language } from "@shared/types/project";

export interface AssertionCheck {
  readonly name: string;
  readonly category: AssertionCategory;
  readonly score: number;
  readonly patterns: readonly RegExp[];
}

export type AssertionCategory =
  | "status"
  | "body"
  | "property"
  | "type_format"
  | "error_case"
  | "boundary";

const JS_TS_PATTERNS: readonly AssertionCheck[] = [
  {
    name: "Status code verification",
    category: "status",
    score: 1,
    patterns: [
      /expect\(.+(?:status|statusCode)\)\.toBe/,
      /expect\(.+(?:status|statusCode)\)\.toEqual/,
      /\.expect\(\d{3}\)/,
      /assert\.equal\(.+(?:status|statusCode)/,
    ],
  },
  {
    name: "Response body verification",
    category: "body",
    score: 2,
    patterns: [
      /expect\(.+body\)/,
      /expect\(.+data\)/,
      /expect\(.+json\)/,
      /expect\(.+text\)/,
      /expect\(.+response\)/,
      /expect\(result\)/,
      /expect\(await .+\)/,
    ],
  },
  {
    name: "Property existence verification",
    category: "property",
    score: 2,
    patterns: [
      /toHaveProperty/,
      /toBeDefined/,
      /not\.toBeUndefined/,
      /not\.toBeNull/,
      /toContain/,
      /toContainEqual/,
      /toHaveLength/,
      /\.length\)\.toBe/,
    ],
  },
  {
    name: "Type/format verification",
    category: "type_format",
    score: 3,
    patterns: [
      /toBeInstanceOf/,
      /toMatch\(/,
      /toBeGreaterThan/,
      /toBeLessThan/,
      /toBeGreaterThanOrEqual/,
      /toBeLessThanOrEqual/,
      /toBeCloseTo/,
      /typeof .+ ===|expect\(.+\)\.toEqual\(expect\./,
      /toMatchObject/,
      /toMatchSchema/,
      /toSatisfy/,
    ],
  },
  {
    name: "Error case test",
    category: "error_case",
    score: 3,
    patterns: [
      /toThrow/,
      /rejects\.toThrow/,
      /expect\(.+status\)\.toBe\(4\d\d\)/,
      /expect\(.+status\)\.toBe\(5\d\d\)/,
      /expect\(.+error\)/,
      /expect\(.+message\).*error/i,
      /catch\s*\(/,
      /\.rejects\./,
    ],
  },
  {
    name: "Boundary/multiple patterns",
    category: "boundary",
    score: 3,
    patterns: [
      /\.each\s*\(/,
      /test\.each/,
      /it\.each/,
      /describe\.each/,
      /parametrize|parameterize/i,
    ],
  },
];

const PYTHON_PATTERNS: readonly AssertionCheck[] = [
  {
    name: "Status code verification",
    category: "status",
    score: 1,
    patterns: [
      /assert .+status_code == \d{3}/,
      /assertEqual\(.+status_code/,
      /\.status_code\s*==\s*\d{3}/,
    ],
  },
  {
    name: "Response body verification",
    category: "body",
    score: 2,
    patterns: [
      /assert .+\.json\(\)/,
      /assert .+\.data/,
      /assert .+\.text/,
      /assertEqual\(.+json/,
    ],
  },
  {
    name: "Property existence verification",
    category: "property",
    score: 2,
    patterns: [
      /assertIn\(/,
      /assert .+ in /,
      /assertIsNotNone/,
      /assert .+ is not None/,
      /assert len\(/,
    ],
  },
  {
    name: "Type/format verification",
    category: "type_format",
    score: 3,
    patterns: [
      /assertIsInstance/,
      /isinstance\(/,
      /assertRegex/,
      /assertGreater/,
      /assertLess/,
      /assert .+ [><=]/,
    ],
  },
  {
    name: "Error case test",
    category: "error_case",
    score: 3,
    patterns: [
      /assertRaises/,
      /pytest\.raises/,
      /with .+raises/,
      /assert .+status_code == 4\d\d/,
      /assert .+status_code == 5\d\d/,
    ],
  },
  {
    name: "Boundary/parametrize",
    category: "boundary",
    score: 3,
    patterns: [/@pytest\.mark\.parametrize/, /parametrize/, /subTest/],
  },
];

const GO_PATTERNS: readonly AssertionCheck[] = [
  {
    name: "Status code verification",
    category: "status",
    score: 1,
    patterns: [
      /\.Code\s*!=?\s*\d{3}/,
      /StatusCode\s*!=?\s*\d{3}/,
      /assert\.Equal.+http\.Status/,
    ],
  },
  {
    name: "Response body verification",
    category: "body",
    score: 2,
    patterns: [
      /\.Body/,
      /ioutil\.ReadAll/,
      /json\.Unmarshal/,
      /assert\.Equal.+body/i,
    ],
  },
  {
    name: "Property existence verification",
    category: "property",
    score: 2,
    patterns: [
      /assert\.NotNil/,
      /assert\.NotEmpty/,
      /assert\.Len/,
      /assert\.Contains/,
    ],
  },
  {
    name: "Type/format verification",
    category: "type_format",
    score: 3,
    patterns: [
      /assert\.IsType/,
      /assert\.Greater/,
      /assert\.Less/,
      /assert\.Regexp/,
    ],
  },
  {
    name: "Error case test",
    category: "error_case",
    score: 3,
    patterns: [
      /assert\.Error/,
      /assert\.EqualError/,
      /require\.Error/,
      /t\.Fatal/,
    ],
  },
  {
    name: "Table-driven tests",
    category: "boundary",
    score: 3,
    patterns: [/tests?\s*:?=\s*\[\]struct/, /tc\s*:?=\s*range/, /t\.Run\(/],
  },
];

export function getAssertionPatterns(
  language: Language,
): readonly AssertionCheck[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return JS_TS_PATTERNS;
    case "python":
      return PYTHON_PATTERNS;
    case "go":
      return GO_PATTERNS;
    default:
      return JS_TS_PATTERNS; // fallback
  }
}

export const MAX_POSSIBLE_SCORE = 14; // 1+2+2+3+3+3
