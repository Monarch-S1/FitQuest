import { SKILL_TREE_8 } from "../data/skillTree";

describe("SKILL_TREE_8", () => {
  it("contains all 8 movement pathways", () => {
    const ids = SKILL_TREE_8.map((b) => b.id);
    expect(ids).toContain("hp");
    expect(ids).toContain("vp");
    expect(ids).toContain("hpll");
    expect(ids).toContain("vpll");
    expect(ids).toContain("aql");
    expect(ids).toContain("hpl");
    expect(ids).toContain("ac");
    expect(ids).toContain("plc");
    expect(SKILL_TREE_8.length).toBe(8);
  });

  it("contains all 96 exercises across branches", () => {
    const totalNodes = SKILL_TREE_8.reduce((sum, branch) => sum + branch.nodes.length, 0);
    expect(totalNodes).toBe(96);
  });

  it("each branch has exactly 12 exercises (levels 1-12)", () => {
    for (const branch of SKILL_TREE_8) {
      expect(branch.nodes.length).toBe(12);
    }
  });

  it("each node has required fields", () => {
    for (const branch of SKILL_TREE_8) {
      for (const node of branch.nodes) {
        expect(node.exercise).toBeDefined();
        expect(node.exercise.id).toBeTruthy();
        expect(node.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(node.family).toBe(branch.parentFamily);
        expect(node.pathwayId).toBe(branch.id);
        expect(node.pathwayLevel).toBeGreaterThanOrEqual(1);
        expect(node.pathwayLevel).toBeLessThanOrEqual(12);
        expect(Array.isArray(node.progressionPath)).toBe(true);
        expect(Array.isArray(node.hardPrerequisites)).toBe(true);
        expect(node.accent).toMatch(/^#/);
      }
    }
  });

  it("each branch has a unique accent color", () => {
    const colors = SKILL_TREE_8.map((b) => b.accent);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(8);
  });

  it("nodes are sorted by level within each branch", () => {
    for (const branch of SKILL_TREE_8) {
      for (let i = 1; i < branch.nodes.length; i++) {
        expect(branch.nodes[i].pathwayLevel).toBeGreaterThan(branch.nodes[i - 1].pathwayLevel);
      }
    }
  });

  it("level 1 exercises are always unlocked by default", () => {
    for (const branch of SKILL_TREE_8) {
      const firstNode = branch.nodes[0];
      expect(firstNode.pathwayLevel).toBe(1);
      expect(firstNode.defaultState).toBe("unlocked");
    }
  });

  it("nodes are ordered by pathway level ascending", () => {
    for (const branch of SKILL_TREE_8) {
      for (let i = 0; i < branch.nodes.length; i++) {
        expect(branch.nodes[i].pathwayLevel).toBe(i + 1);
      }
    }
  });

  it("contains specific known exercises at correct levels", () => {
    const hpBranch = SKILL_TREE_8.find((b) => b.id === "hp")!;
    expect(hpBranch.nodes[0].exercise.name).toContain("Wall Push-up");
    expect(hpBranch.nodes[3].exercise.name).toContain("Standard Push-up");
    expect(hpBranch.nodes[6].exercise.name).toContain("Decline Push-up");
    expect(hpBranch.nodes[11].exercise.name).toContain("One-Arm Floor Push-up");

    const acBranch = SKILL_TREE_8.find((b) => b.id === "ac")!;
    expect(acBranch.nodes[0].exercise.name).toContain("Dead Bug");
    expect(acBranch.nodes[4].exercise.name).toContain("Hollow Body Hold");
    expect(acBranch.nodes[11].exercise.name).toContain("Full Dragon Flag");
  });

  it("hard prerequisites are defined for advanced cross-pathway nodes", () => {
    const aql12 = SKILL_TREE_8.find((b) => b.id === "aql")!.nodes[11];
    expect(aql12.hardPrerequisites).toContain("AQL9");

    const vp10 = SKILL_TREE_8.find((b) => b.id === "vp")!.nodes[9];
    expect(vp10.hardPrerequisites).toContain("VP7");

    const vp12 = SKILL_TREE_8.find((b) => b.id === "vp")!.nodes[11];
    expect(vp12.hardPrerequisites).toContain("VP11");
  });

  it("progression paths contain at least one step", () => {
    for (const branch of SKILL_TREE_8) {
      for (const node of branch.nodes) {
        expect(node.progressionPath.length).toBeGreaterThan(0);
      }
    }
  });
});
