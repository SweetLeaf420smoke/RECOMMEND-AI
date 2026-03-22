import User from "../models/User.js";

export async function findMatches(currentUser) {
  const users = await User.find({ _id: { $ne: currentUser._id } });
  const matches = [];

  for (let user of users) {
    const overlap = user.topArtists.filter((a) => currentUser.topArtists.includes(a));
    const score = (overlap.length / Math.max(user.topArtists.length, 1)) * 100;
    if (score > 20) {
      matches.push({
        name: user.name,
        avatar: user.avatar,
        overlap,
        score: score.toFixed(1),
      });
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}

