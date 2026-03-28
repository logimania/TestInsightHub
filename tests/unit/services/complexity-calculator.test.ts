import { describe, it, expect } from "vitest";
import {
  calculateComplexity,
  estimateComplexityFromLoc,
} from "../../../src/main/services/project-parser/complexity-calculator";

describe("complexity-calculator", () => {
  describe("TypeScript/JavaScript", () => {
    it("calculates complexity 1 for a simple function", () => {
      const body = `function greet(name) {
      return "Hello " + name;
    }`;
      expect(calculateComplexity(body, "typescript")).toBe(1);
    });

    it("counts if statements", () => {
      const body = `function check(x) {
      if (x > 0) {
        return "positive";
      } else if (x < 0) {
        return "negative";
      }
      return "zero";
    }`;
      expect(calculateComplexity(body, "typescript")).toBeGreaterThanOrEqual(3);
    });

    it("counts logical operators", () => {
      const body = `function validate(a, b) {
      if (a && b || !a) {
        return true;
      }
      return false;
    }`;
      const complexity = calculateComplexity(body, "typescript");
      expect(complexity).toBeGreaterThanOrEqual(3);
    });

    it("counts for loops, while loops, and switch cases", () => {
      const body = `function process(items) {
      for (let i = 0; i < items.length; i++) {
        while (items[i].pending) {
          switch (items[i].type) {
            case "a":
              break;
            case "b":
              break;
          }
        }
      }
    }`;
      const complexity = calculateComplexity(body, "typescript");
      // 1 base + for + while + 2 case = at least 5
      expect(complexity).toBeGreaterThanOrEqual(5);
    });

    it("counts nullish coalescing and optional chaining", () => {
      const body = `function safe(obj) {
      const val = obj?.nested?.value ?? "default";
      return val;
    }`;
      const complexity = calculateComplexity(body, "typescript");
      // 1 base + 2 optional chaining + 1 nullish coalescing
      expect(complexity).toBeGreaterThanOrEqual(3);
    });

    it("counts catch blocks", () => {
      const body = `function risky() {
      try {
        doSomething();
      } catch (e) {
        handleError(e);
      }
    }`;
      const complexity = calculateComplexity(body, "typescript");
      expect(complexity).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Python", () => {
    it("handles Python syntax", () => {
      const body = `def process(items):
    for item in items:
        if item > 0 and item < 100:
            yield item
        elif item == 0:
            continue`;
      const complexity = calculateComplexity(body, "python");
      // 1 base + for + if + and + elif = 5
      expect(complexity).toBeGreaterThanOrEqual(4);
    });

    it("counts Python except and or", () => {
      const body = `def safe_divide(a, b):
    try:
        if b == 0 or a is None:
            return None
        return a / b
    except ZeroDivisionError:
        return None
    except TypeError:
        return None`;
      const complexity = calculateComplexity(body, "python");
      // 1 base + if + or + 2 except = 5
      expect(complexity).toBeGreaterThanOrEqual(5);
    });

    it("counts Python while loops", () => {
      const body = `def countdown(n):
    while n > 0:
        if n == 5:
            print("halfway")
        n -= 1`;
      const complexity = calculateComplexity(body, "python");
      // 1 base + while + if = 3
      expect(complexity).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Go", () => {
    it("handles Go syntax", () => {
      const body = `func handler(w http.ResponseWriter, r *http.Request) {
      if r.Method != "GET" {
        return
      }
      for _, item := range items {
        if item.Active && item.Valid {
          fmt.Fprintf(w, "%v", item)
        }
      }
    }`;
      const complexity = calculateComplexity(body, "go");
      // 1 base + 2 if + for + && = 5
      expect(complexity).toBeGreaterThanOrEqual(4);
    });

    it("counts Go select and case statements", () => {
      const body = `func multiplex(ch1, ch2 chan int) {
      for i := 0; i < 10; i++ {
        select {
          case v := <-ch1:
            fmt.Println(v)
          case v := <-ch2:
            fmt.Println(v)
        }
      }
    }`;
      const complexity = calculateComplexity(body, "go");
      // 1 base + for + select + 2 case = 5
      expect(complexity).toBeGreaterThanOrEqual(5);
    });

    it("counts Go || operator", () => {
      const body = `func validate(a, b string) bool {
      if a == "" || b == "" {
        return false
      }
      return true
    }`;
      const complexity = calculateComplexity(body, "go");
      // 1 base + if + || = 3
      expect(complexity).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Rust", () => {
    it("calculates complexity 1 for a simple Rust function", () => {
      const body = `fn add(a: i32, b: i32) -> i32 {
    a + b
}`;
      expect(calculateComplexity(body, "rust")).toBe(1);
    });

    it("counts Rust if and logical operators", () => {
      const body = `fn validate(x: i32, y: i32) -> bool {
    if x > 0 && y > 0 {
        true
    } else if x < 0 || y < 0 {
        false
    } else {
        x == y
    }
}`;
      const complexity = calculateComplexity(body, "rust");
      // 1 base + 2 if + && + || = 5
      expect(complexity).toBeGreaterThanOrEqual(5);
    });

    it("counts Rust match arms", () => {
      const body = `fn describe(val: Option<i32>) -> &str {
    match val {
        Some(x) if x > 0 => "positive",
        Some(0) => "zero",
        Some(_) => "negative",
        None => "nothing",
    }
}`;
      const complexity = calculateComplexity(body, "rust");
      // 1 base + match + 4 => + if = at least 5
      expect(complexity).toBeGreaterThanOrEqual(5);
    });

    it("counts Rust for and while loops", () => {
      const body = `fn process(items: &[i32]) -> Vec<i32> {
    let mut result = Vec::new();
    for item in items {
        if *item > 0 {
            result.push(*item);
        }
    }
    while result.len() > 10 {
        result.pop();
    }
    result
}`;
      const complexity = calculateComplexity(body, "rust");
      // 1 base + for + if + while = 4
      expect(complexity).toBeGreaterThanOrEqual(4);
    });
  });

  describe("C/C++", () => {
    it("calculates complexity 1 for a simple C++ function", () => {
      const body = `int add(int a, int b) {
    return a + b;
}`;
      expect(calculateComplexity(body, "cpp")).toBe(1);
    });

    it("counts C++ if, for, while", () => {
      const body = `void process(int* arr, int len) {
    for (int i = 0; i < len; i++) {
        if (arr[i] > 0) {
            int j = arr[i];
            while (j > 1) {
                j /= 2;
            }
        }
    }
}`;
      const complexity = calculateComplexity(body, "cpp");
      // 1 base + for + if + while = 4
      expect(complexity).toBeGreaterThanOrEqual(4);
    });

    it("counts C++ switch cases", () => {
      const body = `int categorize(int x) {
    switch (x) {
        case 1:
            return 10;
        case 2:
            return 20;
        case 3:
            return 30;
    }
    return 0;
}`;
      const complexity = calculateComplexity(body, "cpp");
      // 1 base + 3 case = 4
      expect(complexity).toBeGreaterThanOrEqual(4);
    });

    it("counts C++ logical operators and ternary", () => {
      const body = `int compute(int a, int b) {
    if (a > 0 && b > 0) {
        return a + b;
    }
    return (a > b) ? a : b;
}`;
      const complexity = calculateComplexity(body, "cpp");
      // 1 base + if + && + ternary = 4
      expect(complexity).toBeGreaterThanOrEqual(4);
    });

    it("counts C++ catch blocks", () => {
      const body = `void risky() {
    try {
        dangerous();
    } catch (std::runtime_error& e) {
        handle(e);
    } catch (...) {
        fallback();
    }
}`;
      const complexity = calculateComplexity(body, "cpp");
      // 1 base + 2 catch = 3
      expect(complexity).toBeGreaterThanOrEqual(3);
    });

    it("also works for plain C", () => {
      const body = `int max(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}`;
      const complexity = calculateComplexity(body, "c");
      // 1 base + if = 2
      expect(complexity).toBeGreaterThanOrEqual(2);
    });
  });

  describe("unknown language", () => {
    it("returns complexity 1 for unknown language", () => {
      const body = "some code here";
      expect(calculateComplexity(body, "unknown" as any)).toBe(1);
    });
  });

  describe("estimateComplexityFromLoc", () => {
    it("estimates complexity from LOC", () => {
      expect(estimateComplexityFromLoc(10)).toBe(1);
      expect(estimateComplexityFromLoc(50)).toBe(5);
      expect(estimateComplexityFromLoc(200)).toBe(20);
    });

    it("caps at 100", () => {
      expect(estimateComplexityFromLoc(2000)).toBe(100);
      expect(estimateComplexityFromLoc(5000)).toBe(100);
    });

    it("handles zero LOC", () => {
      expect(estimateComplexityFromLoc(0)).toBe(0);
    });

    it("rounds to nearest integer", () => {
      expect(estimateComplexityFromLoc(15)).toBe(2);
      expect(estimateComplexityFromLoc(25)).toBe(3);
    });
  });
});
