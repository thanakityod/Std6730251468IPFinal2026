/**
 * 1D K-Means Clustering Algorithm (k = 3)
 * Groups employee salaries into 3 distinct tiers (Tier 1, Tier 2, Tier 3)
 */

function kMeans1D(salaries, k = 3, maxIterations = 50) {
  // Edge case: No salaries provided
  if (!salaries || salaries.length === 0) {
    return [
      { group: "Tier 1", centroid: 0, count: 0 },
      { group: "Tier 2", centroid: 0, count: 0 },
      { group: "Tier 3", centroid: 0, count: 0 }
    ];
  }

  // Filter valid numbers and sort ascending
  const cleanSalaries = salaries
    .map(Number)
    .filter(val => !isNaN(val) && val >= 0)
    .sort((a, b) => a - b);

  const n = cleanSalaries.length;

  if (n === 0) {
    return [
      { group: "Tier 1", centroid: 0, count: 0 },
      { group: "Tier 2", centroid: 0, count: 0 },
      { group: "Tier 3", centroid: 0, count: 0 }
    ];
  }

  // Handle case where fewer than k elements exist
  if (n < k) {
    const results = [];
    for (let i = 0; i < k; i++) {
      if (i < n) {
        results.push({
          group: `Tier ${i + 1}`,
          centroid: Math.round(cleanSalaries[i]),
          count: 1
        });
      } else {
        results.push({
          group: `Tier ${i + 1}`,
          centroid: Math.round(cleanSalaries[n - 1]),
          count: 0
        });
      }
    }
    return results;
  }

  // Quantile-based centroid initialization to guarantee distinct starting points
  // c1 at ~1/6th, c2 at median (1/2), c3 at ~5/6th
  let centroids = [
    cleanSalaries[Math.floor((n - 1) * 0.166)],
    cleanSalaries[Math.floor((n - 1) * 0.500)],
    cleanSalaries[Math.floor((n - 1) * 0.833)]
  ];

  // If all values are identical or duplicate centroids occur, jitter slightly
  if (centroids[0] === centroids[1]) centroids[1] += 0.01;
  if (centroids[1] === centroids[2]) centroids[2] += 0.02;

  let clusters = [[], [], []];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Reset clusters
    clusters = [[], [], []];

    // Assign each salary to nearest centroid
    for (const val of cleanSalaries) {
      let minDistance = Infinity;
      let assignedIndex = 0;

      for (let j = 0; j < k; j++) {
        const dist = Math.abs(val - centroids[j]);
        if (dist < minDistance) {
          minDistance = dist;
          assignedIndex = j;
        }
      }

      clusters[assignedIndex].push(val);
    }

    // Recompute centroids
    let converged = true;
    const newCentroids = [];

    for (let j = 0; j < k; j++) {
      if (clusters[j].length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(centroids[j]);
      } else {
        const sum = clusters[j].reduce((acc, curr) => acc + curr, 0);
        const avg = sum / clusters[j].length;
        newCentroids.push(avg);

        if (Math.abs(avg - centroids[j]) > 0.001) {
          converged = false;
        }
      }
    }

    centroids = newCentroids;
    if (converged) break;
  }

  // Package into cluster summary objects
  const clusterData = centroids.map((c, idx) => ({
    centroid: Math.round(c),
    count: clusters[idx].length
  }));

  // Sort clusters by centroid ascending (Tier 1 = Lowest, Tier 2 = Mid, Tier 3 = High)
  clusterData.sort((a, b) => a.centroid - b.centroid);

  return clusterData.map((c, idx) => ({
    group: `Tier ${idx + 1}`,
    centroid: c.centroid,
    count: c.count
  }));
}

module.exports = { kMeans1D };
