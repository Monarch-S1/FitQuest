import { buildSkillTree, SKILL_TREE } from "../data/skillTree";

describe("SKILL_TREE", () => {
  it("contains all 4 movement families", () => {
    const families = SKILL_TREE.map((b) => b.family);
    expect(families).toContain("push");
    expect(families).toContain("pull");
    expect(families).toContain("legs");
    expect(families).toContain("core");
  });

  it("contains all 24 exercises across branches", () => {
    const totalNodes = SKILL_TREE.reduce((sum, branch) => sum + branch.nodes.length, 0);
    expect(totalNodes).toBe(24);
  });

  it("each branch has at least 4 exercises", () => {
    for (const branch of SKILL_TREE) {
      expect(branch.nodes.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("each node has required fields", () => {
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        expect(node.exercise).toBeDefined();
        expect(node.exercise.id).toBeTruthy();
        expect(node.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(node.family).toBe(branch.family);
        expect(Array.isArray(node.progressionPath)).toBe(true);
        expect(Array.isArray(node.prerequisites)).toBe(true);
        expect(node.accent).toMatch(/^#/);
      }
    }
  });

  it("each branch has a unique accent color", () => {
    const colors = SKILL_TREE.map((b) => b.accent);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(4);
  });

  it("nodes are sorted by difficulty within each branch", () => {
    const tierOrder: Record<string, number> = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
    };

    for (const branch of SKILL_TREE) {
      for (let i = 1; i < branch.nodes.length; i++) {
        const prev = tierOrder[branch.nodes[i - 1].difficulty];
        const curr = tierOrder[branch.nodes[i].difficulty];
        expect(prev).toBeLessThanOrEqual(curr);
      }
    }
  });

  it("push branch contains horizontal push, vertical push, and tricep exercises", () => {
    const pushBranch = SKILL_TREE.find((b) => b.family === "push");
    expect(pushBranch).toBeDefined();
    const names = pushBranch!.nodes.map((n) => n.exercise.name);
    expect(names).toContain("Decline Push-Up");
    expect(names).toContain("Decline Pike Push-Up");
    expect(names).toContain("Archer Push-Up Progression");
    expect(names).toContain("Sliding Chest Fly");
    expect(names).toContain("Floor Tricep Extension");
    // Scapular Push-Up is scapular_mobility → core, not push
    expect(names).not.toContain("Scapular Push-Up");
  });

  it("pull branch contains row, pull, and bicep exercises", () => {
    const pullBranch = SKILL_TREE.find((b) => b.family === "pull");
    expect(pullBranch).toBeDefined();
    const names = pullBranch!.nodes.map((n) => n.exercise.name);
    expect(names).toContain("Doorway Row");
    expect(names).toContain("One-Arm Towel Row");
    expect(names).toContain("Table Row");
    expect(names).toContain("Doorframe Pull-Up Negative");
    expect(names).toContain("Towel Bicep Curl");
    // Prone Swimmers is scapular_mobility → core, not pull
    expect(names).not.toContain("Prone Swimmers");
  });

  it("legs branch contains lower body exercises", () => {
    const legsBranch = SKILL_TREE.find((b) => b.family === "legs");
    expect(legsBranch).toBeDefined();
    const names = legsBranch!.nodes.map((n) => n.exercise.name);
    expect(names).toContain("Bulgarian Split Squat");
    expect(names).toContain("Sliding Hamstring Curl");
    expect(names).toContain("Nordic Hamstring Curl");
    expect(names).toContain("Jump Squat");
    expect(names).toContain("Cossack Squat");
    expect(names).toContain("Single-Leg Glute Bridge");
    expect(names).toContain("Glute Bridge March"); // lower_body_pull → legs
  });

  it("core branch contains core stability and scapular exercises", () => {
    const coreBranch = SKILL_TREE.find((b) => b.family === "core");
    expect(coreBranch).toBeDefined();
    const names = coreBranch!.nodes.map((n) => n.exercise.name);
    expect(names).toContain("Hollow Body Hold");
    expect(names).toContain("Reverse Plank Hold");
    expect(names).toContain("Dragon Flag Progression");
    expect(names).toContain("Dead Bug");
    expect(names).toContain("L-Sit Progression");
    expect(names).toContain("Prone Swimmers"); // scapular_mobility → core
    expect(names).toContain("Scapular Push-Up"); // scapular_mobility → core
    // Glute Bridge March is lower_body_pull → legs, not core
    expect(names).not.toContain("Glute Bridge March");
  });

  it("has 5 push, 5 pull, 7 legs, 7 core exercises", () => {
    expect(SKILL_TREE.find((b) => b.family === "push")!.nodes.length).toBe(5);
    expect(SKILL_TREE.find((b) => b.family === "pull")!.nodes.length).toBe(5);
    expect(SKILL_TREE.find((b) => b.family === "legs")!.nodes.length).toBe(7);
    expect(SKILL_TREE.find((b) => b.family === "core")!.nodes.length).toBe(7);
  });

  it("progression paths contain at least one step", () => {
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        expect(node.progressionPath.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildSkillTree", () => {
  it("produces consistent output on multiple calls", () => {
    const tree1 = buildSkillTree();
    const tree2 = buildSkillTree();
    expect(tree1.length).toBe(tree2.length);
    for (let i = 0; i < tree1.length; i++) {
      expect(tree1[i].nodes.length).toBe(tree2[i].nodes.length);
      for (let j = 0; j < tree1[i].nodes.length; j++) {
        expect(tree1[i].nodes[j].exercise.id).toBe(tree2[i].nodes[j].exercise.id);
      }
    }
  });
});

describe("difficulty classification", () => {
  it("classifies archer push-up as advanced", () => {
    const pushBranch = SKILL_TREE.find((b) => b.family === "push");
    const archer = pushBranch!.nodes.find((n) => n.exercise.id === "archer-push-up-progression");
    expect(archer).toBeDefined();
    expect(archer!.difficulty).toBe("advanced");
  });

  it("classifies dragon flag as advanced", () => {
    const coreBranch = SKILL_TREE.find((b) => b.family === "core");
    const dragonFlag = coreBranch!.nodes.find((n) => n.exercise.id === "dragon-flag-progression");
    expect(dragonFlag).toBeDefined();
    expect(dragonFlag!.difficulty).toBe("advanced");
  });

  it("classifies L-sit as advanced", () => {
    const coreBranch = SKILL_TREE.find((b) => b.family === "core");
    const lSit = coreBranch!.nodes.find((n) => n.exercise.id === "l-sit-progression");
    expect(lSit).toBeDefined();
    expect(lSit!.difficulty).toBe("advanced");
  });

  it("classifies glute bridge march as beginner", () => {
    // Glute Bridge March is lower_body_pull → legs, not core
    const legsBranch = SKILL_TREE.find((b) => b.family === "legs");
    const gluteBridge = legsBranch!.nodes.find((n) => n.exercise.id === "glute-bridge-march");
    expect(gluteBridge).toBeDefined();
    expect(gluteBridge!.difficulty).toBe("beginner");
  });

  it("classifies dead bug as beginner", () => {
    const coreBranch = SKILL_TREE.find((b) => b.family === "core");
    const deadBug = coreBranch!.nodes.find((n) => n.exercise.id === "dead-bug");
    expect(deadBug).toBeDefined();
    expect(deadBug!.difficulty).toBe("beginner");
  });
});
