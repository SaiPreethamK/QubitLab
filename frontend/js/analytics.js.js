// QubitLab Learning Effectiveness Analytics

const beforeScore = 4;
const afterScore = 8;

const beforePercentage = beforeScore * 10;
const afterPercentage = afterScore * 10;

const improvement = afterPercentage - beforePercentage;

console.log("QubitLab Learning Analytics");
console.log("----------------------------");
console.log(`Before Quiz: ${beforeScore}/10 (${beforePercentage}%)`);
console.log(`After Quiz:  ${afterScore}/10 (${afterPercentage}%)`);
console.log(`Improvement: +${improvement} percentage points`);

// Example analytics object
const learningAnalytics = {
    topic: "Quantum Gates",
    before: {
        score: beforeScore,
        percentage: beforePercentage
    },
    after: {
        score: afterScore,
        percentage: afterPercentage
    },
    improvement: improvement
};

console.log(learningAnalytics);