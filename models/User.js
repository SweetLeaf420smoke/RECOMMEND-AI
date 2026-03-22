import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  spotifyId: String,
  name: String,
  avatar: String,
  accessToken: String,
  topArtists: [String], // для обратной совместимости
  artistStats: [{
    name: String,
    rank: Number, // 1-50
    spotifyId: String
  }],
});

export default mongoose.model("User", userSchema);

